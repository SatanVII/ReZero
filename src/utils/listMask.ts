/**
 * 「悬停跟随遮罩」的对齐工具（客户端模块）。
 *
 * 首页文章列表（`PostList.astro`）与隨想流（`inspiration.astro`）都用同一套视觉：
 * 一个绝对定位的框在条目之间滑动，鼠标悬停哪条就移到哪条。
 *
 * 折行前提（改结构前必读）：遮罩是 `.page` 的绝对定位子元素，`top:0` 贴它的
 * padding box 顶边；而 `item.offsetTop` 是相对**列表容器**（`.relative`）的。
 * 两者差一个「列表容器相对 `.page` 的偏移」，所以必须补 `list.offsetTop`。
 *
 * 2026-10-06 的历史教训：`inspiration.astro` 原先用 `getComputedStyle(page).paddingTop`
 * 补这个差值，那公式只在「列表容器之上没有其它流内元素」时成立 —— 归档子视图在列表
 * 上方加了面包屑/维度标题（PostList 的头部槽）后就整体偏高一个头部的高度。
 * `list.offsetTop` 天然包含 `.page` 的响应式上内边距（py-24 → lg:py-16）与头部槽高度，
 * 跨断点也不需要重新读 padding。2026-10-31 两处统一到这里。
 */
export const moveListMask = (
  mask: HTMLElement,
  item: HTMLElement,
  list: HTMLElement,
): void => {
  const height = `${item.offsetHeight}px`;
  const transform = `translateY(${item.offsetTop + list.offsetTop}px)`;
  // 早退守卫：位置不变就不重复写样式（mouseover 是高频事件）
  if (mask.style.height === height && mask.style.transform === transform) return;
  mask.style.height = height;
  mask.style.transform = transform;
};
