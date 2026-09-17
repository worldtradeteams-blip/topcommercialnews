const CATEGORIES = {
  "Marketing": ["digital marketing", "advertising", "branding", "consumer behavior", "campaign",
    "customer experience", "personalization", "retail marketing", "e-commerce marketing", "martech",
    "marketing technology", "ad tech", "brand strategy", "influencer marketing", "social media marketing",
    "content marketing", "ai marketing", "pricing strategy", "market research", "marketing strategy"],
  "International Marketing": ["global brand", "international expansion", "market entry", "localization",
    "cross-border marketing", "global advertising", "international branding", "international consumer",
    "international e-commerce", "global pricing", "emerging markets", "global customer"],
  "Sales": ["b2b sales", "b2c sales", "retail sales", "e-commerce sales", "enterprise sales",
    "sales technology", "crm", "sales strategy", "channel sales", "revenue growth", "customer acquisition",
    "quarterly sales", "sales figures"],
  "Trade": ["import", "export", "wholesale", "logistics", "commodities", "trade policy", "tariff",
    "customs", "trade regulation", "trade agreement", "supply chain", "trade deal"],
  "International Trade": ["bilateral trade", "multilateral trade", "free trade agreement", "trade restrictions",
    "import/export regulation", "cross-border commerce", "trade negotiations", "trade dispute",
    "global supply chain", "foreign investment", "market access", "export controls", "trade war", "wto"],
};
// terms that indicate a FALSE POSITIVE (non-relevant usage) when found near a keyword
const EXCLUSION_CONTEXT = ["ticket sales", "box office", "tournament", "championship", "playoff",
  "album sales", "transfer market", "housing market crash of the plot", "stock market" /*only if isolated*/];
if (typeof module !== "undefined") module.exports = { CATEGORIES, EXCLUSION_CONTEXT };
