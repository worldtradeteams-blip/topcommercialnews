// Derives business-relevance tags directly from matched categories/keywords
// (no invention) and builds a short neutral summary from the source's own
// title + description text (extractive — never fabricated).
function businessRelevanceTags(article) {
  const tags = [];
  const cats = article.categories || [];
  if (cats.includes("Marketing")) tags.push("Marketing Impact");
  if (cats.includes("International Marketing")) tags.push("International Marketing Impact");
  if (cats.includes("Sales")) tags.push("Sales Impact");
  if (cats.includes("Trade")) tags.push("Trade Impact");
  if (cats.includes("International Trade")) tags.push("International Business Impact");
  const text = `${article.title} ${article.summary}`.toLowerCase();
  if (text.includes("tariff") || text.includes("customs") || text.includes("regulation")) tags.push("Regulatory Impact");
  if (text.includes("price") || text.includes("pricing")) tags.push("Pricing Impact");
  if (text.includes("distribution") || text.includes("logistics")) tags.push("Distribution Impact");
  if (text.includes("supply chain")) tags.push("Supply Chain Impact");
  if (text.includes("consumer")) tags.push("Consumer Market Impact");
  return [...new Set(tags)];
}

// Extractive, clearly-labeled summary built ONLY from retrieved text.
function buildSummary(article) {
  const clean = (article.summary || "").replace(/\s+/g, " ").trim();
  if (!clean) return article.title;
  const sentences = clean.split(/(?<=[.!?])\s+/).slice(0, 3);
  return sentences.join(" ").slice(0, 420);
}

if (typeof module !== "undefined") module.exports = { businessRelevanceTags, buildSummary };
