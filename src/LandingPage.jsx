import { useState } from "react";

const STOCKS_PREVIEW = [
  { ticker: "SCOM", name: "Safaricom",  price: "19.10",  change: "+2.1%",  up: true,  signal: "BUY",  color: "#00875A" },
  { ticker: "KCB",  name: "KCB Group", price: "43.50",  change: "-0.8%",  up: false, signal: "WAIT", color: "#1D4ED8" },
  { ticker: "EQTY", name: "Equity",    price: "52.00",  change: "+1.4%",  up: true,  signal: "BUY",  color: "#DC2626" },
  { ticker: "EABL", name: "EABL",      price: "138.00", change: "-1.2%",  up: false, signal: "SELL", color: "#B45309" },
];

const FEATURES = [
  { icon: "📰", title: "Live news feed",         desc: "All major NSE stocks tracked. Fresh news every hour from Business Daily, Nation, The Standard and Google News." },
  { icon: "🤖", title: "AI sentiment analysis",  desc: "Claude AI reads every article and classifies it as bullish, bearish, or neutral with a confidence score." },
  { icon: "🎯", title: "Daily signals",           desc: "Buy, Sell, or Wait — simple actionable signals with confidence scores, key drivers and risk factors." },
  { icon: "📊", title: "Stock outlooks",          desc: "Comprehensive AI recommendations using news + fundamentals + technical indicators combined." },
  { icon: "✉",  title: "Daily email digest",      desc: "Top bullish and bearish stocks delivered to your inbox at 7 AM EAT every morning." },
  { icon: "📈", title: "Fundamental & Technical", desc: "P/E ratios, RSI, 52-week ranges, dividend yields and revenue growth all feed into every signal." },
];

const STEPS = [
  { n: "01", title: "News fetch",     desc: "We pull live news for each NSE stock from 4 sources every morning." },
  { n: "02", title: "AI analysis",    desc: "Claude AI reads articles and fetches financial fundamentals & technicals." },
  { n: "03", title: "Signals",        desc: "Buy / Sell / Wait signals generated with confidence scores and reasoning." },
  { n: "04", title: "Your inbox",     desc: "Daily digest emailed at 7:00 AM EAT with top picks and market summary." },
];

