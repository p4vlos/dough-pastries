export type Lang = 'en' | 'el';
export type Localised = { en: string; el?: string };
export type PageId = 'home' | 'menu' | 'occasions' | 'visit';

const PAGE_PATHS: Record<PageId, string> = {
  home: '',
  menu: 'menu/',
  occasions: 'occasions/',
  visit: 'visit/',
};

/** Every page exists twice: English at the root and Greek under /el/. */
export const languagePaths = () => [
  { params: { lang: undefined }, props: { lang: 'en' as Lang } },
  { params: { lang: 'el' }, props: { lang: 'el' as Lang } },
];

export const loc = (value: Localised, lang: Lang) => value[lang] ?? value.en;

const base = () => import.meta.env.BASE_URL.replace(/\/?$/, '/');

export const pageUrl = (page: PageId, lang: Lang, hash = '') =>
  `${base()}${lang === 'el' ? 'el/' : ''}${PAGE_PATHS[page]}${hash}`;

export const assetUrl = (path: string) => `${base()}${path}`;

export const money = (amount: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'el' ? 'el-GR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
