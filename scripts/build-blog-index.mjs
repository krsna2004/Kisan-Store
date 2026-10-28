
import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://thekisanstore.in";

function readCollection(directory, options = {}) {
  const {
    requirePublished = true,
    excludeExpired = false,
    dateField = "date",
  } = options;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    return [];
  }

  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      const item = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      return { ...item, sourceFile: file };
    })
    .filter((item) => !requirePublished || item.status === "Published")
    .filter((item) => {
      if (!excludeExpired || !item.expiry_date) return true;
      return item.expiry_date >= new Date().toISOString().slice(0, 10);
    })
    .sort((a, b) =>
      (b[dateField] || "").localeCompare(a[dateField] || "") ||
      (b.title || "").localeCompare(a.title || "")
    );
}

function writeIndex(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Generated ${file}: ${data.length} entries`);
}

function escapeXML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemap(blogs) {
  const staticPages = [
    "/",
    "/products.html",
    "/trade-partners.html",
    "/blog.html",
    "/media.html",
    "/updates.html",
    "/contact.html",
  ];

  const blogUrls = blogs
    .filter((post) => post.slug)
    .map((post) =>
      `/blog-post.html?slug=${encodeURIComponent(post.slug)}`
    );

  const urls = [...staticPages, ...blogUrls];

  const uniqueUrls = [...new Set(urls)];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueUrls.map((url) =>
      `  <url><loc>${escapeXML(SITE_URL + url)}</loc></url>`
    ),
    "</urlset>",
    "",
  ].join("\n");

  fs.writeFileSync("sitemap.xml", xml, "utf8");
  console.log(`Generated sitemap.xml: ${uniqueUrls.length} URLs`);
}

const blogs = readCollection("content/blogs");

writeIndex("content/blog-index.json", blogs);

writeIndex(
  "content/updates-index.json",
  readCollection("content/updates", {
    excludeExpired: true,
  })
);

writeIndex(
  "content/media-index.json",
  readCollection("content/media")
);

generateSitemap(blogs);
