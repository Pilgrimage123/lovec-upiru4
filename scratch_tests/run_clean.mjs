import fs from 'fs';
import { decodePNG, encodePNG } from './clean_sprites.mjs';

function analyzeAndCleanSilak(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, pixels } = decodePNG(buf);

  // 8-connected component labeling
  const labels = new Int32Array(width * height).fill(-1);
  let currentLabel = 0;
  const componentSizes = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alpha = pixels[idx * 4 + 3];
      if (alpha < 10 || labels[idx] !== -1) continue;

      // BFS to find connected component
      const queue = [idx];
      labels[idx] = currentLabel;
      let count = 0;

      let minX = x, maxX = x, minY = y, maxY = y;

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        count++;
        const cx = curr % width;
        const cy = Math.floor(curr / width);

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // check 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            if (nx < 0 || nx >= width) continue;

            const nidx = ny * width + nx;
            if (labels[nidx] === -1 && pixels[nidx * 4 + 3] >= 10) {
              labels[nidx] = currentLabel;
              queue.push(nidx);
            }
          }
        }
      }

      componentSizes.push({ label: currentLabel, count, minX, maxX, minY, maxY });
      currentLabel++;
    }
  }

  componentSizes.sort((a, b) => b.count - a.count);
  console.log('Silak components total:', componentSizes.length);
  for (const comp of componentSizes) {
    console.log(`Comp ${comp.label}: ${comp.count} pixels, bbox [x: ${comp.minX}..${comp.maxX}, y: ${comp.minY}..${comp.maxY}]`);
  }

  // The main body has >100,000 pixels.
  // Erase any component that is NOT the main body (label with highest count).
  const mainLabel = componentSizes[0].label;
  let erasedCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labels[idx] !== -1 && labels[idx] !== mainLabel) {
        pixels[idx * 4] = 0;
        pixels[idx * 4 + 1] = 0;
        pixels[idx * 4 + 2] = 0;
        pixels[idx * 4 + 3] = 0;
        erasedCount++;
      }
    }
  }

  console.log(`Erased ${erasedCount} stray pixels from Silak`);
  const encoded = encodePNG(width, height, pixels);
  return encoded;
}

function analyzeAndCleanZlodejka(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, pixels } = decodePNG(buf);

  // 8-connected component labeling
  const labels = new Int32Array(width * height).fill(-1);
  let currentLabel = 0;
  const componentSizes = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alpha = pixels[idx * 4 + 3];
      if (alpha < 10 || labels[idx] !== -1) continue;

      const queue = [idx];
      labels[idx] = currentLabel;
      let count = 0;
      let minX = x, maxX = x, minY = y, maxY = y;

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        count++;
        const cx = curr % width;
        const cy = Math.floor(curr / width);

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            if (nx < 0 || nx >= width) continue;

            const nidx = ny * width + nx;
            if (labels[nidx] === -1 && pixels[nidx * 4 + 3] >= 10) {
              labels[nidx] = currentLabel;
              queue.push(nidx);
            }
          }
        }
      }

      componentSizes.push({ label: currentLabel, count, minX, maxX, minY, maxY });
      currentLabel++;
    }
  }

  componentSizes.sort((a, b) => b.count - a.count);
  console.log('Zlodejka components total:', componentSizes.length);
  for (const comp of componentSizes) {
    console.log(`Comp ${comp.label}: ${comp.count} pixels, bbox [x: ${comp.minX}..${comp.maxX}, y: ${comp.minY}..${comp.maxY}]`);
  }

  // Erase any small disconnected components (< 150 pixels) that are floating far from body
  let erasedCount = 0;
  for (const comp of componentSizes) {
    if (comp.count < 150) {
      console.log(`Erasing component ${comp.label} (${comp.count} px at bbox [${comp.minX}..${comp.maxX}, ${comp.minY}..${comp.maxY}])`);
      for (let y = comp.minY; y <= comp.maxY; y++) {
        for (let x = comp.minX; x <= comp.maxX; x++) {
          const idx = y * width + x;
          if (labels[idx] === comp.label) {
            pixels[idx * 4] = 0;
            pixels[idx * 4 + 1] = 0;
            pixels[idx * 4 + 2] = 0;
            pixels[idx * 4 + 3] = 0;
            erasedCount++;
          }
        }
      }
    }
  }

  console.log(`Erased ${erasedCount} stray pixels from Zlodejka`);
  return encodePNG(width, height, pixels);
}

// Process and save
const silakPaths = [
  'public/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png',
  '.vercel/output/static/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png'
];
const silakCleaned = analyzeAndCleanSilak(silakPaths[0]);
for (const p of silakPaths) {
  if (fs.existsSync(p)) {
    fs.writeFileSync(p, silakCleaned);
    console.log(`Updated ${p}`);
  }
}

const zlodejkaPaths = [
  'public/assets/aistudio/Zlatovlas__zlod_jka_s_d_kou_96361a6e.png',
  '.vercel/output/static/assets/aistudio/Zlatovlas__zlod_jka_s_d_kou_96361a6e.png'
];
const zlodejkaCleaned = analyzeAndCleanZlodejka(zlodejkaPaths[0]);
for (const p of zlodejkaPaths) {
  if (fs.existsSync(p)) {
    fs.writeFileSync(p, zlodejkaCleaned);
    console.log(`Updated ${p}`);
  }
}
