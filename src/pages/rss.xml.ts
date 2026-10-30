import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { EXCLUDED_CATEGORIES } from '@/utils/content';

/** RSS 订阅（旧站没有，属新增能力；@astrojs/rss 官方用法） */
export const GET: APIRoute = async (context) => {
  const items = (await getCollection('post'))
    /*
     * 与全站列表同一口径（2026-10-31）：归档、首页、标签页都排除
     * EXCLUDED_CATEGORIES（「关于」「随想」），RSS 原先没过滤，会把这两个
     * 非文章页往订阅器里推。它们本来就是站点固定页，不是「文章」。
     */
    .filter(({ data }) => !EXCLUDED_CATEGORIES.includes(data.category))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description ?? '',
      categories: entry.data.tags,
      link: `/posts/${entry.id}/`,
    }));

  return rss({
    title: '晴晝夢',
    description: '愿似飘飖五云影，从来从去九天间。',
    /*
     * `context.site` 来自 astro.config.mjs 的 `site`，正常构建恒有值，
     * 这里的兜底只防「site 未配置」时 rss() 拿到 undefined。
     * ⚠️ 兜底值必须与 astro.config.mjs 的 site 一致 —— 原值是旧站域名
     * https://www.yun37.me（2026-10-31 更正）。一旦真的走到兜底，整份 RSS 里的
     * 链接都会指向已经不存在的旧站。
     */
    site: context.site ?? 'https://rezero-five.vercel.app',
    items,
    customData: '<language>zh-cn</language>',
  });
};
