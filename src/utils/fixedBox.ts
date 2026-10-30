/**
 * 量 `position: fixed` 的包含块左右边界（客户端模块）。
 *
 * 站点在 `:root` 开了 `scrollbar-gutter: stable both-edges`（左右各留一条排水沟），
 * 于是 fixed 元素的包含块比 `getBoundingClientRect()` 的坐标系内缩了一段
 * （桌面实测 5px）：`left: 464px` 实际会画在 x=469。直接拿元素 rect 去写
 * `left` / `right` 就会整体偏移，所以先用一个零尺寸探针量出 fixed 坐标系的实际边界。
 *
 * 2026-10-31 抽出：`TocBall.astro` 与 `BackTop.astro` 各自实现过一份
 * （一个建两个探针、一个改两次 style，行为等价），偏移量一旦变了两处都得改。
 *
 * ⚠️ 必须在 `document.body` 已存在后调用；探针在 `finally` 里移除，不会残留。
 */
export interface FixedBounds {
  /** fixed 坐标系左边界（通常 0） */
  left: number;
  /** fixed 坐标系右边界（通常 = 视口宽 − 右侧排水沟） */
  right: number;
}

export const measureFixedBounds = (): FixedBounds => {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none';
  document.body.append(probe);
  try {
    const { left } = probe.getBoundingClientRect();
    // 同一个元素改到 right:0 再量一次，比建两个探针少一次 DOM 操作
    probe.style.left = 'auto';
    probe.style.right = '0';
    const { right } = probe.getBoundingClientRect();
    return { left, right };
  } finally {
    probe.remove();
  }
};
