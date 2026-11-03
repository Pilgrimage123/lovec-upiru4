import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function decodePNG(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('Not a PNG');
  }

  let offset = 8;
  let ihdr = null;
  let idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data.readUInt8(8),
        colorType: data.readUInt8(9),
        compression: data.readUInt8(10),
        filter: data.readUInt8(11),
        interlace: data.readUInt8(12),
      };
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!ihdr) throw new Error('Missing IHDR');
  if (ihdr.bitDepth !== 8 || ihdr.colorType !== 6) {
    throw new Error(`Unsupported PNG format: bitDepth=${ihdr.bitDepth}, colorType=${ihdr.colorType}`);
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const { width, height } = ihdr;
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);

  let srcOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = decompressed.readUInt8(srcOffset++);
    const line = decompressed.slice(srcOffset, srcOffset + stride);
    srcOffset += stride;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const prevX = x > 0 ? (idx - 4) : -1;
      const prevY = y > 0 ? ((y - 1) * width + x) * 4 : -1;
      const prevXY = (x > 0 && y > 0) ? (((y - 1) * width + (x - 1)) * 4) : -1;

      for (let c = 0; c < 4; c++) {
        let val = line[x * 4 + c];
        const a = prevX >= 0 ? pixels[prevX + c] : 0;
        const b = prevY >= 0 ? pixels[prevY + c] : 0;
        const cVal = prevXY >= 0 ? pixels[prevXY + c] : 0;

        if (filter === 0) {
          // None
        } else if (filter === 1) {
          // Sub
          val = (val + a) & 0xff;
        } else if (filter === 2) {
          // Up
          val = (val + b) & 0xff;
        } else if (filter === 3) {
          // Average
          val = (val + Math.floor((a + b) / 2)) & 0xff;
        } else if (filter === 4) {
          // Paeth
          const p = a + b - cVal;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - cVal);
          let pr;
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          else pr = cVal;
          val = (val + pr) & 0xff;
        }
        pixels[idx + c] = val;
      }
    }
  }

  return { width, height, pixels };
}

export function encodePNG(width, height, pixels) {
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));

  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    rawData[dstOffset++] = 0; // Filter None
    pixels.copy(rawData, dstOffset, y * stride, (y + 1) * stride);
    dstOffset += stride;
  }

  const compressed = zlib.deflateSync(rawData);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcBuf = Buffer.alloc(4 + len);
  chunk.copy(crcBuf, 0, 4, 8 + len);
  const crc = crc32(crcBuf);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Quick test
const silakPath = 'public/assets/aistudio/Vintage_sil_k_s_kotvou_a_medail__86a24e4c.png';
const buf = fs.readFileSync(silakPath);
const decoded = decodePNG(buf);
console.log(`Silak decoded: ${decoded.width}x${decoded.height}`);
