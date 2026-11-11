import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://thekisanstore.in";
const SOURCE_DIR = "content/astawan";
const INDEX_FILE = "content/astawan-index.json";
const LANDING_TEMPLATE = "astawan.html";
const OUTPUT_DIR = "astawan";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function safeSlug(value) {
  const slug = String(value || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid Astawan article slug: " + slug);
  return slug;
}
function markdownInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  return html;
}
function markdownToHtml(markdown = "") {
  const lines = String(markdown).replace(/\r\n?/g,"\n").split("\n");
  const out = []; let paragraph = []; let list = "";
  const flush = () => { if (paragraph.length) { out.push("<p>" + markdownInline(paragraph.join(" ")) + "</p>"); paragraph=[]; } };
  const closeList = () => { if (list) { out.push("</"+list+">"); list=""; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); closeList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flush(); closeList(); const level = Math.min(3, heading[1].length + 1); out.push("<h"+level+">"+markdownInline(heading[2])+"</h"+level+">"); continue; }
    const item = line.match(/^[-*+]\s+(.+)$/);
    if (item) { flush(); if (list !== "ul") { closeList(); out.push("<ul>"); list="ul"; } out.push("<li>"+markdownInline(item[1])+"</li>"); continue; }
    closeList(); paragraph.push(line);
  }
  flush(); closeList(); return out.join("\n");
}
function readArticles() {
  if (!fs.existsSync(SOURCE_DIR)) fs.mkdirSync(SOURCE_DIR,{recursive:true});
  return fs.readdirSync(SOURCE_DIR).filter(name => name.endsWith(".json")).map(name => {
    const item = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR,name),"utf8"));
    return {...item, sourceFile:name};
  }).filter(item => item.status === "Published" && item.slug && item.title)
    .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));
}
function buildArticlePage(post, header, footer) {
  const slug = safeSlug(post.slug);
  const canonical = SITE_URL + "/astawan/" + slug + "/";
  const title = String(post.seo_title || (post.title + " | Astawan Local Information"));
  const description = String(post.meta_description || post.description || post.title).slice(0,300);
  const body = markdownToHtml(post.content || "");
  const image = post.image ? '<img class="astawan-post-cover" src="/' + escapeHtml(String(post.image).replace(/^\//,"")) + '" alt="' + escapeHtml(post.image_alt || post.title) + '" loading="eager">' : "";
  const tags = Array.isArray(post.tags) ? post.tags : String(post.tags || "").split(",").map(x=>x.trim()).filter(Boolean);
  const schema = {"@context":"https://schema.org","@type":"Article","headline":post.title,"description":description,"datePublished":post.date || undefined,"dateModified":post.updated_date || post.date || undefined,"author":{"@type":"Person","name":post.author || "The Kisan Store"},"publisher":{"@type":"Organization","name":"The Kisan Store","url":SITE_URL},"mainEntityOfPage":canonical,"image":post.image ? [SITE_URL + "/" + String(post.image).replace(/^\//,"")] : undefined,"keywords":tags.join(", ")};
  Object.keys(schema).forEach(key=>schema[key]===undefined && delete schema[key]);
  const related = "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#b91c1c">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="article"><meta property="og:site_name" content="The Kisan Store"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${post.image ? '<meta property="og:image" content="'+escapeHtml(SITE_URL+'/'+String(post.image).replace(/^\//,''))+'">' : ""}
<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/astawan.css"><link rel="icon" href="/favicon.png"><script src="/script.js" defer></script><script src="/website-search.js" defer></script>
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,"\\\\u003c")}</script></head><body>
${header}
<main class="astawan-post"><nav class="astawan-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/astawan/">Astawan</a> / <span>${escapeHtml(post.title)}</span></nav>
<p class="eyebrow">${escapeHtml(post.category || "Astawan")}</p><h1>${escapeHtml(post.title)}</h1><p class="astawan-post-description">${escapeHtml(post.description || "")}</p>
<div class="astawan-post-meta"><span>${escapeHtml(post.date || "")}</span>${post.author ? '<span>By '+escapeHtml(post.author)+'</span>' : ''}${post.source_name ? '<span>Source: '+escapeHtml(post.source_name)+'</span>' : ''}</div>
${image}<article class="astawan-post-content">${body || "<p>Article content will be added soon.</p>"}</article>
${post.source_url ? '<p class="astawan-editorial-note">Reference: <a href="'+escapeHtml(post.source_url)+'" rel="noopener noreferrer">'+escapeHtml(post.source_name || "Original source")+'</a></p>' : ""}
<section class="astawan-related"><h2>Explore more about Astawan</h2><p>Discover local information, community updates and businesses.</p><a class="button button-primary" href="/astawan/">Back to Astawan Local Hub</a></section>
</main>${footer}</body></html>`;
}
const articles = readArticles();
fs.mkdirSync("content",{recursive:true});
fs.writeFileSync(INDEX_FILE,JSON.stringify(articles,null,2)+"\n");
if (!fs.existsSync(LANDING_TEMPLATE)) throw new Error("Missing astawan.html landing template");
const landing = fs.readFileSync(LANDING_TEMPLATE,"utf8");
const header = landing.match(/<header class="site-header">[\s\S]*?<\/header>/i)?.[0];
const footer = landing.match(/<footer class="site-footer">[\s\S]*?<\/footer>/i)?.[0];
if (!header || !footer) throw new Error("Astawan landing template must contain site header and footer");
fs.mkdirSync(OUTPUT_DIR,{recursive:true});
fs.writeFileSync(path.join(OUTPUT_DIR,"index.html"),landing);
for (const post of articles) {
  const slug = safeSlug(post.slug);
  const directory = path.join(OUTPUT_DIR,slug);
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,"index.html"),buildArticlePage(post,header,footer));
}
console.log("Generated Astawan index and "+articles.length+" article pages.");
