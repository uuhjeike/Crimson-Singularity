# Crimson Singularity

A one-person profile site: plain HTML, CSS and JavaScript. No build step, no backend, no API keys.

## Publish on GitHub Pages
1. Put `index.html`, `style.css`, `script.js`, `posts.txt` and `README.md` in the repository root, together with `IMG_20261010_184609.jpg`.
2. Repository **Settings → Pages** → Source: *Deploy from a branch* → `main` / root → Save.
3. Open `https://USERNAME.github.io/REPOSITORY/`. All paths are relative, so project subdirectories work.

Test through GitHub Pages or a local server (`python3 -m http.server`). Opening `index.html` directly (`file://`) blocks `fetch()` and posts.txt will not load.

## Edit the profile
Open `script.js`; the `CONFIG` block at the top holds the biography and social links. Only links you list are shown.

## Add posts
Edit `posts.txt`. A line containing only `$` separates posts:

```
$
First post
$
Second post
$
Third post
$
```

One `$` line sits between posts, and one at the start and end of the file. Blank lines around a `$` are fine.

Dollar signs inside a line of text (e.g. `$5`) never split a post. Line breaks are preserved; Unicode and Bangla work. Posts appear in file order and the archive count is calculated automatically. To publish: commit and push the changed `posts.txt`, then wait for GitHub Pages to redeploy (usually under a minute or two), and hard-refresh.

## GitHub links
Paste normal links. `github.com/USER/REPO/blob/BRANCH/path/file.jpg` (and `/raw/`) is parsed and rewritten to `raw.githubusercontent.com/USER/REPO/BRANCH/path/file.jpg`, keeping branch, nested folders and encoded characters. `/tree/` folders, repo pages, profiles, issues and pull requests stay normal links. No network request is made to guess whether a file exists. If a raw file fails, the post shows a message with a link to the original URL.

**Private repositories:** visitors are not logged in, so private files will not load. Use a public repository.

## Supported media (any number per post, in order)
- Images: jpg, jpeg, png, gif, webp, svg, avif (consecutive images form a gallery; click to enlarge)
- Audio: mp3, ogg, wav, m4a, aac, flac (native player)
- Video: mp4, webm, ogv (native player); YouTube watch, youtu.be, shorts and embed links (embedded player plus a fallback link)
- Files: pdf, txt, zip, rar, doc, docx, xls, xlsx, ppt, pptx, csv, json (file card that opens the file; no in-page preview)
- Everything else: a plain clickable link

Nothing autoplays. Facebook, Instagram, TikTok and X links are shown as clean links because those platforms often block or restrict embedding.

## Troubleshooting
- "The archive could not be loaded": check the file is named `posts.txt`, is next to `index.html`, is pushed, and you are not on `file://`.
- "The archive is empty": every post needs a `$`-only line before it.
- Media not showing: the file may be missing, renamed, private, or in a format your browser cannot play.
- Old content after a push: wait for the Pages deployment, then hard-refresh.
