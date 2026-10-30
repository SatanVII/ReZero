import { isNavActive } from '../utils/nav';

/**
 * 同步导航激活态（客户端模块）。
 *
 * Side / Header 的节点被 ClientRouter 的 `transition:persist` 保留，换页后 DOM 不重建、
 * 类也不会自动跟着变，所以每次 `astro:page-load` 都要重算一遍。
 *
 * 2026-10-31 从 `BaseLayout.astro` 的 `<script>` 里拆出，理由同上：让那份 script
 * 只留主题/夜间模式这类必须在首帧前后就位的逻辑，导航高亮属于纯粹的「换页后补一次」。
 */
export const updateActiveNav = () => {
  document.querySelectorAll('.nav a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    // 占位社交链接（twitter/telegram/music，config 里为空串）在旧站从不参与激活态；
    // 若参与，首页 pathname 归一化后也是空串，会把它们误标成主题色
    if (!href) {
      a.classList.remove('active');
      return;
    }
    // 2026-10-06：由「严格相等」改为 isNavActive（相等或子路径）。
    // 归档页引入 /archives/{tag,category,year}/… 多级路由后，
    // 严格相等会导致子路由不点亮「歸檔」图标。
    a.classList.toggle('active', isNavActive(href, location.pathname));
  });
};
