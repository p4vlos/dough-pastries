// Generates the link preview image (shown when the demo URL is pasted into WhatsApp or Viber)
// and the home screen icon. Usage: node scripts/make-share-assets.mjs
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const logo = JSON.parse(readFileSync(new URL('src/data/logo.json', root), 'utf8'));
const inRoot = (path) => new URL(path, root).pathname;

const HANDLE =
  'M256 412C241 425 231 430 214 430C200 430 190 428 178 424C155 418 135 410 112 402C104 399.5 98 399 94 399C68 399 50 420 50 445C50 470 68 491 94 491C100 491 104 490 112 487C135 479 155 471 178 465C190 462 205 460 216 460C232 460 241 465 256 478';

const logoSvg = (width) => {
  const height = Math.round((width * 780) / 1160);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="30 52 1160 780">
    <g fill="none" stroke="#ffd985" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
      <path d="M335 362A274.5 289 0 0 1 884 362"/><path d="M708 227.5H755"/>
      <rect x="262" y="363" width="695" height="161" rx="25"/>
      <path d="${HANDLE}"/><path d="${HANDLE}" transform="matrix(-1 0 0 1 1219 0)"/>
    </g>
    <g fill="#fff" fill-rule="evenodd" transform="translate(0 560)"><path d="${logo.word}"/><path d="${logo.tag}"/></g>
  </svg>`);
};

const arch = await sharp(inRoot('src/assets/menu/flatlay.jpg'))
  .resize(470, 500, { fit: 'cover' })
  .composite([{
    input: Buffer.from('<svg width="470" height="500"><path d="M0 500V235A235 235 0 0 1 470 235V500Z" fill="#fff"/></svg>'),
    blend: 'dest-in',
  }])
  .png()
  .toBuffer();

const cookie = (name, size, angle) =>
  sharp(inRoot(`src/assets/cutouts/${name}.webp`))
    .resize(size, size)
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#050708' } })
  .composite([
    { input: logoSvg(520), left: 70, top: 140 },
    { input: arch, left: 660, top: 90 },
    { input: Buffer.from('<svg width="470" height="500"><path d="M4 500V235A231 231 0 0 1 466 235V500" fill="none" stroke="#ffd985" stroke-width="7"/></svg>'), left: 660, top: 90 },
    { input: await cookie('kinder-cookie', 190, 12), left: 985, top: 40 },
    { input: await cookie('lemon-meringue-cookie', 170, -14), left: 560, top: 330 },
    { input: await cookie('red-velvet-cookie', 170, 8), left: 1000, top: 420 },
  ])
  .flatten({ background: '#050708' })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(inRoot('public/og.jpg'));

await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 1220 1220">
  <rect width="1220" height="1220" fill="#050708"/>
  <g transform="translate(0 290)" fill="none" stroke="#ffd985" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
    <path d="M335 362A274.500 289 0 0 1 884 362"/><path d="M708 227.500H755"/>
    <rect x="262" y="363" width="695" height="161" rx="25"/>
    <path d="${HANDLE}"/><path d="${HANDLE}" transform="matrix(-1 0 0 1 1219 0)"/>
  </g>
</svg>`))
  .png()
  .toFile(inRoot('public/apple-touch-icon.png'));

console.log('wrote public/og.jpg and public/apple-touch-icon.png');
