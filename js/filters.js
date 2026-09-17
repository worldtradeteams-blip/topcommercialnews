const Filters = (() => {
  let state = {
    category: "All", country: "All", region: "All", source: "All",
    tier: "All", importance: "All", verification: "All", freshnessHours: 24,
  };

  function getState() { return state; }
  function setState(partial) { state = { ...state, ...partial }; }

  function withinFreshness(article, hours) {
    if (!article.publishedAt) return true;
    const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 36e5;
    return ageHours <= hours;
  }

  function apply(articles, f) {
    return articles.filter((a) => {
      if (f.category !== "All" && a.primaryCategory !== f.category) return false;
      if (f.country !== "All" && !(a.countries || []).includes(f.country)) return false;
      if (f.region !== "All" && a.regionLabel !== f.region && !(a.regionLabel || "").includes(f.region)) return false;
      if (f.source !== "All" && a.source !== f.source) return false;
      if (f.tier !== "All" && String(a.sourceTier) !== String(f.tier)) return false;
      if (f.importance !== "All" && a.importance !== f.importance) return false;
      if (f.verification !== "All" && a.verificationStatus !== f.verification) return false;
      if (f.freshnessHours && !withinFreshness(a, f.freshnessHours)) return false;
      return true;
    });
  }

  function clear() {
    state = { category: "All", country: "All", region: "All", source: "All",
      tier: "All", importance: "All", verification: "All", freshnessHours: 24 };
  }

  return { getState, setState, apply, clear };
})();
