# Dough Pastries: concept website

A demo website for [Dough Pastries](https://doughpastries.cy/), a handmade pastry shop and cafe at Kyriakou Matsi 57G, Strovolos, Nicosia. It was made to show the owners what their site could be. **They have not commissioned it, and it is not their official website.** It is hidden from search engines, and its request form never sends anything.

- **Pages:** Home, Menu (search and categories), Cakes & Occasions (live cake builder), Visit (hours, map, contact)
- **Languages:** English at `/`, Greek at `/el/`
- **Built with:** [Astro](https://astro.build), plain CSS and a little TypeScript. No database and no tracking. Fonts are self-hosted.

## Run it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:4321/dough-pastries/>. `npm test` runs the logic and data checks, and `npm run build` writes the finished site to `dist/`.

## Change the content

| To change | Edit |
|---|---|
| Menu items, prices, photos | `src/data/menu.json` (photos are `src/assets/menu/<item id>.jpg`) |
| Cakes, sizes, event sweets, delivery areas | `src/data/occasions.json` |
| Address, phone, hours, links | `src/data/site.json` |
| All other wording, in both languages | `src/lib/ui.ts` |

## Confirm with the owners

- **Opening hours.** The sources disagree. The site uses Google Maps (Mon-Fri 8:30-17:00, Sat 9:30-13:30, closed Sunday). Their website says 8:00-16:00, and Wolt says Mon 8:00-16:45, Tue-Fri 7:55-17:00, Sat 9:00-13:30.
- **Prices.** Taken from Wolt and their printed coffee menu. In-shop prices may differ.
- **Delivery areas for cakes.** Nicosia, Larnaca and Limassol are taken from the location field on their current order form.
- **Photos.** Taken from their Wolt listing at 1200px. There are none of celebration cakes, wedding sweets or the shop itself, so originals would improve the site.
- **Greek wording.** Should be read by a native speaker before going live.

## Going live

1. Connect the request form in `src/scripts/builder.ts` to a real destination (form service, email or WhatsApp) and remove the demo notice in `src/components/RequestBuilder.astro`.
2. Remove the `noindex` tag in `src/layouts/Base.astro`, and the demo note in `src/components/Footer.astro`.
3. Build for the real domain: `SITE_URL=https://doughpastries.cy BASE_PATH=/ npm run build`
4. Add allergen information if it is required for the menu.

## Regenerating assets

These only need running when their inputs change, and the results are committed.

| Script | Makes |
|---|---|
| `python3 scripts/make-cutouts.py src/assets/menu src/assets/cutouts` | Cookie cut-outs from the photos |
| `node scripts/make-map.mjs <overpass export.json>` | `src/data/map.json` from OpenStreetMap streets |
| `node scripts/make-share-assets.mjs` | Link preview image and home screen icon |
| `node scripts/make-qr.mjs [url]` | QR code in `docs/` |

## Credits

Logo, photos and menu content belong to Dough Pastries. Street data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Fonts: Quicksand, Manrope, Sofia Sans Extra Condensed, Pacifico and Mynerve (SIL Open Font License).
