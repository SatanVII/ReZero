# 云山栖 · Astro 版

基于 [Astro](https://astro.build/) 重构的个人博客（原 Next.js + Contentlayer 版本见 zero-master）。

## 命令

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 开发服务器（自动同步内容） |
| `npm run build` | 构建到 `dist/`（自动同步内容） |
| `npm run preview` | 本地预览构建产物 |
| `npm run check` | Astro + TypeScript 诊断 |
| `npm run content:sync` | 手动同步内容仓库 |

## 内容

文章来自独立内容仓库，默认读取本地 `content/`：

- `content/blog-post/<年份>/` 文章（观云碎月 / 灵感 / 日志 / 随笔）

接入远程内容仓库：

```bash
CONTENT_REPO=https://github.com/<user>/<blog>.git npm run content:sync
```

「灵感」分类的文章会按一级小节（`## `）自动拆成火花流。

## 部署

本地构建后把 `dist/` 推到 `gh-pages` 分支，GitHub Pages 选择 Deploy from a branch：

```bash
npm run build && npx gh-pages -d dist
```

自定义域名配置见 `public/CNAME`。迁移细节与决策记录见 [MIGRATION.md](./MIGRATION.md)。