const PLANS = [
  {
    name: "Free",
    price: "Ksh 0",
    sub: "Forever",
    features: ["Live news feed", "8 NSE stocks tracked", "AI sentiment analysis", "Buy/Sell/Wait signals", "Daily email digest"],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Ksh 990",
    sub: "per month",
    features: ["Everything in Free", "Advanced signal explanations", "Priority news updates", "Custom stock alerts", "API access"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "contact us",
    features: ["Everything in Pro", "Dedicated support", "Custom indicators", "White-label option", "Team accounts"],
    cta: "Contact us",
    highlight: false,
  },
];

export default function LandingPage({ onLaunch }) {
  const [email, setEmail]           = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        setTimeout(() => { setEmail(""); setSubscribed(false); }, 5000);
      }
    } catch {}
    setSubLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#fafaf9", color: "#1C1917", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(28px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; border: none; font-family: inherit; }
      `}</style>

      {/* ── Kenyan decorative background elements ── */}
      <div style={{ position:"fixed", top:"-80px", left:"-80px", width:"360px", height:"360px", border:"10px solid #d32f2f", opacity:0.07, zIndex:0, pointerEvents:"none", clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", animation:"float 9s ease-in-out infinite" }} />
      <div style={{ position:"fixed", bottom:"-120px", right:"-120px", width:"440px", height:"440px", borderRadius:"50%", border:"12px solid #d32f2f", opacity:0.05, zIndex:0, pointerEvents:"none", animation:"float 12s ease-in-out infinite reverse" }} />
      <svg style={{ position:"fixed", top:"8%", right:"4%", width:"220px", height:"270px", opacity:0.07, zIndex:0, pointerEvents:"none" }} viewBox="0 0 200 300">
        <polygon points="100,20 180,250 20,250" fill="none" stroke="#d32f2f" strokeWidth="4" />
        <line x1="100" y1="20" x2="100" y2="150" stroke="#d32f2f" strokeWidth="2" opacity="0.5" />
      </svg>
      <div style={{ position:"fixed", bottom:"8%", left:"4%", display:"flex", gap:"7px", opacity:0.07, zIndex:0, pointerEvents:"none" }}>
        {[...Array(8)].map((_, i) => <div key={i} style={{ width:"26px", height:"26px", borderRadius:"50%", border:"3px solid #d32f2f" }} />)}
      </div>
      <div style={{ position:"fixed", top:"50%", left:"-80px", width:"200%", height:"2px", background:"repeating-linear-gradient(45deg,#d32f2f 0,#d32f2f 25px,transparent 25px,transparent 50px)", opacity:0.05, zIndex:0, pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── NAV ── */}
        <nav style={{ background:"#fff", borderBottom:"1px solid #E7E5E4", position:"sticky", top:0, zIndex:50, padding:"0 24px" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto", height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
              <div style={{ width:"30px", height:"30px", borderRadius:"7px", background:"linear-gradient(135deg,#1C4B82,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"14px", color:"#fff" }}>N</div>
              <span style={{ fontWeight:"700", fontSize:"15px", fontFamily:"'Fraunces',serif", letterSpacing:"-0.01em" }}>NSE Intelligence</span>
            </div>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <a href="#features" style={{ fontSize:"13px", color:"#78716C", fontWeight:"500", padding:"6px 12px" }}>Features</a>
              <a href="#how" style={{ fontSize:"13px", color:"#78716C", fontWeight:"500", padding:"6px 12px" }}>How it works</a>
              <a href="#pricing" style={{ fontSize:"13px", color:"#78716C", fontWeight:"500", padding:"6px 12px" }}>Pricing</a>
              <button onClick={onLaunch} style={{ padding:"8px 18px", background:"#1C1917", color:"#fff", borderRadius:"8px", fontSize:"13px", fontWeight:"600" }}>
                Launch App →
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ maxWidth:"1100px", margin:"0 auto", padding:"80px 24px 72px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"64px", alignItems:"center" }}>
            <div className="fade-up">
              <div style={{ display:"inline-flex", alignItems:"center", gap:"7px", padding:"5px 12px", background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:"20px", fontSize:"12px", fontWeight:"600", color:"#92400E", marginBottom:"24px" }}>
                🇰🇪 Built for Kenyan investors
              </div>
              <h1 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"48px", lineHeight:"1.1", letterSpacing:"-0.03em", marginBottom:"20px", color:"#1C1917" }}>
                AI insights for<br />NSE stocks
              </h1>
              <p style={{ fontSize:"17px", color:"#78716C", lineHeight:"1.7", marginBottom:"36px", maxWidth:"440px" }}>
                Real-time news analysis, financial fundamentals, and daily Buy/Sell/Wait signals. Know what the market is thinking before you invest.
              </p>
              <div style={{ display:"flex", gap:"12px", marginBottom:"28px", flexWrap:"wrap" }}>
                <button onClick={onLaunch} style={{ padding:"13px 26px", background:"#1C1917", color:"#fff", borderRadius:"9px", fontSize:"14px", fontWeight:"700", boxShadow:"0 4px 14px rgba(0,0,0,0.18)" }}>
                  Launch Dashboard →
                </button>
                <a href="#features" style={{ padding:"13px 22px", background:"#fff", border:"1px solid #D6D3D1", borderRadius:"9px", fontSize:"14px", fontWeight:"600", color:"#1C1917", display:"inline-block" }}>
                  See features
                </a>
              </div>
              <p style={{ fontSize:"12px", color:"#A8A29E" }}>8 major NSE stocks · Daily AI analysis · Free forever</p>
            </div>

            {/* Hero card */}
            <div style={{ background:"#fff", border:"1px solid #E7E5E4", borderRadius:"16px", padding:"24px", boxShadow:"0 8px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize:"11px", color:"#A8A29E", fontFamily:"'DM Mono',monospace", marginBottom:"14px", letterSpacing:"0.05em" }}>LIVE SIGNALS · TODAY</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
                {STOCKS_PREVIEW.map(s => (
                  <div key={s.ticker} style={{ padding:"12px 14px", background:"#fafaf9", border:"1px solid #E7E5E4", borderRadius:"10px", borderLeft:`3px solid ${s.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                      <span style={{ fontWeight:"800", fontSize:"13px", color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.ticker}</span>
                      <span style={{ fontSize:"10px", fontWeight:"800", padding:"2px 7px", borderRadius:"4px", background: s.signal==="BUY"?"#D1FAE5":s.signal==="SELL"?"#FEE2E2":"#FEF3C7", color:s.signal==="BUY"?"#065F46":s.signal==="SELL"?"#991B1B":"#92400E", fontFamily:"'DM Mono',monospace" }}>{s.signal}</span>
                    </div>
                    <div style={{ fontSize:"15px", fontWeight:"700", color:"#1C1917" }}>KSh {s.price}</div>
                    <div style={{ fontSize:"12px", color: s.up?"#059669":"#DC2626", fontWeight:"600", marginTop:"2px" }}>{s.change}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:"12px 14px", background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", fontSize:"12px", color:"#0369A1", fontWeight:"600", textAlign:"center" }}>
                ⚡ Powered by Claude AI · Updated daily
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" style={{ borderTop:"1px solid #E7E5E4", padding:"80px 24px" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"36px", letterSpacing:"-0.02em", marginBottom:"12px" }}>What you get</h2>
            <p style={{ color:"#78716C", fontSize:"16px", marginBottom:"56px" }}>Everything you need to make smarter NSE investment decisions.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0" }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ padding:"28px 32px", borderBottom:`1px solid #E7E5E4`, borderRight: i % 3 !== 2 ? "1px solid #E7E5E4" : "none" }}>
                  <div style={{ fontSize:"28px", marginBottom:"12px" }}>{f.icon}</div>
                  <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:"700", fontSize:"17px", marginBottom:"8px" }}>{f.title}</h3>
                  <p style={{ color:"#78716C", fontSize:"13px", lineHeight:"1.7" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STOCKS ── */}
        <section style={{ borderTop:"1px solid #E7E5E4", padding:"80px 24px", background:"#fff" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"36px", letterSpacing:"-0.02em", marginBottom:"12px" }}>NSE stocks we track</h2>
            <p style={{ color:"#78716C", fontSize:"16px", marginBottom:"40px" }}>8 major listings across banking, telecoms and consumer sectors.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
              {[
                { ticker:"SCOM", name:"Safaricom PLC",   sector:"Telecoms", color:"#00875A" },
                { ticker:"KCB",  name:"KCB Group",       sector:"Banking",  color:"#1D4ED8" },
                { ticker:"EQTY", name:"Equity Bank",     sector:"Banking",  color:"#DC2626" },
                { ticker:"EABL", name:"EABL",            sector:"Consumer", color:"#B45309" },
                { ticker:"COOP", name:"Co-op Bank",      sector:"Banking",  color:"#047857" },
                { ticker:"BATK", name:"BAT Kenya",       sector:"Consumer", color:"#7C3AED" },
                { ticker:"ABSA", name:"Absa Bank Kenya", sector:"Banking",  color:"#BE123C" },
                { ticker:"NCBA", name:"NCBA Group",      sector:"Banking",  color:"#0369A1" },
              ].map(s => (
                <div key={s.ticker} style={{ padding:"16px 18px", background:"#fafaf9", border:"1px solid #E7E5E4", borderRadius:"10px", borderTop:`3px solid ${s.color}` }}>
                  <div style={{ fontWeight:"800", fontSize:"14px", color:s.color, fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>{s.ticker}</div>
                  <div style={{ fontSize:"13px", fontWeight:"600", color:"#1C1917", marginBottom:"4px" }}>{s.name}</div>
                  <div style={{ fontSize:"11px", color:"#A8A29E", fontFamily:"'DM Mono',monospace" }}>{s.sector}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ background:"#1C1917", color:"#fff", padding:"80px 24px" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"36px", letterSpacing:"-0.02em", marginBottom:"12px" }}>How it works</h2>
            <p style={{ color:"#A8A29E", fontSize:"16px", marginBottom:"56px" }}>Four steps from raw news to your inbox every morning.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"32px" }}>
              {STEPS.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"48px", color:"#3F3B36", lineHeight:1, marginBottom:"16px" }}>{s.n}</div>
                  <h3 style={{ fontWeight:"700", fontSize:"16px", marginBottom:"8px" }}>{s.title}</h3>
                  <p style={{ color:"#78716C", fontSize:"13px", lineHeight:"1.7" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ borderTop:"1px solid #E7E5E4", padding:"80px 24px" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"36px", letterSpacing:"-0.02em", marginBottom:"12px" }}>Pricing</h2>
            <p style={{ color:"#78716C", fontSize:"16px", marginBottom:"48px" }}>Start free. Upgrade when you need more.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
              {PLANS.map((plan, i) => (
                <div key={i} style={{ padding:"28px", border:`2px solid ${plan.highlight?"#1C1917":"#E7E5E4"}`, borderRadius:"14px", background: plan.highlight?"#1C1917":"#fff", color: plan.highlight?"#fff":"#1C1917" }}>
                  <div style={{ marginBottom:"20px" }}>
                    <div style={{ fontWeight:"700", fontSize:"14px", color: plan.highlight?"#A8A29E":"#78716C", marginBottom:"6px", fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em", textTransform:"uppercase" }}>{plan.name}</div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"36px", letterSpacing:"-0.02em" }}>{plan.price}</div>
                    <div style={{ fontSize:"12px", color: plan.highlight?"#6B7280":"#A8A29E", marginTop:"2px" }}>{plan.sub}</div>
                  </div>
                  <ul style={{ listStyle:"none", marginBottom:"24px" }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 0", fontSize:"13px", borderBottom: j < plan.features.length-1 ? `1px solid ${plan.highlight?"#2D2A26":"#F3F4F6"}` : "none", color: plan.highlight?"#E7E5E4":"#44403C" }}>
                        <span style={{ width:"16px", height:"16px", borderRadius:"50%", background: plan.highlight?"#059669":"#1C1917", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#fff" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={i === 0 ? onLaunch : undefined}
                    style={{ width:"100%", padding:"12px", borderRadius:"8px", fontSize:"13px", fontWeight:"700", background: plan.highlight?"#fff":"#1C1917", color: plan.highlight?"#1C1917":"#fff", border:"none" }}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ background:"#1C1917", color:"#fff", padding:"72px 24px" }}>
          <div style={{ maxWidth:"560px", margin:"0 auto", textAlign:"center" }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:"800", fontSize:"40px", letterSpacing:"-0.02em", marginBottom:"14px" }}>Ready to invest smarter?</h2>
            <p style={{ color:"#A8A29E", fontSize:"16px", lineHeight:"1.7", marginBottom:"36px" }}>
              Get AI-powered NSE insights in less than 2 minutes. Free forever.
            </p>
            {subscribed ? (
              <div style={{ padding:"16px 24px", background:"rgba(5,150,105,0.15)", border:"1px solid rgba(5,150,105,0.3)", borderRadius:"10px", color:"#34D399", fontWeight:"600" }}>
                ✓ Subscribed! Check your inbox for a welcome email.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ flex:1, padding:"13px 16px", background:"#2D2A26", border:"1px solid #44403C", borderRadius:"8px", color:"#fff", fontSize:"14px", outline:"none", fontFamily:"inherit" }} />
                <button type="submit" disabled={subLoading}
                  style={{ padding:"13px 22px", background:"#fff", color:"#1C1917", borderRadius:"8px", fontSize:"13px", fontWeight:"700", whiteSpace:"nowrap" }}>
                  {subLoading ? "…" : "Subscribe Free"}
                </button>
              </form>
            )}
            <button onClick={onLaunch} style={{ padding:"13px 28px", background:"transparent", border:"1px solid #44403C", borderRadius:"8px", color:"#A8A29E", fontSize:"13px", fontWeight:"600", marginTop:"10px" }}>
              Or go straight to the dashboard →
            </button>
            <p style={{ color:"#6B7280", fontSize:"11px", marginTop:"14px" }}>No credit card required · Unsubscribe anytime</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:"1px solid #E7E5E4", padding:"28px 24px", background:"#fff" }}>
          <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ width:"24px", height:"24px", borderRadius:"6px", background:"linear-gradient(135deg,#1C4B82,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"11px", color:"#fff" }}>N</div>
              <span style={{ fontSize:"13px", color:"#78716C" }}>© 2025 NSE Intelligence · Nairobi, Kenya</span>
            </div>
            <div style={{ display:"flex", gap:"20px" }}>
              {["Privacy","Terms","Contact"].map(l => (
                <a key={l} href="#" style={{ fontSize:"13px", color:"#78716C" }}>{l}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
