#!/usr/bin/env node
/**
 * 字体子集覆盖率检查（由 prebuild 自动调用，也可单独跑）
 *
 * 背景
 *   全站正文用了三套自托管子集，按「字重 / 用途」分工（2026-10-31 起不再按页面类型
 *   分流，lite 那套已删除）：
 *     lxgw-wenkai-subset.woff2       全站正文                      4284 码位
 *     lxgw-wenkai-bold-subset.woff2  全站粗体（与正文同表）          4291 码位
 *     lxgw-wenkai-mono-subset.woff2  代码块 / 行内 code（全站）      182 码位
 *   写新文章或改固定文案时若出现子集外的字，那个字会静默回落到系统楷体 ——
 *   不影响布局，但同一段里会混进另一种字体。本脚本只告警，exit 0，不阻断构建。
 *
 * 码位清单的来源（2026-10 改）
 *   **直接解析 public/assets/styles/fonts/*.css 里的 unicode-range**，不再读
 *   scripts/font-charset.json。原因：css 的 unicode-range 是重建子集时从 woff2
 *   实际码位反推写入的，等于「何字体里真有什么」的唯一真相；而 json 是人工回写，
 *   漏写/晚写都会让告警结论出错（历史上 lite 整套就长期没写进 json）。
 *   json 仍保留，仅作为**重建子集时的输入字表**，不参与本检查。
 *
 * 判据
 *   正文用字     ← content/blog-post/**\/*.md 全文汉字 + 中文标点      → regular
 *   粗体用字     ← 同一批文件里 ## ~ ###### 标题行 + **加粗** 内容      → bold
 *   代码用字     ← 同一批文件里的 ``` 围栏与 `行内 code`                → mono
 *   页内固定文案 ← src/**\/*.{astro,ts}（已剥离注释）                   → regular
 *                  这些文案全站都会渲染，regular 必须全部包含。
 *
 *   重建方法见工作区根 AGENTS.md §3.3.1（regular）/ §3.3.2（bold、mono）。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content', 'blog-post');
const SRC_DIR = join(ROOT, 'src');
const FONT_DIR = join(ROOT, 'public', 'assets', 'styles', 'fonts');

/** 子集名 → 提供 unicode-range 的 css（顺序无关） */
const FACE_CSS = {
  regular: 'lxgw-wenkai-subset.css',
  bold: 'lxgw-wenkai-bold-subset.css',
  mono: 'lxgw-wenkai-mono-subset.css',
};

/** 只看会落到文楷子集里的码位：基本区、扩展A、中文标点、全角形式 */
const isCjk = (cp) =>
  (cp >= 0x3400 && cp <= 0x4dbf) ||
  (cp >= 0x4e00 && cp <= 0x9fff) ||
  (cp >= 0x3000 && cp <= 0x303f) ||
  (cp >= 0xff00 && cp <= 0xffef);

/**
 * 从一个 css 里解析出全部 unicode-range，展开成码位集合。
 * 支持 `U+4E00` 与 `U+4E00-9FFF` 两种写法（本仓库两者都用）。
 */
function parseFace(file) {
  const set = new Set();
  let css;
  try {
    css = readFileSync(join(FONT_DIR, file), 'utf8');
  } catch {
    return null;
  }
  for (const m of css.matchAll(/unicode-range\s*:\s*([^;}]+)/g)) {
    for (const part of m[1].split(',')) {
      const hit = part.trim().match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
      if (!hit) continue;
      const from = Number.parseInt(hit[1], 16);
      const to = hit[2] ? Number.parseInt(hit[2], 16) : from;
      for (let cp = from; cp <= to; cp++) set.add(cp);
    }
  }
  return set;
}

/** 递归收集指定后缀的文件 */
function walk(dir, suffixes, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith('.') && e.name !== 'node_modules') walk(p, suffixes, out);
    } else if (suffixes.some((s) => e.name.endsWith(s))) {
      out.push(p);
    }
  }
  return out;
}

