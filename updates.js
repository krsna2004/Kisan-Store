(() => {
  "use strict";

  const INDEX_URL = "content/updates-index.json";
  const latest = document.getElementById("latestUpdate");
  const recent = document.getElementById("recentUpdates");
  const status = document.getElementById("updatesStatus");
  if (!latest || !recent) return;

  let updates = [];
  let language = document.documentElement.lang === "hi" ? "hi" : "en";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function title(item) {
    return language === "hi" && item.title_hi ? item.title_hi : (item.title || "");
  }
  function message(item) {
    return language === "hi" && item.message_hi ? item.message_hi : (item.message || "");
  }
  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(
      language === "hi" ? "hi-IN" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
  }
  function dateMarkup(item) {
    return `<time class="update-date" datetime="${esc(item.date || "")}">${esc(formatDate(item.date))}</time>`;
  }
  function card(item) {
    return `<article class="recent-update-card">
      <div class="recent-update-meta">${dateMarkup(item)}${item.category ? `<span class="update-category">${esc(item.category)}</span>` : ""}</div>
      <h3>${esc(title(item))}</h3>
      <p>${esc(message(item)).replace(/\n/g, "<br>")}</p>
    </article>`;
  }

  function render() {
    const featured = updates.find(item => item.featured) || updates[0];

    if (!featured) {
      latest.innerHTML = `<div class="updates-empty"><h2>${language === "hi" ? "अभी कोई नया अपडेट नहीं है" : "No new updates yet"}</h2><p>${language === "hi" ? "दुकान से जुड़ी नई जानकारी यहाँ साझा की जाएगी।" : "New information from the store will appear here."}</p></div>`;
      recent.innerHTML = "";
      if (status) status.textContent = "0 updates";
      return;
    }

    latest.innerHTML = `<article class="latest-update-card">
      <div class="latest-update-label"><span class="status-dot"></span>${language === "hi" ? "नवीनतम अपडेट" : "LATEST UPDATE"}</div>
      <div class="recent-update-meta">${dateMarkup(featured)}${featured.category ? `<span class="update-category">${esc(featured.category)}</span>` : ""}</div>
      <h2>${esc(title(featured))}</h2>
      <p>${esc(message(featured)).replace(/\n/g, "<br>")}</p>
    </article>`;

    const rest = updates.filter(item => item !== featured);
    recent.innerHTML = rest.length
      ? rest.map(card).join("")
      : `<p>${language === "hi" ? "अभी कोई अन्य अपडेट नहीं है।" : "There are no other updates yet."}`;

    if (status) status.textContent = `${updates.length} ${language === "hi" ? "अपडेट" : "updates"}`;
  }

  async function init() {
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Updates index could not be loaded.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid updates index.");

      const today = new Date().toISOString().slice(0, 10);
      updates = data.filter(item => item.status === "Published" &&
        (!item.expiry_date || item.expiry_date >= today))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      render();
    } catch (error) {
      latest.innerHTML = `<p>${language === "hi" ? "अपडेट अभी लोड नहीं हो सके।" : "Updates could not be loaded. Please try again later."}</p>`;
      console.error(error);
    }
  }

  document.getElementById("langBtn")?.addEventListener("click", () => {
    setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      render();
    }, 0);
  });
  init();
})();