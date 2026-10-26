
import fs from "node:fs";
import path from "node:path";

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

writeIndex(
  "content/blog-index.json",
  readCollection("content/blogs")
);

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
