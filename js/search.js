const Search = (() => {
  let query = "";
  function setQuery(q) { query = (q || "").toLowerCase().trim(); }
  function getQuery() { return query; }

  function apply(articles, q) {
    if (!q) return articles;
    const terms = q.split(/\s+/).filter(Boolean);
    return articles.filter((a) => {
      const haystack = [
        a.title, a.summaryText, a.source, (a.countries || []).join(" "),
        a.regionLabel, a.primaryCategory, (a.categories || []).join(" "),
      ].join(" ").toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  return { setQuery, getQuery, apply };
})();
