// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import { satteriEnhance } from './src/lib/satteriEnhance.ts';

// https://astro.build/config
export default defineConfig({
  // 站点线上地址（sitemap / RSS / canonical 依赖此项）
  // 部署到 GitHub Pages 项目站时改为 'https://<用户名>.github.io' 并添加 base: '/<仓库名>'
  site: 'https://rezero.vercel.app',

  integrations: [mdx(), sitemap()],

  markdown: {
    // Shiki 主题配置保留在 markdown 顶层（Astro 内部传给处理器）。
    // 旧站用 material-theme-lighter，但该主题 token 配色极浅（注释 #B0BEC5、
    // 默认前景 #90A4AE），在近白底色上模糊发白、难以阅读；github-light
    // 为对比度最高的经典浅色主题，token 均为深色系，可读性优先。
    shikiConfig: {
      theme: 'github-light',
    },
    // Astro 7 默认处理器为 Rust 版 Sätteri；关闭旧站未使用的 smartypants 以保持输出一致
    processor: satteri({
      // 构建期增强正文（图注 figure/figcaption、外链 rel、图片 loading），
      // 替代旧站的 rehype-external-links + 自定义 MDX Image 组件
      hastPlugins: [satteriEnhance],
      features: {
        smartPunctuation: false,
      },
    }),
  },

  vite: {
    plugins: [tailwindcss()],
    /*
     * 评论主题已改为运行时 data: URL 方案（Comment.astro 内联打包，
     * 不再依赖 giscus iframe 直接 fetch 本站资源）。静态资源仍统一开放 CORS，
     * 保持本地 dev / preview 与线上（GitHub Pages 等默认带 ACAO:*）行为一致，
     * 也为任何跨源取本站静态资源的场景兜底。
     */
    server: {
      headers: { 'Access-Control-Allow-Origin': '*' },
    },
    preview: {
      headers: { 'Access-Control-Allow-Origin': '*' },
    },
  },
});


