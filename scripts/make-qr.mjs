// Makes a QR code for showing the demo in person. Usage: node scripts/make-qr.mjs [url]
import { writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const url = process.argv[2] ?? 'https://p4vlos.github.io/dough-pastries/';
const options = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#050708', light: '#ffd985' } };
const target = (name) => new URL(`../docs/${name}`, import.meta.url);

await QRCode.toFile(target('demo-qr.png').pathname, url, { ...options, width: 1024 });
writeFileSync(target('demo-qr.svg'), await QRCode.toString(url, { ...options, type: 'svg' }));
console.log(`QR codes for ${url} written to docs/`);
