/**
 * 主题背景图为 8% 透明度的全屏装饰图，无需 astro:assets 优化管线；
 * 用 Vite 原生 ?url 导入，保证 dev/build 都稳定产出资源 URL。
 */
import Slate from '@/assets/images/slate.webp?url';
import Lilac from '@/assets/images/lilac.webp?url';
import Indigo from '@/assets/images/indigo.webp?url';
import Coral from '@/assets/images/coral.webp?url';
import Mauve from '@/assets/images/mauve.webp?url';
import Sage from '@/assets/images/sage.webp?url';
import Azure from '@/assets/images/azure.webp?url';
import Terracotta from '@/assets/images/terracotta.webp?url';

export type ThemeType =
  | 'Coral'
  | 'Sage'
  | 'Azure'
  | 'Indigo'
  | 'Mauve'
  | 'Slate'
  | 'Terracotta'
  | 'Lilac';

export interface Theme {
  type: ThemeType;
  name: string;
  description: string;
  color: {
    primary: string;
    background: string;
  };
  image: string;
  url: string;
}

/** hex → rgba（替代旧站 color 库，仅用于色块底色的 30% 透明度） */
export const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 旧站 utils/theme.ts 的主题列表（Keqing 已在旧版注释停用，2026-10-01 连同其余角色名标识一并清理）
// 逻辑 ID 由角色名改为色名，与配色语义对齐；中文主题名与配色值保持不变。
const themes: Theme[] = [
  {
    type: 'Coral',
    name: '朔日手记',
    description: 'Notes on Shuòrì',
    color: { primary: '#E06458', background: '#FCFAF2' },
    image: Coral,
    url: 'https://www.bilibili.com/video/BV1tT4y187zp/',
  },
  {
    type: 'Sage',
    name: '春风有信',
    description: 'Moonlight Grows',
    color: { primary: '#7EA08A', background: '#F3F7F2' },
    image: Sage,
    url: 'https://www.bilibili.com/video/BV1Kw411F79h/',
  },
  {
    type: 'Azure',
    name: '具象之外',
    description: 'Transcends All Matters',
    color: { primary: '#74B5DB', background: '#DBEAF1' },
    image: Azure,
    url: 'https://www.bilibili.com/video/BV1sh4y1z7JB/',
  },
  {
    type: 'Indigo',
    name: '遥远来客',
    description: 'Galaxy On The Strings',
    color: { primary: '#5260A6', background: '#E2E5F5' },
    image: Indigo,
    url: 'https://www.bilibili.com/video/BV1Uy4y1c78E/',
  },
  {
    type: 'Mauve',
    name: '交于坠星',
    description: 'पंख की ओर यात्रा मोर',
    color: { primary: '#BF9997', background: '#F2E1DC' },
    image: Mauve,
    url: 'https://www.bilibili.com/video/BV1z34y1K7s9/',
  },
  {
    type: 'Slate',
    name: '行至日暮',
    description: 'Cantabile',
    color: { primary: '#8996B2', background: '#D8E2EC' },
    image: Slate,
    url: 'https://www.bilibili.com/video/BV1Ea4y157HT/',
  },
  {
    type: 'Terracotta',
    name: '诗篇以外',
    description: 'Beyond Poems',
    color: { primary: '#C15C42', background: '#F3E8DB' },
    image: Terracotta,
    url: 'https://www.bilibili.com/video/BV1BV4y1C7tJ/',
  },
  {
    type: 'Lilac',
    name: '心向天灯',
    description: 'E lucevan le stelle',
    color: { primary: '#8C78B0', background: '#E3DBED' },
    image: Lilac,
    url: 'https://www.bilibili.com/video/BV1nF4m1j7MR/',
  },
];

/** 主题名列表（首屏防闪脚本按访问次数轮换默认主题时用） */
export const themeTypes: ThemeType[] = themes.map((t) => t.type);

export default themes;
