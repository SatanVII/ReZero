/**
 * 内容分类的受控词表（2026-10-06 起）
 *
 * 分类是**单值**字段，承担顶层结构；与自由的 `tags`（多值）分工不同。
 * 用 enum 而非 `z.string()` 的原因：「关于」「随想」是**保留分类**，被代码硬依赖
 * （见下方 EXCLUDED_CATEGORIES）。若分类可随意填写，拼错会**静默失效** ——
 * 构建不报错，自述页渲染空白、火花流消失。enum 让拼错在构建期直接失败。
 *
 * 新增分类 = 在 CATEGORIES 里加一项（一次显式决定，而不是随手输入）。
 */
export const CATEGORIES = ['关于', '随想', '日志', '随笔', '笔记'] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * 不进常规文章流的分类（必须是 CATEGORIES 的子集）
 *
 * 「关于」由 /about 自述页独占（渲染最新一篇「关于」文章）；
 * 「随想」由 /inspiration 隨想流独占（inspirationLoader 把正文按 `##` 拆成火花流）。
 * 两者都不进首页文章列表，归档页的**三个维度（标签 / 分类 / 时间线）也一律排除**。
 *
 * 抽成独立模块的原因：`getStaticPaths` 在构建期会被抽成单独模块执行，
 * **取不到 .astro frontmatter 作用域的变量**，因此这类共享常量必须可被 import。
 */
export const EXCLUDED_CATEGORIES: readonly Category[] = ['关于', '随想'];
