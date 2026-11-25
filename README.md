# Divyabharathi R — Motion Graphics Portfolio

A minimal, editorial portfolio for a 2D motion graphics designer.
Plain HTML, CSS and JavaScript with GSAP animations. No frameworks, no backend, no build step, and it's ready for GitHub Pages.

- **Showreel**: large cinematic player with muted autoplay, play/pause, sound and fullscreen.
- **Automatic project gallery**: every video in `assets/videos/` becomes a project card, and the layout adapts to 1, 2, 5, 10 or more projects.
- **Project view**: a modal with a large video, description, category and software. You can link to it directly (`#work/logo-animation`).
- **One config file**: all personal details live in `js/config.js`.
- **Accessible and responsive**: keyboard friendly, respects *reduced motion*, and works on desktop, tablet and mobile.

> The videos in `assets/videos/` and `assets/images/profile.jpg` are **placeholders**. Replace them with your own work (see below).

---

## Folder structure

```text
divyabharathi/
├── index.html
├── projects.json                ← video manifest (generated, editable)
├── README.md
├── assets/
│   ├── videos/                  ← put showreel.mp4 + project videos here
│   ├── images/profile.jpg       ← your portrait (4:5 works best)
│   ├── thumbnails/              ← optional cover images
│   └── resume.pdf               ← optional (Download button appears automatically)
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── config.js                ← ✏️ edit your details here
│   ├── projects.js              ← gallery + project modal
│   ├── main.js                  ← page content, navigation, showreel
│   ├── animations.js            ← GSAP animations
│   └── vendor/                  ← GSAP + ScrollTrigger (bundled, no CDN needed)
├── scripts/
│   ├── generate-manifest.js     ← Node.js version
│   └── generate-manifest.py     ← Python version (same result)
└── .github/workflows/deploy.yml ← automatic GitHub Pages deployment
```

---

## 1. Preview on your computer

Browsers don't let a page read `projects.json` when you just double-click `index.html`, so start a tiny local server instead:

```bash
cd divyabharathi
python3 -m http.server 8000
# open http://localhost:8000
```

