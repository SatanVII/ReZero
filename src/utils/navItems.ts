/**
 * 侧栏 / 顶栏共用的导航项 —— **唯一数据源**。
 *
 * 2026-10-31 抽出：此前 `Side.astro` 与 `Header.astro` 各写一份 6 项 navItems
 * （href / name / Icon 完全相同），改文案或换图标必须两处同改，漏改过一次。
 *
 * ⚠️ 本模块 import 了 .astro 图标组件，**只能给构建期模板用**。
 *    `BaseLayout.astro` 的客户端 `<script>` 请继续用 `@/utils/nav` 的 isNavActive
 *    —— 那个模块是纯函数、零组件依赖，不会把图标组件拖进客户端 bundle。
 *
 * 导航文案（繁体，与站名一致）：文章 / 隨想 / 歸檔 / 書閣 / 友鄰 / 自述。
 * 图标几何取自 src/components/icons（lucide-react@0.279 vendor，共 20 个）。
 * 新增/删除导航项时，MIGRATION.md 的路由清单也要同步。
 */
import BookOpen from '@/components/icons/BookOpen.astro';
import Codepen from '@/components/icons/Codepen.astro';
import Ghost from '@/components/icons/Ghost.astro';
import HeartPulse from '@/components/icons/HeartPulse.astro';
import ScrollText from '@/components/icons/ScrollText.astro';
import Sparkles from '@/components/icons/Sparkles.astro';

export const navItems = [
  { href: '/', name: '文章', Icon: ScrollText },
  { href: '/inspiration', name: '隨想', Icon: Sparkles },
  { href: '/archives', name: '歸檔', Icon: Codepen },
  { href: '/book', name: '書閣', Icon: BookOpen },
  { href: '/friend', name: '友鄰', Icon: HeartPulse },
  { href: '/about', name: '自述', Icon: Ghost },
];
