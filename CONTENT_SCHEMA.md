# Meridian content contract (the site and the newsroom both obey this)

Meridian is a static-generated Next.js site. ALL content lives in `content/` as JSON files.
The newsroom (Luna agents) only edits `content/`. The app reads it at build time. Push to `main` = Vercel auto-deploys.

## 1. Articles: `content/articles/<YYYY-MM-DD>-<slug>.json`

```json
{
  "slug": "fed-holds-rates-signals-december-cut",          // kebab-case, unique, matches filename suffix
  "title": "Fed Holds Rates, Signals a December Cut Is Live",
  "dek": "One-sentence standfirst, 15-35 words.",
  "section": "markets",                                     // see section list below
  "tags": ["fed", "rates", "bonds"],
  "author": "Meridian Newsroom",
  "publishedAt": "2026-10-26T12:30:00Z",                    // ISO 8601 UTC
  "updatedAt": "2026-10-26T12:30:00Z",
  "edition": "pre-market",                                  // pre-market | midday | afternoon
  "featured": false,                                        // true = eligible for homepage lead (max ~3 true at once)
  "breaking": false,
  "readMinutes": 4,
  "image": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/....jpg",
    "alt": "Descriptive alt text",
    "credit": "Photographer / Agency",
    "license": "CC BY-SA 4.0",                              // or "Public domain", "Unsplash License", "Pexels License"
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:....jpg"
  },
  "keyPoints": ["3-5 short bullets"],
  "body": "Markdown. 450-1100 words. ## subheads allowed. No H1. Inline links to sources encouraged.",
  "marketImpact": {                                         // OPTIONAL. Required for markets/business/crypto/energy-relevant stories.
    "summary": "How this could move markets and why.",
    "timeframe": "Next 1-2 sessions",                       // when the effect likely lands
    "confidence": "medium",                                 // low | medium | high
    "tickers": [
      { "symbol": "TLT", "direction": "up", "rationale": "Lower yield path" }   // direction: up | down | mixed | watch
    ],
    "catalysts": [ { "date": "2026-10-29", "event": "FOMC decision 2:00 PM ET" } ]
  },
  "sources": [
    { "title": "Exact headline of source", "publisher": "Reuters", "url": "https://...", "accessedAt": "2026-10-26" }
  ],
  "corrections": [ { "date": "2026-10-26", "note": "What was fixed" } ]   // OPTIONAL
}
```

Sections (exact ids): `markets`, `economy`, `ai-tech`, `autos`, `business`, `world`, `us`, `science`, `health`, `climate`, `crypto`, `sports`, `culture`.

## 2. Front page / market desk: `content/site.json`

```json
{
  "updatedAt": "2026-10-26T12:30:00Z",
  "edition": "pre-market",
  "leadSlug": "slug-of-homepage-lead-story",
  "marketBrief": {
    "headline": "What matters before the bell",
    "summary": "2-3 sentences.",
    "bullets": ["4-6 bullets"],
    "asOf": "2026-10-26T12:15:00Z"
  },
  "marketSnapshot": [                                        // last known levels from a cited source, labeled as-of. NOT live.
    { "label": "S&P 500 futures", "value": "6,812", "change": "+0.4%", "direction": "up" }
  ],
  "calendar": [                                              // market-moving events ahead, with when
    { "date": "2026-10-29", "time": "2:00 PM ET", "event": "FOMC rate decision", "importance": "high", "why": "Short why it matters" }
  ],
  "trending": ["slug-a", "slug-b"]
}
```

## 3. Rules (non-negotiable, the validator enforces the mechanical ones)
- Every article has at least 2 sources with real, working URLs from reputable outlets or primary sources. Never invent a source, quote, number or URL.
- Images: ONLY freely licensed, hotlinkable images from `upload.wikimedia.org` (Wikimedia Commons), `images.unsplash.com`, or `images.pexels.com`. Never wire-service/news-outlet photos. Credit + license + sourceUrl always filled. Verify the URL returns an image (HTTP 200) before using it.
- Market calls are analysis, labeled with confidence; the site shows an "AI-assisted analysis, not financial advice" notice on them.
- Write original prose. Summarize and attribute, never copy paragraphs from sources.
- Updating a story: edit the same file, bump `updatedAt`, add a `corrections` entry if a fact changed. Don't create duplicates of a running story.
- Run `npm run validate` before committing. Commit message: `newsroom(<edition>): <short summary>`.
