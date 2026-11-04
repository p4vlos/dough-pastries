// Turns an OpenStreetMap (Overpass) export of the streets around the shop into
// src/data/map.json, which StreetMap.astro draws in brand colours.
//
// Usage: node scripts/make-map.mjs <overpass export.json>
// Street data (c) OpenStreetMap contributors, ODbL.
import { readFileSync, writeFileSync } from 'node:fs';
import site from '../src/data/site.json' with { type: 'json' };

const WIDTH = 1200;
const HEIGHT = 800;
const SPAN_METRES = 1150;
const BUILDING_RADIUS = 300;

const CLASSES = {
  primary: 'major', secondary: 'major', trunk: 'major',
  tertiary: 'mid',
  residential: 'minor', unclassified: 'minor', living_street: 'minor', pedestrian: 'minor',
  service: 'service',
};

const LABELS = {
  'Kiriakou Matsi': { en: 'Kyriakou Matsi', el: 'Κυριάκου Μάτση', main: true },
  'Λεωφόρος Στροβόλου': { en: 'Strovolou Avenue', el: 'Λεωφόρος Στροβόλου' },
  'Λεωφόρος Αρχιεπισκόπου Κυπριανού': { en: 'Archbishop Kyprianou Avenue', el: 'Λεωφ. Αρχ. Κυπριανού' },
  'Μακεδονίτισσης': { en: 'Makedonitissis', el: 'Μακεδονίτισσης' },
};

const { lat: lat0, lng: lng0 } = site.geo;
const metresPerLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
const metresPerLat = 110540;
const scale = WIDTH / SPAN_METRES;

const project = ({ lat, lon }) => [
  WIDTH / 2 + (lon - lng0) * metresPerLng * scale,
  HEIGHT / 2 - (lat - lat0) * metresPerLat * scale,
];
const fmt = (n) => Math.round(n * 10) / 10;
const toPath = (points, close = false) =>
  `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L')}${close ? 'Z' : ''}`;
const inView = ([x, y], margin = 60) =>
  x > -margin && x < WIDTH + margin && y > -margin && y < HEIGHT + margin;

// Joins a street's separate segments into its longest continuous run, for a text path.
function longestChain(segments) {
  const key = ([x, y]) => `${fmt(x)},${fmt(y)}`;
  const remaining = segments.map((segment) => [...segment]);
  let best = [];
  while (remaining.length) {
    let chain = remaining.shift();
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < remaining.length; i += 1) {
        const segment = remaining[i];
        const first = segment[0];
        const last = segment[segment.length - 1];
        if (key(last) === key(chain[0])) chain = [...segment, ...chain.slice(1)];
        else if (key(first) === key(chain[chain.length - 1])) chain = [...chain, ...segment.slice(1)];
        else if (key(first) === key(chain[0])) chain = [...[...segment].reverse(), ...chain.slice(1)];
        else if (key(last) === key(chain[chain.length - 1])) chain = [...chain, ...[...segment].reverse().slice(1)];
        else continue;
        remaining.splice(i, 1);
        grew = true;
        break;
      }
    }
    const visible = chain.filter((point) => inView(point, 0));
    if (visible.length > best.length) best = visible;
  }
  return best[0]?.[0] > best[best.length - 1]?.[0] ? [...best].reverse() : best;
}

const elements = JSON.parse(readFileSync(process.argv[2], 'utf8')).elements;
const layers = { major: [], mid: [], minor: [], service: [], buildings: [] };
const named = new Map();

for (const way of elements) {
  const points = way.geometry.map(project);
  if (!points.some((point) => inView(point))) continue;

  if (way.tags.building) {
    const [x, y] = points[0];
    if (Math.hypot(x - WIDTH / 2, y - HEIGHT / 2) < BUILDING_RADIUS * scale) {
      layers.buildings.push(toPath(points, true));
    }
    continue;
  }

  const layer = CLASSES[way.tags.highway];
  if (!layer) continue;
  layers[layer].push(toPath(points));
  if (LABELS[way.tags.name]) {
    if (!named.has(way.tags.name)) named.set(way.tags.name, []);
    named.get(way.tags.name).push(points);
  }
}

const labels = [...named].flatMap(([name, segments], index) => {
  const chain = longestChain(segments);
  if (chain.length < 2) return [];
  const { en, el, main } = LABELS[name];
  return [{ id: `street-${index}`, en, el, main: Boolean(main), d: toPath(chain) }];
});

const output = {
  width: WIDTH,
  height: HEIGHT,
  roads: Object.fromEntries(
    ['major', 'mid', 'minor', 'service', 'buildings'].map((layer) => [layer, layers[layer].join('')]),
  ),
  labels,
};

const target = new URL('../src/data/map.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  Object.entries(layers).map(([name, paths]) => `${name}:${paths.length}`).join(' '),
  '| labels:', labels.map((label) => label.en).join(', '),
);
