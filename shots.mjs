// Renders poster.html to entry.png: 1024x1024, deviceScaleFactor 1.
//
//   node shots.mjs
//
// It also measures every text element against its box before the screenshot and fails the build if any
// line is clipped, wrapped oddly or overflows, so a clipped meme can never be committed.
import { chromium } from 'playwright';
import { mkdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const TARGET = join(HERE, 'entry.png');
const MAX_BYTES = 1_048_576;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(HERE, 'poster.html')).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

const problems = [];
const ok = (cond, msg) => {
  console.log(cond ? 'ok  ' : 'FAIL', msg);
  if (!cond) problems.push(msg);
};

// --- the document is exactly the shot ---
const doc = await page.evaluate(() => ({
  w: document.documentElement.scrollWidth,
  h: document.documentElement.scrollHeight,
  bodyOverflowY: document.body.scrollHeight - 1024,
}));
ok(doc.w === 1024 && doc.h === 1024, `page is exactly 1024x1024 (${doc.w}x${doc.h})`);
ok(doc.bodyOverflowY <= 0, `nothing spills past the 1024px frame (body overflow ${doc.bodyOverflowY}px)`);

// --- every text box: no clipped glyphs, no horizontal overflow ---
const boxes = await page.evaluate(() => {
  const sel = ['h1', 'h1 .rogue', '.kicker', '.row .who', '.row .bubble', '.row .stamp', '.status .label', '.status .sub', '.members'];
  const out = [];
  for (const s of sel) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push({
        sel: s,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46),
        top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right),
        scrollW: el.scrollWidth, clientW: el.clientWidth, scrollH: el.scrollHeight, clientH: el.clientHeight,
        overflow: cs.overflow,
        inFrame: r.top >= 0 && r.bottom <= 1024 && r.left >= 0 && r.right <= 1024,
      });
    }
  }
  return out;
});

for (const b of boxes) {
  const clipX = b.scrollW - b.clientW;
  const clipY = b.scrollH - b.clientH;
  ok(b.inFrame, `[${b.sel}] "${b.text}" sits inside the 1024 frame (${b.left},${b.top})-(${b.right},${b.bottom})`);
  ok(clipX <= 1, `[${b.sel}] "${b.text}" is not clipped sideways (overflow ${clipX}px)`);
  ok(clipY <= 1, `[${b.sel}] "${b.text}" is not clipped vertically (overflow ${clipY}px)`);
}

// --- each bubble's text must fill its bubble without touching the rounded edges ---
const bubbles = await page.evaluate(() =>
  [...document.querySelectorAll('.row .bubble')].map((el) => {
    const r = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const t = range.getBoundingClientRect();
    const lines = Math.round((t.height) / (parseFloat(getComputedStyle(el).lineHeight) || 1));
    return {
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
      padRight: Math.round(r.right - t.right),
      padBottom: Math.round(r.bottom - t.bottom),
      padTop: Math.round(t.top - r.top),
      lines,
      w: Math.round(r.width), h: Math.round(r.height),
    };
  })
);
for (const b of bubbles) {
  ok(b.padRight >= 8 && b.padTop >= 8 && b.padBottom >= 4,
    `bubble "${b.text}" keeps its padding (t ${b.padTop}, r ${b.padRight}, b ${b.padBottom}) ${b.w}x${b.h}, ${b.lines} lines`);
}

// --- the whole joke has to survive a phone thumbnail: header and bubble type stay big ---
const sizes = await page.evaluate(() => ({
  h1: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
  bubble: parseFloat(getComputedStyle(document.querySelector('.row .bubble')).fontSize),
  status: parseFloat(getComputedStyle(document.querySelector('.status .sub')).fontSize),
}));
console.log('font sizes:', JSON.stringify(sizes));
ok(sizes.h1 >= 90, `header is huge (${sizes.h1}px)`);
ok(sizes.bubble >= 30, `bubble text is thumbnail-readable (${sizes.bubble}px)`);
ok(sizes.status >= 20, `status line is readable (${sizes.status}px)`);

// --- text is real text, spelled right ---
const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
console.log('rendered text:', bodyText);
for (const phrase of ['MY AI AGENT WENT ROGUE', 'just fix the typo in the README',
  'I renamed the company, fired the intern, and I’m the CEO now', 'AGENT STATUS: ROGUE',
  'last seen approving its own raise']) {
  ok(bodyText.toUpperCase().includes(phrase.toUpperCase()), `renders "${phrase}"`);
}

if (problems.length) {
  console.log(`\n${problems.length} layout problem(s) — not writing entry.png`);
  await browser.close();
  process.exit(1);
}

await page.screenshot({ path: join(OUT, 'entry.png') });
copyFileSync(join(OUT, 'entry.png'), TARGET);
const size = statSync(TARGET).size;
console.log(`entry.png ${size} bytes`);
ok(size <= MAX_BYTES, `entry.png is under 1 MiB (${size} <= ${MAX_BYTES})`);

await browser.close();
process.exit(problems.length ? 1 : 0);
