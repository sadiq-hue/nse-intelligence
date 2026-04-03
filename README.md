# NSE Intelligence — AI-Powered NSE Investment Platform

An AI-driven news aggregation and investment sentiment platform for the Nairobi Securities Exchange, powered by Claude.

## Features
- 📰 News aggregation from Business Daily, Nation, The Standard, Google News
- 🤖 AI article summarisation & sentiment classification
- 📊 Per-stock AI outlook (Bullish/Bearish/Neutral + confidence score)
- 💡 Investment recommendations (Strong Buy → Strong Sell)
- ✉️ AI-generated daily email digest
- 🏦 Tracks SCOM, KCB, EQTY, EABL, COOP, BATK, ABSA, NCBA

---

## 🚀 Deploy to Vercel (5 minutes)

### Option A — Deploy via Vercel CLI (fastest)

```bash
# 1. Install Vercel CLI (one-time)
npm i -g vercel

# 2. Inside the project folder:
cd nse-intelligence
npm install

# 3. Deploy
vercel

# 4. When prompted, follow the wizard. For environment variables, add:
#    ANTHROPIC_API_KEY = sk-ant-...
```

### Option B — Deploy via GitHub + Vercel Dashboard

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/nse-intelligence.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo

3. In **Environment Variables**, add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here` (get from https://console.anthropic.com/settings/keys)

4. Click **Deploy** — done! 🎉

---

## 💻 Run Locally

```bash
npm install

# Create .env.local from the example
cp .env.example .env.local
# Edit .env.local and paste your Anthropic API key

npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
nse-intelligence/
├── api/
│   └── claude.js          # Secure server-side Anthropic API proxy
├── src/
│   ├── main.jsx            # React entry point
│   └── App.jsx             # Full application (all components)
├── index.html
├── vite.config.js
├── vercel.json             # Vercel routing config
├── package.json
└── .env.example
```

## Security Note

Your Anthropic API key is **never** sent to the browser. All Claude API calls go through `/api/claude`, a Vercel serverless function that reads the key from environment variables server-side.

---

## Getting Your Anthropic API Key

1. Visit https://console.anthropic.com/settings/keys
2. Click **Create Key**
3. Copy the key (starts with `sk-ant-`)
4. Add it as `ANTHROPIC_API_KEY` in Vercel's environment variables

---

*Disclaimer: AI-generated outlooks are for informational purposes only and do not constitute financial advice.*
