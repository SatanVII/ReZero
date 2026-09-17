import type { HastPluginDefinition } from 'satteri';

/**
 * 正文 HTML 的构建期增强（Sätteri hast 插件）
 *
 * 对应旧站的 rehype-external-links + 自定义 MDX Image 组件。放在构建期做，
 * 页面运行时就不必再遍历 DOM 改结构：
 *   - <img>：补 loading="lazy" / decoding="async"；有 alt 的在其后插入图注
 *   - <a href="http(s)://...">：补 rel="nofollow noopener noreferrer"
 *
 * 图注用 <span class="img-caption">◭ alt</span> 兄弟节点，与旧站
 * components/MDX/Image.tsx 的输出一致（旧站也不是 figure/figcaption，
 * 而且图片在 Markdown 里会被包进 <p>，figure 嵌在 <p> 里是非法结构）。
 *
 * 之所以用 hast 插件而不是 markdown.rehypePlugins：本项目 markdown.processor 用的是
 * Sätteri（Rust 管线），它通过 satteri({ hastPlugins }) 扩展，不跑 unified 的 rehype 插件。
 */
export const satteriEnhance: HastPluginDefinition = {
  name: 'zero:enhance-prose',
  element: [
    {
      filter: ['img'],
      visit(node, ctx) {
        ctx.setProperty(node, 'loading', 'lazy');
        ctx.setProperty(node, 'decoding', 'async');

        const alt = node.properties?.alt;
        if (typeof alt !== 'string' || !alt.trim()) return;

        ctx.insertAfter(node, {
          type: 'element',
          tagName: 'span',
          properties: { className: ['img-caption'] },
          children: [{ type: 'text', value: `◭ ${alt}` }],
        });
      },
    },
    {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href === 'string' && /^https?:\/\//i.test(href)) {
          ctx.setProperty(node, 'rel', 'nofollow noopener noreferrer');
        }
      },
    },
  ],
};
