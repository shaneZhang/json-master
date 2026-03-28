const fs = require('fs');
const path = require('path');

function createPNG(size) {
  const png = Buffer.alloc(68);
  png.write('\x89PNG\r\n\x1a\n', 0);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12);
  png.writeUInt32BE(size, 16);
  png.writeUInt32BE(size, 20);
  png.writeUInt8(8, 24);
  png.writeUInt8(2, 25);
  png.writeUInt8(0, 26);
  png.writeUInt8(0, 27);
  png.writeUInt8(0, 28);
  const crc1 = crc32(png.slice(12, 29));
  png.writeUInt32BE(crc1, 29);
  png.write('IDATx\x9c', 33);
  png.writeUInt32BE(0, 41);
  const crc2 = crc32(Buffer.concat([Buffer.from('IDATx\x9c'), Buffer.alloc(4)]));
  png.writeUInt32BE(crc2, 45);
  png.write('IEND', 53);
  const crc3 = crc32(Buffer.from('IEND'));
  png.writeUInt32BE(crc3, 57);
  return png;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const iconsDir = path.join(__dirname, 'dist', 'icons');
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Created icon${size}.png`);
});

console.log('Done!');
