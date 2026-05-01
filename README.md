# Amazon Review Insights

A Next.js + Vercel app that:

1. Takes a search keyword.
2. Scrapes the **top 10 Amazon products** ranking for that keyword.
3. Pulls real customer reviews for each product (~250 reviews per run).
4. Uses **Claude (Sonnet 4.6)** to extract:
   - Top keyword themes driving **negative sentiment**.
   - Top keyword themes driving **very positive sentiment**.
   - **5 creative ad angles** that weaponize what customers love and exploit competitor weaknesses.

---

## Setup

### 1. Get API keys

- **RapidAPI** — for Amazon data. Subscribe to [Real-Time Amazon Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data) (free tier covers ~500 reqs/mo, paid ~$10/mo for 5k). Copy your `x-rapidapi-key`.
- **Anthropic** — for analysis. Get a key at [console.anthropic.com](https://console.anthropic.com/).

### 2. Configure environment

```bash
cp .env.example .env.local
# fill in RAPIDAPI_KEY and ANTHROPIC_API_KEY
```

### 3. Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Vercel

```bash
npx vercel
# then in the Vercel dashboard, add the same env vars under Settings → Environment Variables
```

The `/api/analyze` route is configured for `maxDuration: 300` (5 min) — analysis takes 30–90s end-to-end, mostly waiting on the Amazon API.

---

## How it works

```
User keyword
    │
    ▼
[lib/scraper.ts]  ──►  RapidAPI /search        ──►  top 10 products
    │
    └──►  RapidAPI /product-reviews (10× parallel)  ──►  ~250 reviews
                                                              │
                                                              ▼
                                                   [lib/analyzer.ts]
                                                   Claude Sonnet 4.6
                                                   (system prompt cached)
                                                              │
                                                              ▼
                                              Positive/negative themes
                                              + 5 ad angles (JSON)
                                                              │
                                                              ▼
                                                   [app/page.tsx] renders
```

### Cost per run (rough)

- RapidAPI: 11 requests (1 search + 10 review pulls × ~3 pages) = ~33 calls.
- Anthropic: ~50–80k input tokens, ~3k output. With prompt caching on the system prompt: ~$0.20–$0.30 per run on Sonnet 4.6.

---

## Tunable knobs

In the UI:

- **Products** (1–10): how many top-ranking products to analyze.
- **Reviews / product** (5–50): how deep to go per product.
- **Country**: marketplace (US, GB, CA, DE, FR, IT, ES, JP, AU).

In `lib/analyzer.ts`: edit `SYSTEM_PROMPT` to bias the kinds of themes/angles Claude returns (e.g. force a specific brand voice, target a different ad platform, or focus on a competitor positioning frame).

---

## Files

| Path | Purpose |
|---|---|
| `app/page.tsx` | Form + results UI |
| `app/api/analyze/route.ts` | Orchestrates scrape → analyze |
| `lib/scraper.ts` | RapidAPI Amazon search + reviews |
| `lib/analyzer.ts` | Claude prompt + JSON parsing |
| `lib/types.ts` | Shared types |
| `components/KeywordForm.tsx` | Keyword input |
| `components/ResultsView.tsx` | Themes + ad angles display |

---

## Notes

- Amazon actively blocks direct scraping; this app deliberately uses RapidAPI as the data layer to stay in legitimate territory and avoid IP blocks. Swapping in a different provider (Apify, Oxylabs, Bright Data) only requires editing `lib/scraper.ts`.
- The system prompt in `lib/analyzer.ts` is cached via Anthropic prompt caching for cheap reruns.
- If your run returns "No reviews could be fetched", check the RapidAPI dashboard — the free tier rate-limits aggressively.
# amazon-research
# amazon-research