(`npx serve` also works, as does VS Code's "Live Server" extension.)

---

## 2. Personalise

Open **`js/config.js`** and edit the values: name, title, about text, email, Instagram, LinkedIn, Behance, skills, services and process steps.
Set any value to `""` to hide it. For example, `behance: ""` hides the Behance link and `location: ""` hides "Based in".

- **Profile photo:** replace `assets/images/profile.jpg`. If the file is missing, your initials are shown instead.
- **Resume:** put your PDF at `assets/resume.pdf`. The *Download Resume* button only appears when that file exists.

---

## 3. Add or change project videos

1. Copy your videos into **`assets/videos/`**.
   - `showreel.mp4` is always the main showreel. It is never shown as a project.
   - Every other `.mp4`, `.webm` or `.mov` file becomes a project card.
   - The file name becomes the title: `logo-animation.mp4` → **Logo Animation**, `kinetic_typography.mp4` → **Kinetic Typography**.
2. Update the manifest:

   ```bash
   node scripts/generate-manifest.js
   # or
   python3 scripts/generate-manifest.py
   ```

   The script adds new videos, removes deleted ones and **keeps everything you typed** into `projects.json`.

> If you deploy with the included GitHub Action (step 5, option A), this runs automatically on every push. You can just upload a video.

### Optional: titles, descriptions, categories

Edit `projects.json`. Empty fields fall back to sensible defaults:

```json
{
  "showreel": "showreel.mp4",
  "showreelPoster": "showreel.jpg",
  "projects": [
    {
      "file": "logo-animation.mp4",
      "title": "Brand Logo Reveal",
      "category": "Logo Animation",
      "description": "A playful logo reveal built with shape layers and custom easing.",
      "software": ["After Effects", "Illustrator"],
      "thumbnail": "logo-animation.jpg",
      "year": "2026"
    },
    "product-promo.mp4"
  ]
}
```

- **Order on the website = order in this file.** Move entries up or down to re-order. The script keeps your order.
- A plain string such as `"product-promo.mp4"` is also allowed.

### Optional: thumbnails and showreel poster

Put an image in `assets/thumbnails/` with **the same name as the video** (`logo-animation.jpg` for `logo-animation.mp4`, `showreel.jpg` for the showreel), then run the script. It picks them up automatically.
Without a thumbnail, the card shows the video's first frame. Hovering a card plays a muted preview.

---

## 4. Video tips (important for GitHub)

GitHub rejects files over **100 MB**, and its website upload accepts only **25 MB** per file. Short, compressed clips also load much faster for visitors.

Recommended: H.264 MP4, 1080p or 720p, 5–20 MB per project. With [ffmpeg](https://ffmpeg.org):

```bash
# compress a video for the web (no audio for silent loops: add -an)
ffmpeg -i input.mov -c:v libx264 -crf 24 -preset slow -vf "scale=1920:-2" \
       -c:a aac -b:a 128k -movflags +faststart assets/videos/logo-animation.mp4

# grab a thumbnail at 2 seconds
ffmpeg -ss 2 -i assets/videos/logo-animation.mp4 -frames:v 1 -q:v 3 assets/thumbnails/logo-animation.jpg
```

HandBrake (free app, "Fast 1080p30" preset with *Web Optimized* ticked) works just as well.

---

## 5. Publish on GitHub Pages

Create a new repository on the GitHub account you want to use. A repo named `USERNAME.github.io` is served at `https://USERNAME.github.io/`; any other name, for example `portfolio`, is served at `https://USERNAME.github.io/portfolio/`. Both work, because all paths are relative.

Upload the **contents** of this folder to the repository root. With git:

```bash
cd divyabharathi
git init
git add .
git commit -m "Portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

(GitHub Desktop works too. If you drag files into the GitHub website instead, note that macOS hides the `.github` folder. Press `Cmd + Shift + .` in Finder to show it, or use option B.)

Then choose **one** deployment option:

### Option A: GitHub Actions (recommended, fully automatic)

1. Repo → **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
2. Push or upload anything to `main`. The workflow regenerates `projects.json` and publishes the site.
3. Watch progress in the **Actions** tab. Your URL appears there and in Settings → Pages.

### Option B: Deploy from a branch (no Actions)

1. Repo → **Settings → Pages → Source: _Deploy from a branch_ → `main` / `(root)`** → Save.
2. Run the manifest script before each push, so `projects.json` stays current.
3. Delete `.github/workflows/deploy.yml`, so GitHub doesn't run a workflow you aren't using.

**Safety net:** on `*.github.io` the site also checks the repo's `assets/videos/` folder through GitHub's public API. A video you uploaded without updating `projects.json` still appears. You can turn this off with `autoDetectOnGitHub: false` in `config.js`. For a custom domain, fill in `github: { owner, repo }`.

---

## 6. Customise the look

Colours, fonts and spacing are CSS variables at the top of `css/style.css`:

```css
--bg: #F7F6F2;  --ink: #202020;  --muted: #898989;  --accent: #D98258;
--font-display: "Space Grotesk";  --font-body: "Inter";
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| No projects locally | You opened the file directly. Run `python3 -m http.server` (step 1). |
| New video not showing | Run the manifest script, or check that the file is in `assets/videos/` and ends in `.mp4`, `.webm` or `.mov`. |
| Showreel section missing | `assets/videos/showreel.mp4` doesn't exist or can't be played. The section hides itself on purpose. |
| `.mov` won't play | Some browsers (Firefox, Chrome on Windows) can't play QuickTime files. Convert to MP4 (see step 4). |
| Upload rejected by GitHub | The file is too large. Compress it (step 4). |
| Site 404 after enabling Pages | Wait 1–2 minutes. With option A, check the Actions tab for a green tick. |
| Changes not visible | Hard-refresh (`Cmd/Ctrl + Shift + R`). GitHub Pages caches for a few minutes. |

---

Built with HTML, CSS, vanilla JS and [GSAP](https://gsap.com) (bundled under the GSAP standard license).
