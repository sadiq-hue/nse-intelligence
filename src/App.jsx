import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const NSE_STOCKS = [
  { ticker: "SCOM", name: "Safaricom PLC",   sector: "Telecoms", color: "#00875A" },
  { ticker: "KCB",  name: "KCB Group",       sector: "Banking",  color: "#1D4ED8" },
  { ticker: "EQTY", name: "Equity Bank",     sector: "Banking",  color: "#DC2626" },
  { ticker: "EABL", name: "EABL",            sector: "Consumer", color: "#B45309" },
  { ticker: "COOP", name: "Co-op Bank",      sector: "Banking",  color: "#047857" },
  { ticker: "BATK", name: "BAT Kenya",       sector: "Consumer", color: "#7C3AED" },
  { ticker: "ABSA", name: "Absa Bank Kenya", sector: "Banking",  color: "#BE123C" },
  { ticker: "NCBA", name: "NCBA Group",      sector: "Banking",  color: "#0369A1" },
];

const SENTIMENT_CONFIG = {
  bullish: { label: "Bullish", color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", icon: "↑" },
  bearish: { label: "Bearish", color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5", icon: "↓" },
  neutral: { label: "Neutral", color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB", icon: "→" },
};

const RECO_CONFIG = {
  "Strong Buy":  { color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" },
  "Buy":         { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
  "Hold":        { color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" },
  "Watch":       { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
  "Sell":        { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  "Strong Sell": { color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" },
};

const DECISION = {
  "Buy":  { label:"BUY",  color:"#065F46", bg:"#D1FAE5", border:"#6EE7B7", softBg:"#ECFDF5", icon:"↑", desc:"Positive signals — consider entering" },
  "Sell": { label:"SELL", color:"#991B1B", bg:"#FEE2E2", border:"#FCA5A5", softBg:"#FEF2F2", icon:"↓", desc:"Negative signals — consider reducing" },
  "Wait": { label:"WAIT", color:"#92400E", bg:"#FEF3C7", border:"#FCD34D", softBg:"#FFFBEB", icon:"→", desc:"Mixed signals — monitor before acting" },
};

const FALLBACK_NEWS = [
  { id:"f1",  title:"Safaricom posts record M-Pesa revenue of KSh 117B in H1 2025",          source:"Business Daily", url:"#", date:"2025-03-28", stock:"SCOM", content:"Safaricom's M-Pesa segment delivered unprecedented growth in H1 FY2025, recording revenues of KSh 117 billion. Growth was driven by Ethiopian expansion and rising transaction volumes across East Africa." },
  { id:"f2",  title:"Safaricom Ethiopia reaches 5 million subscribers ahead of schedule",    source:"Google News",    url:"#", date:"2025-03-25", stock:"SCOM", content:"Safaricom Ethiopia crossed 5 million subscribers 18 months ahead of projections, boosted by competitive pricing and rural coverage expansion. Analysts forecast the unit breaking even by FY2027." },
  { id:"f3",  title:"Safaricom faces antitrust probe over mobile money dominance",           source:"Business Daily", url:"#", date:"2025-03-19", stock:"SCOM", content:"Kenya's Competition Authority opened a formal inquiry into M-Pesa's dominant market position following complaints from smaller fintechs about interoperability barriers." },
  { id:"f4",  title:"CBK raises concerns over digital lending at listed banks",              source:"Nation Business",url:"#", date:"2025-03-27", stock:"KCB",  content:"The Central Bank issued guidance to KCB Group and Equity Bank over interest rate disclosures on mobile loan products, citing consumer protection concerns amid rising NPLs." },
  { id:"f5",  title:"KCB Group completes acquisition of DRC's Trust Merchant Bank",         source:"Nation Business",url:"#", date:"2025-03-24", stock:"KCB",  content:"KCB Group completed the USD 55 million acquisition of Trust Merchant Bank in DRC, strengthening its regional footprint and access to the mining and trade finance corridor." },
  { id:"f6",  title:"KCB Group profit before tax rises 18% to KSh 51B in FY2024",          source:"The Standard",   url:"#", date:"2025-03-18", stock:"KCB",  content:"KCB reported PBT of KSh 51 billion for FY2024, up 18% YoY, driven by net interest income growth and improved loan quality. Board recommended a KSh 4.00 dividend per share." },
  { id:"f7",  title:"Equity Bank expands into DRC with new digital banking licenses",       source:"The Standard",   url:"#", date:"2025-03-26", stock:"EQTY", content:"Equity Group secured regulatory approval for full digital banking operations in DRC, adding over 90 million potential customers to its seven-country footprint." },
  { id:"f8",  title:"Equity Bank mobile loans book grows 34% YoY to KSh 89B",              source:"Business Daily", url:"#", date:"2025-03-22", stock:"EQTY", content:"Equity Group's digital loan book hit KSh 89 billion, up 34% year-on-year, with 60% of disbursements via mobile. NPLs in the digital segment stayed below 4%, beating industry average." },
  { id:"f9",  title:"EABL volumes decline 8% as illicit brews eat into market share",      source:"Business Daily", url:"#", date:"2025-03-25", stock:"EABL", content:"EABL reported an 8% volume decline due to the proliferation of illicit and counterfeit alcohol in Kenya and Uganda, threatening further margin compression in H2." },
  { id:"f10", title:"EABL wins court case against KRA over KSh 4.2B excise duty dispute",  source:"Google News",    url:"#", date:"2025-03-21", stock:"EABL", content:"The High Court ruled in EABL's favour in a long-running KRA tax dispute worth KSh 4.2 billion in backdated excise duties, boosting the company's net cash position." },
  { id:"f11", title:"Co-op Bank launches KSh 5B green bond for climate agriculture",       source:"Nation Business",url:"#", date:"2025-03-20", stock:"COOP", content:"Co-operative Bank announced a KSh 5 billion green bond to finance climate-smart agriculture and renewable energy, attracting interest from global ESG-focused DFIs." },
  { id:"f12", title:"NSE 20-Share Index drops 2.3% on foreign investor selling",           source:"The Standard",   url:"#", date:"2025-03-23", stock:"KCB",  content:"The NSE 20-Share Index fell 2.3% as foreign institutional investors sold for a third consecutive week. A stronger US dollar and rising treasury yields triggered the capital outflow." },
];

const CACHE_KEY   = "nse_articles_v4";
const OUTLOOK_KEY = "nse_outlooks_v4";
const NEWS_KEY    = "nse_live_news_v4";
const CACHE_TTL   = 24 * 60 * 60 * 1000;

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}
function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

async function callClaude(messages, system, maxTokens = 900) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return data.content?.map(i => i.text || "").join("").replace(/```json\n?|```/g, "").trim();
}

async function fetchLiveNews(ticker, name) {
  try {
    const res = await fetch(`/api/news?ticker=${ticker}&name=${encodeURIComponent(name)}`);
    if (!res.ok) return [];
    const { articles } = await res.json();
    return (articles || []).map((a, i) => ({ ...a, id: `live_${ticker}_${i}` }));
  } catch { return []; }
}

function fallbackOutlook(ticker) {
  return {
    overallSentiment: "Neutral", confidenceScore: 30, recommendation: "Watch",
    keyDrivers: ["No recent news found"],
    risks: ["Limited public information available"],
    opportunities: ["Monitor for upcoming company announcements"],
    summary: `Insufficient recent news for ${ticker} to generate a reliable outlook. Watch for updates.`,
  };
}

async function analyseStock(stock, articles) {
  if (!articles || articles.length === 0) {
    return { articleAnalyses: [], outlook: fallbackOutlook(stock.ticker) };
  }
  const trimmed = articles.slice(0, 3).map(a => ({
    ...a, content: (a.content || a.title).slice(0, 280),
  }));
  const articlesText = trimmed.map((a, i) => `[${i+1}] "${a.title}"\n${a.content}`).join("\n\n");
  const prompt =
    `Analyse ${stock.name} (${stock.ticker}) on the Nairobi Securities Exchange.\n` +
    `${trimmed.length} recent articles:\n\n${articlesText}\n\n` +
    `Return ONLY a JSON object with:\n` +
    `"articles": array of ${trimmed.length} objects each {summary,sentiment,category}\n` +
    `"outlook": {overallSentiment,confidenceScore,recommendation,keyDrivers,risks,opportunities,summary}`;
  try {
    const raw = await callClaude(
      [{ role: "user", content: prompt }],
      "Return ONLY valid JSON starting with { and ending with }. No markdown, no extra text.",
      800
    );
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    const defaultArticle = { summary: "See article for details.", sentiment: "neutral", category: "other" };
    return {
      articleAnalyses: Array.isArray(parsed.articles) ? parsed.articles : trimmed.map(() => defaultArticle),
      outlook: (parsed.outlook && parsed.outlook.overallSentiment) ? parsed.outlook : fallbackOutlook(stock.ticker),
    };
  } catch (err) {
    console.error(`analyseStock error for ${stock.ticker}:`, err.message);
    return {
      articleAnalyses: trimmed.map(() => ({ summary: "Analysis unavailable.", sentiment: "neutral", category: "other" })),
      outlook: fallbackOutlook(stock.ticker),
    };
  }
}

function getDecision(outlook) {
  if (!outlook) return null;
  if (!outlook.overallSentiment && !outlook.recommendation) return "Wait";
  const r = (outlook.recommendation || "").trim();
  const s = (outlook.overallSentiment || "").toLowerCase().trim();
  const c = Number(outlook.confidenceScore) || 0;
  if (["Strong Buy","Buy"].includes(r)) return "Buy";
  if (["Sell","Strong Sell"].includes(r)) return "Sell";
  if (s === "bullish" && c >= 60) return "Buy";
  if (s === "bearish" && c >= 55) return "Sell";
  return "Wait";
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#F8F7F4",
  surface: "#FFFFFF",
  surfaceAlt: "#F1EFE9",
  border: "#E8E4DC",
  borderStrong: "#D4CFC4",
  text: "#1C1917",
  textMuted: "#78716C",
  textFaint: "#A8A29E",
  accent: "#1C4B82",
  accentLight: "#EFF6FF",
  accentBorder: "#BFDBFE",
  green: "#059669",
  greenBg: "#ECFDF5",
  red: "#DC2626",
  redBg: "#FEF2F2",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 10px 30px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)",
  radius: "12px",
  radiusSm: "8px",
  radiusLg: "16px",
};

// ─── Reusable UI Atoms ────────────────────────────────────────────────────────
function Pill({ children, color, bg, border }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"3px",
      padding:"2px 9px", borderRadius:"20px",
      background: bg || T.surfaceAlt,
      border: `1px solid ${border || T.border}`,
      color: color || T.textMuted,
      fontSize:"11px", fontWeight:"600", fontFamily:"'DM Mono',monospace",
      letterSpacing:"0.03em", whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function SentimentBadge({ sentiment, score }) {
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <Pill color={cfg.color} bg={cfg.bg} border={cfg.border}>
      {cfg.icon} {cfg.label}{score != null ? ` ${score}%` : ""}
    </Pill>
  );
}

function RecoBadge({ reco }) {
  const cfg = RECO_CONFIG[reco] || RECO_CONFIG["Hold"];
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:"6px",
      background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
      fontSize:"10px", fontWeight:"800", letterSpacing:"0.08em",
      textTransform:"uppercase", fontFamily:"'DM Mono',monospace",
    }}>{reco}</span>
  );
}

function ConfidenceMeter({ score }) {
  const color = score >= 70 ? T.green : score >= 40 ? T.amber : T.red;
  const bg    = score >= 70 ? "#D1FAE5" : score >= 40 ? "#FEF3C7" : "#FEE2E2";
  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
        <span style={{ fontSize:"10px", color:T.textFaint, fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}>CONFIDENCE</span>
        <span style={{ fontSize:"11px", fontWeight:"700", color, fontFamily:"'DM Mono',monospace" }}>{score}%</span>
      </div>
      <div style={{ height:"6px", background:T.surfaceAlt, borderRadius:"3px", overflow:"hidden", border:`1px solid ${T.border}` }}>
        <div style={{ height:"100%", width:`${score}%`, background:color, borderRadius:"3px", transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

function Card({ children, style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.borderStrong : T.border}`,
        borderRadius: T.radius,
        boxShadow: hovered ? T.shadowMd : T.shadow,
        transition: "all 0.2s ease",
        ...style,
      }}
    >{children}</div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"20px" }}>
      <div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"22px", color:T.text, margin:"0 0 2px", letterSpacing:"-0.02em" }}>{title}</h2>
        {subtitle && <p style={{ fontSize:"12px", color:T.textFaint, margin:0, fontFamily:"'DM Mono',monospace" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ article }) {
  const an = article.analysis;
  const sentimentKey = an?.sentiment === "positive" ? "bullish" : an?.sentiment === "negative" ? "bearish" : "neutral";
  const stockInfo = NSE_STOCKS.find(s => s.ticker === article.stock);
  const isLive = String(article.id).startsWith("live_");

  return (
    <Card style={{ padding:"18px", display:"flex", flexDirection:"column", gap:"10px" }}>
      {/* Top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
        <a href={article.url !== "#" ? article.url : undefined} target="_blank" rel="noopener noreferrer"
          style={{ color:T.text, fontWeight:"600", fontSize:"13.5px", lineHeight:"1.5", textDecoration:"none", fontFamily:"'Fraunces',serif", flex:1, cursor: article.url !== "#" ? "pointer" : "default" }}
          onMouseEnter={e=>{ if(article.url !== "#") e.target.style.color = T.accent; }}
          onMouseLeave={e=>e.target.style.color = T.text}>
          {article.title}
        </a>
        {an && <div style={{ flexShrink:0 }}><SentimentBadge sentiment={sentimentKey} /></div>}
      </div>

      {/* Meta row */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
        {isLive && (
          <span style={{ fontSize:"9px", fontFamily:"'DM Mono',monospace", fontWeight:"800", padding:"2px 7px", borderRadius:"4px", background:"#D1FAE5", color:T.green, letterSpacing:"0.06em", border:"1px solid #6EE7B7" }}>● LIVE</span>
        )}
        <Pill color={T.accent}>{article.source}</Pill>
        <Pill>{article.date}</Pill>
        <span style={{ fontSize:"10px", fontFamily:"'DM Mono',monospace", fontWeight:"800", padding:"2px 8px", borderRadius:"4px", background: (stockInfo?.color || T.accent) + "15", color: stockInfo?.color || T.accent, border:`1px solid ${(stockInfo?.color || T.accent)}30` }}>{article.stock}</span>
        {an?.category && <Pill>{an.category}</Pill>}
      </div>

      {/* Summary */}
      <p style={{ fontSize:"13px", color:T.textMuted, lineHeight:"1.65", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {an?.summary || article.content.slice(0, 160) + "…"}
      </p>
    </Card>
  );
}

// ─── StockOutlookCard ─────────────────────────────────────────────────────────
function StockOutlookCard({ stock, outlook, isActive }) {
  const sentimentKey = outlook?.overallSentiment?.toLowerCase() === "bullish" ? "bullish"
    : outlook?.overallSentiment?.toLowerCase() === "bearish" ? "bearish" : "neutral";
  const sentCfg = SENTIMENT_CONFIG[sentimentKey];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive ? T.accentLight : T.surface,
        border: `1px solid ${isActive ? T.accentBorder : hovered ? T.borderStrong : T.border}`,
        borderRadius: T.radiusLg,
        padding:"20px",
        boxShadow: isActive ? `0 0 0 3px ${T.accentBorder}` : hovered ? T.shadowMd : T.shadow,
        transition:"all 0.2s",
        position:"relative", overflow:"hidden",
      }}
    >
      {/* Colour strip at top */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background: stock.color, borderRadius:"16px 16px 0 0" }} />

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px", marginTop:"4px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"3px" }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"800", color: stock.color, letterSpacing:"0.08em" }}>{stock.ticker}</span>
            <span style={{ fontSize:"10px", color:T.textFaint, fontFamily:"'DM Mono',monospace", background:T.surfaceAlt, padding:"1px 6px", borderRadius:"4px" }}>{stock.sector}</span>
          </div>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"15px", color:T.text }}>{stock.name}</div>
        </div>
        {outlook && <SentimentBadge sentiment={sentimentKey} score={outlook.confidenceScore} />}
      </div>

      {isActive && !outlook ? (
        <div style={{ padding:"20px 0", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"8px 16px", background:T.accentLight, borderRadius:"20px", border:`1px solid ${T.accentBorder}` }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:T.accent, animation:"pulse 1s infinite", display:"block" }} />
            <span style={{ fontSize:"12px", color:T.accent, fontFamily:"'DM Mono',monospace" }}>Fetching news + analysing…</span>
          </div>
        </div>
      ) : outlook ? (
        <>
          <ConfidenceMeter score={outlook.confidenceScore} />
          {outlook.recommendation && <div style={{ marginTop:"12px" }}><RecoBadge reco={outlook.recommendation} /></div>}

          {outlook.keyDrivers?.length > 0 && (
            <div style={{ marginTop:"12px" }}>
              <div style={{ fontSize:"10px", color:T.textFaint, fontFamily:"'DM Mono',monospace", marginBottom:"6px", letterSpacing:"0.06em" }}>KEY DRIVERS</div>
              {outlook.keyDrivers.slice(0,2).map((d,i) => (
                <div key={i} style={{ display:"flex", gap:"6px", marginBottom:"5px", alignItems:"flex-start" }}>
                  <span style={{ color:T.green, fontSize:"11px", marginTop:"1px", flexShrink:0 }}>▸</span>
                  <span style={{ fontSize:"12px", color:T.textMuted, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.5" }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          {(outlook.risks?.length > 0 || outlook.opportunities?.length > 0) && (
            <div style={{ marginTop:"10px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {outlook.risks?.length > 0 && (
                <div style={{ padding:"8px 10px", background:T.redBg, borderRadius:T.radiusSm, border:`1px solid #FECACA` }}>
                  <div style={{ fontSize:"9px", color:T.red, fontFamily:"'DM Mono',monospace", marginBottom:"4px", letterSpacing:"0.06em" }}>RISKS</div>
                  {outlook.risks.slice(0,1).map((r,i) => <p key={i} style={{ fontSize:"11px", color:"#B91C1C", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.4" }}>{r}</p>)}
                </div>
              )}
              {outlook.opportunities?.length > 0 && (
                <div style={{ padding:"8px 10px", background:T.greenBg, borderRadius:T.radiusSm, border:`1px solid #A7F3D0` }}>
                  <div style={{ fontSize:"9px", color:T.green, fontFamily:"'DM Mono',monospace", marginBottom:"4px", letterSpacing:"0.06em" }}>OPPORTUNITY</div>
                  {outlook.opportunities.slice(0,1).map((o,i) => <p key={i} style={{ fontSize:"11px", color:"#065F46", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.4" }}>{o}</p>)}
                </div>
              )}
            </div>
          )}

          {outlook.summary && (
            <div style={{ marginTop:"10px", padding:"10px 12px", background:T.surfaceAlt, borderRadius:T.radiusSm, borderLeft:`3px solid ${sentCfg.color}` }}>
              <p style={{ fontSize:"12px", color:T.textMuted, margin:0, lineHeight:"1.6", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{outlook.summary}</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding:"16px 0", textAlign:"center" }}>
          <span style={{ fontSize:"12px", color:T.textFaint, fontFamily:"'DM Mono',monospace" }}>Awaiting analysis</span>
        </div>
      )}
    </div>
  );
}

// ─── SignalCard ───────────────────────────────────────────────────────────────
function SignalCard({ stock, outlook, news }) {
  const decision = getDecision(outlook);
  const d = decision ? DECISION[decision] : null;
  const [expanded, setExpanded] = useState(false);
  const stockNews = news.filter(n => n.stock === stock.ticker);
  const [hov, setHov] = useState(false);

  if (!outlook || !d) return null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hov ? T.borderStrong : T.border}`,
        borderRadius: T.radiusLg,
        boxShadow: hov ? T.shadowMd : T.shadow,
        overflow:"hidden", transition:"all 0.2s",
      }}
    >
      {/* Colour header band */}
      <div style={{ height:"4px", background: d.color }} />

      <div style={{ padding:"20px" }}>
        {/* Top row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"3px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"800", color: stock.color, letterSpacing:"0.08em" }}>{stock.ticker}</span>
              <span style={{ fontSize:"10px", color:T.textFaint, background:T.surfaceAlt, padding:"1px 6px", borderRadius:"4px", fontFamily:"'DM Mono',monospace" }}>{stock.sector}</span>
            </div>
            <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"17px", color:T.text }}>{stock.name}</div>
          </div>

          {/* Decision badge */}
          <div style={{
            width:"70px", height:"70px", borderRadius:"12px",
            background: d.softBg, border:`2px solid ${d.border}`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <span style={{ fontSize:"20px", color:d.color, lineHeight:1 }}>{d.icon}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:"800", fontSize:"12px", color:d.color, letterSpacing:"0.1em", marginTop:"3px" }}>{d.label}</span>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom:"14px" }}><ConfidenceMeter score={outlook.confidenceScore} /></div>

        {/* Description */}
        <p style={{ fontSize:"13px", color:T.textMuted, margin:"0 0 12px", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.6" }}>
          <span style={{ fontWeight:"600", color: d.color }}>{d.desc}</span> — {outlook.summary}
        </p>

        {/* Chips */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px" }}>
          {(outlook.keyDrivers || []).slice(0,2).map((dr, i) => (
            <span key={i} style={{ fontSize:"11px", padding:"3px 9px", borderRadius:"20px", background:T.greenBg, color:T.green, fontFamily:"'Plus Jakarta Sans',sans-serif", border:"1px solid #A7F3D0" }}>▸ {dr}</span>
          ))}
          {(outlook.risks || []).slice(0,1).map((r, i) => (
            <span key={i} style={{ fontSize:"11px", padding:"3px 9px", borderRadius:"20px", background:T.redBg, color:T.red, fontFamily:"'Plus Jakarta Sans',sans-serif", border:"1px solid #FECACA" }}>⚠ {r}</span>
          ))}
        </div>

        {/* Expand news */}
        <button onClick={() => setExpanded(e => !e)}
          style={{ width:"100%", padding:"8px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:T.radiusSm, color:T.textMuted, fontSize:"11px", cursor:"pointer", fontFamily:"'DM Mono',monospace", transition:"all 0.2s", textAlign:"left" }}
          onMouseEnter={e => { e.currentTarget.style.background = T.border; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.color = T.textMuted; }}
        >
          {expanded ? "▲ Hide" : "▼ Show"} supporting news ({stockNews.length})
        </button>

        {expanded && (
          <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"8px" }}>
            {stockNews.slice(0,3).map((article, i) => {
              const an = article.analysis;
              const sk = an?.sentiment === "positive" ? "bullish" : an?.sentiment === "negative" ? "bearish" : "neutral";
              const cfg = SENTIMENT_CONFIG[sk];
              return (
                <div key={i} style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:T.radiusSm, borderLeft:`3px solid ${cfg.color}` }}>
                  <div style={{ fontSize:"12px", color:T.text, fontWeight:"600", marginBottom:"4px", fontFamily:"'Fraunces',serif" }}>{article.title}</div>
                  {an?.summary && <p style={{ fontSize:"11px", color:T.textMuted, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.5" }}>{an.summary}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SignalsTab ───────────────────────────────────────────────────────────────
function SignalsTab({ stockOutlooks, news, rankedStocks, onRunAnalysis, running }) {
  const [filter, setFilter] = useState("ALL");

  const allSignals = Object.entries(stockOutlooks)
    .map(([ticker, outlook]) => {
      const stock = NSE_STOCKS.find(s => s.ticker === ticker);
      if (!stock || !outlook) return null;
      return { stock, outlook, decision: getDecision(outlook) };
    })
    .filter(Boolean)
    .sort((a, b) => (b.outlook.confidenceScore || 0) - (a.outlook.confidenceScore || 0));

  const hasData = allSignals.length > 0;
  const buys  = allSignals.filter(s => s.decision === "Buy");
  const sells = allSignals.filter(s => s.decision === "Sell");
  const waits = allSignals.filter(s => s.decision === "Wait");
  const filtered = filter === "ALL" ? allSignals : filter === "Buy" ? buys : filter === "Sell" ? sells : waits;

  if (!hasData) {
    return (
      <div style={{ textAlign:"center", padding:"80px 20px" }}>
        <div style={{ width:"64px", height:"64px", background:T.accentLight, borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"28px", border:`1px solid ${T.accentBorder}` }}>🎯</div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"22px", color:T.text, margin:"0 0 8px" }}>No Signals Yet</h2>
        <p style={{ fontSize:"14px", color:T.textMuted, marginBottom:"6px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Run the AI analysis first — signals are generated automatically.</p>
        <p style={{ fontSize:"12px", color:T.textFaint, marginBottom:"28px", fontFamily:"'DM Mono',monospace" }}>
          {Object.keys(stockOutlooks).length > 0 ? `${Object.keys(stockOutlooks).length} outlooks in state but signals failed` : "No analysis data found"}
        </p>
        <button onClick={onRunAnalysis} disabled={running}
          style={{ padding:"12px 28px", background:T.accent, border:"none", borderRadius:T.radiusSm, color:"#fff", fontSize:"13px", fontWeight:"700", cursor:running?"default":"pointer", fontFamily:"'DM Mono',monospace", boxShadow:T.shadowMd }}>
          {running ? "Analysing…" : "🤖 Run Analysis Now"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Investment Signals"
        subtitle={`AI-generated decisions · ${allSignals.length} of ${NSE_STOCKS.length} stocks analysed`}
      />

      {/* Scoreboard */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
        {[
          { label:"BUY",  count:buys.length,  d:DECISION["Buy"],  sub:"Strong positive signals" },
          { label:"WAIT", count:waits.length, d:DECISION["Wait"], sub:"Mixed or unclear signals" },
          { label:"SELL", count:sells.length, d:DECISION["Sell"], sub:"Negative signals present" },
        ].map((s,i) => (
          <div key={i} onClick={() => setFilter(filter === s.label ? "ALL" : s.label)}
            style={{
              padding:"20px", background: filter===s.label ? s.d.softBg : T.surface,
              border:`2px solid ${filter===s.label ? s.d.border : T.border}`,
              borderRadius:T.radiusLg, textAlign:"center", cursor:"pointer",
              boxShadow: filter===s.label ? T.shadowMd : T.shadow,
              transition:"all 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=T.shadowMd}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=filter===s.label?T.shadowMd:T.shadow}
          >
            <div style={{ fontSize:"40px", fontWeight:"800", color:s.d.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{s.count}</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", margin:"8px 0 4px" }}>
              <span style={{ fontSize:"14px", color:s.d.color }}>{s.d.icon}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:"800", fontSize:"13px", color:s.d.color, letterSpacing:"0.1em" }}>{s.label}</span>
            </div>
            <div style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        {[
          { f:"ALL",  label:`All (${allSignals.length})`, color:T.accent, bg:T.accentLight, border:T.accentBorder },
          { f:"Buy",  label:`↑ Buy (${buys.length})`,     color:T.green,  bg:T.greenBg,    border:"#A7F3D0" },
          { f:"Wait", label:`→ Wait (${waits.length})`,   color:T.amber,  bg:T.amberBg,    border:"#FCD34D" },
          { f:"Sell", label:`↓ Sell (${sells.length})`,   color:T.red,    bg:T.redBg,      border:"#FECACA" },
        ].map(item => (
          <button key={item.f} onClick={() => setFilter(item.f)}
            style={{
              padding:"6px 16px", borderRadius:"20px", cursor:"pointer",
              background: filter===item.f ? item.bg : T.surface,
              border: `1px solid ${filter===item.f ? item.border : T.border}`,
              color: filter===item.f ? item.color : T.textMuted,
              fontSize:"12px", fontWeight:"700", fontFamily:"'DM Mono',monospace",
              boxShadow: filter===item.f ? T.shadow : "none",
              transition:"all 0.2s",
            }}>{item.label}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:"11px", color:T.textFaint, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Click cards to expand news</span>
      </div>

      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"16px", marginBottom:"24px" }}>
        {filtered.map(({ stock, outlook }) => (
          <SignalCard key={stock.ticker} stock={stock} outlook={outlook} news={news} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ padding:"14px 16px", background:T.amberBg, border:`1px solid #FCD34D`, borderRadius:T.radius, display:"flex", gap:"10px" }}>
        <span style={{ color:T.amber, fontSize:"14px", flexShrink:0 }}>⚠</span>
        <p style={{ fontSize:"12px", color:"#78350F", margin:0, lineHeight:"1.6", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          <strong>Disclaimer:</strong> Signals are derived purely from news sentiment and do not constitute financial advice. Always consult a licensed financial advisor before investing on the NSE.
        </p>
      </div>
    </div>
  );
}

// ─── EmailDigest ──────────────────────────────────────────────────────────────
function EmailDigest({ stockOutlooks }) {
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [subStatus, setSubStatus] = useState("idle"); // idle | loading | success | error
  const [subMsg, setSubMsg]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [digest, setDigest]     = useState(null);
  const hasData = Object.keys(stockOutlooks).length > 0;

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) { setSubMsg("Please enter a valid email address."); setSubStatus("error"); return; }
    setSubStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubStatus("success");
        setSubMsg("🎉 Subscribed! Check your inbox for a welcome email. You'll receive your first digest tomorrow at 7:00 AM EAT.");
        setEmail(""); setName("");
      } else {
        setSubStatus("error");
        setSubMsg(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setSubStatus("error");
      setSubMsg("Network error. Please try again.");
    }
  };

  const generate = async () => {
    setLoading(true);
    const summary = Object.entries(stockOutlooks)
      .map(([t,o])=>`${t}: ${o.overallSentiment} (${o.confidenceScore}%), Rec: ${o.recommendation}. ${o.summary}`)
      .join("\n");
    const raw = await callClaude(
      [{ role:"user", content:`Generate a daily NSE email digest:\n${summary}\n\nReturn JSON: { "subject":"...","executiveSummary":"3 sentences","bullishPicks":[{"ticker":"...","rationale":"..."}],"bearishWarnings":[{"ticker":"...","rationale":"..."}],"closingNote":"1 sentence" }` }],
      "You are a senior NSE investment analyst. Return only valid JSON.", 800
    );
    try { setDigest(JSON.parse(raw)); } catch { setDigest({ subject:"NSE Daily Digest", executiveSummary: raw }); }
    setLoading(false);
  };

  return (
    <Card style={{ padding:"24px" }} hover={false}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px", paddingBottom:"16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ width:"40px", height:"40px", background:T.accentLight, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", border:`1px solid ${T.accentBorder}` }}>✉</div>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"16px", color:T.text }}>Daily Email Digest</div>
          <div style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'DM Mono',monospace" }}>Sent every day at 7:00 AM EAT via Resend</div>
        </div>
        <div style={{ marginLeft:"auto", padding:"4px 10px", background:T.greenBg, border:`1px solid #A7F3D0`, borderRadius:"20px" }}>
          <span style={{ fontSize:"10px", color:T.green, fontFamily:"'DM Mono',monospace", fontWeight:"700" }}>● LIVE</span>
        </div>
      </div>

      {/* What you get */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"20px" }}>
        {["📰 AI news summaries","🎯 Buy/Sell/Wait signals","↑ Top bullish picks","↓ Bearish warnings","📊 Market sentiment","⚡ Delivered at 7 AM EAT"].map((item,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 10px", background:T.surfaceAlt, borderRadius:"8px", border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:"12px", color:T.textMuted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Subscription form */}
      {subStatus === "success" ? (
        <div style={{ padding:"16px 20px", background:T.greenBg, border:`1px solid #A7F3D0`, borderRadius:T.radiusSm, textAlign:"center" }}>
          <div style={{ fontSize:"22px", marginBottom:"8px" }}>🎉</div>
          <p style={{ color:T.green, fontWeight:"700", fontSize:"14px", margin:"0 0 4px", fontFamily:"'Fraunces',serif" }}>You're subscribed!</p>
          <p style={{ color:"#065F46", fontSize:"12px", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:"1.6" }}>{subMsg}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <div style={{ display:"flex", gap:"8px" }}>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name (optional)"
              style={{ flex:1, padding:"10px 14px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:T.radiusSm, color:T.text, fontSize:"13px", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }} />
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
              onKeyDown={e => e.key === "Enter" && handleSubscribe()}
              style={{ flex:1, padding:"10px 14px", background:T.surfaceAlt, border:`1px solid ${subStatus==="error"?"#FECACA":T.border}`, borderRadius:T.radiusSm, color:T.text, fontSize:"13px", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }} />
            <button onClick={handleSubscribe} disabled={subStatus==="loading"}
              style={{ padding:"10px 20px", background:subStatus==="loading"?T.surfaceAlt:T.accent, border:"none", borderRadius:T.radiusSm, color:subStatus==="loading"?T.textMuted:"#fff", fontSize:"13px", fontWeight:"700", cursor:subStatus==="loading"?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap", boxShadow:subStatus==="loading"?"none":T.shadow, transition:"all 0.2s" }}>
              {subStatus === "loading" ? "Subscribing…" : "Subscribe Free"}
            </button>
          </div>
          {subMsg && subStatus === "error" && (
            <p style={{ fontSize:"12px", color:T.red, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{subMsg}</p>
          )}
          <p style={{ fontSize:"11px", color:T.textFaint, margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Free forever · No spam · Unsubscribe anytime
          </p>
        </div>
      )}

      {/* AI digest preview */}
      {hasData && (
        <div style={{ marginTop:"20px", paddingTop:"20px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'DM Mono',monospace", marginBottom:"12px", letterSpacing:"0.04em" }}>PREVIEW TODAY'S DIGEST</div>
          {!digest ? (
            <button onClick={generate} disabled={loading}
              style={{ width:"100%", padding:"10px", background:loading?T.surfaceAlt:T.accentLight, border:`1px solid ${loading?T.border:T.accentBorder}`, borderRadius:T.radiusSm, color:loading?T.textMuted:T.accent, fontSize:"12px", fontWeight:"700", cursor:loading?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
              {loading ? "Generating preview…" : "Generate Preview Digest"}
            </button>
          ) : (
            <div>
              <div style={{ padding:"10px 14px", background:T.accentLight, borderRadius:T.radiusSm, marginBottom:"10px", border:`1px solid ${T.accentBorder}` }}>
                <div style={{ fontSize:"10px", color:T.accent, fontFamily:"'DM Mono',monospace", marginBottom:"3px" }}>SUBJECT</div>
                <div style={{ fontSize:"14px", fontWeight:"700", color:T.text, fontFamily:"'Fraunces',serif" }}>{digest.subject}</div>
              </div>
              {digest.executiveSummary && <p style={{ fontSize:"13px", color:T.textMuted, lineHeight:"1.7", margin:"0 0 10px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{digest.executiveSummary}</p>}
              {digest.bullishPicks?.length > 0 && (
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ fontSize:"10px", color:T.green, fontFamily:"'DM Mono',monospace", marginBottom:"5px", fontWeight:"700" }}>▲ BULLISH PICKS</div>
                  {digest.bullishPicks.map((p,i)=>(
                    <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"4px" }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:T.green, fontWeight:"800", padding:"1px 6px", background:T.greenBg, borderRadius:"4px", flexShrink:0 }}>{p.ticker}</span>
                      <span style={{ fontSize:"12px", color:T.textMuted }}>{p.rationale}</span>
                    </div>
                  ))}
                </div>
              )}
              {digest.closingNote && <p style={{ fontSize:"12px", color:T.textFaint, fontStyle:"italic", margin:0, padding:"8px 12px", background:T.surfaceAlt, borderRadius:"6px" }}>{digest.closingNote}</p>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function NSEIntelligence() {
  const [activeTab, setActiveTab]         = useState("dashboard");
  const [news, setNews]                   = useState(() => loadCache(NEWS_KEY) || FALLBACK_NEWS);
  const [stockOutlooks, setStockOutlooks] = useState(() => loadCache(OUTLOOK_KEY) || {});
  const [filterStock, setFilterStock]     = useState("ALL");
  const [lastRefresh, setLastRefresh]     = useState(new Date());
  const [running, setRunning]             = useState(false);
  const [currentStock, setCurrentStock]   = useState("");
  const [doneCount, setDoneCount]         = useState(0);
  const [totalCount, setTotalCount]       = useState(0);
  const [statusMsg, setStatusMsg]         = useState("");

  useEffect(() => {
    const cachedArticles = loadCache(CACHE_KEY) || {};
    if (Object.keys(cachedArticles).length > 0) {
      setNews(prev => prev.map(a => ({ ...a, analysis: cachedArticles[a.id] || a.analysis })));
    }
  }, []);

  const runAnalysis = useCallback(async (forceRefresh = false) => {
    if (running) return;
    setRunning(true); setDoneCount(0);
    const stocksToProcess = NSE_STOCKS;
    setTotalCount(stocksToProcess.length);
    const articleCache = forceRefresh ? {} : (loadCache(CACHE_KEY) || {});
    const outlookCache = forceRefresh ? {} : (loadCache(OUTLOOK_KEY) || {});
    let allNews        = forceRefresh ? [] : (loadCache(NEWS_KEY) || FALLBACK_NEWS);

    for (const stock of stocksToProcess) {
      setCurrentStock(stock.ticker);
      setStatusMsg(`Fetching news for ${stock.ticker}…`);
      let liveArticles = [];
      try { liveArticles = await fetchLiveNews(stock.ticker, stock.name); } catch {}
      const fallbackForStock = FALLBACK_NEWS.filter(a => a.stock === stock.ticker);
      const existingTitles   = new Set(liveArticles.map(a => a.title.toLowerCase()));
      const merged = [...liveArticles, ...fallbackForStock.filter(a => !existingTitles.has(a.title.toLowerCase()))].slice(0, 5);
      allNews = [...allNews.filter(a => a.stock !== stock.ticker), ...merged];
      setNews([...allNews]);
      saveCache(NEWS_KEY, allNews);

      if (!forceRefresh && outlookCache[stock.ticker]) {
        setDoneCount(d => d + 1);
        setStockOutlooks(prev => ({ ...prev, [stock.ticker]: outlookCache[stock.ticker] }));
        continue;
      }

      setStatusMsg(`AI analysing ${stock.name}…`);
      try {
        const { articleAnalyses, outlook } = await analyseStock(stock, merged);
        merged.forEach((article, i) => { if (articleAnalyses[i]) articleCache[article.id] = articleAnalyses[i]; });
        saveCache(CACHE_KEY, articleCache);
        setNews(prev => prev.map(a => ({ ...a, analysis: articleCache[a.id] || a.analysis })));
        outlookCache[stock.ticker] = outlook;
        saveCache(OUTLOOK_KEY, outlookCache);
        setStockOutlooks(prev => ({ ...prev, [stock.ticker]: outlook }));
      } catch (err) { console.error(`Failed for ${stock.ticker}:`, err.message); }
      setDoneCount(d => d + 1);
    }

    setCurrentStock("");
    setStockOutlooks({ ...outlookCache });
    saveCache(OUTLOOK_KEY, outlookCache);
    setStatusMsg("Analysis complete ✓");
    setLastRefresh(new Date());
    setRunning(false);
    setActiveTab("signals");
    setTimeout(() => setStatusMsg(""), 4000);
  }, [running]);

  const clearAll = () => {
    [CACHE_KEY, OUTLOOK_KEY, NEWS_KEY].forEach(k => localStorage.removeItem(k));
    setNews(FALLBACK_NEWS); setStockOutlooks({}); setCurrentStock(""); setDoneCount(0); setStatusMsg("");
  };

  const filteredNews  = filterStock === "ALL" ? news : news.filter(n => n.stock === filterStock);
  const liveCount     = news.filter(a => String(a.id).startsWith("live_")).length;
  const analysedCount = news.filter(a => a.analysis).length;
  const rankedStocks  = NSE_STOCKS
    .map(s => ({ ...s, outlook: stockOutlooks[s.ticker] }))
    .sort((a, b) => {
      const score = o => !o ? -999 : o.overallSentiment?.toLowerCase() === "bullish" ? (o.confidenceScore||50) : o.overallSentiment?.toLowerCase() === "bearish" ? -(o.confidenceScore||50) : 0;
      return score(b.outlook) - score(a.outlook);
    });

  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const TABS = [
    { id:"dashboard", label:"Dashboard" },
    { id:"news",      label:"News Feed" },
    { id:"outlook",   label:"Outlook" },
    { id:"signals",   label:"🎯 Signals" },
    { id:"digest",    label:"Digest" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;0,800;1,600&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing:border-box; }
        ::selection { background:#BFDBFE; color:#1D4ED8; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:${T.surfaceAlt}; }
        ::-webkit-scrollbar-thumb { background:${T.borderStrong}; border-radius:3px; }
        input::placeholder { color:${T.textFaint}; }
        button { transition:all 0.2s; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: T.surface, borderBottom:`1px solid ${T.border}`,
        position:"sticky", top:0, zIndex:100,
        boxShadow:"0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:"62px" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:`linear-gradient(135deg, ${T.accent}, #059669)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"16px", color:"#fff", boxShadow:T.shadow }}>N</div>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"15px", color:T.text, lineHeight:1, letterSpacing:"-0.01em" }}>NSE Intelligence</div>
              <div style={{ fontSize:"10px", color:T.textFaint, fontFamily:"'DM Mono',monospace", marginTop:"1px" }}>Nairobi Securities Exchange · AI</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display:"flex", gap:"2px", background:T.surfaceAlt, padding:"3px", borderRadius:"10px", border:`1px solid ${T.border}` }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding:"6px 14px", borderRadius:"8px", cursor:"pointer",
                  background: activeTab===tab.id ? T.surface : "transparent",
                  border: activeTab===tab.id ? `1px solid ${T.border}` : "1px solid transparent",
                  color: activeTab===tab.id ? T.accent : T.textMuted,
                  fontSize:"12px", fontWeight: activeTab===tab.id ? "700" : "500",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  boxShadow: activeTab===tab.id ? T.shadow : "none",
                }}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'DM Mono',monospace", background:T.surfaceAlt, padding:"4px 10px", borderRadius:"6px", border:`1px solid ${T.border}` }}>
              {lastRefresh.toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})} EAT
            </span>
            <button onClick={clearAll} disabled={running}
              style={{ padding:"6px 12px", borderRadius:"7px", background:T.redBg, border:`1px solid #FECACA`, color:T.red, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* ── Progress banner ── */}
      {(running || statusMsg) && (
        <div style={{ background:T.accentLight, borderBottom:`1px solid ${T.accentBorder}`, padding:"10px 24px" }}>
          <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: running ? "8px" : "0" }}>
              <span style={{ fontSize:"13px", color:T.accent, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:"600" }}>
                {running ? <>Analysing <strong style={{ color:NSE_STOCKS.find(s=>s.ticker===currentStock)?.color||T.accent }}>{currentStock}</strong> — {statusMsg}</> : statusMsg}
              </span>
              {running && <span style={{ fontSize:"12px", color:T.accent, fontFamily:"'DM Mono',monospace" }}>{doneCount}/{totalCount}</span>}
            </div>
            {running && (
              <div style={{ height:"5px", background:T.accentBorder, borderRadius:"3px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${progressPct}%`, background:T.accent, borderRadius:"3px", transition:"width 0.5s ease" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ maxWidth:"1280px", margin:"0 auto", padding:"28px 24px" }}>

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            {/* Hero action */}
            <div style={{ background:`linear-gradient(135deg, ${T.accent} 0%, #1a6b8a 100%)`, borderRadius:"20px", padding:"32px 36px", marginBottom:"28px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:T.shadowLg, overflow:"hidden", position:"relative" }}>
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
              <div style={{ position:"absolute", bottom:"-60px", right:"120px", width:"160px", height:"160px", borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
              <div>
                <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"26px", color:"#fff", marginBottom:"6px", letterSpacing:"-0.02em" }}>NSE Investment Intelligence</div>
                <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.75)", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  AI-powered news analysis for {NSE_STOCKS.length} Nairobi Securities Exchange stocks
                </p>
              </div>
              <div style={{ display:"flex", gap:"10px", flexShrink:0 }}>
                <button onClick={() => runAnalysis(false)} disabled={running}
                  style={{ padding:"12px 24px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"10px", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:running?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {running ? `Analysing ${currentStock}… (${doneCount}/${totalCount})` : Object.keys(stockOutlooks).length > 0 ? "↻ Refresh Analysis" : "🤖 Analyse All Stocks"}
                </button>
                {!running && Object.keys(stockOutlooks).length > 0 && (
                  <button onClick={() => runAnalysis(true)}
                    style={{ padding:"12px 20px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"10px", color:"rgba(255,255,255,0.85)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Force Refresh
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"28px" }}>
              {[
                { label:"Stocks Tracked",   value:NSE_STOCKS.length,                                                                                    color:T.accent, icon:"📊", sub:"NSE primary listings" },
                { label:"News Articles",    value:news.length,                                                                                           color:T.text,   icon:"📰", sub:`${liveCount} live · ${analysedCount} analysed` },
                { label:"Bullish Signals",  value:Object.values(stockOutlooks).filter(o=>o?.overallSentiment?.toLowerCase()==="bullish").length,         color:T.green,  icon:"↑",  sub:"Positive outlook" },
                { label:"Bearish Signals",  value:Object.values(stockOutlooks).filter(o=>o?.overallSentiment?.toLowerCase()==="bearish").length,         color:T.red,    icon:"↓",  sub:"Negative outlook" },
              ].map((s,i) => (
                <Card key={i} style={{ padding:"18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <span style={{ fontSize:"10px", color:T.textFaint, fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em", textTransform:"uppercase" }}>{s.label}</span>
                    <span style={{ fontSize:"16px" }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize:"32px", fontWeight:"800", color:s.color, fontFamily:"'Fraunces',serif", lineHeight:1, marginBottom:"4px" }}>{s.value}</div>
                  <div style={{ fontSize:"11px", color:T.textFaint }}>{s.sub}</div>
                </Card>
              ))}
            </div>

            {/* Rankings */}
            <div style={{ marginBottom:"28px" }}>
              <SectionHeader title="Stock Rankings" subtitle="Sorted by AI sentiment score" action={
                <button onClick={() => setActiveTab("signals")} style={{ padding:"7px 14px", background:T.accentLight, border:`1px solid ${T.accentBorder}`, borderRadius:"8px", color:T.accent, fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>View Signals →</button>
              } />
              <Card hover={false} style={{ overflow:"hidden" }}>
                {rankedStocks.map((stock, idx) => {
                  const o = stock.outlook;
                  const sentimentKey = o?.overallSentiment?.toLowerCase()==="bullish"?"bullish":o?.overallSentiment?.toLowerCase()==="bearish"?"bearish":"neutral";
                  const isActive = running && currentStock === stock.ticker;
                  const isLast = idx === rankedStocks.length - 1;
                  return (
                    <div key={stock.ticker} style={{
                      display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px",
                      background: isActive ? T.accentLight : "transparent",
                      borderBottom: isLast ? "none" : `1px solid ${T.border}`,
                      transition:"background 0.2s",
                    }}>
                      <span style={{ fontSize:"12px", color:T.textFaint, fontFamily:"'DM Mono',monospace", width:"24px", flexShrink:0, textAlign:"center" }}>#{idx+1}</span>
                      <div style={{ width:"3px", height:"32px", borderRadius:"2px", background:stock.color, flexShrink:0 }} />
                      <div style={{ flex:1, display:"flex", alignItems:"center", gap:"10px" }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:"800", fontSize:"12px", color:stock.color, letterSpacing:"0.06em" }}>{stock.ticker}</span>
                        <span style={{ fontSize:"14px", fontWeight:"600", color:T.text, fontFamily:"'Fraunces',serif" }}>{stock.name}</span>
                        <span style={{ fontSize:"10px", color:T.textFaint, background:T.surfaceAlt, padding:"1px 6px", borderRadius:"4px", fontFamily:"'DM Mono',monospace" }}>{stock.sector}</span>
                      </div>
                      {isActive ? (
                        <span style={{ fontSize:"11px", color:T.accent, fontFamily:"'DM Mono',monospace", animation:"pulse 1s infinite" }}>⚡ Analysing…</span>
                      ) : o ? (
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <RecoBadge reco={o.recommendation} />
                          <SentimentBadge sentiment={sentimentKey} score={o.confidenceScore} />
                        </div>
                      ) : (
                        <span style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'DM Mono',monospace" }}>{news.filter(n=>n.stock===stock.ticker).length} articles · pending</span>
                      )}
                    </div>
                  );
                })}
              </Card>
            </div>

            {/* Latest news */}
            <SectionHeader title="Latest News" subtitle="Most recent articles" action={
              <button onClick={() => setActiveTab("news")} style={{ padding:"7px 14px", background:T.accentLight, border:`1px solid ${T.accentBorder}`, borderRadius:"8px", color:T.accent, fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>View All →</button>
            } />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {[...news].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(a=><NewsCard key={a.id} article={a} />)}
            </div>
          </div>
        )}

        {/* ── NEWS FEED ── */}
        {activeTab === "news" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <SectionHeader
              title="News Feed"
              subtitle={`${news.length} articles · ${liveCount} live · ${analysedCount} AI-analysed`}
              action={
                <div style={{ display:"flex", gap:"6px" }}>
                  {["Business Daily","Nation Business","The Standard","Google News"].map(src=>(
                    <Pill key={src} color={T.accent}>{src}</Pill>
                  ))}
                </div>
              }
            />
            {/* Stock filter */}
            <div style={{ display:"flex", gap:"6px", marginBottom:"18px", flexWrap:"wrap" }}>
              {["ALL",...NSE_STOCKS.map(s=>s.ticker)].map(ticker=>{
                const stockInfo = NSE_STOCKS.find(s=>s.ticker===ticker);
                const active = filterStock===ticker;
                return (
                  <button key={ticker} onClick={()=>setFilterStock(ticker)}
                    style={{
                      padding:"5px 12px", borderRadius:"7px", cursor:"pointer",
                      background: active ? (stockInfo?.color+"15" || T.accentLight) : T.surface,
                      border: `1px solid ${active ? (stockInfo?.color+"40" || T.accentBorder) : T.border}`,
                      color: active ? (stockInfo?.color || T.accent) : T.textMuted,
                      fontSize:"12px", fontWeight: active?"700":"500",
                      fontFamily:"'DM Mono',monospace",
                      boxShadow: active ? T.shadow : "none",
                    }}>
                    {ticker}{ticker!=="ALL"&&<span style={{ opacity:0.6, marginLeft:"4px" }}>({news.filter(n=>n.stock===ticker).length})</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {[...filteredNews].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(a=><NewsCard key={a.id} article={a} />)}
            </div>
          </div>
        )}

        {/* ── OUTLOOK ── */}
        {activeTab === "outlook" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <SectionHeader
              title="AI Stock Outlook"
              subtitle="Live news sentiment → investment analysis · 1 stock at a time"
              action={
                <button onClick={() => runAnalysis(true)} disabled={running}
                  style={{ padding:"8px 16px", background:running?T.surfaceAlt:T.accent, border:"none", borderRadius:"8px", color:running?T.textMuted:"#fff", fontSize:"12px", fontWeight:"700", cursor:running?"default":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:running?"none":T.shadow }}>
                  {running ? `Analysing ${currentStock}…` : "↻ Refresh All"}
                </button>
              }
            />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
              {NSE_STOCKS.map(stock=>(
                <StockOutlookCard key={stock.ticker} stock={stock} outlook={stockOutlooks[stock.ticker]} isActive={running && currentStock===stock.ticker} />
              ))}
            </div>
            <div style={{ marginTop:"24px", padding:"14px 16px", background:T.amberBg, border:`1px solid #FCD34D`, borderRadius:T.radius, display:"flex", gap:"10px" }}>
              <span style={{ color:T.amber, fontSize:"14px", flexShrink:0 }}>⚠</span>
              <p style={{ fontSize:"12px", color:"#78350F", margin:0, lineHeight:"1.6", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <strong>Disclaimer:</strong> AI outlooks are based solely on aggregated news and are for informational purposes only. Not financial advice. Consult a licensed financial advisor before investing.
              </p>
            </div>
          </div>
        )}

        {/* ── SIGNALS ── */}
        {activeTab === "signals" && (
          <div style={{ animation:"slideIn 0.3s ease" }}>
            <SignalsTab stockOutlooks={stockOutlooks} news={news} rankedStocks={rankedStocks} onRunAnalysis={() => runAnalysis(false)} running={running} />
          </div>
        )}

        {/* ── DIGEST ── */}
        {activeTab === "digest" && (
          <div style={{ animation:"slideIn 0.3s ease", maxWidth:"720px" }}>
            <SectionHeader title="Daily Digest" subtitle="AI-curated daily NSE intelligence report" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
              <Card style={{ padding:"16px" }}>
                <div style={{ fontSize:"10px", color:T.green, fontFamily:"'DM Mono',monospace", marginBottom:"10px", fontWeight:"700", letterSpacing:"0.06em" }}>▲ TOP BULLISH</div>
                {rankedStocks.filter(s=>s.outlook?.overallSentiment?.toLowerCase()==="bullish").slice(0,3).map(s=>(
                  <div key={s.ticker} style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px", alignItems:"center" }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:T.green, fontWeight:"700", background:T.greenBg, padding:"1px 7px", borderRadius:"4px" }}>{s.ticker}</span>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{s.outlook?.confidenceScore}% conf.</span>
                  </div>
                ))}
                {!rankedStocks.some(s=>s.outlook?.overallSentiment?.toLowerCase()==="bullish") && <p style={{ fontSize:"12px", color:T.textFaint, margin:0 }}>Run analysis to populate</p>}
              </Card>
              <Card style={{ padding:"16px" }}>
                <div style={{ fontSize:"10px", color:T.red, fontFamily:"'DM Mono',monospace", marginBottom:"10px", fontWeight:"700", letterSpacing:"0.06em" }}>▼ TOP BEARISH</div>
                {rankedStocks.filter(s=>s.outlook?.overallSentiment?.toLowerCase()==="bearish").slice(0,3).map(s=>(
                  <div key={s.ticker} style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px", alignItems:"center" }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:T.red, fontWeight:"700", background:T.redBg, padding:"1px 7px", borderRadius:"4px" }}>{s.ticker}</span>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{s.outlook?.confidenceScore}% conf.</span>
                  </div>
                ))}
                {!rankedStocks.some(s=>s.outlook?.overallSentiment?.toLowerCase()==="bearish") && <p style={{ fontSize:"12px", color:T.textFaint, margin:0 }}>Run analysis to populate</p>}
              </Card>
            </div>
            <EmailDigest stockOutlooks={stockOutlooks} />
            <Card style={{ padding:"16px", marginTop:"14px" }} hover={false}>
              <div style={{ fontSize:"11px", color:T.textFaint, fontFamily:"'DM Mono',monospace", marginBottom:"12px", fontWeight:"600", letterSpacing:"0.04em" }}>SCHEDULED JOBS</div>
              {[
                {time:"06:00 EAT", job:"Live RSS news fetch per stock from Google News"},
                {time:"06:30 EAT", job:"Sequential AI analysis — 1 stock at a time"},
                {time:"07:00 EAT", job:"Stock outlook rankings update"},
                {time:"07:15 EAT", job:"Daily digest compilation & email dispatch"},
                {time:"14:00 EAT", job:"Intraday news refresh"},
              ].map((job,i)=>(
                <div key={i} style={{ display:"flex", gap:"12px", alignItems:"center", marginBottom:"8px" }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:T.accent, flexShrink:0, width:"80px" }}>{job.time}</span>
                  <span style={{ fontSize:"12px", color:T.textMuted, flex:1 }}>{job.job}</span>
                  <span style={{ fontSize:"10px", color:T.green, fontFamily:"'DM Mono',monospace", fontWeight:"700" }}>● active</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
