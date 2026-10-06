/**
 * 自托管霞鹜文楷（LXGW WenKai）分片生成（2026-10-06）
 *
 * 背景：全站中文字体为 LXGW WenKai，但此前**只生成了 Regular 400**，
 * 导致 `strong` 请求 600 字重时该族无对应字面 → 浏览器**合成加粗**（faux bold），
 * 楷体笔锋被糊成方硬笔画（用户反馈「markdown 标记的文字变成另一种字体」）。
 * 本脚本补上 Bold 700，并保证流程可复现。
 *
 * 设计约束（重要）：
 *  - Bold **必须输出为独立文件**。src/components/Comment.astro 会把
 *    `lxgw-wenkai.css` 引用的 woff2 全部 base64 内联进 giscus iframe 主题；
 *    若把 Bold 追加进同一文件，评论主题体积会翻倍。
 *  - 输出文件名保持 `lxgw-wenkai.css`（Regular），BaseLayout 的 <link> 不变。
 *
 * 用法：node scripts/prepare-fonts.mjs
 * 幂等：重复运行输出一致。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PKG = path.join(ROOT, 'node_modules/lxgw-wenkai-webfont');
const OUT_DIR = path.join(ROOT, 'public/assets/styles/fonts');
const SHARD_DIR = path.join(OUT_DIR, 'lxgw-wenkai');

/** 包内 css → 输出 css（顺序无关；Regular 沿用原文件名以免动 BaseLayout） */
const WEIGHTS = [
  { src: 'lxgwwenkai-regular.css', out: 'lxgw-wenkai.css', label: 'Regular 400' },
  { src: 'lxgwwenkai-bold.css', out: 'lxgw-wenkai-bold.css', label: 'Bold 700' },
  // 代码等宽（2026-10-06）：--font-mono 指向 'LXGW WenKai Mono'，需为其提供分片。
  // 拉丁与 CJK 都用 Mono（2:1 对齐基于它自己的拉丁宽度，混搭会错列）。
  // 只做 regular 一个字重 —— 代码块基本不用粗体，且官方本就没有 Bold TTF。
  { src: 'lxgwwenkaimono-regular.css', out: 'lxgw-wenkai-mono.css', label: 'Mono Regular' },
];

if (!fs.existsSync(PKG)) {
  console.error(`[fonts] 未找到 ${PKG}。请先 npm i（lxgw-wenkai-webfont 是 devDependency）`);
  process.exit(1);
}
fs.mkdirSync(SHARD_DIR, { recursive: true });

/**
 * 输出文件应使用的行尾。
 * 包内 CSS 是 LF，但本仓库（core.autocrlf）里这些文件是 CRLF —— 直接写 LF 会让
 * Regular 文件产生「每行都变了」的假 diff（曾踩过）。故沿用既有文件的 EOL；
 * 首次生成时退回 LF，交由 git 归一化。
 */
const eolOf = (file) => {
  if (!fs.existsSync(file)) return '\n';
  const raw = fs.readFileSync(file, 'utf8');
  return raw.includes('\r\n') ? '\r\n' : '\n';
};

let copiedTotal = 0;
for (const { src, out, label } of WEIGHTS) {
  const srcPath = path.join(PKG, src);
  if (!fs.existsSync(srcPath)) throw new Error(`[fonts] 包内缺少 ${src}`);

  // 把 ./files/xxx.woff2 重写为 ./lxgw-wenkai/xxx.woff2（与既有目录结构一致），
  // 并**统一去掉引号**：本仓库既有的 lxgw-wenkai.css 是无引号写法
  // （url(./lxgw-wenkai/…)），而包内 bold.css 带引号。不归一化会让 Regular
  // 文件产生 97 行假 diff（曾踩过）。
  const css = fs
    .readFileSync(srcPath, 'utf8')
    .replace(/url\(\s*['"]?\.\/files\/([^'")]+)['"]?\s*\)/g, 'url(./lxgw-wenkai/$1)');

  // 只复制该 css 真正引用到的分片（兼容有/无引号两种写法）
  const refs = [
    ...new Set(
      [...css.matchAll(/url\(\s*['"]?\.\/lxgw-wenkai\/([^'")]+)['"]?\s*\)/g)].map((m) => m[1]),
    ),
  ];
  let copied = 0;
  for (const file of refs) {
    const from = path.join(PKG, 'files', file);
    const to = path.join(SHARD_DIR, file);
    if (!fs.existsSync(from)) throw new Error(`[fonts] 包内缺少分片 ${file}`);
    const same = fs.existsSync(to) && fs.readFileSync(from).equals(fs.readFileSync(to));
    if (!same) {
      fs.copyFileSync(from, to);
      copied++;
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, out), css.replace(/\n/g, eolOf(path.join(OUT_DIR, out))));

  const faces = (css.match(/@font-face/g) ?? []).length;
  console.log(`  ${label.padEnd(12)} → public/assets/styles/fonts/${out}` +
    `  (${faces} 个 @font-face，${refs.length} 个分片，新复制 ${copied})`);
  copiedTotal += copied;
}

// 目录里不应存在未被任何 css 引用的分片（防止改字重后残留）
const referenced = new Set();
for (const f of fs.readdirSync(OUT_DIR).filter((n) => /^lxgw-wenkai(-bold|-mono)?\.css$/.test(n))) {
  for (const m of fs
    .readFileSync(path.join(OUT_DIR, f), 'utf8')
    .matchAll(/url\(\s*['"]?\.\/lxgw-wenkai\/([^'")]+)['"]?\s*\)/g))
    referenced.add(m[1]);
}
const orphans = fs.readdirSync(SHARD_DIR).filter((n) => !referenced.has(n));
if (orphans.length) {
  orphans.forEach((n) => fs.rmSync(path.join(SHARD_DIR, n)));
  console.log(`  清理未被引用的分片：${orphans.length} 个`);
}

console.log(`[prepare-fonts] 完成（新复制 ${copiedTotal} 个分片）。`);
console.log('提示：BaseLayout 的 <link> 加了新字重后需 bump ?v —— 见该文件注释。');
