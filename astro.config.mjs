import { defineConfig } from 'astro/config';

export default defineConfig({
  // Override both when the site moves, e.g. SITE_URL=https://doughpastries.cy BASE_PATH=/ npm run build
  site: process.env.SITE_URL ?? 'https://p4vlos.github.io',
  base: process.env.BASE_PATH ?? '/dough-pastries',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  image: { responsiveStyles: false },
});
