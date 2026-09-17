import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { inspirationLoader } from '@/lib/inspirationLoader';

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
  category: z.string(),
  tags: z.array(z.string()),
  description: z.string().optional(),
});

// 「 blog-post/ 」目录：文章按年份子目录归档（2024/、2025/…），
// 分类沿用原站约定（观云碎月/一心净土/藏星/碎月/随笔等）
const post = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content/blog-post',
    generateId: generateIdFromTitle,
  }),
  schema: postSchema,
});

// 笔记与 post 同源加载（同一批文件，URL /note 仅取 category === 'Note'）。
// 原「 computer-science/ 」目录已从内容仓库移除，Note 分类的文章暂缺，/note 页为空列表。
const note = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content/blog-post',
    generateId: generateIdFromTitle,
  }),
  schema: postSchema,
});

// 「一心净土」分类按一级小节（## 标题）拆成的火花流
const inspiration = defineCollection({
  loader: inspirationLoader(),
  schema: z.object({
    title: z.string(),
    postTitle: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    order: z.number(),
  }),
});

export const collections = { post, note, inspiration };
