#!/usr/bin/env node
/**
 * 字体子集覆盖率检查（由 prebuild 自动调用，也可单独跑）
 *
 * 背景
 *   正文与粗体各是一个 GB2312 一级全覆盖的单文件子集：
 *     public/assets/styles/fonts/lxgw-wenkai-subset.woff2      (weight 400)
 *     public/assets/styles/fonts/lxgw-wenkai-bold-subset.woff2 (weight 700)
 *   写新文章时若出现子集外的字，那个字会静默回落到系统楷体 —— 不影响布局，
 *   但同一段里会混进另一种字体。本脚本只告警，exit 0，不阻断构建。
 *
 * 判据
 *   正文用字 = 文章正文的汉字 + 中文标点
 *   粗体用字 = ## ~ ###### 标题行 + **加粗** 里的内容
 *
 * 码位清单来自 scripts/font-charset.json（重建子集时由同一个 python 脚本生成）。
 * 重建方法见工作区根 AGENTS.md 的 §3.3.1 / §3.3.2。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content', 'blog-post');
const CHARSET = join(ROOT, 'scripts', 'font-charset.json');

/** 只看会落到文楷子集里的码位：基本区、扩展A、中文标点、全角形式 */
const isCjk = (cp) =>
  (cp >= 0x3400 && cp <= 0x4dbf) ||
  (cp >= 0x4e00 && cp <= 0x9fff) ||
  (cp >= 0x3000 && cp <= 0x303f) ||
  (cp >= 0xff00 && cp <= 0xffef);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith('.')) walk(p, out);
    } else if (e.name.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

function collect(str, into) {
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (isCjk(cp)) into.add(cp);
  }
  return into;
}

const pretty = (list) => {
  const s = list.map((cp) => String.fromCodePoint(cp)).join('');
  return s.length > 60 ? `${s.slice(0, 60)}…(共 ${s.length} 字)` : s;
};

let charset;
try {
  charset = JSON.parse(readFileSync(CHARSET, 'utf8'));
} catch {
  console.log('[fonts] 跳过覆盖率检查：scripts/font-charset.json 缺失');
  process.exit(0);
}
const have = {
  regular: new Set(charset.regular ?? []),
  bold: new Set(charset.bold ?? []),
  mono: new Set(charset.mono ?? []),
};

const files = walk(CONTENT_DIR);
if (!files.length) {
  console.log('[fonts] content/blog-post 下没有文章，跳过覆盖率检查');
  process.exit(0);
}

const needBody = new Set();
const needBold = new Set();
const needCode = new Set();

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const text = raw.replace(/^---[\s\S]*?\n---\s*\n/, ''); // 去掉 frontmatter
  collect(text, needBody);
  for (const m of text.matchAll(/^#{2,6}[ \t]+(.+)$/gm)) collect(m[1], needBold);
  for (const m of text.matchAll(/\*\*([^*\n]+)\*\*/g)) collect(m[1], needBold);
  // 代码块（``` 围栏）与行内 code —— 走 LXGW WenKai Mono 子集
  for (const m of text.matchAll(/```[\s\S]*?```/g)) collect(m[0], needCode);
  for (const m of text.matchAll(/`([^`\n]+)`/g)) collect(m[1], needCode);
}

const missBody = [...needBody].filter((cp) => !have.regular.has(cp)).sort((a, b) => a - b);
const missBold = [...needBold].filter((cp) => !have.bold.has(cp)).sort((a, b) => a - b);
const missCode = [...needCode].filter((cp) => !have.mono.has(cp)).sort((a, b) => a - b);

if (missBody.length) {
  console.log(`[fonts] ⚠ 正文子集缺 ${missBody.length} 字：${pretty(missBody)}`);
}
if (missBold.length) {
  console.log(`[fonts] ⚠ 粗体子集缺 ${missBold.length} 字：${pretty(missBold)}`);
}
if (missCode.length) {
  console.log(`[fonts] ⚠ 代码块等宽子集缺 ${missCode.length} 字：${pretty(missCode)}`);
}

if (missBody.length || missBold.length || missCode.length) {
  console.log('[fonts]  这些字会回落到系统字体（不影响布局，只是字形不统一）。');
  console.log('[fonts]  要消除：按 AGENTS.md §3.3.1 重建 regular/bold、按 §3.3.3 重建 mono，');
  console.log('[fonts]  并递增对应 css 与 BaseLayout 里的 ?v=');
} else {
  console.log(
    `[fonts] ✓ 子集覆盖完整（正文用字 ${needBody.size} / 粗体用字 ${needBold.size} / ` +
      `代码用字 ${needCode.size}，共 ${files.length} 篇）`
  );
}

process.exit(0);
