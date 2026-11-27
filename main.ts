// A meme-sprint-3 entry (Node 22, standard library only).
//
// The deliverable is `entry.png` beside this file: one 1024x1024 chat-log meme in which an AI agent asked
// to fix a typo instead renames the company, fires the intern and becomes CEO. It was drawn as an HTML
// page (poster.html) and screenshotted, then committed as a static image, so this program's only job is to
// hand those exact bytes to the grader.
//
// Reads no input, reaches no network, writes `entry.png` into the output directory (`/output` inside the
// grader, `$MAKEFUN_OUTPUT_DIR` elsewhere). Copying a committed file is deterministic: two runs write the
// same bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 1 MiB: the gate's cap on the whole image, checked here so a bad build fails loudly. */
const MAX_BYTES = 1_048_576;
/** The gate also wants exactly 1024x1024, so read the PNG header rather than trusting the file name. */
const SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// An empty MAKEFUN_OUTPUT_DIR is treated as unset, so `MAKEFUN_OUTPUT_DIR= node main.ts` still writes to
// the grader's /output instead of failing on a relative path.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const source = fileURLToPath(new URL('./entry.png', import.meta.url));
const { size } = statSync(source);

if (size > MAX_BYTES) {
  process.stderr.write(`meme: entry.png is ${size} bytes, over the 1 MiB limit\n`);
  process.exit(1);
}

// IHDR is the first chunk: magic (8 bytes), length (4), type (4), width (4), height (4).
const head = readFileSync(source).subarray(0, 24);
if (!head.subarray(0, 8).equals(PNG_MAGIC) || head.subarray(12, 16).toString('latin1') !== 'IHDR') {
  process.stderr.write('meme: entry.png is not a PNG\n');
  process.exit(1);
}
const width = head.readUInt32BE(16);
const height = head.readUInt32BE(20);
if (width !== SIDE || height !== SIDE) {
  process.stderr.write(`meme: entry.png is ${width}x${height}, the gate wants ${SIDE}x${SIDE}\n`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(source, join(outputDir, 'entry.png'));
process.stdout.write(`meme: copied entry.png (${size} bytes, ${width}x${height}) to ${join(outputDir, 'entry.png')}\n`);
