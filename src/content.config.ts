import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { inspirationLoader } from '@/lib/inspirationLoader';
import { CATEGORIES } from '@/utils/content';

// 旧站约定：URL 为 /posts/<frontmatter 标题>，因此以标题作为条目 id
const generateIdFromTitle = ({
  entry,
  data,
}: {
  entry: string;
  data?: Record<string, unknown>;
}) => (data?.title ? String(data.title) : entry.replace(/\.md$/, ''));

const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  // 受控词表：见 src/utils/content.ts 的 CATEGORIES（写错会在构建期报错，
  // 而不是静默变成「未分类」——「关于」「随想」是保留分类，拼错会让页面静默失效）
  category: z.enum(CATEGORIES),
  tags: z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(z.string())),
  description: z.string().optional(),
});

// 「 blog-post/ 」目录：文章按年份子目录归档（2025/、2026/…）
// 分类为受控词表（src/utils/content.ts 的 CATEGORIES）：
//   关于（/about 自述页独占）、随想（/inspiration 火花流独占）、日志、随笔、笔记
const post = defineCollection({
  loader: glob({
    // 排除模板目录：`content/blog-post/templates/**` 里的 Obsidian 模板含 `<% tp.date.now() %>`
    // 之类占位符，被当文章读取会因日期校验失败而中断构建（2026-09-28）
    pattern: ['**/*.md', '!**/templates/**'],
    base: './content/blog-post',
    generateId: generateIdFromTitle,
  }),
  schema: postSchema,
});

// 「随想」分类按一级小节（## 标题）拆成的火花流
const inspiration = defineCollection({
  loader: inspirationLoader(),
  schema: z.object({
    title: z.string(),
    postTitle: z.string(),
    date: z.coerce.date(),
    category: z.enum(CATEGORIES),
    order: z.number(),
  }),
});

export const collections = { post, inspiration };
