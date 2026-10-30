/**
 * 自托管霞鹜文楷（LXGW WenKai）**旧分片架构**生成器（2026-10-06 写，2026-10-30 停用）
 *
 * 历史：全站中文字体是 LXGW WenKai，2026-10-06 之前只生成了 Regular 400，
 * 于是 `strong` 请求 600 时该族无对应字面 → 浏览器合成加粗（faux bold），
 * 楷体笔锋被糊成方硬笔画。当时本脚本补上 Bold 700，并把官方包拆成 97 个分片。
 *
 * ⚠️ 2026-10-30 起这套分片架构已被整体淘汰（`61f6938` 删掉 291 个 woff2 与 3 个 css）：
 * 「97 分片 + 子集 face 不写 unicode-range」会让首屏正文渲染两次，根因与三组实测见
 * AGENTS.md §3.1.1。现在正文/粗体/代码/评论区全部是**单文件子集**：
 *   lxgw-wenkai-subset.css       全站正文 4284 字 / 922KB
 *   （lxgw-wenkai-lite.css 已于 2026-10-31 删除，全站统一用上面的 subset）
 *   lxgw-wenkai-bold-subset.css  文章页粗体（与正文同表）
 *   lxgw-wenkai-mono-subset.css  代码 182 字
 *   lxgw-wenkai-comment.css      评论区 GB2312 全集 1.57MB
 * 它们的重建方式见 AGENTS.md §3.3（fontTools.subset + 从产物反推 unicode-range）。
 *
 * 因此本脚本默认**拒绝执行**：跑一次就会往 public/ 塞回 291 个分片（约 14MB，
 * Astro 会原样拷进 dist），并重新造出 `lxgw-wenkai.css` —— 那个文件一旦被 link 回
 * BaseLayout，站点就退回 FOUT 老路。真要临时对照旧架构才加 --force。
 *
 * 用法：
 *   node scripts/prepare-fonts.mjs           # 打印原因后退出（exit 1）
 *   node scripts/prepare-fonts.mjs --force   # 真的重建分片
 */
import fs from 'node:fs';
import path from 'node:path';

// 守卫放最前面：连 node_modules 都不查，先说明为什么不该跑
const FORCE = process.argv.includes('--force');

if (!FORCE) {
  console.error(
    [
      '[fonts] 已停用：本脚本重建的是旧分片架构（97 片 / 3 个 css）。',
      '        现行站点用单文件子集 lxgw-wenkai-{subset,bold-subset,mono-subset}.css，',
      '        重建方法见 AGENTS.md §3.3（fontTools.subset + 从产物反推 unicode-range）。',
      '        跑本脚本会往 public/ 塞回约 14MB 分片，并造出会引发正文二次渲染的 lxgw-wenkai.css。',
      '        确实要重建旧分片时：node scripts/prepare-fonts.mjs --force',
    ].join('\n'),
  );
  process.exit(1);
}

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
