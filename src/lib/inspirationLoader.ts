import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Loader, LoaderContext } from 'astro/loaders';

const POST_DIR = path.resolve('content/blog-post');
// 仅「随想」分类的文章参与火花流
const INSPIRATION_CATEGORY = '随想';

/**
 * 自定义内容 loader：把「随想」文章正文按一级小节（## 标题）拆成独立条目，
 * 并用 LoaderContext 官方 renderMarkdown() 预渲染（走完整 Markdown 管线，GFM/Shiki 生效）。
 *
 * 对应旧站 contentlayer 的 inspiration computed field（mdx-bundler 编译）。
 */
export function inspirationLoader(): Loader {
  const syncCollection = async ({
    store,
    parseData,
    generateDigest,
    renderMarkdown,
    logger,
  }: LoaderContext) => {
    if (!fs.existsSync(POST_DIR)) {
      logger.warn(`目录不存在：${POST_DIR}（先运行 npm run content:sync）`);
      return;
    }

    store.clear();

    const walk = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((item) =>
          item.isDirectory() ? walk(path.join(dir, item.name)) : path.join(dir, item.name),
        );

    const files = walk(POST_DIR).filter((file) => file.endsWith('.md'));

    for (const file of files) {
      const raw = fs.readFileSync(file, 'utf-8');
      const { data, content } = matter(raw);
      if (data.category !== INSPIRATION_CATEGORY) continue;

      // 与旧站一致：按「## 」拆段，过滤纯空白段；段内首行是标题
      // order 保留文档顺序（0 = 第一个小节），页面按 order 倒序渲染，实现旧站 list.reverse() 的文内倒序
      const sections = content
        .split('## ')
        .filter((section) => section.replace(/[\r\n]/g, '').length > 0)
        .map((section) => {
          const newlineIndex = section.indexOf('\n');
          const title = newlineIndex === -1 ? section : section.slice(0, newlineIndex);
          const body = newlineIndex === -1 ? '' : section.slice(newlineIndex + 1);
          return { title: title.trim(), body: body.trim() };
        });

      for (const [index, section] of sections.entries()) {
        const id = `${data.title}/${section.title}`;
        const parsed = await parseData({
          id,
          data: {
            title: section.title,
            postTitle: String(data.title),
            date: data.date,
            category: String(data.category),
            order: index,
          },
        });
        store.set({
          id,
          data: parsed,
          rendered: await renderMarkdown(section.body),
          digest: generateDigest(`${raw}#${index}`),
        });
      }
    }
  };

  return {
    name: 'inspiration-loader',
    load: async (context) => {
      const { watcher, renderMarkdown } = context;
      if (!renderMarkdown) {
        throw new Error('当前 Astro 版本的 LoaderContext 不支持 renderMarkdown()（需要 astro >= 5.9.0）');
      }
      // dev 模式：内容文件变化时重建集合
      watcher?.on('all', (_event, filePath) => {
        if (filePath.startsWith(POST_DIR) && filePath.endsWith('.md')) {
          void syncCollection(context);
        }
      });
      await syncCollection(context);
    },
  } satisfies Loader;
}
