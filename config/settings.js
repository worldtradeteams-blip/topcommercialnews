const DEFAULT_SETTINGS = {
  autoRefreshMinutes: 30,
  maxArticles: 150,
  defaultCountry: "All",
  defaultRegion: "All",
  defaultCategory: "All",
  theme: "light",
  showOnlyVerified: false,
  showDuplicateCoverage: true,
  freshnessHours: 24,
};
if (typeof module !== "undefined") module.exports = DEFAULT_SETTINGS;
