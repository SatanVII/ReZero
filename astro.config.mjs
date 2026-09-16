// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';

// https://astro.build/config
export default defineConfig({
  // 站点线上地址（sitemap / RSS / canonical 依赖此项）
  // 部署到 GitHub Pages 项目站时改为 'https://<用户名>.github.io' 并添加 base: '/<仓库名>'
  site: 'https://www.yun37.me',

  integrations: [mdx(), sitemap()],

  markdown: {
    // Shiki 主题配置保留在 markdown 顶层（Astro 内部传给处理器）
    shikiConfig: {
      theme: 'material-theme-lighter',
    },
    // Astro 7 默认处理器为 Rust 版 Sätteri；关闭旧站未使用的 smartypants 以保持输出一致
    processor: satteri({
      features: {
        smartPunctuation: false,
      },
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});


