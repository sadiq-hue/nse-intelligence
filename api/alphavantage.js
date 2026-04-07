// api/alphavantage.js
// Fetches from Alpha Vantage: News+Sentiment, Technical Indicators, Company Overview
// Then computes a comprehensive 1-100 Investment Score for each NSE stock

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { ticker, name, mode } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  const AV_KEY = process.env.ALPHA_VANTAGE_KEY;
  if (!AV_KEY) {
    return res.status(200).json({
      error: "ALPHA_VANTAGE_KEY not set",
      score: null,
      message: "Add ALPHA_VANTAGE_KEY to Vercel environment variables. Get a free key at alphavantage.co",
    });
  }

  // NSE Kenya stocks use format like "SCOM.NBO" on Alpha Vantage
  // Map our tickers to Alpha Vantage symbols
  const AV_SYMBOL_MAP = {
    SCOM: "SCOM.NBO", KCB: "KCB.NBO",   EQTY: "EQTY.NBO", EABL: "EABL.NBO",
    COOP: "COOP.NBO", BATK: "BATK.NBO", ABSA: "ABSA.NBO", NCBA: "NCBA.NBO",
    DTK:  "DTK.NBO",  IMH:  "IMH.NBO",  SCBK: "SCBK.NBO", SBIC: "SBIC.NBO",
    JUB:  "JUB.NBO",  BRIT: "BRIT.NBO", CIC:  "CIC.NBO",  KEGN: "KEGN.NBO",
    KPLC: "KPLC.NBO", KQ:  "KQ.NBO",   NMG:  "NMG.NBO",  CTUM: "CTUM.NBO",
    KPC:  "KPC.NBO",  HF:  "HF.NBO",
  };
  const avSymbol = AV_SYMBOL_MAP[ticker] || `${ticker}.NBO`;

  const base = "https://www.alphavantage.co/query";

  // Run all fetches in parallel
  const [newsRes, rsiRes, macdRes, smaRes, overviewRes] = await Promise.allSettled([
    // 1. News & Sentiment — search by company name for global coverage
    fetch(`${base}?function=NEWS_SENTIMENT&tickers=${avSymbol}&limit=20&sort=LATEST&apikey=${AV_KEY}`),
    // 2. RSI (14-day)
    fetch(`${base}?function=RSI&symbol=${avSymbol}&interval=daily&time_period=14&series_type=close&apikey=${AV_KEY}`),
    // 3. MACD
    fetch(`${base}?function=MACD&symbol=${avSymbol}&interval=daily&series_type=close&apikey=${AV_KEY}`),
    // 4. SMA (50-day)
    fetch(`${base}?function=SMA&symbol=${avSymbol}&interval=daily&time_period=50&series_type=close&apikey=${AV_KEY}`),
    // 5. Company Overview (fundamentals)
    fetch(`${base}?function=OVERVIEW&symbol=${avSymbol}&apikey=${AV_KEY}`),
  ]);

  const parse = async (settled) => {
    if (settled.status !== "fulfilled") return null;
    try { return await settled.value.json(); } catch { return null; }
  };

  const [newsData, rsiData, macdData, smaData, overviewData] = await Promise.all([
    parse(newsRes), parse(rsiRes), parse(macdRes), parse(smaRes), parse(overviewRes),
  ]);

  // ── 1. Extract News Articles & Sentiment ──────────────────────────────────
  const newsArticles = [];
  let newsSentimentScore = 50; // default neutral

  if (newsData?.feed?.length > 0) {
    const feed = newsData.feed;
    let totalSentiment = 0;
    let sentimentCount = 0;

    feed.forEach(article => {
      // Alpha Vantage sentiment: label + score per ticker
      let articleSentiment = article.overall_sentiment_score || 0;
      let articleLabel     = article.overall_sentiment_label || "Neutral";

      // Check ticker-specific sentiment if available
      const tickerSentiment = article.ticker_sentiment?.find(
        t => t.ticker === avSymbol || t.ticker === ticker
      );
      if (tickerSentiment) {
        articleSentiment = parseFloat(tickerSentiment.ticker_sentiment_score) || articleSentiment;
        articleLabel     = tickerSentiment.ticker_sentiment_label || articleLabel;
      }

      totalSentiment += articleSentiment;
      sentimentCount++;

      newsArticles.push({
        id:        `av_${ticker}_${article.time_published}`,
        title:     article.title,
        url:       article.url,
        source:    article.source,
        date:      article.time_published?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        datetime:  article.time_published,
        content:   article.summary || article.title,
        stock:     ticker,
        isLive:    true,
        avSentiment: {
          score: parseFloat(articleSentiment.toFixed(4)),
          label: articleLabel,
          relevanceScore: tickerSentiment?.relevance_score || null,
        },
      });
    });

    if (sentimentCount > 0) {
      // AV sentiment is -1 to +1, convert to 0-100
      const avgSentiment = totalSentiment / sentimentCount;
      newsSentimentScore = Math.round((avgSentiment + 1) * 50);
    }
  }

  // ── 2. Technical Indicators ───────────────────────────────────────────────
  let rsiValue    = null;
  let macdSignal  = null;
  let macdHist    = null;
  let smaValue    = null;
  let techScore   = 50;

  // RSI
  const rsiSeries = rsiData?.["Technical Analysis: RSI"];
  if (rsiSeries) {
    const latestRSIDate = Object.keys(rsiSeries)[0];
    rsiValue = parseFloat(rsiSeries[latestRSIDate]?.RSI);
  }

  // MACD
  const macdSeries = macdData?.["Technical Analysis: MACD"];
  if (macdSeries) {
    const latestDate = Object.keys(macdSeries)[0];
    macdSignal = parseFloat(macdSeries[latestDate]?.MACD_Signal);
    macdHist   = parseFloat(macdSeries[latestDate]?.MACD_Hist);
  }

  // SMA
  const smaSeries = smaData?.["Technical Analysis: SMA"];
  if (smaSeries) {
    const latestDate = Object.keys(smaSeries)[0];
    smaValue = parseFloat(smaSeries[latestDate]?.SMA);
  }

  // Compute tech score from RSI + MACD
  if (rsiValue !== null) {
    // RSI: < 30 oversold (bullish bounce) = 70+, > 70 overbought = 30-, 40-60 neutral = 50
    let rsiScore;
    if (rsiValue < 25)       rsiScore = 80;
    else if (rsiValue < 35)  rsiScore = 65;
    else if (rsiValue < 45)  rsiScore = 55;
    else if (rsiValue < 55)  rsiScore = 50;
    else if (rsiValue < 65)  rsiScore = 45;
    else if (rsiValue < 75)  rsiScore = 35;
    else                     rsiScore = 25;

    // MACD histogram: positive = bullish momentum
    let macdScore = 50;
    if (macdHist !== null) {
      macdScore = macdHist > 0.5 ? 70 : macdHist > 0 ? 58 : macdHist > -0.5 ? 42 : 30;
    }

    techScore = Math.round(rsiScore * 0.6 + macdScore * 0.4);
  }

  // ── 3. Fundamentals from Company Overview ────────────────────────────────
  let fundamentalScore = 50;
  const fundamentals   = {};

  if (overviewData && overviewData.Symbol) {
    const o = overviewData;
    fundamentals.pe            = parseFloat(o.PERatio)           || null;
    fundamentals.pb            = parseFloat(o.PriceToBookRatio)  || null;
    fundamentals.eps           = parseFloat(o.EPS)               || null;
    fundamentals.dividendYield = parseFloat(o.DividendYield) * 100 || null;
    fundamentals.roe           = parseFloat(o.ReturnOnEquityTTM) * 100 || null;
    fundamentals.revenueGrowth = parseFloat(o.QuarterlyRevenueGrowthYOY) * 100 || null;
    fundamentals.profitMargin  = parseFloat(o.ProfitMargin) * 100 || null;
    fundamentals.debtToEquity  = parseFloat(o.DebtToEquityRatio) || null;
    fundamentals.marketCap     = parseFloat(o.MarketCapitalization) / 1e9 || null;
    fundamentals.weekHigh52    = parseFloat(o["52WeekHigh"])     || null;
    fundamentals.weekLow52     = parseFloat(o["52WeekLow"])      || null;
    fundamentals.beta          = parseFloat(o.Beta)              || null;
    fundamentals.analystTarget = parseFloat(o.AnalystTargetPrice)|| null;
    fundamentals.source        = "Alpha Vantage / Annual Report";
    fundamentals.name          = o.Name;
    fundamentals.description   = o.Description;
    fundamentals.exchange      = o.Exchange;
    fundamentals.sector        = o.Sector;
    fundamentals.industry      = o.Industry;

    // Fundamental scoring (higher = better)
    let fScore = 50;
    const factors = [];

    // P/E: lower is cheaper (for banking 4-8x is good, 15+ expensive)
    if (fundamentals.pe) {
      if (fundamentals.pe < 6)        factors.push(75);
      else if (fundamentals.pe < 10)  factors.push(65);
      else if (fundamentals.pe < 15)  factors.push(55);
      else if (fundamentals.pe < 20)  factors.push(45);
      else                            factors.push(30);
    }

    // Dividend yield (higher is better for NSE stocks)
    if (fundamentals.dividendYield) {
      if (fundamentals.dividendYield > 8)       factors.push(80);
      else if (fundamentals.dividendYield > 5)  factors.push(65);
      else if (fundamentals.dividendYield > 3)  factors.push(55);
      else                                      factors.push(40);
    }

    // ROE: higher is better
    if (fundamentals.roe) {
      if (fundamentals.roe > 20)      factors.push(75);
      else if (fundamentals.roe > 15) factors.push(65);
      else if (fundamentals.roe > 10) factors.push(55);
      else if (fundamentals.roe > 5)  factors.push(45);
      else                            factors.push(30);
    }

    // Revenue growth
    if (fundamentals.revenueGrowth) {
      if (fundamentals.revenueGrowth > 20)     factors.push(75);
      else if (fundamentals.revenueGrowth > 10) factors.push(65);
      else if (fundamentals.revenueGrowth > 5)  factors.push(55);
      else if (fundamentals.revenueGrowth > 0)  factors.push(45);
      else                                      factors.push(25);
    }

    // Analyst target vs current
    if (fundamentals.analystTarget && fundamentals.weekHigh52 && fundamentals.weekLow52) {
      const midPrice = (fundamentals.weekHigh52 + fundamentals.weekLow52) / 2;
      if (fundamentals.analystTarget > midPrice * 1.15) factors.push(75);
      else if (fundamentals.analystTarget > midPrice)   factors.push(60);
      else                                              factors.push(40);
    }

    if (factors.length > 0) {
      fundamentalScore = Math.round(factors.reduce((a, b) => a + b, 0) / factors.length);
    }
  }

  // ── 4. Compute the MASTER INVESTMENT SCORE (1–100) ───────────────────────
  // Weights: News Sentiment 25%, Technical 30%, Fundamentals 35%, Recency Bonus 10%
  const WEIGHTS = { news: 0.25, technical: 0.30, fundamental: 0.35, recency: 0.10 };

  // Recency bonus: more recent news = higher confidence
  const recencyScore = newsArticles.length > 0
    ? Math.min(100, 40 + newsArticles.length * 4)
    : 30;

  const masterScore = Math.round(
    newsSentimentScore * WEIGHTS.news +
    techScore          * WEIGHTS.technical +
    fundamentalScore   * WEIGHTS.fundamental +
    recencyScore       * WEIGHTS.recency
  );

  // Clamp to 1–100
  const investmentScore = Math.max(1, Math.min(100, masterScore));

  // ── 5. Score interpretation ───────────────────────────────────────────────
  let scoreLabel, scoreColor, recommendation;
  if (investmentScore >= 80) {
    scoreLabel = "Strong Buy"; scoreColor = "#065F46"; recommendation = "Strong Buy";
  } else if (investmentScore >= 65) {
    scoreLabel = "Buy"; scoreColor = "#047857"; recommendation = "Buy";
  } else if (investmentScore >= 55) {
    scoreLabel = "Moderate Buy"; scoreColor = "#059669"; recommendation = "Buy";
  } else if (investmentScore >= 45) {
    scoreLabel = "Hold"; scoreColor = "#D97706"; recommendation = "Hold";
  } else if (investmentScore >= 35) {
    scoreLabel = "Watch"; scoreColor = "#92400E"; recommendation = "Watch";
  } else if (investmentScore >= 20) {
    scoreLabel = "Sell"; scoreColor = "#B91C1C"; recommendation = "Sell";
  } else {
    scoreLabel = "Strong Sell"; scoreColor = "#7F1D1D"; recommendation = "Strong Sell";
  }

  return res.status(200).json({
    ticker,
    avSymbol,
    investmentScore,
    scoreLabel,
    scoreColor,
    recommendation,
    breakdown: {
      newsSentimentScore,
      techScore,
      fundamentalScore,
      recencyScore,
      articleCount: newsArticles.length,
      rsi: rsiValue,
      macdHistogram: macdHist,
    },
    articles: newsArticles,
    fundamentals: Object.keys(fundamentals).length > 0 ? fundamentals : null,
    technicals: {
      rsi: rsiValue,
      macd: { signal: macdSignal, histogram: macdHist },
      sma50: smaValue,
      rsiSignal: rsiValue ? (rsiValue < 30 ? "Oversold — Bullish" : rsiValue > 70 ? "Overbought — Caution" : "Neutral RSI zone") : null,
      macdSignal: macdHist ? (macdHist > 0 ? "Bullish momentum" : "Bearish momentum") : null,
    },
    fetchedAt: new Date().toISOString(),
    dataQuality: newsArticles.length > 5 ? "High" : newsArticles.length > 2 ? "Medium" : "Low — AV may not cover this NSE symbol",
  });
}
