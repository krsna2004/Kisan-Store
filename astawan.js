(() => {
  "use strict";

  const INDEX_URL = "/content/astawan-index.json";
  const list = document.getElementById("astawanList");
  const featured = document.getElementById("astawanFeatured");
  const search = document.getElementById("astawanSearch");
  const picker = document.getElementById("astawanCategoryPicker");
  const trigger = document.getElementById("astawanCategoryTrigger");
  const label = document.getElementById("astawanCategoryLabel");
  const menu = document.getElementById("astawanCategoryMenu");
  const status = document.getElementById("astawanStatus");

  if (!list || !featured || !picker || !trigger || !label || !menu) return;

  let articles = [];
  let selectedCategory = "";

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateLabel = value => {
    if (!value) return "";
    const d = new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  };

  function card(post) {
    const image = post.image ? '<img src="' + escapeHTML(post.image) + '" alt="' + escapeHTML(post.image_alt || post.title) + '" loading="lazy">' : "";
    return '<article class="astawan-article-card">' + image + '<div class="astawan-article-copy"><p class="astawan-article-category">' + escapeHTML(post.category || "Astawan") + '</p><h3><a href="/astawan/' + encodeURIComponent(post.slug) + '/">' + escapeHTML(post.title) + '</a></h3><p>' + escapeHTML(post.description || "") + '</p><div class="astawan-article-meta"><span>' + escapeHTML(dateLabel(post.date)) + '</span>' + (post.author ? '<span>' + escapeHTML(post.author) + '</span>' : '') + '</div></div></article>';
  }

  function setMenuOpen(open) {
    menu.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  }

  function chooseCategory(value) {
    selectedCategory = value;
    const selectedOption = [...menu.querySelectorAll("[data-category]")].find(option => option.dataset.category === value);
    label.textContent = selectedOption ? selectedOption.firstChild.textContent.trim() : "All categories";

    menu.querySelectorAll("[data-category]").forEach(option => {
      const selected = option.dataset.category === value;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", String(selected));
      const check = option.querySelector(".catalog-category-check");
      if (check) check.textContent = selected ? "✓" : "";
    });

    setMenuOpen(false);
    render();
  }

  function renderCategoryOptions() {
    const values = [...new Set(articles.map(post => post.category).filter(Boolean))].sort();
    menu.innerHTML = '<button type="button" class="catalog-category-option is-selected" role="option" aria-selected="true" data-category="">All categories<span class="catalog-category-check">✓</span></button>' +
      values.map(value => '<button type="button" class="catalog-category-option" role="option" aria-selected="false" data-category="' + escapeHTML(value) + '">' + escapeHTML(value) + '<span class="catalog-category-check"></span></button>').join("");
  }

  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    const filtered = articles.filter(post =>
      (!selectedCategory || post.category === selectedCategory) &&
      (!q || [post.title,post.title_hi,post.description,post.description_hi,post.category,post.tags].join(" ").toLowerCase().includes(q))
    );

    const lead = filtered.find(post => post.featured);
    featured.innerHTML = lead
      ? '<article class="astawan-featured">' + (lead.image ? '<img src="' + escapeHTML(lead.image) + '" alt="' + escapeHTML(lead.image_alt || lead.title) + '" loading="lazy">' : '<div></div>') + '<div class="astawan-featured-copy"><p class="astawan-article-category">FEATURED · ' + escapeHTML(lead.category || "ASTAWAN") + '</p><h3>' + escapeHTML(lead.title) + '</h3><p>' + escapeHTML(lead.description || "") + '</p><a href="/astawan/' + encodeURIComponent(lead.slug) + '/">Read the story →</a></div></article>'
      : "";

    const rest = filtered.filter(post => post !== lead);
    list.innerHTML = rest.length
      ? rest.map(card).join("")
      : '<p class="astawan-empty">' + (articles.length ? "No articles match your search. Try another keyword or category." : "Astawan articles will appear here after you publish them in Pages CMS.") + '</p>';

    if (status) status.textContent = filtered.length + (filtered.length === 1 ? " published article" : " published articles");
  }

  trigger.addEventListener("click", () => setMenuOpen(menu.hidden));
  menu.addEventListener("click", event => {
    const option = event.target.closest("[data-category]");
    if (option) chooseCategory(option.dataset.category);
  });

  document.addEventListener("click", event => {
    if (!picker.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setMenuOpen(false);
      trigger.focus();
    }
  });

  search?.addEventListener("input", render);
  document.querySelectorAll("[data-category-link]").forEach(link => {
    link.addEventListener("click", () => chooseCategory(link.dataset.categoryLink));
  });

  async function init() {
    try {
      const response = await fetch(INDEX_URL, {cache:"no-cache"});
      if (!response.ok) throw new Error("Astawan index unavailable");
      const data = await response.json();
      articles = Array.isArray(data) ? data.filter(post => post && post.status === "Published" && post.slug && post.title) : [];
      renderCategoryOptions();
      render();
    } catch (error) {
      list.innerHTML = '<p class="astawan-empty">Astawan articles could not be loaded right now. Please try again later.</p>';
      console.error(error);
    }
  }

  init();
})();
