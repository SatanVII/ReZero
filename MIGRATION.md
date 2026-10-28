# 上游 ZERO 博客 → Astro 重构记录

旧站：Next.js 13 (App Router) + Contentlayer + TailwindCSS 3 + React
新站：**Astro 7**（零 React、零运行时框架 JS、静态输出）

上游仓库：[chanshiyucx/zero](https://github.com/chanshiyucx/zero)（MIT）。
本仓库是它的 Astro 重写版，不是移植或 fork。

## 结构树

```
Rezero-astro/
├── astro.config.mjs              # ① 骨架：site/MDX/sitemap/Sätteri+Shiki/Tailwind v4/redirects
├── tsconfig.json                 # ① strict + @/* 别名
├── scripts/
│   └── sync-content.mjs          # ② 内容同步（CONTENT_REPO git clone/pull，predev/prebuild 挂钩）
├── content/                      # ② 内容目录（子模块；blog-post 按年份归档 + IMAGES）
├── public/                       # ①⑥ favicon/giscus 主题 CSS/书影友链图/robots.txt
└── src/
    ├── content.config.ts         # ② post（glob loader，标题作 id）+ inspiration（自定义 loader）
    ├── lib/
    │   └── inspirationLoader.ts  # ② 「随想」按 ## 拆段 + renderMarkdown 预渲染
    ├── styles/global.css         # ③ Tailwind v4 入口 + 旧 globals.css 平移 + typography 变量 + 字体
    ├── data/                     # ①③ themes.ts（8 主题）/ book / friend / poetry JSON
    ├── utils/                    # ③ config（联系方式）/ content（分类词表）/ excerpt / nav（激活态）
    ├── components/               # ③⑤ 全部组件（零 React）
    │   ├── icons/                #    20 个 vendored SVG，全部来自 lucide-react@0.279
    │   ├── 布局相关：Header / Side / Panel / Site / Poetry / Butterfly /
    │   │             ShootingStar / TopProgress / SchemeToggle / ThemeStyles
    │   ├── 内容相关：PostList / ArchiveView / Comment(giscus)
    ├── layouts/
    │   └── BaseLayout.astro      # ③ head+OG / 字体 preload / ClientRouter / 主题系统 / 灯箱
    └── pages/                    # ④ 页面 + 404 + rss.xml
        ├── index / about / inspiration / book / friend
        ├── archives.astro + archives/{tag,category,year}/[...].astro
        ├── posts/[slug].astro    #    getStaticPaths，中文标题作 slug
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
| next/font (Google Noto Serif SC) | 仓库自带 TTF/OTF 子集 + `@font-face`（**本地字体**，零外部网络依赖） |
| template.tsx + react-photo-view | `<ClientRouter />` + 原生 `<dialog>` 灯箱 |
| next-sitemap | @astrojs/sitemap（构建期生成 sitemap-index.xml） |
| @giscus/react | giscus 官方 `<script>` 嵌入 + 主题 CSS 以 `data:` URL 注入 |
| rehype-external-links | 构建期 hast 插件 `satteriEnhance` 输出 |
| rehype-pretty-code | 内置 Shiki 双主题（github-light / github-dark，`astro-code` 类名） |
| lucide-react + @svgr/webpack | 全部图标 vendor 为 `src/components/icons/*.astro`（见关键决策 10） |

## 关键决策

1. **路线 B（更 Astro 化）**：默认 Sätteri 处理器 + 内置 Shiki + astro:assets；不引入 React/`@astrojs/react`；`remark-gfm` 删除（GFM 默认开启）。
2. **smartypants 关闭**：旧站没有标点替换，保持输出一致。
3. **中文 slug**：条目 id = frontmatter 标题，`/posts/中文标题/` 与旧站 URL 一致；percent-encoded 请求已验证 200。
4. **无限滚动 → 全量渲染**：五个列表页构建期渲染全部条目（个人博客体量下 SEO 与体验更优）。
5. **summary 简化**：description 或正文第二行，纯文本输出（原为客户端 MDX 渲染）。
6. **inspiration 顺序**：文章日期倒序 + 文内小节倒序（还原旧站 `list.reverse()`）。
7. **主题保持**：`astro:after-swap` 重放 CSS 变量（官方推荐的主题保持模式）；24h 过期与按访问次数轮换默认主题的逻辑原样保留。
8. **字体本地化**：旧站从 Google 拉 Noto Serif SC，现改为仓库自带字体文件（`src/assets/fonts/`）配 `@font-face`，构建/运行零外部网络依赖。当前站名字体是**郑庆科南北词宫谱宋体**（`--font-site` 首字 `ZQKNanBei`），正文用 LXGW 文楷分片。字体子集用 `fontTools.subset` 重建，命令见 `src/styles/global.css` 注释。
9. **Side.css 重建**：原文件含非法选择器（`side .nav svg` 少一个点，故旧站的 hover 放大其实是死规则），按旧站**线上实测值**重写。其中 `.nav svg`（图标框 20×24，`transform: translateX(-10px)`）在旧站是**全局**规则——Next.js 的组件级 CSS 不做作用域隔离，桌面侧栏与移动端顶栏共用同一套图标尺寸。因此新站刻意**不加 `.side` 前缀**，否则 Header 的图标会退回 `<svg>` 的 24px 属性值而偏大、图标与文字间距错位。
10. **图标 vendor（不再用 @lucide/astro）**：lucide 的图标几何随版本漂移——旧站固定 `lucide-react@0.279`，而 `@lucide/astro@1.46` 里我们**用到的 14 个图标有 13 个路径已改写**（`book-open`/`ghost`/`globe`/`heart-pulse`/`mail`/`scroll-text`/`send`/`book-marked`/`sparkles`…），`sparkles` 甚至会因为 `aliases:["stars"]` 渲染成 `lucide-stars`，品牌图标（`github`/`twitter`/`codepen`）则被整体移除。因此把用到的图标**全部**按 `lucide-react@0.279` 的几何 vendor 成静态 `.astro`（`src/components/icons/`，现为 **20 个**），并移除 `@lucide/astro` 依赖。
    - 每个文件保留旧站同款的 `<svg>` 属性序列与 `class="lucide lucide-<slug>"`，已与线上站渲染结果**逐字节比对通过**。
    - 生成方式：从 `unpkg.com/lucide-react@0.279.0/dist/esm/icons/<slug>.js` 取 `createLucideIcon` 的图元数组，按对象键序还原属性顺序。
    - 好处：图标几何与旧站锁死，不受上游版本影响；代价是新增图标需手工 vendor。
11. **giscus 主题自托管**：评论主题 CSS 在 `public/assets/styles/`，每个 `<theme>.css` 里原本 `@import url('https://www.yun37.me/assets/styles/comment.css')` —— 这是旧站（域名就是 yun37.me）的写法，自托管后会变成对外站域名的硬依赖。改为相对路径 `./comment.css`。当前实际注入方式已升级为**运行时抓取 CSS → 拼成 `data:` URL 传给 giscus**（见第 13 条与 `Comment.astro`）。
12. **评论区边框固定黑色**：`comment.css` 里 `--color-border-default` / `--color-border-muted` / `--color-accent-muted` / `--color-segmented-control-button-selected-border` 在旧站是固定浅灰 `#d0d7de`（在浅色纸质底上偏虚）。改动只落在 9 个 `<theme>.css` 里（`comment.css` 保持与旧站逐字节一致），把这 4 个**边框类**变量置为 `#000` —— 评论框外框、输入框、「输入 / 预览」标签页、分隔线一律黑色细线，**不随主题变化**；非边框部分（`--color-btn-primary-bg` / `--color-accent-fg` / `--color-accent-emphasis` / `--color-success-fg`）仍指向 `var(--<theme>-primary)`，登录按钮与强调色继续跟随主题。
    - giscus 的消费方式已实测确认：其 CSS 里 `* { border-color: var(--color-border-default,…) }`、`body *`、`.form-control`、`.Box`、`.color-label-border` 等**大量全局**引用这几个变量，所以只改这 4 个就能覆盖整个评论区框架；而 `.btn { border-color: var(--color-btn-border) }` 自带变量，因此登录按钮边框不受影响（保持 `rgba(31,35,40,.15)`）。
    - 验证方式：连 giscus 的 iframe target（OOPIF）读计算值 —— `form.gsc-comment-box` / `textarea` / 「输入」标签页在 Hutao 与 Nilou 下均为 `1px solid rgb(0, 0, 0)`，而登录按钮背景 `rgb(224,100,88)` → `rgb(116,181,219)`。
13. **本地 dev/preview 补 `Access-Control-Allow-Origin: *`**（`astro.config.mjs` 的 `vite.server.headers` / `vite.preview.headers`）：giscus 从 `https://giscus.app` 的 iframe 里以 **CORS 方式**取主题 CSS；线上托管（Vercel）对静态资源默认带该头，本地服务器不带，实测表现为主题整份被拦（`net::ERR_FAILED`）→ 评论框退回 giscus 默认样式（发白、字体与主题色全丢）。补头后本地与线上行为一致。
14. **`transition:persist` 必须写在元素上，不能写在普通 `.astro` 组件上**：写在 `<Side />` 这类组件标签上只会被当作 prop 丢掉，产物里不会出现 `data-astro-transition-persist`，持久化完全不生效。正确做法是写在组件**内部的根元素**上（`Side.astro` 的 `.side`、`Header.astro` 的 `.header`、`Cloud.astro` 的 `#weather-widget`）。
    - 由此换页时布局组件不再重建，对齐旧站 Next App Router 的持久 layout。
    - ⚠️ 但官方文档 "Maintaining State" 明确写了：**CSS 动画的重启在 view transition 期间无法避免，即使使用了 `transition:persist`**（元素被搬进新 DOM 时会被浏览器重启动画）。因此侧栏/底栏的常驻导航在 `Side.css` 里显式 `animation: none`，即本项的第 15 条。
15. **侧栏/底栏导航不做入场动画**：旧站 `Header/index.css` 的 `.nav { animation: zoomIn }` 是全局规则，桌面侧栏也会命中；但旧站 layout 常驻、侧栏 DOM 不重建，那个 zoomIn 只在整页首次加载时播一次。Astro 每次换页都会重启它，表现为 6 个侧栏图标 + 7 个底栏图标反复缩放闪现。故在 `Side.css` 加 `.side .nav { animation: none }`（优先级 `.side .nav` > `.nav`，与文件加载顺序无关），**Header 的 `.nav` 动画保留** —— 移动端下拉菜单正是靠 `display: none → flex` 重放它实现缩放弹出的（已实测）。
16. **运行时零开销化**：把能在构建期做的事全部前移，页面运行时只剩必要的交互监听器。重构完成时 JS 产物 **45.4KB → 16.4KB**（只剩 Astro 的 ClientRouter），HTML **38.3KB → 26.4KB**。后续随功能增加已变化，当前 `dist/_astro/` 下 JS 合计约 25KB、首页 HTML 约 43KB。
    | 原运行时行为 | 现方案 |
    |---|---|
    | AOS 库（~14KB）初始化 + 每次换页 `AOS.refresh()` + 小屏改 `data-aos` | 删除依赖。改为 `IntersectionObserver` + CSS `transition`（500ms / ease，参数逐字对照 `aos@2.3.4`）；挂在 `html.js` 下，无 JS 时不隐藏内容 |
    | typed.js（~10.7KB） | 删除依赖，改用 ~45 行无依赖实现（同样的速度/延迟/shuffle/loop，且按 HTML 逐字渲染以正确处理诗句里的 `<br>`） |
    | 主题配色：`data-theme-data` JSON（~2KB）塞进 `<body>` + `JSON.parse` + 逐个 `style.setProperty` | `ThemeStyles.astro` 构建期把 8 套主题编译成 `:root[data-theme='X']` CSS，运行时只往 `<html>` 写一个 `data-theme` |
    | 主题在 `DOMContentLoaded` 后才应用 → **首屏闪一下默认主题** | head 里 `is:inline` 脚本在首次绘制前定好主题，**消除 FOUC** |
    | 正文图注：每次页面加载遍历 DOM 建 `figure/figcaption` | 构建期 hast 插件直接输出（且改为与旧站 `MDX/Image.tsx` 一致的 `<span class="img-caption">`，旧站本来就不是 figure，何况图片在 Markdown 里被包进 `<p>`，figure 嵌 `<p>` 属非法结构） |
    | 正文外链 `rel`：每次加载遍历 `.prose a[href^=http]` | 构建期 hast 插件输出（旧站本来就是 `rehype-external-links`） |
    | 灯箱：`ensureLightbox()` 建 `<dialog>`（**该函数从未被调用，灯箱一直是坏的**） | `<dialog>` 改为构建期静态标记，运行时只留一个委托点击监听器 |
    | 图片渐显：逐张绑定 `load` 监听 | 一个文档级捕获监听器统一处理；并把 `opacity: 0` 收进 `.js` 作用域，脚本被禁用时图片照常可见 |
    | `clsx`（React 时代遗留，已无引用） | 移除 |
    - **hast 插件必须挂在 `satteri({ hastPlugins })` 上**：本项目 `markdown.processor` 是 Rust 版 Sätteri，不跑 unified 的 `markdown.rehypePlugins`。
    - ⚠️ **改 hast 插件后必须清 `.astro/` 与 `node_modules/.astro/` 再构建**：Markdown 渲染结果有缓存，插件变化不会让缓存失效（本次就被旧输出骗过一轮）。
    - ⚠️ **CSS 滚动动画若用 `animation` 简写，`animation-timeline` 会被合并进简写而失效**（Lightning CSS 行为）。本项目已改用 `IntersectionObserver` + `transition`，此条仅作历史备查。
    - ⚠️ **ClientRouter 换页会重置 `<html>` 的属性**：`data-theme` 与 `class` 都会被清掉，需在 `astro:after-swap` 里补回，否则每页都闪一下兜底主题、图片渐显开关也失效（已实测）。
    - ⚠️ 主题变量用 `:root[data-theme='X']` 而非 `[data-theme='X']`：`global.css` 的 `:root` 里有兜底默认值，同为 (0,1,0) 时会被文档顺序（`<link>` 在 `<style>` 之后）压掉。
17. **火花流的悬停滑动遮罩**：旧站 `app/inspiration/page.tsx` 用 `maskRef` + `calcMaskPos` / `handleMask` / `handleScroll` 驱动一块滑动遮罩（半透明底 + 左侧主题色竖条），悬停时平滑滑到当前条目。重构时这块**纯交互整块没搬** —— 而最容易误判的地方在于：`.mask` / `.mask:before` 的 CSS 规则早已复制进 `global.css`，**有样式、没人驱动**，静态比对（HTML + CSS）完全看不出问题，悬停却毫无反馈。已在 `inspiration.astro` 补回遮罩元素（class 与旧站逐字一致）并用原生事件委托驱动，零依赖；只写内联 `height` / `transform`（`translateY = article.offsetTop + .page 的上内边距`），滑动交给 CSS 的 `transition-all duration-300 ease-in-out`，故时长与缓动曲线天然与旧站相同。
    - 另加两处稳健性处理（不改变可见行为）：`ResizeObserver` 在条目因图片/字体延迟加载变高时重对齐（旧站只在 scroll 时重算）；`astro:page-load` 初始化前先解绑上一轮监听（换页后旧 DOM 已移除，否则 window/list 上的监听会累积）。
    - 说明：这是**必要的运行时成本**，无法构建期化 —— 悬停位置只有运行时才知道。脚本约 0.7KB，Astro 只把它内联进火花页 HTML，其他页面与 JS 产物体积不变。

18. **STORM 主题面板点击空白处关闭**：旧站 `components/Panel/index.tsx` 的 `<div className="overlay" onClick={togglePanle}>` 承接「点面板外任意空白关闭」；重构时 overlay 元素搬了、CSS 也一致（`.overlay` 全屏 + `.main` 为 `pointer-events:none`，空白点击全落到 overlay），但**没接监听器**，导致面板只能开不能关。已在 `Panel.astro` 补上事件委托：点击命中 `[data-panel-overlay]` 时给 `.panel` 加回 `hidden`。同样用 `elementFromPoint` 实测过：空白处命中 overlay、面板内点击（主题项）不会误关、ClientRouter 换页后依然有效。

19. **主题轮换语义（刷新换壁纸）**：旧站 `app/context.tsx` 的真实语义是 —— `viewCount` 每次完整加载 +1；`theme`/`theme-expire` **只在用户点选时写入**（24h 过期）；**从未点选的访客每次刷新都按 `viewCount % 8` 轮换壁纸**（轮换值不落盘，首访即胡桃）。重构时把轮换结果**立即落盘并续 24h**，把「默认轮换态」变成了「固定态」→ 未点选时刷新壁纸不再变化。已对齐：head 内联脚本过期/无效时只用旧 `count` 取轮换索引（先取索引再落 `count+1`），不写 `theme`/`theme-expire`。另有一个实测发现：**ClientRouter 换页会随新 head 重新执行 head 里的内联脚本**（会重复计数、推进轮换游标），用 `window.__themeBoot` 一次性标记挡住 —— 换页后的主题由 `astro:after-swap` 的补回机制维护。端到端 13/13：首访胡桃、连刷连换、点选落盘保持、过期回到轮换态、过期态点选重新保持、点击换页（非 reload）主题与计数都不动。

20. **meta 行图标间距失效（文章/列表的日期栏标签栏挤在一起）**：旧站 lucide-react 的 `<Calendar className="mr-1" />` 会把 className **合并**进 svg；重构的内联图标组件把 `class="lucide lucide-xxx"` **写死**、外部 class 被丢弃 → `.meta` 里 3 个图标的 `mr-1`/`ml-4` 全部静默失效（CDP 实测 margin 全 0），日期/分类/标签与图标紧贴。现已让全部 20 个图标统一用 `class:list={["lucide lucide-xxx", Astro.props.class]}` 透传。正文（prose）间距实测与旧站一致（p 20px、blockquote 1.6em、img mt32/mb16、li 8px），未动。

## 行为差异（有意为之）

- 列表分页：无（全量渲染）
- 图片灯箱：原生 `<dialog>`，无缩放手势（原 react-photo-view 支持滚轮/触摸缩放）
- 图片加载 Spinner：移除，改为渐显 + 灯箱
- **天气组件已整体移除**（原 `Cloud.astro` 及其 6 个天气图标已删，全站无天气请求）。
- 列表入场动画：`IntersectionObserver` + CSS `transition` 实现 AOS 等价效果；无 JS 时内容直接显示。
- 控制台彩蛋文案改为本站信息

## 内容仓库接入

```bash
CONTENT_REPO=https://github.com/<user>/<blog>.git npm run content:sync
# predev / prebuild 已自动挂载同步
```

## 部署

推送 `main` 后由 Vercel 自动构建部署，无需手动操作：

```bash
git push origin main
```

- 内容仓推送后由 `.github/workflows/content-dispatch.yml` 收到 `repository_dispatch` 事件，
  自动 bump `content` 子模块指针并 push，从而触发 Vercel 重建。
- 站点地址集中在 `astro.config.mjs` 的 `site` 字段（sitemap / RSS / canonical 依赖它）。
