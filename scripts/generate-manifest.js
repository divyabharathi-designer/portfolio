#!/usr/bin/env node
/* =====================================================================
   Project manifest generator
   ---------------------------------------------------------------------
   Scans assets/videos/ and writes projects.json for the website.

     node scripts/generate-manifest.js

   • showreel.(mp4|webm|mov)  → the main showreel (never listed as a project)
   • every other .mp4 / .webm / .mov → one project card
   • Existing titles, descriptions, categories, software & thumbnails you
     typed into projects.json are KEPT. Deleted videos are removed,
     new videos are appended.
   • A thumbnail is picked up automatically when assets/thumbnails/ has an
     image with the same name as the video (e.g. logo-animation.jpg).
   No dependencies — only Node.js (v14+).
   ===================================================================== */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const VIDEO_DIR = path.join(ROOT, "assets", "videos");
const THUMB_DIR = path.join(ROOT, "assets", "thumbnails");
const MANIFEST = path.join(ROOT, "projects.json");

const VIDEO_EXT = [".mp4", ".webm", ".mov"];
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];

const listFiles = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => !f.startsWith(".") && fs.statSync(path.join(dir, f)).isFile())
    : [];

const ext = (f) => path.extname(f).toLowerCase();
const base = (f) => path.basename(f, path.extname(f));
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function findThumb(name, thumbs) {
  const want = base(name).toLowerCase();
  return thumbs.find((t) => IMAGE_EXT.includes(ext(t)) && base(t).toLowerCase() === want) || "";
}

function main() {
  const videos = listFiles(VIDEO_DIR).filter((f) => VIDEO_EXT.includes(ext(f))).sort(natural);
  const thumbs = listFiles(THUMB_DIR);

  // Showreel: prefer mp4, then webm, then mov
  const reels = videos.filter((f) => base(f).toLowerCase() === "showreel");
  reels.sort((a, b) => VIDEO_EXT.indexOf(ext(a)) - VIDEO_EXT.indexOf(ext(b)));
  const showreel = reels[0] || "";
  const projectFiles = videos.filter((f) => !reels.includes(f));

  // Read the existing manifest so hand-written metadata survives
  let old = { projects: [] };
  if (fs.existsSync(MANIFEST)) {
    try {
      old = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    } catch (err) {
      console.error("✖ projects.json is not valid JSON — fix it first (nothing was changed).");
      console.error("  " + err.message);
      process.exit(1);
    }
  }

  const oldEntries = (Array.isArray(old.projects) ? old.projects : [])
    .map((p) => (typeof p === "string" ? { file: p } : p))
    .filter((p) => p && p.file);

  const byFile = new Map(oldEntries.map((p) => [p.file, p]));
  const kept = oldEntries.filter((p) => projectFiles.includes(p.file));
  const added = projectFiles.filter((f) => !byFile.has(f));
  const removed = oldEntries.filter((p) => !projectFiles.includes(p.file)).map((p) => p.file);

  const projects = [...kept, ...added.map((file) => ({ file }))].map((p) => {
    const entry = {
      file: p.file,
      title: p.title || "",
      category: p.category || "",
      description: p.description || "",
      software: Array.isArray(p.software) ? p.software : [],
      thumbnail: p.thumbnail || "",
      year: p.year || ""
    };
    // carry over any extra custom keys
    Object.keys(p).forEach((k) => { if (!(k in entry)) entry[k] = p[k]; });
    if (!entry.thumbnail) entry.thumbnail = findThumb(p.file, thumbs);
    else if (!thumbs.includes(entry.thumbnail))
      console.warn(`! Thumbnail "${entry.thumbnail}" for ${p.file} was not found in assets/thumbnails/`);
    return entry;
  });

  const manifest = {
    showreel,
    showreelPoster: (old.showreelPoster && thumbs.includes(old.showreelPoster) && old.showreelPoster) || findThumb("showreel", thumbs),
    projects
  };

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  console.log("✔ projects.json updated");
  console.log(`  Showreel : ${showreel || "— none found (section will be hidden)"}`);
  console.log(`  Projects : ${projects.length}`);
  added.forEach((f) => console.log(`    + ${f}`));
  removed.forEach((f) => console.log(`    - ${f} (file no longer in assets/videos)`));
}

main();
