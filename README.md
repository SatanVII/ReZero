# 晴晝夢

个人博客「晴晝夢」。基于 [Astro](https://astro.build/) 7 + Tailwind CSS v4，TypeScript，纯静态输出。

## 源头

本站的版式与交互源自 [**chanshiyucx/zero**](https://github.com/chanshiyucx/zero)
本仓库是它的 Astro 重写版：渲染管线换成 Astro + Sätteri，组件与数据结构重新组织。

## 命令

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 开发服务器（`predev` 先同步内容） |
| `npm run build` | 构建到 `dist/`（`prebuild` 先同步内容） |
| `npm run preview` | 本地预览构建产物 |
| `npm run check` | `astro check`，类型与模板诊断 |
| `npm run content:sync` | 手动同步内容（拉取 + 镜像图片） |

## 内容

文章来自独立内容仓库，默认读取本地 `content/`：

- `content/blog-post/` 文章目录，按年份分 `2025/`、`2026/` 等子目录，
  `about.md`、`inspiration.md` 两个保留分类直接放在 `blog-post/` 根下。
  frontmatter 字段：`title` / `date` / `category` / `tags` / `description`
- `content/IMAGES/` 图片源，构建前镜像到 `public/IMAGES/`

分类为 **关于 / 随想 / 日志 / 随笔 / 笔记**（见 `src/utils/content.ts`），其中前两类是保留分类：

- **关于** —— 由 `/about` 自述页独占
- **随想** —— 由 `/inspiration` 隨想流独占，正文按一级小节（`## `）自动拆成火花流
- 其余三类进首页文章列表与归档

这两类不进文章列表和归档（`EXCLUDED_CATEGORIES`）。分类写错会在构建期直接失败，不会静默降级。

正文图片一律写成 `/IMAGES/<文件名>`（根路径）。写成 `IMAGES/x`、`../IMAGES/x` 或裸文件名都会触发构建失败。

接入远程内容仓库：

```bash
CONTENT_REPO=https://github.com/<user>/<blog>.git npm run content:sync
```

未设置 `CONTENT_REPO` 时直接使用本地 `content/`，只同步图片。

## 部署

推送 `main` 后由 Vercel 自动构建部署，无需手动操作。

```bash
git push origin main
```

站点地址在 `astro.config.mjs` 的 `site` 字段，sitemap、RSS、canonical 都依赖它。

## 文档

迁移细节与历史决策见 [MIGRATION.md](./MIGRATION.md)。
