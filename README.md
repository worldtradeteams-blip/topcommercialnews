# Global Marketing & Trade Intelligence

Real-time news intelligence platform for **Marketing, International Marketing, Sales, Trade, and International Trade**, covering North America, Europe, East/Southeast/South Asia, the Middle East, Latin America, and Eurasia.

## 1. What this actually is (honest scope)

This is a **real, working application**, not a mockup. It retrieves **live articles from public RSS feeds** of 50 reputable outlets — including Reuters, BBC, FT, AP, The Guardian, Nikkei Asia, CNBC, MarketWatch, Forbes, Fortune, Business Insider, Axios, POLITICO, The New York Times, South China Morning Post, The Korea Herald, The Japan Times, The Straits Times, The Economic Times, Moneycontrol, Arabian Business, Gulf Business, Khaleej Times, The Globe and Mail, Australian Financial Review, Ad Age, Adweek, Marketing Dive, Digiday, MediaPost, Search Engine Journal/Land, Retail Dive, PRWeek, Social Media Today, The Drum, HubSpot Sales, Supply Chain Dive, FreightWaves, Journal of Commerce, Logistics Management, Inbound Logistics, The Loadstar, Marketing Week, and Campaign UK — via a Netlify Function, then classifies, deduplicates, ranks, and displays them. No news is invented. If a feed is unreachable, that source is marked "Unavailable" and skipped — the UI never fabricates data.

`config/sources.js` also includes a `SOURCE_DIRECTORY` reference list of every outlet from the user-supplied source directory that does **not** yet have a wired-up RSS feed (mostly non-English regional papers and trade/government bodies like WTO, UNCTAD, JETRO, KOTRA, MOFCOM, whose sites don't expose a public feed). Their homepages are kept there for attribution/reference and easy wiring once you have a real feed URL for them — see "Adding a News Source" below. Nothing in that reference list is polled or displayed as news until it has a real feed entry in the `SOURCES` array.

**Limitations (important):**
- RSS feed URLs and formats occasionally change or get blocked by publishers; some may return errors over time. The source list in `config/sources.js` is easy to edit/replace.
- No paywalled/authenticated content is accessed. No CAPTCHA/robots bypass is performed.
- "AI-Generated Summary" is an **extractive** summary built only from the retrieved title/description text — not a generative model call (no API key required). You can wire in a real LLM summarizer later via a Netlify Function if desired.
- Country/category classification uses a configurable keyword dictionary + contextual scoring — it is good, not perfect. Tune `config/categories.js` and `config/countries.js` as needed.

## 2. Project Structure

```
index.html            Main page
css/                   styles.css, themes.css, responsive.css
js/                    app.js, ui.js, filters.js, search.js, ranking.js,
                       deduplication.js, relevance.js, storage.js, csv-export.js
config/                sources.js, countries.js, categories.js, settings.js
netlify/functions/     news.js  (server-side RSS fetch + normalize)
netlify.toml, package.json, robots.txt, sitemap.xml, favicon.svg
```

## 3. Local Testing

Because the app calls a Netlify Function, you need the Netlify CLI (it emulates functions locally):

```bash
npm install -g netlify-cli
cd Global-Marketing-Trade-News-Intelligence
netlify dev
```

Open the local URL it prints (usually `http://localhost:8888`). Opening `index.html` directly via `file://` will NOT work, because the browser cannot call `/.netlify/functions/news` without the dev server.

## 4. Upload to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Global Marketing & Trade Intelligence"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 5. Deploy to Netlify

1. Log in to https://app.netlify.com
2. Click **Add new site → Import an existing project**
3. Choose GitHub and select your repository
4. Build settings are already defined in `netlify.toml` (publish = ".", functions = "netlify/functions") — leave defaults
5. Click **Deploy site**

## 6. Environment Variables

**None are required** for the current source list (all are public RSS feeds). If you later add a source that requires an API key (e.g. a commercial News API):

1. Go to **Site settings → Environment variables** in Netlify
2. Add e.g. `NEWSAPI_KEY = your_key_here`
3. In `netlify/functions/news.js`, read it via `process.env.NEWSAPI_KEY`
4. **Never** put the key in any client-side file (`js/`, `index.html`) or commit it to GitHub.

## 7. Adding a News Source

Edit `config/sources.js` and add an entry:
```js
{ id: "example", name: "Example News", tier: 2, url: "https://example.com/rss.xml" }
```
Tiers: 1 = highest reliability (wire services, major papers, official bodies), 2 = reputable business/specialist, 3 = established industry press, 4 = other.

## 8. Removing a Source

Delete its object from the `SOURCES` array in `config/sources.js`.

## 9. Modifying Countries / Regions

Edit `config/countries.js` — add to `COUNTRIES` (country → region) and `COUNTRY_KEYWORDS` (detection keywords).

## 10. Modifying Categories

Edit `config/categories.js` — add/remove keywords under each of the five primary categories.

## 11. Changing Refresh Interval

Use the in-app **Settings** panel (15/30/60 min or manual). Default is defined in `config/settings.js` (`autoRefreshMinutes`).

## 12. Troubleshooting

- **"Some sources unavailable" banner**: normal — a feed timed out or changed URL. Check `Source Status` panel; update the URL in `config/sources.js` if a source is permanently broken.
- **"Showing cached news"**: the live function call failed entirely (e.g. deploy misconfiguration); the last successful dataset from `localStorage` is shown instead, clearly labeled.
- **No functions endpoint / 404 on `/.netlify/functions/news`**: confirm `netlify.toml` `functions` path matches `netlify/functions`, and that you're running via `netlify dev` locally or a real Netlify deploy (not opening the HTML file directly).

## 13. Updating the Application

Edit files, commit, and push to `main` — Netlify auto-deploys on every push (continuous deployment).

---
*Headlines, short extractive summaries, and metadata only are shown for each story. Full article content always remains on the original publisher's site — click "Read Original Article."*
