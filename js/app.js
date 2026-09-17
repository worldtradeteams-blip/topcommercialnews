const App = (() => {
  let allArticles = [];
  let filtered = [];
  let visibleCount = 20;
  let settings = Storage.loadSettings(DEFAULT_SETTINGS);
  let countdownTimer = null;
  let secondsToNext = settings.autoRefreshMinutes * 60;
  let sourceStatus = {};
  let isCached = false;
  let cachedAt = null;

  async function fetchNews() {
    UI.setLoading(true);
    UI.hideBanner();
    try {
      const res = await fetch("/.netlify/functions/news");
      if (!res.ok) throw new Error(`Function returned ${res.status}`);
      const data = await res.json();
      sourceStatus = data.sourceStatus || {};
      isCached = false;
      cachedAt = null;

      const withCountry = data.articles.filter((a) => a.countries && a.countries.length > 0);
      const globalArticles = data.articles.filter((a) => !a.countries || a.countries.length === 0)
        .map((a) => ({ ...a, countries: ["Global"] }));
      const combined = [...withCountry, ...globalArticles];

      const grouped = groupArticles(combined);
      const ranked = rankArticles(grouped).map((a) => ({
        ...a,
        summaryText: buildSummary(a),
        relevanceTags: businessRelevanceTags(a),
        verificationStatus: a.url ? "Verified Source" : "UNVERIFIED",
        regionLabel: (a.countries || []).map((c) => COUNTRIES[c] || "Global").filter((v, i, arr) => arr.indexOf(v) === i).join(", "),
      }));

      allArticles = ranked.slice(0, settings.maxArticles);
      Storage.saveCache({ articles: allArticles, sourceStatus });
      UI.renderSourceStatus(sourceStatus, isCached, cachedAt);
      applyFiltersAndRender();

      const unavailable = Object.entries(sourceStatus).filter(([, v]) => v.status === "unavailable");
      if (unavailable.length > 0) {
        UI.showBanner(
          `Some news sources are temporarily unavailable (${unavailable.map(([n]) => n).join(", ")}). Results from available sources are still displayed.`
        );
      }
      if (allArticles.length === 0) {
        UI.showBanner("No verified current news could be retrieved.");
      }
    } catch (err) {
      const cache = Storage.loadCache();
      if (cache && cache.articles && cache.articles.length) {
        allArticles = cache.articles;
        isCached = true;
        cachedAt = cache.cachedAt;
        sourceStatus = cache.sourceStatus || {};
        UI.showBanner(`Showing cached news. Last successful update: ${new Date(cachedAt).toLocaleString()}. Live retrieval failed.`, true);
        UI.renderSourceStatus(sourceStatus, isCached, cachedAt);
        applyFiltersAndRender();
      } else {
        UI.showBanner("Live news could not be retrieved and no cached data is available. Please try refreshing again shortly.", true);
        UI.renderTechnicalDetails(String(err));
      }
    } finally {
      UI.setLoading(false);
      UI.setLastUpdated(new Date());
      secondsToNext = settings.autoRefreshMinutes * 60;
    }
  }

  function applyFiltersAndRender() {
    filtered = Filters.apply(allArticles, Filters.getState());
    filtered = Search.apply(filtered, Search.getQuery());
    visibleCount = 20;
    UI.renderDashboardCounts(allArticles);
    UI.renderArticles(filtered.slice(0, visibleCount), filtered.length);
  }

  function loadMore() {
    visibleCount += 20;
    UI.renderArticles(filtered.slice(0, visibleCount), filtered.length);
  }

  function exportCsv() {
    CsvExport.exportArticles(filtered, "global-news-export.csv");
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (settings.autoRefreshMinutes === 0 || document.hidden) return; // manual only / tab inactive
      secondsToNext -= 1;
      if (secondsToNext <= 0) {
        fetchNews();
      }
      UI.renderCountdown(secondsToNext);
    }, 1000);
  }

  function updateSetting(key, value) {
    settings[key] = value;
    Storage.saveSettings(settings);
    if (key === "autoRefreshMinutes") secondsToNext = value * 60;
    if (key === "theme") UI.applyTheme(value);
    applyFiltersAndRender();
  }

  function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    Storage.saveSettings(settings);
    UI.applyTheme(settings.theme);
    applyFiltersAndRender();
  }

  function init() {
    UI.applyTheme(settings.theme);
    UI.bindEvents({ onRefresh: fetchNews, onLoadMore: loadMore, onExport: exportCsv,
      onFilterChange: applyFiltersAndRender, onSearch: applyFiltersAndRender,
      onSettingChange: updateSetting, onResetSettings: resetSettings });
    fetchNews();
    startCountdown();
  }

  return { init, getSettings: () => settings, getAllArticles: () => allArticles };
})();

document.addEventListener("DOMContentLoaded", App.init);
