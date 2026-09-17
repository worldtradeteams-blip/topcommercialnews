// Netlify Function: fetches live RSS feeds server-side, parses, and returns
// normalized JSON. Keeps all network calls off the client (CORS + secrecy).
const SOURCES = require("../../config/sources.js");
const { COUNTRY_KEYWORDS } = require("../../config/countries.js");
const { CATEGORIES } = require("../../config/categories.js");

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, {
    signal: controller.signal,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GlobalNewsIntel/1.0)" },
  }).finally(() => clearTimeout(t));
}

function stripTags(s) {
  return (s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? stripTags(m[1]) : "";
}

function extractLink(block) {
  // Standard RSS <link>url</link>, fallback to atom <link href="..."/>
  let m = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (m) return stripTags(m[1]);
  m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

function parseRSS(xml, source) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    if (!title) continue;
    const link = extractLink(block);
    const desc = extractTag(block, "description") || extractTag(block, "summary") || extractTag(block, "content");
    const pubDateRaw = extractTag(block, "pubDate") || extractTag(block, "published") || extractTag(block, "updated") || extractTag(block, "dc:date");
    let publishedAt = null;
    if (pubDateRaw) {
      const d = new Date(pubDateRaw);
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }
    items.push({
      title,
      url: link,
      rawSummary: desc.slice(0, 500),
      publishedAt,
      source: source.name,
      sourceId: source.id,
      sourceTier: source.tier,
    });
  }
  return items;
}

function detectCountries(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [country, kws] of Object.entries(COUNTRY_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) found.push(country);
  }
  return found;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  const matchedTags = [];
  for (const [cat, kws] of Object.entries(CATEGORIES)) {
    let score = 0;
    for (const k of kws) if (lower.includes(k)) score++;
    if (score > 0) matchedTags.push(cat);
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return { category: best, score: bestScore, matchedCategories: matchedTags };
}

exports.handler = async function () {
  const results = [];
  const sourceStatus = {};

  await Promise.all(
    SOURCES.map(async (src) => {
      try {
        const res = await fetchWithTimeout(src.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const items = parseRSS(xml, src);
        results.push(...items);
        sourceStatus[src.name] = { status: "available", count: items.length };
      } catch (err) {
        sourceStatus[src.name] = { status: "unavailable", error: String(err.message || err) };
      }
    })
  );

  // Relevance filter + classification
  const classified = [];
  for (const item of results) {
    const text = `${item.title} ${item.rawSummary}`;
    const { category, score, matchedCategories } = detectCategory(text);
    // Require at least 2 keyword hits (not just 1) so a single incidental
    // mention — e.g. "trade" used loosely in an unrelated political story —
    // doesn't get the article classified as Trade/Marketing/Sales content.
    if (!category || score < 2) continue;
    const countries = detectCountries(text);
    classified.push({
      id: Buffer.from(item.url || item.title).toString("base64").slice(0, 24),
      title: item.title,
      summary: item.rawSummary,
      source: item.source,
      sourceTier: item.sourceTier,
      url: item.url,
      publishedAt: item.publishedAt,
      retrievedAt: new Date().toISOString(),
      countries,
      categories: matchedCategories,
      primaryCategory: category,
      relevanceScore: score,
    });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      generatedAt: new Date().toISOString(),
      sourceStatus,
      articles: classified,
    }),
  };
};
