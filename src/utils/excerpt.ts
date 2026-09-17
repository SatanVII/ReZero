import type { CollectionEntry } from 'astro:content';

/**
 * 列表摘要（对应旧站 summary computed field 的简化版）：
 * 优先 frontmatter description，否则取正文第二行
 */
export const excerpt = (entry: CollectionEntry<'post'>): string => {
  if (entry.data.description) return entry.data.description;
  const lines = (entry.body ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[1] ?? lines[0] ?? '';
};
