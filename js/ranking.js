// Computes an internal importance level from tier, recency, relevance score,
// number of corroborating sources, and geographic breadth.
function hoursAgo(iso) {
  if (!iso) return 999;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function computeImportance(article) {
  let points = 0;
  points += article.sourceTier === 1 ? 4 : article.sourceTier === 2 ? 3 : article.sourceTier === 3 ? 2 : 1;
  const age = hoursAgo(article.publishedAt);
  if (age <= 3) points += 4;
  else if (age <= 12) points += 2;
  else if (age <= 24) points += 1;
  points += Math.min(article.relevanceScore || 0, 4);
  const corroboration = (article.relatedSources || []).length;
  points += Math.min(corroboration * 2, 4);
  if ((article.countries || []).length > 1) points += 1;

  let level = "STANDARD";
  if (points >= 13) level = "BREAKING";
  else if (points >= 10) level = "HIGH IMPORTANCE";
  else if (points >= 6) level = "IMPORTANT";
  return { level, points };
}

function rankArticles(articles) {
  return articles
    .map((a) => {
      const { level, points } = computeImportance(a);
      return { ...a, importance: level, importanceScore: points };
    })
    .sort((a, b) => b.importanceScore - a.importanceScore);
}

if (typeof module !== "undefined") module.exports = { rankArticles, computeImportance };
