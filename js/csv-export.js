const CsvExport = (() => {
  const HEADERS = [
    "ID","Headline","Summary","Category","Subcategory","Country","Region","Source","Source Tier",
    "Published Date","Published Time","Importance","Verification Status","Business Relevance",
    "Original URL","Retrieved Date","Retrieved Time",
  ];

  function esc(v) {
    const s = (v === null || v === undefined) ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  }

  function splitDateTime(iso) {
    if (!iso) return ["", ""];
    const d = new Date(iso);
    return [d.toISOString().slice(0, 10), d.toISOString().slice(11, 19)];
  }

  function exportArticles(articles, filename = "global-news-export.csv") {
    const rows = [HEADERS.map(esc).join(",")];
    for (const a of articles) {
      const [pd, pt] = splitDateTime(a.publishedAt);
      const [rd, rt] = splitDateTime(a.retrievedAt);
      rows.push([
        a.id, a.title, a.summaryText || a.summary, a.primaryCategory, (a.categories || []).join("; "),
        (a.countries || [])[0] || "", a.regionLabel || "", a.source, a.sourceTier,
        pd, pt, a.importance, a.verificationStatus, (a.relevanceTags || []).join("; "),
        a.url, rd, rt,
      ].map(esc).join(","));
    }
    const csv = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return { exportArticles };
})();
