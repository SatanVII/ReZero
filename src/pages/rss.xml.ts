import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/** RSS 订阅（旧站没有，属新增能力；@astrojs/rss 官方用法） */
export const GET: APIRoute = async (context) => {
  const posts = await getCollection('post');
  const notes = await getCollection('note');

  const items = [...posts, ...notes]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description ?? '',
      categories: entry.data.tags,
      link: `/posts/${entry.id}/`,
    }));

  return rss({
    title: '云山栖',
    description: '愿似飘飖五云影，从来从去九天间。',
    site: context.site ?? 'https://www.yun37.me',
    items,
    customData: '<language>zh-cn</language>',
  });
};
