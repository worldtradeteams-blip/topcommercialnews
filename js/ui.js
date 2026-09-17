const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const feed = () => $("#news-feed");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "☀ Light" : "🌙 Dark";
  }

  function setLoading(isLoading) {
    const el = $("#loading-indicator");
    if (el) el.style.display = isLoading ? "flex" : "none";
  }

  function showBanner(msg, isError = false) {
    const el = $("#status-banner");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    el.classList.toggle("banner-error", isError);
  }
  function hideBanner() {
    const el = $("#status-banner");
    if (el) el.style.display = "none";
  }
  function renderTechnicalDetails(text) {
    const el = $("#technical-details");
    if (el) el.textContent = text;
  }

  function setLastUpdated(date) {
    const el = $("#last-updated");
    if (el) el.textContent = `Last Updated: ${date.toLocaleString()}`;
  }

  function renderCountdown(seconds) {
    const el = $("#next-update");
    if (!el) return;
    if (seconds <= 0) { el.textContent = ""; return; }
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    el.textContent = `Next update in: ${m}:${s}`;
  }

  function renderSourceStatus(status, isCached, cachedAt) {
    const el = $("#source-status-list");
    if (!el) return;
    el.innerHTML = "";
    if (isCached) {
      const p = document.createElement("p");
      p.className = "cache-note";
      p.textContent = `Showing cached news · Last successful update: ${new Date(cachedAt).toLocaleString()}`;
      el.appendChild(p);
    }
    Object.entries(status).forEach(([name, info]) => {
      const row = document.createElement("div");
      row.className = "source-row";
      row.innerHTML = `<span>${name}</span><span class="${info.status === "available" ? "ok" : "warn"}">${info.status === "available" ? "✓ Available" : "⚠ Unavailable"}</span>`;
      el.appendChild(row);
    });
  }

  function renderDashboardCounts(articles) {
    const counts = {
      total: articles.length,
      high: articles.filter((a) => a.importance === "HIGH IMPORTANCE" || a.importance === "BREAKING").length,
      Marketing: articles.filter((a) => a.primaryCategory === "Marketing").length,
      "International Marketing": articles.filter((a) => a.primaryCategory === "International Marketing").length,
      Sales: articles.filter((a) => a.primaryCategory === "Sales").length,
      Trade: articles.filter((a) => a.primaryCategory === "Trade").length,
      "International Trade": articles.filter((a) => a.primaryCategory === "International Trade").length,
      Global: articles.filter((a) => (a.countries || []).includes("Global")).length,
    };
    const map = {
      "#count-total": counts.total, "#count-high": counts.high, "#count-marketing": counts.Marketing,
      "#count-intl-marketing": counts["International Marketing"], "#count-sales": counts.Sales,
      "#count-trade": counts.Trade, "#count-intl-trade": counts["International Trade"], "#count-global": counts.Global,
    };
    Object.entries(map).forEach(([sel, val]) => { const el = $(sel); if (el) el.textContent = val; });

    // Global market pulse: top countries by story count
    const tally = {};
    articles.forEach((a) => (a.countries || []).forEach((c) => { tally[c] = (tally[c] || 0) + 1; }));
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const pulseEl = $("#market-pulse");
    if (pulseEl) {
      pulseEl.innerHTML = top.map(([c, n]) => `<span class="pulse-chip">${c} · ${n}</span>`).join("") || "No data yet";
    }
  }

  function badgeClass(importance) {
    return { BREAKING: "badge-breaking", "HIGH IMPORTANCE": "badge-high", IMPORTANT: "badge-important" }[importance] || "badge-standard";
  }

  function cardHtml(a) {
    const dt = a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "Time unavailable";
    const countries = (a.countries || []).join(", ");
    const otherCount = (a.relatedSources || []).length;
    return `
    <article class="news-card" tabindex="0" data-id="${a.id}">
      <div class="card-top">
        <span class="badge ${badgeClass(a.importance)}">${a.importance}</span>
        <span class="cat-tag">${a.primaryCategory}</span>
      </div>
      <h3 class="card-title">${escapeHtml(a.title)}</h3>
      <div class="card-meta">${countries} &middot; ${a.regionLabel || ""} &middot; ${a.source} &middot; ${dt}</div>
      <p class="card-summary"><strong>AI-Generated Summary:</strong> ${escapeHtml(a.summaryText)}</p>
      <div class="card-tags">${(a.relevanceTags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <div class="card-footer">
        <span class="${a.verificationStatus === "Verified Source" ? "verified" : "unverified"}">
          ${a.verificationStatus === "Verified Source" ? "✓ Verified Source" : "UNVERIFIED"}
        </span>
        <span class="coverage">${otherCount > 0 ? `${otherCount + 1} verified sources` : a.coverageStatus || "Single-source report"}</span>
      </div>
      <a class="read-original" href="${a.url}" target="_blank" rel="noopener noreferrer">READ ORIGINAL ARTICLE →</a>
    </article>`;
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function renderArticles(list, totalCount) {
    const el = feed();
    if (!el) return;
    if (list.length === 0) {
      el.innerHTML = `<p class="empty-state">No verified current news could be retrieved for these filters.</p>`;
      $("#load-more").style.display = "none";
      return;
    }
    el.innerHTML = list.map(cardHtml).join("");
    el.querySelectorAll(".news-card").forEach((card) => {
      card.addEventListener("click", () => openModal(card.dataset.id));
      card.addEventListener("keypress", (e) => { if (e.key === "Enter") openModal(card.dataset.id); });
    });
    const lm = $("#load-more");
    lm.style.display = list.length < totalCount ? "block" : "none";
  }

  function openModal(id) {
    const article = App.getAllArticles().find((a) => a.id === id);
    if (!article) return;
    const modal = $("#news-modal");
    $("#modal-body").innerHTML = `
      <h2>${escapeHtml(article.title)}</h2>
      <p class="modal-meta"><strong>Source:</strong> ${article.source} (Tier ${article.sourceTier}) &middot;
      <strong>Published:</strong> ${article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "Unavailable"}</p>
      <p class="modal-meta"><strong>Country:</strong> ${(article.countries || []).join(", ")} &middot;
      <strong>Region:</strong> ${article.regionLabel}</p>
      <p class="modal-meta"><strong>Category:</strong> ${article.primaryCategory} &middot;
      <strong>Subcategories:</strong> ${(article.categories || []).join(", ")}</p>
      <p class="modal-meta"><strong>Importance:</strong> ${article.importance} &middot;
      <strong>Verification:</strong> ${article.verificationStatus}</p>
      <p><strong>AI-Generated Summary:</strong> ${escapeHtml(article.summaryText)}</p>
      <p><strong>Business Relevance:</strong> ${(article.relevanceTags || []).join(", ") || "None identified"}</p>
      <p><strong>Other Verified Coverage:</strong> ${
        (article.relatedSources || []).length
          ? article.relatedSources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.source}</a>`).join(", ")
          : "None found"
      }</p>
      <a class="read-original" href="${article.url}" target="_blank" rel="noopener noreferrer">READ ORIGINAL ARTICLE →</a>
    `;
    modal.style.display = "flex";
  }
  function closeModal() { $("#news-modal").style.display = "none"; }

  function populateFilterOptions(sourcesList) {
    const sourceSel = $("#filter-source");
    if (sourceSel) {
      sourceSel.innerHTML = `<option value="All">All Sources</option>` +
        sourcesList.map((s) => `<option value="${s.name}">${s.name}</option>`).join("");
    }
  }

  function bindEvents({ onRefresh, onLoadMore, onExport, onFilterChange, onSearch, onSettingChange, onResetSettings }) {
    $("#refresh-btn").addEventListener("click", onRefresh);
    $("#load-more").addEventListener("click", onLoadMore);
    $("#export-csv").addEventListener("click", onExport);
    $("#theme-toggle").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      onSettingChange("theme", cur === "dark" ? "light" : "dark");
    });
    $("#news-modal .modal-close").addEventListener("click", closeModal);
    $("#news-modal").addEventListener("click", (e) => { if (e.target.id === "news-modal") closeModal(); });

    document.querySelectorAll(".nav-link[data-category]").forEach((link) => {
      link.addEventListener("click", () => {
        Filters.setState({ category: link.dataset.category });
        $("#filter-category").value = link.dataset.category;
        onFilterChange();
      });
    });
    document.querySelectorAll(".region-chip[data-country]").forEach((chip) => {
      chip.addEventListener("click", () => {
        Filters.setState({ country: chip.dataset.country === "All" ? "All" : chip.dataset.country });
        onFilterChange();
      });
    });

    ["filter-category", "filter-country", "filter-region", "filter-source", "filter-tier", "filter-importance", "filter-verification", "filter-freshness"]
      .forEach((id) => {
        const el = $("#" + id);
        if (el) el.addEventListener("change", () => {
          Filters.setState({
            category: $("#filter-category").value, country: $("#filter-country").value,
            region: $("#filter-region").value, source: $("#filter-source").value,
            tier: $("#filter-tier").value, importance: $("#filter-importance").value,
            verification: $("#filter-verification").value, freshnessHours: Number($("#filter-freshness").value),
          });
          onFilterChange();
        });
      });
    $("#clear-filters").addEventListener("click", () => {
      Filters.clear();
      document.querySelectorAll("#filters-panel select").forEach((s) => (s.value = s.dataset.default || "All"));
      $("#filter-freshness").value = "24";
      onFilterChange();
    });

    $("#search-input").addEventListener("input", (e) => { Search.setQuery(e.target.value); onSearch(); });

    $("#settings-toggle").addEventListener("click", () => $("#settings-panel").classList.toggle("open"));
    $("#setting-auto-refresh").addEventListener("change", (e) => onSettingChange("autoRefreshMinutes", Number(e.target.value)));
    $("#setting-max-articles").addEventListener("change", (e) => onSettingChange("maxArticles", Number(e.target.value)));
    $("#setting-reset").addEventListener("click", onResetSettings);

    $("#filters-toggle").addEventListener("click", () => $("#filters-panel").classList.toggle("open"));
  }

  return {
    applyTheme, setLoading, showBanner, hideBanner, renderTechnicalDetails, setLastUpdated,
    renderCountdown, renderSourceStatus, renderDashboardCounts, renderArticles, populateFilterOptions,
    bindEvents,
  };
})();
