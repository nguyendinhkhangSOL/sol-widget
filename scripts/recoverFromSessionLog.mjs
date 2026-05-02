#!/usr/bin/env node
//
// Recover lost files từ Claude Cowork session log (.jsonl).
// Mỗi tool use Write hoặc Edit có ghi file_path + content/edits.
// Script này scan toàn bộ log + reconstruct files.
//
// Usage:
//   node scripts/recoverFromSessionLog.mjs <path-to-session.jsonl> <output-base-dir>
//
// Example:
//   node scripts/recoverFromSessionLog.mjs ~/.claude/projects/.../session.jsonl ./recovered/

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node recoverFromSessionLog.mjs <session.jsonl> <output-base>');
  process.exit(1);
}

const [logPath, outBase] = args;

// Filter chỉ recover files trong wiki-skeletons (chips, voice, video, upload)
const FILTER_PATHS = [
  'wiki-skeletons/chips/',
  'wiki-skeletons/voice-scripts/',
  'wiki-skeletons/video-scripts/',
  'wiki-skeletons/upload-script/',
];

const filesByPath = new Map(); // path → latest content

const stream = fs.createReadStream(logPath);
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

let lineCount = 0;
let writeCount = 0;
let editCount = 0;

for await (const line of rl) {
  lineCount++;
  if (!line.trim()) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }

  // Tool uses nằm trong assistant messages: obj.message.content (array)
  const content = obj?.message?.content;
  if (!Array.isArray(content)) continue;

  for (const block of content) {
    if (block.type !== 'tool_use') continue;
    if (block.name === 'Write') {
      const fp = block.input?.file_path;
      const c = block.input?.content;
      if (!fp || c == null) continue;
      // Filter
      if (!FILTER_PATHS.some((p) => fp.includes(p))) continue;
      filesByPath.set(fp, c);
      writeCount++;
    } else if (block.name === 'Edit') {
      const fp = block.input?.file_path;
      const oldStr = block.input?.old_string;
      const newStr = block.input?.new_string;
      if (!fp || !FILTER_PATHS.some((p) => fp.includes(p))) continue;
      // Apply edit nếu file đã trong map
      const existing = filesByPath.get(fp);
      if (existing && oldStr) {
        const updated = block.input?.replace_all
          ? existing.split(oldStr).join(newStr ?? '')
          : existing.replace(oldStr, newStr ?? '');
        filesByPath.set(fp, updated);
        editCount++;
      }
    }
  }
}

console.log(`Scanned ${lineCount} lines · ${writeCount} writes · ${editCount} edits`);
console.log(`Found ${filesByPath.size} unique files to recover\n`);

// Write to disk
let written = 0;
for (const [origPath, content] of filesByPath.entries()) {
  // Strip absolute prefix, keep relative path từ wiki-skeletons/
  const idx = origPath.indexOf('wiki-skeletons/');
  if (idx === -1) continue;
  const rel = origPath.slice(idx);
  const outPath = path.join(outBase, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');
  written++;
  console.log(`  ✓ ${rel}  (${content.length} chars)`);
}

console.log(`\n✓ Recovered ${written} files into ${outBase}`);
