import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = "content/blogs";
const OUTPUT_FILE = "content/blog-index.json";

function readBlogs() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log("No blog directory found; generating an empty index.");
    return [];
  }

  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(BLOG_DIR, file);
      const blog = JSON.parse(fs.readFileSync(fullPath, "utf8"));

      return {
        ...blog,
        sourceFile: file,
      };
    })
    .filter((blog) => blog.status === "Published")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(readBlogs(), null, 2) + "\n",
  "utf8"
);

console.log(`Generated ${OUTPUT_FILE}`);
