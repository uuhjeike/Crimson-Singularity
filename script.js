'use strict';
/* ============ EDIT YOUR PROFILE HERE ============ */
const CONFIG = {
  bio: 'A single presence, recorded here. Replace this line with your own words.',
  // Only links listed here are shown. Example:
  // { label: 'GitHub', url: 'https://github.com/your-name' }
  socials: []
};
/* ================================================== */

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const EXT = {
  img: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'],
  audio: ['mp3', 'ogg', 'wav', 'm4a', 'aac', 'flac'],
  video: ['mp4', 'webm', 'ogv'],
  doc: ['pdf', 'txt', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json']
};

/* ---------- posts.txt parser: split only on a line that is exactly "$" ---------- */
function parsePosts(txt) {
  const posts = [];
  let cur = null;
  for (const line of txt.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    if (line === '$') { if (cur) posts.push(cur.join('\n')); cur = []; }
    else if (cur) cur.push(line);
  }
  if (cur) posts.push(cur.join('\n'));
  return posts.map(p => p.trim()).filter(Boolean);
}

/* ---------- URL handling ---------- */
function safeUrl(s) {
  try {
    const u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u : null;
  } catch (e) { return null; }
}

// github.com/USER/REPO/blob/REF/path -> raw.githubusercontent.com/USER/REPO/REF/path
// /tree/, repo pages, issues, PRs, profiles etc. are returned unchanged.
function resolveGithub(u) {
  if (!/^(www\.)?github\.com$/i.test(u.hostname)) return u;
  const p = u.pathname.split('/').filter(Boolean);
  if (p.length >= 5 && (p[2] === 'blob' || p[2] === 'raw')) {
    try {
      return new URL('https://raw.githubusercontent.com/' + p[0] + '/' + p[1] + '/' + p.slice(3).join('/'));
    } catch (e) { return u; }
  }
  return u;
}

function ytInfo(u) {
  const h = u.hostname.replace(/^(www|m)\./i, '').toLowerCase();
  const p = u.pathname.split('/').filter(Boolean);
  let id = null, short = false;
  if (h === 'youtu.be') id = p[0];
  else if (h === 'youtube.com') {
    if (p[0] === 'watch') id = u.searchParams.get('v');
    else if (['shorts', 'embed', 'live'].includes(p[0])) { id = p[1]; short = p[0] === 'shorts'; }
  }
  return id && /^[\w-]{11}$/.test(id) ? { id, short } : null;
}

function extOf(u) {
  let path = u.pathname;
  try { path = decodeURIComponent(path); } catch (e) {}
  const m = path.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}
function nameOf(u) {
  let n = u.pathname.split('/').pop() || u.hostname;
  try { n = decodeURIComponent(n); } catch (e) {}
  return n;
}

/* ---------- node builders ---------- */
function extLink(href, text, cls) {
  const a = el('a', cls, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function fail(what, origHref) {
  const d = el('div', 'fail', what + ' could not be loaded. ');
  d.appendChild(extLink(origHref, 'Open the original link'));
  return d;
}

function imageNode(src, orig, name) {
  const b = el('button', 'thumb');
  b.type = 'button';
  b.setAttribute('aria-label', 'View full size: ' + name);
  const img = new Image();
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = name;
  img.src = src;
  img.addEventListener('error', () => b.replaceWith(fail('This image', orig)), { once: true });
  b.appendChild(img);
  b.addEventListener('click', () => {
    $('lbi').src = img.currentSrc || src;
    $('lbi').alt = name;
    $('lb').showModal();
  });
  return b;
}

function mediaNode(kind, src, orig) {
  const wrap = el('div', 'media');
  const m = document.createElement(kind);
  m.controls = true;
  m.preload = kind === 'video' ? 'metadata' : 'none';
  if (kind === 'video') m.playsInline = true;
  m.src = src;
  m.addEventListener('error', () => wrap.replaceWith(fail('This ' + kind + ' file', orig)), { once: true });
  wrap.appendChild(m);
  return wrap;
}

function ytNode(y) {
  const w = el('div', y.short ? 'yt short' : 'yt');
  const f = el('div', 'frame');
  const i = document.createElement('iframe');
  i.src = 'https://www.youtube-nocookie.com/embed/' + y.id;
  i.title = 'YouTube video player';
  i.loading = 'lazy';
  i.allowFullscreen = true;
  i.referrerPolicy = 'strict-origin-when-cross-origin';
  i.allow = 'encrypted-media; picture-in-picture; fullscreen';
  i.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
  f.appendChild(i);
  w.appendChild(f);
  w.appendChild(extLink('https://www.youtube.com/watch?v=' + y.id, 'Open on YouTube if the player does not load'));
  return w;
}

function fileNode(src, orig, ext, name, differs) {
  const a = extLink(src, '', 'file');
  a.appendChild(el('span', 'ext', ext.toUpperCase()));
  const t = el('span', 'fname');
  t.appendChild(el('span', 'lbl', 'OPEN FILE'));
  t.appendChild(document.createTextNode(name));
  a.appendChild(t);
  return a;
}

function linkNode(u) {
  const a = extLink(u.href, '', 'link');
  const t = el('span', 'fname');
  t.appendChild(el('span', 'lbl', u.hostname.replace(/^www\./, '').toUpperCase()));
  t.appendChild(document.createTextNode(u.href));
  a.appendChild(t);
  return a;
}

/* ---------- one URL -> one element ---------- */
function renderUrl(s) {
  const u = safeUrl(s);
  if (!u) return { n: el('p', 'txt', s) };
  const y = ytInfo(u);
  if (y) return { n: ytNode(y) };
  const r = resolveGithub(u);
  const ext = extOf(r), name = nameOf(r);
  if (EXT.img.includes(ext)) return { n: imageNode(r.href, u.href, name), img: true };
  if (EXT.audio.includes(ext)) return { n: mediaNode('audio', r.href, u.href) };
  if (EXT.video.includes(ext)) return { n: mediaNode('video', r.href, u.href) };
  if (EXT.doc.includes(ext)) {
    const f = fileNode(r.href, u.href, ext, name);
    if (r.href === u.href) return { n: f };
    const box = document.createDocumentFragment();
    box.appendChild(f);
    return { n: box };
  }
  return { n: linkNode(u) };
}

/* ---------- split a post into text + URLs, in order ---------- */
function tokenize(text) {
  const out = [], re = /https?:\/\/[^\s<>"']+/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    let url = m[0];
    const t = url.match(/[.,;:!?)\]}]+$/);
    if (t) url = url.slice(0, -t[0].length);
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    out.push({ t: 'url', v: url });
    last = m.index + url.length;
    re.lastIndex = last;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

function renderPost(text, i) {
  const art = el('article', 'post');
  art.appendChild(el('div', 'rec', 'RECORD // ' + String(i + 1).padStart(3, '0')));
  let gallery = null;
  for (const tk of tokenize(text)) {
    if (tk.t === 'text') {
      const s = tk.v.trim();
      if (s) { gallery = null; art.appendChild(el('p', 'txt', s)); }
      continue;
    }
    let r;
    try { r = renderUrl(tk.v); } catch (e) { r = { n: el('p', 'txt', tk.v) }; }
    if (r.img) {
      if (!gallery) { gallery = el('div', 'gallery'); art.appendChild(gallery); }
      gallery.appendChild(r.n);
    } else { gallery = null; art.appendChild(r.n); }
  }
  return art;
}

function notice(title, msg) {
  const d = el('div', 'notice');
  d.appendChild(el('h3', null, title));
  d.appendChild(el('p', null, msg));
  return d;
}

/* ---------- init ---------- */
async function init() {
  $('bio').textContent = CONFIG.bio;
  for (const s of CONFIG.socials) {
    const u = s && safeUrl(s.url);
    if (!u || !s.label) continue;
    const li = el('li');
    li.appendChild(extLink(u.href, s.label));
    $('socials').appendChild(li);
  }
  const av = $('avatar');
  av.addEventListener('error', () => av.classList.add('bad'));
  $('lbc').addEventListener('click', () => $('lb').close());
  $('lb').addEventListener('click', e => { if (e.target === $('lb')) $('lb').close(); });

  const list = $('posts'), count = $('count'), more = $('more');
  let posts;
  try {
    const r = await fetch('posts.txt', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    posts = parsePosts(await r.text());
  } catch (e) {
    count.textContent = 'ARCHIVE // UNAVAILABLE';
    list.appendChild(notice('The archive could not be loaded',
      location.protocol === 'file:'
        ? 'Browsers block reading posts.txt from a file:// page. Open the site through GitHub Pages or a local web server.'
        : 'posts.txt was not found or could not be read. Check that it sits next to index.html and has been pushed to GitHub.'));
    return;
  }
  if (!posts.length) {
    count.textContent = 'ARCHIVE // 000 POSTS';
    list.appendChild(notice('The archive is empty',
      'posts.txt has no valid posts. Put a line containing only $ before and after each post.'));
    return;
  }
  count.textContent = 'ARCHIVE // ' + String(posts.length).padStart(3, '0') + ' POSTS';

  let n = 0, io = null;
  const BATCH = 8;
  const next = () => {
    if (n >= posts.length) return;
    const frag = document.createDocumentFragment();
    for (const end = Math.min(n + BATCH, posts.length); n < end; n++) {
      try { frag.appendChild(renderPost(posts[n], n)); }
      catch (e) { frag.appendChild(notice('Record ' + (n + 1), 'This post could not be displayed.')); }
    }
    list.appendChild(frag);
    if (n >= posts.length) { more.hidden = true; if (io) io.disconnect(); }
  };
  more.hidden = false;
  more.addEventListener('click', next);
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(es => { if (es[0].isIntersecting) next(); }, { rootMargin: '600px' });
    io.observe(more);
  }
  next();
}
init();
