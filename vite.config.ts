import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import zlib from 'zlib';

function crc32(buf: Buffer) {
  let crc = 0xffffffff;
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function createPNG(size: number) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  
  const ihdr = makeChunk('IHDR', ihdrData);
  
  const raw: number[] = [];
  for (let y = 0; y < size; y++) {
    raw.push(0);
    for (let x = 0; x < size; x++) {
      raw.push(76, 175, 80);
    }
  }
  const rawData = Buffer.from(raw);
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  
  const iend = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function generateIcons() {
  const iconsDir = resolve(__dirname, 'dist', 'icons');
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }
  [16, 32, 48, 128].forEach(size => {
    copyFileSync(resolve(__dirname, 'icons', `icon${size}.png`), resolve(iconsDir, `icon${size}.png`));
    console.log(`Copied icon${size}.png`);
  });
}

function createRootIcons() {
  const iconsDir = resolve(__dirname, 'icons');
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }
  [16, 32, 48, 128].forEach(size => {
    const iconPath = resolve(iconsDir, `icon${size}.png`);
    if (!existsSync(iconPath)) {
      writeFileSync(iconPath, createPNG(size));
      console.log(`Created root icon${size}.png`);
    }
  });
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
        options: resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (ext === 'css') {
            return 'assets/styles/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'build-setup',
      buildStart() {
        createRootIcons();
      },
      writeBundle() {
        const destPath = resolve(__dirname, 'dist', 'manifest.json');
        copyFileSync(resolve(__dirname, 'manifest.json'), destPath);
        console.log('manifest.json copied to dist');
        generateIcons();
      }
    }
  ]
});
