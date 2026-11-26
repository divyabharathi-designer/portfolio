#!/usr/bin/env python3
"""
Project manifest generator (Python version — same result as generate-manifest.js)

    python3 scripts/generate-manifest.py

Scans assets/videos/ and writes projects.json:
  * showreel.(mp4|webm|mov)          -> main showreel (not listed as a project)
  * every other .mp4 / .webm / .mov  -> one project card
  * metadata you typed into projects.json is kept; deleted videos are
    removed, new videos are appended
  * thumbnails in assets/thumbnails/ with the same name as a video are
    picked up automatically
No dependencies — Python 3.6+.
"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO_DIR = os.path.join(ROOT, "assets", "videos")
THUMB_DIR = os.path.join(ROOT, "assets", "thumbnails")
MANIFEST = os.path.join(ROOT, "projects.json")

VIDEO_EXT = [".mp4", ".webm", ".mov"]
IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]


def list_files(d):
    if not os.path.isdir(d):
        return []
    return [f for f in os.listdir(d)
            if not f.startswith(".") and os.path.isfile(os.path.join(d, f))]


def ext(f):
    return os.path.splitext(f)[1].lower()


def base(f):
    return os.path.splitext(f)[0]


def natural_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def version_of(path):
    """Short content hash: changes only when the file itself changes (cache-busting)."""
    if not os.path.isfile(path):
        return ""
    h = hashlib.sha1()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:10]


def find_thumb(name, thumbs):
    want = base(name).lower()
    for t in sorted(thumbs, key=natural_key):
        if ext(t) in IMAGE_EXT and base(t).lower() == want:
            return t
    return ""


def main():
    videos = sorted([f for f in list_files(VIDEO_DIR) if ext(f) in VIDEO_EXT], key=natural_key)
    thumbs = list_files(THUMB_DIR)

    reels = sorted([f for f in videos if base(f).lower() == "showreel"],
                   key=lambda f: VIDEO_EXT.index(ext(f)))
    showreel = reels[0] if reels else ""
    project_files = [f for f in videos if f not in reels]

    old = {"projects": []}
    if os.path.exists(MANIFEST):
        try:
            with open(MANIFEST, encoding="utf-8") as fh:
                old = json.load(fh)
        except ValueError as err:
            print("✖ projects.json is not valid JSON — fix it first (nothing was changed).")
            print("  " + str(err))
            sys.exit(1)

    old_entries = []
    for p in old.get("projects", []) if isinstance(old.get("projects"), list) else []:
        if isinstance(p, str):
            p = {"file": p}
        if isinstance(p, dict) and p.get("file"):
            old_entries.append(p)

    known = {p["file"] for p in old_entries}
    kept = [p for p in old_entries if p["file"] in project_files]
    added = [f for f in project_files if f not in known]
    removed = [p["file"] for p in old_entries if p["file"] not in project_files]

    projects = []
    for p in kept + [{"file": f} for f in added]:
        entry = {
            "file": p["file"],
            "title": p.get("title", "") or "",
            "category": p.get("category", "") or "",
            "description": p.get("description", "") or "",
            "software": p.get("software") if isinstance(p.get("software"), list) else [],
            "thumbnail": p.get("thumbnail", "") or "",
            "year": p.get("year", "") or "",
        }
        for k, v in p.items():
            if k not in entry:
                entry[k] = v
        entry["version"] = version_of(os.path.join(VIDEO_DIR, p["file"]))
        if not entry["thumbnail"]:
            entry["thumbnail"] = find_thumb(p["file"], thumbs)
        elif entry["thumbnail"] not in thumbs:
            print('! Thumbnail "%s" for %s was not found in assets/thumbnails/' % (entry["thumbnail"], p["file"]))
        projects.append(entry)

    poster = old.get("showreelPoster") or ""
    if poster not in thumbs:
        poster = find_thumb("showreel", thumbs)

    manifest = {
        "showreel": showreel,
        "showreelVersion": version_of(os.path.join(VIDEO_DIR, showreel)) if showreel else "",
        "showreelPoster": poster,
        "projects": projects,
    }
    with open(MANIFEST, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print("✔ projects.json updated")
    print("  Showreel : %s" % (showreel or "— none found (section will be hidden)"))
    print("  Projects : %d" % len(projects))
    for f in added:
        print("    + " + f)
    for f in removed:
        print("    - %s (file no longer in assets/videos)" % f)


if __name__ == "__main__":
    main()
