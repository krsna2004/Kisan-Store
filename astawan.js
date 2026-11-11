(() => {
  "use strict";
  const INDEX_URL = "/content/astawan-index.json";
  const list = document.getElementById("astawanList");
  const featured = document.getElementById("astawanFeatured");
  const search = document.getElementById("astawanSearch");
  const category = document.getElementById("astawanCategory");
  const status = document.getElementById("astawanStatus");
  let articles = [];
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateLabel = value => { if (!value) return ""; const d = new Date(value + "T00:00:00"); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); };
  function card(post) {
    const image = post.image ? '<img src="' + escapeHTML(post.image) + '" alt="' + escapeHTML(post.image_alt || post.title) + '" loading="lazy">' : "";
    return '<article class="astawan-article-card">' + image + '<div class="astawan-article-copy"><p class="astawan-article-category">' + escapeHTML(post.category || "Astawan") + '</p><h3><a href="/astawan/' + encodeURIComponent(post.slug) + '/">' + escapeHTML(post.title) + '</a></h3><p>' + escapeHTML(post.description || "") + '</p><div class="astawan-article-meta"><span>' + escapeHTML(dateLabel(post.date)) + '</span>' + (post.author ? '<span>' + escapeHTML(post.author) + '</span>' : '') + '</div></div></article>';
  }
  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    const selected = category?.value || "";
    const filtered = articles.filter(post => (!selected || post.category === selected) && (!q || [post.title,post.title_hi,post.description,post.description_hi,post.category,post.tags].join(" ").toLowerCase().includes(q)));
    const lead = filtered.find(post => post.featured);
    featured.innerHTML = lead ? '<article class="astawan-featured">' + (lead.image ? '<img src="' + escapeHTML(lead.image) + '" alt="' + escapeHTML(lead.image_alt || lead.title) + '" loading="lazy">' : '<div></div>') + '<div class="astawan-featured-copy"><p class="astawan-article-category">FEATURED · ' + escapeHTML(lead.category || "ASTAWAN") + '</p><h3>' + escapeHTML(lead.title) + '</h3><p>' + escapeHTML(lead.description || "") + '</p><a href="/astawan/' + encodeURIComponent(lead.slug) + '/">Read the story →</a></div></article>' : "";
    const rest = filtered.filter(post => post !== lead);
    list.innerHTML = rest.length ? rest.map(card).join("") : '<p class="astawan-empty">' + (articles.length ? "No articles match your search. Try another keyword or category." : "Astawan articles will appear here after you publish them in Pages CMS.") + '</p>';
    status.textContent = filtered.length + (filtered.length === 1 ? " published article" : " published articles");
  }
  async function init() {
    try {
      const response = await fetch(INDEX_URL, {cache:"no-cache"});
      if (!response.ok) throw new Error("Astawan index unavailable");
      const data = await response.json();
      articles = Array.isArray(data) ? data.filter(post => post && post.status === "Published" && post.slug && post.title) : [];
      [...new Set(articles.map(post => post.category).filter(Boolean))].sort().forEach(value => {
        const option = document.createElement("option"); option.value = value; option.textContent = value; category.appendChild(option);
      });
      render();
    } catch (error) {
      list.innerHTML = '<p class="astawan-empty">Astawan articles could not be loaded right now. Please try again later.</p>';
      console.error(error);
    }
  }
  search?.addEventListener("input", render);
  category?.addEventListener("change", render);
  document.querySelectorAll("[data-category-link]").forEach(link => link.addEventListener("click", () => { const value = link.dataset.categoryLink; if (category) category.value = value; render(); }));
  init();
})();