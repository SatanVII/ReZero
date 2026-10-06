/**
 * 导航激活态判定
 *
 * 2026-10-06 抽出，供 Side.astro / Header.astro（构建期）与 BaseLayout（客户端）
 * 三处共用。原先各处都写成「严格相等」：
 *     normalized === path
 * 这导致子路由不点亮父级导航项 —— 例如 `/archives/tag/冬天` 不会点亮「歸檔」。
 * 归档页引入多级路由（/archives/{tag,category,year}/…）后必须改为前缀匹配。
 *
 * 必须排除首页：归一化后首页 href 为空串，若参与前缀匹配，
 * 任何路径都会 startsWith('')，导致首页图标在全站误亮。
 */

/** 去掉结尾斜杠；根路径 '/' 归一为 '' */
export const normalizePath = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

/**
 * href 对应的导航项在当前 pathname 下是否应处于激活态。
 * 规则：完全相等，或 pathname 位于该 href 的子路径下。
 */
export const isNavActive = (href: string, pathname: string): boolean => {
  const target = normalizePath(href);
  const current = normalizePath(pathname);
  if (!target) return current === '';
  return current === target || current.startsWith(`${target}/`);
};
