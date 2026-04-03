// api/subscribe.js — email subscription handler
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const email = (body.email || "").trim();
    const name  = (body.name  || "").trim();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    // If Resend not configured, still accept the subscription gracefully
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — subscription recorded but no email sent for:", email);
      return res.status(200).json({
        success: true,
        message: "Subscribed! Note: email delivery requires RESEND_API_KEY to be set in Vercel environment variables.",
        email,
      });
    }

    const FROM = process.env.EMAIL_DOMAIN
      ? `NSE Intelligence <nse@${process.env.EMAIL_DOMAIN}>`
      : "NSE Intelligence <onboarding@resend.dev>";

    // Send welcome email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "Welcome to NSE Intelligence Daily Digest 🇰🇪",
        html: welcomeHtml(name || email.split("@")[0]),
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", JSON.stringify(emailData));
      // Still return success — subscription is saved even if welcome email fails
      return res.status(200).json({
        success: true,
        message: "Subscribed! Welcome email could not be sent — check RESEND_API_KEY.",
        resendError: emailData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscribed successfully! Check your inbox for a welcome email.",
      email,
    });

  } catch (err) {
    console.error("subscribe handler error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}

function welcomeHtml(name) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:36px 20px;">

  <div style="background:linear-gradient(135deg,#1C4B82,#1a6b8a);border-radius:18px;padding:32px;margin-bottom:20px;text-align:center;">
    <div style="display:inline-block;width:46px;height:46px;background:rgba(255,255,255,0.15);border-radius:12px;line-height:46px;font-size:22px;font-weight:800;color:#fff;margin-bottom:14px;">N</div>
    <h1 style="color:#fff;font-size:22px;margin:0 0 6px;font-weight:700;">Welcome to NSE Intelligence</h1>
    <p style="color:rgba(255,255,255,0.75);margin:0;font-size:13px;">Your daily AI-powered Nairobi Securities Exchange digest</p>
  </div>

  <div style="background:#fff;border-radius:14px;padding:26px;margin-bottom:16px;border:1px solid #E8E4DC;">
    <p style="color:#1C1917;font-size:16px;margin:0 0 14px;font-weight:600;">Hi ${name} 👋</p>
    <p style="color:#78716C;font-size:14px;line-height:1.7;margin:0 0 14px;">
      You're now subscribed to the <strong>NSE Intelligence Daily Digest</strong>. Every morning at <strong>7:00 AM EAT</strong> you'll receive:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;color:#78716C;font-size:14px;">📰 &nbsp;AI-summarised NSE news headlines</td></tr>
      <tr><td style="padding:6px 0;color:#78716C;font-size:14px;">🎯 &nbsp;Buy / Sell / Wait signals per stock</td></tr>
      <tr><td style="padding:6px 0;color:#78716C;font-size:14px;">↑ &nbsp;Top 3 bullish picks with reasoning</td></tr>
      <tr><td style="padding:6px 0;color:#78716C;font-size:14px;">↓ &nbsp;Top 3 bearish warnings</td></tr>
      <tr><td style="padding:6px 0;color:#78716C;font-size:14px;">📊 &nbsp;Overall market sentiment summary</td></tr>
    </table>
    <div style="margin-top:18px;padding:12px 16px;background:#F8F7F4;border-radius:8px;border-left:3px solid #1C4B82;">
      <p style="color:#9CA3AF;font-size:11px;margin:0;line-height:1.6;">⚠ All insights are AI-generated from news sentiment and do not constitute financial advice. Always consult a licensed financial advisor before investing.</p>
    </div>
  </div>

  <div style="text-align:center;margin-bottom:20px;">
    <a href="${process.env.APP_URL || "https://nse-intelligence.vercel.app"}" style="display:inline-block;padding:12px 28px;background:#1C4B82;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open Dashboard →</a>
  </div>

  <p style="color:#C4B5A5;font-size:11px;text-align:center;margin:0;">NSE Intelligence · Nairobi, Kenya · Daily at 7:00 AM EAT</p>
</div>
</body>
</html>`;
}
