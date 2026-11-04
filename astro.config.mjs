import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://p4vlos.github.io',
  base: '/dough-pastries',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  image: { responsiveStyles: false },
});
