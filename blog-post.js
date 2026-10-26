
(() => {
  "use strict";

  const INDEX_URL = "content/blog-index.json";
  const titleElement = document.getElementById("postTitle");
  const descriptionElement = document.getElementById("postDescription");
  const categoryElement = document.getElementById("postCategory");
  const dateElement = document.getElementById("postDate");
  const readingTimeElement = document.getElementById("postReadingTime");
  const coverElement = document.getElementById("postCover");
  const contentElement = document.getElementById("postContent");
  const relatedElement = document.getElementById("relatedPosts");

  let posts = [];
  let currentPost = null;
  let language = document.documentElement.lang === "hi" ? "hi" : "en";

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function localized(post, englishKey, hindiKey) {
    return language === "hi" && post[hindiKey]
      ? post[hindiKey]
      : (post[englishKey] || "");
  }

  function renderMarkdown(text) {
    // Safe basic Markdown: escape HTML first, then apply simple formatting.
    let html = escapeHTML(text);
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(?:<li>.*<\/li>\n?)+/g, (items) => `<ul>${items}</ul>`);
    return html.split(/\n{2,}/).map((block) => {
      if (/^\s*<(h2|h3|ul|ol|blockquote)/i.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
  }

  function readTime(text) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function updateSEO(post, title, description) {
    document.title = `${title} | Kisan Hardware & Sanitary Store`;
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", post.meta_description || description || title);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href.split("?")[0] + "?slug=" + encodeURIComponent(post.slug);
  }

  function render() {
    if (!currentPost) return;

    const title = localized(currentPost, "title", "title_hi");
    const description = localized(currentPost, "description", "description_hi");
    const content = localized(currentPost, "content", "content_hi");

    titleElement.textContent = title;
    descriptionElement.textContent = description;
    categoryElement.textContent = currentPost.category || "Guide";
    dateElement.textContent = currentPost.date || "";
    readingTimeElement.textContent = language === "hi"
      ? `${readTime(content)} मिनट पढ़ने का समय`
      : `${readTime(content)} min read`;

    if (currentPost.image) {
      coverElement.src = currentPost.image;
      coverElement.alt = currentPost.image_alt || title;
      coverElement.hidden = false;
    } else {
      coverElement.hidden = true;
    }

    contentElement.innerHTML = renderMarkdown(content);
    updateSEO(currentPost, title, description);

    const related = posts
      .filter((post) => post.slug !== currentPost.slug && post.category === currentPost.category)
      .slice(0, 3);

    relatedElement.innerHTML = related.map((post) => `
      <article class="article-card">
        <div class="article-body">
          <h3><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${escapeHTML(localized(post, "title", "title_hi"))}</a></h3>
          <p>${escapeHTML(localized(post, "description", "description_hi"))}</p>
        </div>
      </article>`).join("");
  }

  async function init() {
    if (!slug) {
      titleElement.textContent = "Article not found";
      descriptionElement.textContent = "No article was selected.";
      contentElement.innerHTML = '<p><a href="blog.html">Back to all guides</a></p>';
      return;
    }

    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Blog index could not be loaded.");

      posts = await response.json();
      currentPost = posts.find((post) => post.slug === slug && post.status === "Published");

      if (!currentPost) {
        titleElement.textContent = "Article not found";
        descriptionElement.textContent = "This article may still be a draft or may no longer be available.";
        contentElement.innerHTML = '<p><a href="blog.html">Back to all guides</a></p>';
        return;
      }

      render();
    } catch (error) {
      titleElement.textContent = "Unable to load article";
      descriptionElement.textContent = "Please try again later.";
      console.error(error);
    }
  }

  document.getElementById("langBtn")?.addEventListener("click", () => {
    window.setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      render();
    }, 0);
  });

  init();
})();
  
