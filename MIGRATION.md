# ZERO 博客 → Astro 重构记录

旧站：Next.js 13 (App Router) + Contentlayer + TailwindCSS 3 + React
新站：**Astro 7**（零 React、零运行时框架 JS、静态输出）

## 七部分结构树

```
zero-astro/
├── astro.config.mjs              # ① 骨架：site/MDX/sitemap/Sätteri+Shiki/Tailwind v4/Fonts API
├── tsconfig.json                 # ① strict + @/* 别名
├── scripts/
│   └── sync-content.mjs          # ② 内容同步（CONTENT_REPO git clone/pull，predev/prebuild 挂钩）
├── content/                      # ② 内容目录（不入库；wandering-clouds + computer-science）
├── public/                       # ①⑥ favicon/giscus 主题 CSS/书影友链图/CNAME/robots.txt
└── src/
    ├── content.config.ts         # ② post/note（glob loader，标题作 id）+ inspiration（自定义 loader）
    ├── lib/
    │   └── inspirationLoader.ts  # ② 「一心净土」按 ## 拆段 + renderMarkdown 预渲染
    ├── styles/global.css         # ③ Tailwind v4 入口 + 旧 globals.css 平移 + typography 变量
    ├── data/                     # ①③ themes.ts（8 主题）/ book / friend / poetry JSON
    ├── utils/                    # ③ config（联系方式）/ excerpt（列表摘要）
    ├── components/               # ③⑤ 全部组件（零 React）
    │   ├── icons/                #    天气 SVG ×6 + Github 内联（lucide 移除了品牌图标）
    │   ├── BaseLayout 相关：Header / Side / Panel / Site / Poetry / Cloud /
    │   │                    ShootingStar / Butterfly / Comment(giscus) / PostList
    ├── layouts/
    │   └── BaseLayout.astro      # ③ head+OG / Fonts / ClientRouter / 主题系统 / 灯箱 / AOS
    └── pages/                    # ④ 11 页 + 404 + rss.xml
        ├── index / about / article / note / stars / moon / inspiration
        ├── posts/[slug].astro    #    getStaticPaths，中文标题作 slug
        ├── book / friend / project / 404
        └── rss.xml.ts            # ⑥ 新增 RSS
```

## 概念映射

| 旧站 | 新站 |
|---|---|
| contentlayer + mdx-bundler | Content Layer：`glob()` loader + `renderMarkdown()` |
| `allPosts` / `useMDXComponent(code)` | `getCollection()` / `render()`（构建期渲染） |
| inspiration computed field | 自定义 loader，官方 `renderMarkdown()` 预渲染 HTML |
| `'use client'` 组件 ×15 | `.astro` 模板 + 原生 `<script>`（TS、打包、去重、astro:page-load） |
| next/image | astro:assets / public 原样 |
| next/font (Google Noto Serif SC) | Astro Fonts API（**本地字体**，零外部网络依赖） |
| template.tsx + react-photo-view | `<ClientRouter />` + 原生 `<dialog>` 灯箱 |
| next-sitemap | @astrojs/sitemap（构建期生成 sitemap-index.xml） |
| @giscus/react | giscus 官方 `<script>` 嵌入 + postMessage 换肤 |
| rehype-external-links | page-load 脚本补 `rel="nofollow noopener noreferrer"` |
| rehype-pretty-code | 内置 Shiki（material-theme-lighter，`astro-code` 类名） |
| lucide-react + @svgr/webpack | @lucide/astro + 内联 SVG 组件 |

## 关键决策

1. **路线 B（更 Astro 化）**：默认 Sätteri 处理器 + 内置 Shiki + astro:assets；不引入 React/`@astrojs/react`；`remark-gfm` 删除（GFM 默认开启）。
2. **smartypants 关闭**：旧站没有标点替换，保持输出一致。
3. **中文 slug**：条目 id = frontmatter 标题，`/posts/中文标题/` 与旧站 URL 一致；percent-encoded 请求已验证 200。
4. **无限滚动 → 全量渲染**：五个列表页构建期渲染全部条目（个人博客体量下 SEO 与体验更优）。
5. **summary 简化**：description 或正文第二行，纯文本输出（原为客户端 MDX 渲染）。
6. **inspiration 顺序**：文章日期倒序 + 文内小节倒序（还原旧站 `list.reverse()`）。
7. **主题保持**：`astro:after-swap` 重放 CSS 变量（官方推荐的主题保持模式）；24h 过期与按访问次数轮换默认主题的逻辑原样保留。
8. **字体本地化**：Noto Serif SC（旧站从 Google 拉取）改用仓库自带 Regular 本地文件，构建/运行零外部网络依赖；删除 5 个旧代码从未引用的遗留字体。
9. **Side.css 重建**：原文件已损坏（大量无效 @apply 类、非法选择器），按视觉意图重写。

## 行为差异（有意为之）

- 列表分页：无（全量渲染）
- 图片灯箱：原生 `<dialog>`，无缩放手势（原 react-photo-view 支持滚轮/触摸缩放）
- 图片加载 Spinner：移除，改为渐显 + 灯箱
- 控制台彩蛋文案改为本站信息

## 内容仓库接入

```bash
CONTENT_REPO=https://github.com/<user>/<blog>.git npm run content:sync
# predev / prebuild 已自动挂载同步
```

## 部署（本地构建 → GitHub）

```bash
npm run build            # 产物 dist/
npx gh-pages -d dist     # 推送到 gh-pages 分支
# GitHub Settings → Pages → Source: Deploy from a branch → gh-pages /(root)
# 自定义域名已放 public/CNAME（www.yun37.me）
```
