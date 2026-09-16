// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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

  // Fonts API（astro >= 6 稳定）：全部走本地字体，构建期与运行时零外部网络依赖
  fonts: [
    {
      // 旧站经 next/font 从 Google 拉取 Noto Serif SC w500；此处使用仓库自带的 Regular 本地文件
      provider: fontProviders.local(),
      name: 'Noto Serif SC',
      cssVariable: '--font-serif',
      options: {
        variants: [
          {
            weight: '400',
            style: 'normal',
            src: ['./src/assets/fonts/NotoSerifSC-Regular.otf'],
          },
        ],
      },
    },
    {
      // 站名专用字体（流云快哉）
      provider: fontProviders.local(),
      name: 'Liu Yun Kuai Zai',
      cssVariable: '--font-site',
      options: {
        variants: [
          {
            weight: '400',
            style: 'normal',
            src: ['./src/assets/fonts/liuyunkuaizai.ttf'],
          },
        ],
      },
    },
  ],

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


