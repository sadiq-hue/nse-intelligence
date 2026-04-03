// api/cron/digest.js — Daily digest cron job
// Triggered by Vercel Cron at 04:00 UTC = 07:00 EAT every day
// Fetches live news → generates AI analysis → emails all subscribers via Resend

const NSE_STOCKS = [
  { ticker: "SCOM", name: "Safaricom PLC",   sector: "Telecoms" },
  { ticker: "KCB",  name: "KCB Group",       sector: "Banking"  },
  { ticker: "EQTY", name: "Equity Bank",     sector: "Banking"  },
  { ticker: "EABL", name: "EABL",            sector: "Consumer" },
  { ticker: "COOP", name: "Co-op Bank",      sector: "Banking"  },
  { ticker: "BATK", name: "BAT Kenya",       sector: "Consumer" },
  { ticker: "ABSA", name: "Absa Bank Kenya", sector: "Banking"  },
  { ticker: "NCBA", name: "NCBA Group",      sector: "Banking"  },
];

const DECISION_LABELS = {
  "Strong Buy": "BUY", "Buy": "BUY",
  "Hold": "WAIT", "Watch": "WAIT",
  "Sell": "SELL", "Strong Sell": "SELL",
};

export default async function handler(req, res) {
  // Verify this is a legitimate Vercel cron request
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const RESEND_API_KEY    = process.env.RESEND_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const SUBSCRIBERS       = (process.env.SUBSCRIBER_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
  const FROM_EMAIL        = `NSE Intelligence <digest@${process.env.EMAIL_DOMAIN || "resend.dev"}>`;

  if (!RESEND_API_KEY || !ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing API keys" });
  }
  if (SUBSCRIBERS.length === 0) {
    console.log("No subscribers — cron ran but no emails sent");
    return res.status(200).json({ message: "No subscribers" });
  }

  console.log(`Daily digest cron started — ${SUBSCRIBERS.length} subscribers`);

  try {
    // ── Step 1: Fetch live news for each stock ────────────────────────────────
    const allNews = [];
    for (const stock of NSE_STOCKS.slice(0, 5)) { // top 5 to stay within timeout
      try {
        const query = encodeURIComponent(`${stock.name} NSE Kenya stock`);
        const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-KE&gl=KE&ceid=KE:en`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
        const rssRes = await fetch(proxyUrl);
        const json = await rssRes.json();
        const xml = json.contents || "";
        const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 2);
        for (const match of itemMatches) {
          const block   = match[1];
          const title   = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
          const desc    = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/))?.[1]?.replace(/<[^>]+>/g,"").trim().slice(0,200) || "";
          const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() || "";
          const source  = (block.match(/<source[^>]*>(.*?)<\/source>/))?.[1]?.trim() || "Google News";
          if (title && title !== "Title") {
            allNews.push({ title, content: desc || title, source, stock: stock.ticker, stockName: stock.name, date: pubDate ? new Date(pubDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0] });
          }
        }
      } catch (err) { console.error(`News fetch failed for ${stock.ticker}:`, err.message); }
    }

    // ── Step 2: Generate AI digest via Claude ─────────────────────────────────
    const newsText = allNews.length > 0
      ? allNews.map((a, i) => `[${i+1}] ${a.stockName} (${a.stock}): "${a.title}" — ${a.content}`).join("\n")
      : NSE_STOCKS.map(s => `${s.ticker} (${s.name}): No live news today`).join("\n");

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        system: "You are a senior NSE investment analyst writing a daily email digest. Be data-driven, concise, and actionable. Base conclusions strictly on provided news. Return only valid JSON.",
        messages: [{
          role: "user",
          content: `Generate a daily NSE investment digest from this news:\n\n${newsText}\n\nReturn JSON:\n{\n  "marketSummary": "2-3 sentence overall market assessment",\n  "bullishPicks": [{"ticker":"...","name":"...","signal":"BUY","confidence":0-100,"rationale":"1 sentence"}],\n  "bearishWarnings": [{"ticker":"...","name":"...","signal":"SELL","confidence":0-100,"rationale":"1 sentence"}],\n  "watchList": [{"ticker":"...","name":"...","signal":"WAIT","rationale":"1 sentence"}],\n  "keyTheme": "One dominant market theme today in 1 sentence",\n  "disclaimer": "Standard investment disclaimer"\n}\nInclude 2-3 items per section based on the news.`
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText    = claudeData.content?.[0]?.text || "{}";
    const jsonMatch  = rawText.match(/\{[\s\S]*\}/);
    let digest       = {};
    try { digest = JSON.parse(jsonMatch?.[0] || "{}"); } catch { digest = {}; }

    // ── Step 3: Build beautiful HTML email ────────────────────────────────────
    const today    = new Date().toLocaleDateString("en-KE", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const htmlBody = buildDigestEmail(digest, allNews, today);

    // ── Step 4: Send to all subscribers via Resend ────────────────────────────
    let sent = 0, failed = 0;
    for (const email of SUBSCRIBERS) {
      try {
        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: `🇰🇪 NSE Daily Digest — ${today}`,
            html: htmlBody,
          }),
        });
        if (sendRes.ok) { sent++; } else { failed++; console.error(`Failed to send to ${email}`); }
      } catch (err) { failed++; console.error(`Send error for ${email}:`, err.message); }
    }

    console.log(`Digest sent: ${sent} success, ${failed} failed`);
    return res.status(200).json({ success: true, sent, failed, newsCount: allNews.length, date: today });

  } catch (err) {
    console.error("Cron digest error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function buildDigestEmail(digest, news, today) {
  const bullish = digest.bullishPicks || [];
  const bearish = digest.bearishWarnings || [];
  const watchList = digest.watchList || [];

  const signalRow = (item, type) => {
    const colors = { BUY: { bg:"#D1FAE5", color:"#065F46", border:"#6EE7B7" }, SELL: { bg:"#FEE2E2", color:"#991B1B", border:"#FCA5A5" }, WAIT: { bg:"#FEF3C7", color:"#92400E", border:"#FCD34D" } };
    const c = colors[type] || colors.WAIT;
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1EFE9;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="52">
              <span style="display:inline-block;padding:4px 8px;background:${c.bg};border:1px solid ${c.border};border-radius:6px;font-family:monospace;font-size:11px;font-weight:800;color:${c.color};letter-spacing:0.08em;">${type}</span>
            </td>
            <td style="padding-left:12px;">
              <strong style="color:#1C1917;font-size:14px;">${item.name || item.ticker}</strong>
              <span style="color:#9CA3AF;font-size:12px;margin-left:6px;">${item.ticker}</span>
              ${item.confidence ? `<span style="color:#9CA3AF;font-size:11px;margin-left:6px;">${item.confidence}% conf.</span>` : ""}
              <p style="color:#78716C;font-size:13px;margin:4px 0 0;line-height:1.5;">${item.rationale || ""}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  };

  const newsRows = news.slice(0, 6).map(a => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1EFE9;">
        <span style="display:inline-block;font-size:10px;font-family:monospace;padding:1px 6px;background:#EFF6FF;color:#1D4ED8;border-radius:4px;margin-bottom:4px;">${a.stock}</span>
        <p style="color:#1C1917;font-size:13px;font-weight:600;margin:0 0 3px;line-height:1.4;">${a.title}</p>
        <p style="color:#9CA3AF;font-size:11px;margin:0;">${a.source} · ${a.date}</p>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>NSE Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1C4B82 0%,#1a6b8a 100%);border-radius:20px;padding:32px;margin-bottom:20px;text-align:center;position:relative;overflow:hidden;">
      <div style="display:inline-block;width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:11px;line-height:44px;font-size:22px;font-weight:800;color:#fff;margin-bottom:14px;">N</div>
      <h1 style="color:#fff;font-size:22px;margin:0 0 6px;font-weight:700;letter-spacing:-0.02em;">NSE Intelligence Digest</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">${today} · Nairobi Securities Exchange</p>
    </div>

    <!-- Market Summary -->
    ${digest.marketSummary ? `
    <div style="background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8E4DC;border-left:4px solid #1C4B82;">
      <p style="font-size:11px;color:#9CA3AF;font-family:monospace;margin:0 0 8px;letter-spacing:0.06em;text-transform:uppercase;">Market Summary</p>
      <p style="color:#1C1917;font-size:15px;line-height:1.7;margin:0;font-weight:500;">${digest.marketSummary}</p>
      ${digest.keyTheme ? `<p style="color:#6B7280;font-size:12px;margin:10px 0 0;font-style:italic;">Theme: ${digest.keyTheme}</p>` : ""}
    </div>` : ""}

    <!-- Signals -->
    <div style="background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8E4DC;">
      <p style="font-size:11px;color:#9CA3AF;font-family:monospace;margin:0 0 14px;letter-spacing:0.06em;text-transform:uppercase;">Today's Investment Signals</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${bullish.map(i => signalRow(i, "BUY")).join("")}
        ${bearish.map(i => signalRow(i, "SELL")).join("")}
        ${watchList.map(i => signalRow(i, "WAIT")).join("")}
      </table>
      ${bullish.length + bearish.length + watchList.length === 0 ? '<p style="color:#9CA3AF;font-size:13px;text-align:center;padding:10px 0;">Insufficient news data for signals today</p>' : ""}
    </div>

    <!-- News -->
    ${news.length > 0 ? `
    <div style="background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:16px;border:1px solid #E8E4DC;">
      <p style="font-size:11px;color:#9CA3AF;font-family:monospace;margin:0 0 14px;letter-spacing:0.06em;text-transform:uppercase;">Latest News Headlines</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${newsRows}
      </table>
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${process.env.APP_URL || "https://nse-intelligence.vercel.app"}" style="display:inline-block;padding:13px 28px;background:#1C4B82;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">
        View Full Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0;">
      <p style="color:#A8A29E;font-size:11px;margin:0 0 6px;">NSE Intelligence · Nairobi, Kenya · Delivered daily at 7:00 AM EAT</p>
      <p style="color:#C4B5A5;font-size:10px;margin:0;line-height:1.6;">
        ⚠ This digest is AI-generated from news sentiment and is for informational purposes only.<br>
        It does not constitute financial advice. Always consult a licensed financial advisor.
      </p>
    </div>

  </div>
</body>
</html>`;
}
