import type { CollectionEntry } from 'astro:content';

/**
 * 内容分类的受控词表（2026-10-06 起）
 *
 * 分类是**单值**字段，承担顶层结构；与自由的 `tags`（多值）分工不同。
 * 用 enum 而非 `z.string()` 的原因：「关于」「随想」是**保留分类**，被代码硬依赖
 * （见下方 EXCLUDED_CATEGORIES）。若分类可随意填写，拼错会**静默失效** ——
 * 构建不报错，自述页渲染空白、火花流消失。enum 让拼错在构建期直接失败。
 *
 * 新增分类 = 在 CATEGORIES 里加一项（一次显式决定，而不是随手输入）。
 */
export const CATEGORIES = ['关于', '随想', '日志', '随笔', '笔记'] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * 不进常规文章流的分类（必须是 CATEGORIES 的子集）
 *
 * 「关于」由 /about 自述页独占（渲染最新一篇「关于」文章）；
 * 「随想」由 /inspiration 隨想流独占（inspirationLoader 把正文按 `##` 拆成火花流）。
 * 两者都不进首页文章列表，归档页的**三个维度（标签 / 分类 / 时间线）也一律排除**。
 *
 * 抽成独立模块的原因：`getStaticPaths` 在构建期会被抽成单独模块执行，
 * **取不到 .astro frontmatter 作用域的变量**，因此这类共享常量必须可被 import。
 */
export const EXCLUDED_CATEGORIES: readonly Category[] = ['关于', '随想'];

/* ---------------------------------------------------------------------------
 * 归档聚合（2026-10-31 抽出）
 *
 * 归档页三个维度（标签 / 分类 / 时间线）的 `getStaticPaths` 原本各写一遍：
 * 「过滤 EXCLUDED_CATEGORIES → 建 Map 分组 → 组内按日期倒序」，只有分组键不同。
 * 漏改一处的后果不会报错，只会让某个维度悄悄多出「关于」「随想」的文章。
 * ------------------------------------------------------------------------- */

/** 归档聚合用到的文章类型（= getCollection('post') 的元素） */
export type ArchiveEntry = CollectionEntry<'post'>;

/** 按日期倒序（新的在前）。归档页三个维度与首页列表共用同一口径。 */
export const byDateDesc = (a: ArchiveEntry, b: ArchiveEntry): number =>
  b.data.date.getTime() - a.data.date.getTime();

/**
 * 把文章按某个键分组（组内已按日期倒序），用于归档页的三个维度。
 *
 * - `keyOf` 返回字符串 = 单值维度（分类 / 年份）；
 *   返回字符串数组 = 多值维度（标签，一篇文章可进多个组）。
 * - **排除「关于」「随想」在这里统一生效**，调用方不需要（也不应该）重复过滤。
 */
export function groupArchiveEntries(
  entries: readonly ArchiveEntry[],
  keyOf: (entry: ArchiveEntry) => string | readonly string[],
): Map<string, ArchiveEntry[]> {
  const grouped = new Map<string, ArchiveEntry[]>();
  for (const entry of entries) {
    if (EXCLUDED_CATEGORIES.includes(entry.data.category)) continue;
    const raw = keyOf(entry);
    for (const key of typeof raw === 'string' ? [raw] : raw) {
      const list = grouped.get(key);
      if (list) list.push(entry);
      else grouped.set(key, [entry]);
    }
  }
  for (const list of grouped.values()) list.sort(byDateDesc);
  return grouped;
}