/**
 * 剥离注释后再取字：注释里的中文不参与渲染，不该要求字体覆盖它。
 *   <!-- html 注释 -->   /* 块注释 *\/   // 行注释（避开 URL 的 ://）
 */
const stripComments = (raw) =>
  raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

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

// ---- 读取四套子集的真实覆盖 ----
const have = {};
const missingCss = [];
for (const [name, file] of Object.entries(FACE_CSS)) {
  const set = parseFace(file);
  if (set) have[name] = set;
  else missingCss.push(`${file}（${name}）`);
}
if (missingCss.length) {
  console.log(`[fonts] 跳过覆盖率检查：缺少或无法解析 ${missingCss.join('、')}`);
  process.exit(0);
}

// ---- 收集用字 ----
const mdFiles = walk(CONTENT_DIR, ['.md']);
if (!mdFiles.length) {
  console.log('[fonts] content/blog-post 下没有文章，跳过文章用字检查');
}

const needBody = new Set();
const needBold = new Set();
const needCode = new Set();

for (const file of mdFiles) {
  const raw = readFileSync(file, 'utf8');
  const text = raw.replace(/^---[\s\S]*?\n---\s*\n/, ''); // 去掉 frontmatter
  collect(text, needBody);
  for (const m of text.matchAll(/^#{2,6}[ \t]+(.+)$/gm)) collect(m[1], needBold);
  for (const m of text.matchAll(/\*\*([^*\n]+)\*\*/g)) collect(m[1], needBold);
  // 代码块（``` 围栏）与行内 code —— 走 LXGW WenKai Mono 子集
  for (const m of text.matchAll(/```[\s\S]*?```/g)) collect(m[0], needCode);
  for (const m of text.matchAll(/`([^`\n]+)`/g)) collect(m[1], needCode);
}

// 页内固定文案（导航、页脚、按钮、空状态、404…）
const srcFiles = walk(SRC_DIR, ['.astro', '.ts', '.tsx']);
const needUi = new Set();
for (const file of srcFiles) {
  collect(stripComments(readFileSync(file, 'utf8')), needUi);
}

const miss = (need, face) => [...need].filter((cp) => !have[face].has(cp)).sort((a, b) => a - b);

const missBody = miss(needBody, 'regular');
const missBold = miss(needBold, 'bold');
const missCode = miss(needCode, 'mono');
const missUiRegular = miss(needUi, 'regular');

const groups = [
  {
    name: '正文（全站 regular）',
    list: missBody,
    hint: '按 AGENTS.md §3.3.1 重建 lxgw-wenkai-subset，并递增其 css 与 BaseLayout 的 ?v=',
  },
  {
    name: '粗体（全站 bold）',
    list: missBold,
    hint: '按 AGENTS.md §3.3.2 重建 lxgw-wenkai-bold-subset，并递增其 css 与 BaseLayout 的 ?v=',
  },
  {
    name: '代码（全站 mono）',
    list: missCode,
    hint: '按 AGENTS.md §3.3.2 重建 lxgw-wenkai-mono-subset，并递增其 css 与 BaseLayout 的 ?v=',
  },
  {
    name: '页内文案（全站 regular）',
    list: missUiRegular,
    hint: '按 AGENTS.md §3.3.1 重建 lxgw-wenkai-subset（regular 需包含全部固定文案）',
  },
];

let failed = 0;
for (const { name, list, hint } of groups) {
  if (!list.length) continue;
  failed++;
  console.log(`[fonts] ⚠ ${name} 子集缺 ${list.length} 字：${pretty(list)}`);
  console.log(`[fonts]   消除方法：${hint}`);
}

if (failed) {
  console.log('[fonts]  这些字会回落到系统字体（不影响布局，只是字形不统一）。');
} else {
  console.log(
    `[fonts] ✓ 子集覆盖完整（正文 ${needBody.size} / 粗体 ${needBold.size} / ` +
      `代码 ${needCode.size} / 页内文案 ${needUi.size}；` +
      `文章 ${mdFiles.length} 篇、源文件 ${srcFiles.length} 个）`
  );
}

process.exit(0);
