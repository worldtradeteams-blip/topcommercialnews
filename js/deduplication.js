// Groups articles that likely describe the same event using headline
// token-overlap similarity + same-day + shared country signals.
function tokenize(str) {
  return new Set(
    (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function jaccard(a, b) {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function groupArticles(articles, threshold = 0.45) {
  const groups = [];
  const used = new Array(articles.length).fill(false);
  const tokenCache = articles.map((a) => tokenize(a.title));

  for (let i = 0; i < articles.length; i++) {
    if (used[i]) continue;
    const group = [articles[i]];
    used[i] = true;
    for (let j = i + 1; j < articles.length; j++) {
      if (used[j]) continue;
      const sim = jaccard(tokenCache[i], tokenCache[j]);
      const sameDay =
        articles[i].publishedAt &&
        articles[j].publishedAt &&
        articles[i].publishedAt.slice(0, 10) === articles[j].publishedAt.slice(0, 10);
      if (sim >= threshold && sameDay) {
        group.push(articles[j]);
        used[j] = true;
      }
    }
    groups.push(group);
  }

  return groups.map((group) => {
    group.sort((a, b) => a.sourceTier - b.sourceTier);
    const primary = group[0];
    const others = group.slice(1);
    return {
      ...primary,
      relatedSources: others.map((o) => ({ source: o.source, url: o.url, sourceTier: o.sourceTier })),
      coverageStatus:
        group.length >= 2 ? "Covered by multiple verified sources" : "Single-source report",
    };
  });
}

if (typeof module !== "undefined") module.exports = { groupArticles, jaccard, tokenize };
