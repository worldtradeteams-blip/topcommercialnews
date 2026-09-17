const Storage = (() => {
  const CACHE_KEY = "gnti_cache_v1";
  const SETTINGS_KEY = "gnti_settings_v1";

  function saveCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, cachedAt: new Date().toISOString() }));
    } catch (e) { /* storage may be full/unavailable */ }
  }
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }
  function loadSettings(defaults) {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch (e) { return { ...defaults }; }
  }
  return { saveCache, loadCache, saveSettings, loadSettings };
})();
