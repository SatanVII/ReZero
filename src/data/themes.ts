/**
 * 主题背景图为 8% 透明度的全屏装饰图，无需 astro:assets 优化管线；
 * 用 Vite 原生 ?url 导入，保证 dev/build 都稳定产出资源 URL。
 */
import Ayaka from '@/assets/images/Vertin.png?url';
import Beelzebul from '@/assets/images/Night.jpg?url';
import Ganyu from '@/assets/images/voyager2.jpg?url';
import Hutao from '@/assets/images/qu2.jpg?url';
import Kokomi from '@/assets/images/kaalaa3.jpg?url';
import Nahida from '@/assets/images/Spring.jpg?url';
import Nilou from '@/assets/images/37.jpg?url';
import Yoimiya from '@/assets/images/Sonetto.jpg?url';

export type ThemeType =
  | 'Hutao'
  | 'Nahida'
  | 'Nilou'
  | 'Ganyu'
  | 'Kokomi'
  | 'Ayaka'
  | 'Yoimiya'
  | 'Beelzebul';

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

// 旧站 utils/theme.ts 的主题列表（Keqing 已在旧版注释停用，随之移除）
const themes: Theme[] = [
  {
    type: 'Hutao',
    name: '朔日手记',
    description: 'Notes on Shuòrì',
    color: { primary: '#E06458', background: '#FCFAF2' },
    image: Hutao,
    url: 'https://www.bilibili.com/video/BV1tT4y187zp/',
  },
  {
    type: 'Nahida',
    name: '春风有信',
    description: 'Moonlight Grows',
    color: { primary: '#7EA08A', background: '#F3F7F2' },
    image: Nahida,
    url: 'https://www.bilibili.com/video/BV1Kw411F79h/',
  },
  {
    type: 'Nilou',
    name: '具象之外',
    description: 'Transcends All Matters',
    color: { primary: '#74B5DB', background: '#DBEAF1' },
    image: Nilou,
    url: 'https://www.bilibili.com/video/BV1sh4y1z7JB/',
  },
  {
    type: 'Ganyu',
    name: '遥远来客',
    description: 'Galaxy On The Strings',
    color: { primary: '#5260A6', background: '#E2E5F5' },
    image: Ganyu,
    url: 'https://www.bilibili.com/video/BV1Uy4y1c78E/',
  },
  {
    type: 'Kokomi',
    name: '交于坠星',
    description: 'पंख की ओर यात्रा मोर',
    color: { primary: '#BF9997', background: '#F2E1DC' },
    image: Kokomi,
    url: 'https://www.bilibili.com/video/BV1z34y1K7s9/',
  },
  {
    type: 'Ayaka',
    name: '行至日暮',
    description: 'Cantabile',
    color: { primary: '#8996B2', background: '#D8E2EC' },
    image: Ayaka,
    url: 'https://www.bilibili.com/video/BV1Ea4y157HT/',
  },
  {
    type: 'Yoimiya',
    name: '诗篇以外',
    description: 'Beyond Poems',
    color: { primary: '#C15C42', background: '#F3E8DB' },
    image: Yoimiya,
    url: 'https://www.bilibili.com/video/BV1BV4y1C7tJ/',
  },
  {
    type: 'Beelzebul',
    name: '心向天灯',
    description: 'E lucevan le stelle',
    color: { primary: '#8C78B0', background: '#E3DBED' },
    image: Beelzebul,
    url: 'https://www.bilibili.com/video/BV1nF4m1j7MR/',
  },
];

export default themes;
