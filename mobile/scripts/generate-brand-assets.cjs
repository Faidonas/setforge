/* global __dirname */
/* Package the approved artwork without changing the logo's geometry.
 * Jimp is supplied by Expo's existing image tooling; no runtime dependency.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const expoRequire = createRequire(require.resolve('@expo/image-utils'));
const Jimp = expoRequire('jimp-compact');

const sourcePath = path.resolve(__dirname, '../assets/brand/spotter-approved-board.png');
const outputPath = path.resolve(__dirname, '../assets/images/spotter');
const DARK = 0x09090bff;
const ADAPTIVE_ARTWORK_WIDTH = 560;

function bounds(image) {
  let left = image.bitmap.width;
  let top = image.bitmap.height;
  let right = -1;
  let bottom = -1;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, index) => {
    if (image.bitmap.data[index + 3] <= 4) return;
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  });
  if (right < left) throw new Error('Approved artwork is empty.');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function trim(image) {
  const box = bounds(image);
  return image.crop(box.left, box.top, box.width, box.height);
}

function monochrome(image, color) {
  const result = image.clone();
  result.scan(0, 0, result.bitmap.width, result.bitmap.height, (_x, _y, i) => {
    result.bitmap.data[i] = color[0];
    result.bitmap.data[i + 1] = color[1];
    result.bitmap.data[i + 2] = color[2];
  });
  return result;
}

function fitted(image, width) {
  return image.clone().resize(width, Jimp.AUTO, Jimp.RESIZE_BICUBIC);
}

function opaque(image) {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_x, _y, i) => {
    image.bitmap.data[i + 3] = 255;
  });
  return image;
}

function square(image, size, artworkWidth, background = 0x00000000) {
  const canvas = new Jimp(size, size, background);
  const artwork = fitted(image, artworkWidth);
  canvas.composite(artwork, Math.round((size - artwork.bitmap.width) / 2), Math.round((size - artwork.bitmap.height) / 2));
  return canvas;
}

async function main() {
  fs.mkdirSync(outputPath, { recursive: true });
  const source = await Jimp.read(sourcePath);
  if (source.bitmap.width !== 1536 || source.bitmap.height !== 1024) {
    throw new Error('Use the approved 1536 x 1024 Spotter logo board.');
  }

  // Isolate the upper primary lockup. Lower-panel alternatives are never used.
  const logo = source.clone().crop(220, 135, 1110, 340);
  logo.scan(0, 0, logo.bitmap.width, logo.bitmap.height, (_x, _y, i) => {
    const pixels = logo.bitmap.data;
    const [red, green, blue] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const strength = Math.max(red, green, blue);
    const alpha = strength < 30 ? 0 : Math.round(255 * Math.min(1, (strength - 18) / 220));
    const cyan = green - red > 35 && blue - red > 35;
    pixels[i] = cyan ? 0 : 255;
    pixels[i + 1] = cyan ? 240 : 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = alpha;
  });
  trim(logo);

  // Locate the existing empty column gap between emblem and wordmark.
  let gapStart = -1;
  let gapLength = 0;
  let currentStart = -1;
  for (let x = Math.floor(logo.bitmap.width * 0.25); x < logo.bitmap.width * 0.43; x++) {
    let ink = false;
    for (let y = 0; y < logo.bitmap.height; y++) {
      if (logo.bitmap.data[(y * logo.bitmap.width + x) * 4 + 3] > 4) { ink = true; break; }
    }
    if (!ink && currentStart < 0) currentStart = x;
    if ((ink || x + 1 >= logo.bitmap.width * 0.43) && currentStart >= 0) {
      if (x - currentStart > gapLength) { gapStart = currentStart; gapLength = x - currentStart; }
      currentStart = -1;
    }
  }
  if (gapLength < 10) throw new Error('Could not identify the approved emblem/wordmark separation.');
  const mark = trim(logo.clone().crop(0, 0, gapStart, logo.bitmap.height));
  const assets = {
    'logo-dark.png': logo,
    'logo-light.png': monochrome(logo, [9, 9, 11]),
    'mark-dark.png': mark,
    'mark-light.png': monochrome(mark, [9, 9, 11]),
    'app-icon.png': opaque(square(mark, 1024, 760, DARK)),
    'adaptive-foreground.png': square(mark, 1024, ADAPTIVE_ARTWORK_WIDTH),
    'adaptive-monochrome.png': square(monochrome(mark, [255, 255, 255]), 1024, ADAPTIVE_ARTWORK_WIDTH),
    'splash.png': square(mark, 512, 400),
  };
  assets['favicon.png'] = opaque(assets['app-icon.png'].clone().resize(128, 128, Jimp.RESIZE_BICUBIC));
  for (const [name, image] of Object.entries(assets)) {
    await image.writeAsync(path.join(outputPath, name));
  }

  const metadata = {
    source: '../../brand/spotter-approved-board.png',
    approvedConcept: '01-single-lifter',
    colors: { cyan: '#00F0FF', dark: '#09090B', white: '#FFFFFF' },
    logo: { width: logo.bitmap.width, height: logo.bitmap.height, aspectRatio: logo.bitmap.width / logo.bitmap.height },
    mark: { width: mark.bitmap.width, height: mark.bitmap.height, aspectRatio: mark.bitmap.width / mark.bitmap.height },
    assets: Object.fromEntries(Object.entries(assets).map(([name, image]) => [name, { width: image.bitmap.width, height: image.bitmap.height }])),
  };
  fs.writeFileSync(path.join(outputPath, 'artwork.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(JSON.stringify(metadata, null, 2));

  // A local proof sheet for checking dark/light transparency and device padding.
  const proof = new Jimp(1200, 810, DARK);
  proof.composite(fitted(assets['logo-dark.png'], 700), 40, 25);
  proof.composite(new Jimp(1200, 230, 0xf4f5f7ff), 0, 255);
  proof.composite(fitted(assets['logo-light.png'], 700), 40, 275);
  proof.composite(assets['app-icon.png'].clone().resize(200, 200), 40, 540);
  const adaptiveProofWidth = Math.round(200 * ADAPTIVE_ARTWORK_WIDTH / 1024);
  proof.composite(square(mark, 200, adaptiveProofWidth, 0x27272aff), 280, 540);
  proof.composite(square(monochrome(mark, [255, 255, 255]), 200, adaptiveProofWidth, 0x27272aff), 520, 540);
  proof.composite(fitted(mark, 48), 800, 555);
  proof.composite(fitted(mark, 32), 900, 555);
  const proofPath = path.resolve(__dirname, '../../output/branding/spotter-integration-proof.png');
  fs.mkdirSync(path.dirname(proofPath), { recursive: true });
  await proof.writeAsync(proofPath);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
