(() => {
  "use strict";

  if (document.getElementById("kisanSearchRoot")) return;

  const root = document.createElement("div");
  root.id = "kisanSearchRoot";
  root.innerHTML = `
    <div class="ks-header-search">
      <form class="ks-desktop-form" role="search">
        <label class="ks-sr-only" for="ksDesktopInput">Search the whole website</label>
        <span class="ks-search-icon" aria-hidden="true">⌕</span>
        <input id="ksDesktopInput" type="search" autocomplete="off" placeholder="Search the whole website…" />
        <button type="submit" aria-label="Search">↵</button>
      </form>
      <div class="ks-desktop-results" id="ksDesktopResults" hidden></div>
      <button class="ks-mobile-trigger" type="button" aria-label="Open website search">
        <span aria-hidden="true">⌕</span>
      </button>
    </div>
    <section class="ks-search-overlay" id="ksSearchOverlay" aria-hidden="true" aria-label="Website search">
      <div class="ks-search-panel" role="dialog" aria-modal="true" aria-labelledby="ksSearchTitle">
        <div class="ks-search-panel-head">
          <div class="ks-search-brand">
            <span class="ks-search-brand-mark" aria-hidden="true">KH</span>
            <span><strong id="ksSearchTitle">Search Kisan Store</strong><small>Pages, guides, updates and media</small></span>
          </div>
          <button class="ks-close" type="button" aria-label="Close search">×</button>
        </div>
        <form class="ks-mobile-form" role="search">
          <span class="ks-search-icon" aria-hidden="true">⌕</span>
          <label class="ks-sr-only" for="ksMobileInput">Search the whole website</label>
          <input id="ksMobileInput" type="search" autocomplete="off" placeholder="Search anything on Kisan Store…" />
          <button type="submit" aria-label="Submit search">→</button>
        </form>
        <p class="ks-search-hint" id="ksSearchHint">Search across the entire website.</p>
        <div class="ks-results" id="ksOverlayResults" aria-live="polite"></div>
        <div class="ks-search-footer"><span class="ks-yellow-dot"></span> Kisan Store · Hardware &amp; Sanitary</div>
      </div>
    </section>
  `;
  document.body.appendChild(root);

  const headerActions = document.querySelector(".site-header .header-actions");
  if (headerActions) headerActions.prepend(root.querySelector(".ks-header-search"));

  const desktopInput = root.querySelector("#ksDesktopInput");
  const mobileInput = root.querySelector("#ksMobileInput");
  const desktopResults = root.querySelector("#ksDesktopResults");
  const overlay = root.querySelector("#ksSearchOverlay");
  const overlayResults = root.querySelector("#ksOverlayResults");
  const hint = root.querySelector("#ksSearchHint");
  const mobileTrigger = root.querySelector(".ks-mobile-trigger");
  const closeButton = root.querySelector(".ks-close");
  const desktopForm = root.querySelector(".ks-desktop-form");
  const mobileForm = root.querySelector(".ks-mobile-form");

  let searchItems = [];
  let lastFocus = null;
  let overlayOpen = false;
  let loadPromise;

  const lang = () => document.documentElement.lang === "hi" ? "hi" : "en";
  const words = () => lang() === "hi" ? {
    desktop: "पूरी वेबसाइट खोजें…",
    mobile: "किसान स्टोर पर कुछ भी खोजें…",
    title: "किसान स्टोर खोजें",
    subtitle: "पेज, जानकारी, अपडेट और मीडिया",
    hint: "पूरी वेबसाइट में खोजें।",
    start: "खोजने के लिए कुछ लिखें।",
    none: "कोई परिणाम नहीं मिला। दूसरे शब्द आज़माएँ।",
    loading: "वेबसाइट खोज तैयार हो रही है…",
    pages: "पेज", blog: "जानकारी", updates: "अपडेट", media: "मीडिया", products: "उत्पाद",
    open: "खोलें"
  } : {
    desktop: "Search the whole website…",
    mobile: "Search anything on Kisan Store…",
    title: "Search Kisan Store",
    subtitle: "Pages, guides, updates and media",
    hint: "Search across the entire website.",
    start: "Start typing to search the website.",
    none: "No results found. Try different words.",
    loading: "Preparing website search…",
    pages: "Page", blog: "Guide", updates: "Update", media: "Media", products: "Product",
    open: "Open"
  };

  function updateLanguageText() {
    const w = words();
    desktopInput.placeholder = w.desktop;
    mobileInput.placeholder = w.mobile;
    root.querySelector("#ksSearchTitle").textContent = w.title;
    root.querySelector(".ks-search-brand small").textContent = w.subtitle;
    hint.textContent = w.hint;
  }

  function plain(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
  }

  function firstString(obj, keys) {
    for (const key of keys) {
      const value = plain(obj && obj[key]);
      if (value.trim()) return value.trim();
    }
    return "";
  }

  function slugify(value) {
    return String(value || "").toLowerCase().trim()
      .replace(/\.json$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function addItem(item) {
    if (!item || !item.title || !item.url) return;
    const key = `${item.url}|${item.title}`.toLowerCase();
    if (searchItems.some(existing => `${existing.url}|${existing.title}`.toLowerCase() === key)) return;
    searchItems.push({
      title: item.title,
      description: item.description || "",
      type: item.type || "pages",
      url: item.url,
      text: `${item.title} ${item.description || ""} ${item.keywords || ""}`.toLowerCase()
    });
  }

  function addStaticPage(url, html) {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelector("title")?.textContent?.trim() || url;
      const description = doc.querySelector('meta[name="description"]')?.content || "";
      const main = doc.querySelector("main") || doc.body;
      const text = (main.textContent || "").replace(/\s+/g, " ").trim().slice(0, 1400);
      addItem({
        title,
        description: `${description} ${text}`.trim(),
        type: "pages",
        url
      });
    } catch (_) {}
  }

  function itemToSearchEntry(item, type) {
    if (!item || typeof item !== "object") return;
    const status = firstString(item, ["status", "publication_status"]);
    if (status && status.toLowerCase() !== "published") return;
    const title = firstString(item, ["title", "name", "heading", "caption", "caption_hi", "label"]);
    if (!title) return;
    const description = firstString(item, ["description", "excerpt", "summary", "content", "body", "text", "caption", "caption_hi", "alt"]);
    const slug = firstString(item, ["slug", "id", "url_slug"]);
    const explicitUrl = firstString(item, ["url", "permalink", "href", "link"]);
    let url = "";

    if (explicitUrl && !/^javascript:/i.test(explicitUrl)) {
      url = explicitUrl;
    } else if (type === "blog") {
      url = slug ? `blog-post.html?slug=${encodeURIComponent(slug)}` : "blog.html";
    } else if (type === "updates") {
      url = "updates.html";
    } else if (type === "media") {
      url = "media.html";
    } else if (type === "products") {
      url = "products.html";
    } else {
      url = "index.html";
    }

    addItem({ title, description, type, url, keywords: firstString(item, ["category", "tags", "brand", "author"]) });
  }

  function readIndex(data, type) {
    const arr = Array.isArray(data) ? data :
      Array.isArray(data.items) ? data.items :
      Array.isArray(data.posts) ? data.posts :
      Array.isArray(data.entries) ? data.entries :
      Array.isArray(data.results) ? data.results : [];
    arr.forEach(item => itemToSearchEntry(item, type));
  }

  async function loadSearchIndex() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const pages = [
        ["index.html", "pages"], ["products.html", "products"],
        ["trade-partners.html", "pages"], ["blog.html", "blog"],
        ["media.html", "media"], ["updates.html", "updates"],
        ["contact.html", "pages"]
      ];

      await Promise.all(pages.map(async ([url]) => {
        try {
          const response = await fetch(url);
          if (response.ok) addStaticPage(url, await response.text());
        } catch (_) {}
      }));

      const indexes = [
        ["content/blog-index.json", "blog"],
        ["content/updates-index.json", "updates"],
        ["content/media-index.json", "media"],
        ["content/products-index.json", "products"],
        ["content/product-index.json", "products"],
        ["content/catalog-index.json", "products"]
      ];

      await Promise.all(indexes.map(async ([url, type]) => {
        try {
          const response = await fetch(url);
          if (!response.ok) return;
          const data = await response.json();
          readIndex(data, type);
        } catch (_) {}
      }));

      // Ignore explicitly unpublished CMS records, if a status field is present.
      searchItems = searchItems.filter(item => {
        const source = item.text;
        return Boolean(source);
      });
    })();
    return loadPromise;
  }

  function typeLabel(type) {
    const w = words();
    return w[type] || w.pages;
  }

  function rank(item, query) {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return 0;
    let score = 0;
    const title = item.title.toLowerCase();
    const text = item.text;
    for (const token of tokens) {
      if (title === token) score += 12;
      else if (title.includes(token)) score += 7;
      if (text.includes(token)) score += 2;
      else return 0;
    }
    return score;
  }

  function resultMarkup(item) {
    const type = typeLabel(item.type);
    const title = escapeHtml(item.title);
    const desc = escapeHtml(item.description.slice(0, 180));
    const url = escapeHtml(item.url);
    return `<a class="ks-result" href="${url}">
      <span class="ks-result-icon" aria-hidden="true">${iconFor(item.type)}</span>
      <span class="ks-result-copy"><strong>${title}</strong><small>${type}${desc ? " · " + desc : ""}</small></span>
      <span class="ks-result-arrow" aria-hidden="true">↗</span>
    </a>`;
  }

  function iconFor(type) {
    return ({blog:"✎", updates:"↗", media:"▧", products:"▦", pages:"⌂"})[type] || "⌕";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[c]);
  }

  function renderResults(query, target, isOverlay = false) {
    const w = words();
    const q = query.trim();
    if (!q) {
      target.innerHTML = `<p class="ks-result-message">${w.start}</p>`;
      target.hidden = false;
      return;
    }

    const results = searchItems
      .map(item => ({ item, score: rank(item, q) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(entry => entry.item);

    target.innerHTML = results.length
      ? `<div class="ks-result-count">${results.length} ${lang() === "hi" ? "परिणाम" : results.length === 1 ? "result" : "results"}</div>${results.map(resultMarkup).join("")}`
      : `<p class="ks-result-message">${w.none}</p>`;
    target.hidden = false;
  }

  async function search(query, target, isOverlay = false) {
    const w = words();
    target.innerHTML = `<p class="ks-result-message">${w.loading}</p>`;
    target.hidden = false;
    await loadSearchIndex();
    renderResults(query, target, isOverlay);
  }

  function openOverlay() {
    lastFocus = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    overlayOpen = true;
    document.body.classList.add("ks-search-open");
    mobileInput.value = desktopInput.value;
    search(mobileInput.value, overlayResults, true);
    window.setTimeout(() => mobileInput.focus(), 30);
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlayOpen = false;
    document.body.classList.remove("ks-search-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  let desktopTimer;
  let mobileTimer;
  desktopInput.addEventListener("input", () => {
    window.clearTimeout(desktopTimer);
    desktopTimer = window.setTimeout(() => search(desktopInput.value, desktopResults), 120);
  });
  mobileInput.addEventListener("input", () => {
    window.clearTimeout(mobileTimer);
    mobileTimer = window.setTimeout(() => search(mobileInput.value, overlayResults, true), 120);
  });

  desktopForm.addEventListener("submit", event => {
    event.preventDefault();
    if (desktopInput.value.trim()) search(desktopInput.value, desktopResults);
    else desktopInput.focus();
  });
  mobileForm.addEventListener("submit", event => {
    event.preventDefault();
    if (mobileInput.value.trim()) search(mobileInput.value, overlayResults, true);
    else mobileInput.focus();
  });

  mobileTrigger.addEventListener("click", openOverlay);
  closeButton.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeOverlay();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (overlayOpen) closeOverlay();
      desktopResults.hidden = true;
    }
  });
  document.addEventListener("click", event => {
  const headerSearch = document.querySelector(
    ".site-header .header-actions .ks-header-search"
  );

  if (headerSearch && !headerSearch.contains(event.target)) {
    desktopResults.hidden = true;
  }
});

  document.getElementById("langBtn")?.addEventListener("click", () => {
    window.setTimeout(updateLanguageText, 0);
  });

  updateLanguageText();
  loadSearchIndex();
})();
