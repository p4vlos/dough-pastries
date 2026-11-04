import menu from '../data/menu.json';

export type MenuItem = (typeof menu.categories)[number]['items'][number] & {
  desc?: { en: string; el?: string };
  size?: string;
  image?: boolean;
  popular?: boolean;
};

export type MenuCategory = Omit<(typeof menu.categories)[number], 'items'> & {
  note?: { en: string; el?: string };
  items: MenuItem[];
};

export const categories = menu.categories as MenuCategory[];
export const drinkCategories = categories.filter(({ layout }) => layout === 'list');
export const foodCategories = categories.filter(({ layout }) => layout === 'cards');

export const categoryById = (id: string) => categories.find((category) => category.id === id)!;

const items = categories.flatMap((category) => category.items);
export const itemById = (id: string) => items.find((item) => item.id === id)!;
