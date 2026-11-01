/**
 * 构建期生成站内搜索索引（2026-10-31）
 *
 * 产出：`public/search-index.json`（构建产物，已 gitignore）
 *   { generated, docs: [{ t: 标题, u: 链接, d: 日期, x: 纯文本正文 }] }
 *
 * 为什么在构建期生成、前端本地匹配，而不是引 Pagefind / 服务端搜索：
 *   本站正文总量只有个位数文章、几十 KB 纯文本，一次性 fetch 后在前端 includes
 *   匹配既零依赖又零网络往返；Pagefind 要额外跑索引器并产出一堆分片文件，
 *   对当前体量是净负担（用户 2026-10-27 也曾明确不要 Pagefind）。
 *   文章量涨到几十篇以上时再考虑换 Pagefind —— 那时 search-index.json 会到几百 KB。
 *
 * 依赖：只读 content/blog-post 下的 .md，不碰 content 的 git 状态。
 * 缺 content（未 clone）时打印一行并 exit 0，不阻断构建。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'blog-post');
const OUT = path.join(ROOT, 'public', 'search-index.json');

/** 源码里的 markdown 语法一律剥成纯文本：摘要要高亮的是「读起来的话」，不是记号。 */
function toPlainText(md) {
  return (
    md
      // frontmatter 之外才处理，调用前已剥离
      .replace(/```[\s\S]*?```/g, ' ') // 围栏代码块
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/`[^`\n]*`/g, ' ') // 行内代码
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ') // 图片保留 alt
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
      .replace(/<[^>]+>/g, ' ') // 裸 HTML / iframe
      .replace(/^\s{0,3}#{1,6}\s+/gm, '') // 标题井号
      .replace(/^\s{0,3}>\s?/gm, '') // 引用
      .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '') // 列表符号
      .replace(/^\s{0,3}\|?[\s:|-]{3,}\|?\s*$/gm, ' ') // 表格分隔行
      .replace(/\|/g, ' ') // 表格竖线
      .replace(/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/gm, ' ') // 水平线
      .replace(/(\*\*|__|\*|_|~~)/g, '') // 强调记号
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function readFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { fm, body: raw.slice(m[0].length) };
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.mdx?$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

if (!fs.existsSync(SRC)) {
  console.log('[search] 跳过：content/blog-post 不存在（未 clone 内容仓）');
  process.exit(0);
}

/**
 * 「关于」「随想」由专属页面独占渲染，不进 /posts 文章流
 * （见 src/utils/content.ts 的 EXCLUDED_CATEGORIES）。索引必须跟上，否则搜索结果
 * 会把人送到 /posts/<title> 那个通用文章详情页，版型骤变（2026-11-01）。
 *   - 关于 → 链接改指 /about：单篇直出，命中即命中那篇，可发现性零损失
 *   - 随想 → 完全不索引：/inspiration 是 5 条火花拼成的流，页面没有任何条目级锚点，
 *     跳过去只能落在顶部；索引正文又是各条火花剥掉 `##` 后拼成的一整段，摘要天然
 *     跨条目混杂，收益接近零
 * ⚠️ 本文件是 .mjs，import 不了 content.ts 的 TS 常量 → 字面量须与那边保持一致。
 */
const PAGE_URL = { 关于: '/about' };
const SKIP_CATEGORIES = ['随想'];

const docs = [];
for (const file of walk(SRC)) {
  const raw = fs.readFileSync(file, 'utf8');
  const { fm, body } = readFrontmatter(raw);
  const title = (fm.title || path.basename(file, path.extname(file))).trim();
  if (!title) continue;
  if (SKIP_CATEGORIES.includes(fm.category)) continue;
  const text = toPlainText(body);
  docs.push({
    t: title,
    u: PAGE_URL[fm.category] ?? `/posts/${title}`,
    d: (fm.date || '').slice(0, 10),
    x: text,
  });
}

docs.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), docs }));

const bytes = fs.statSync(OUT).size;
const chars = docs.reduce((n, d) => n + d.x.length, 0);
console.log(
  `[search] ✓ ${docs.length} 篇 / 正文 ${chars} 字 → public/search-index.json（${(bytes / 1024).toFixed(1)} KB）`
);
