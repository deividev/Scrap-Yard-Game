/**
 * Generates build/icon.ico from build/icon.png using sharp + to-ico.
 * Produces a proper 32-bit RGBA ICO with transparency preserved.
 * Sizes: 16, 32, 48, 256 px
 */

const sharp = require('sharp');
const toIco = require('to-ico');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '../src/app/assets/image/Icon_Scrap_Yardl_2-removebg.png');
const DEST = path.join(__dirname, '../build/icon.ico');
const DEST_PNG = path.join(__dirname, '../build/icon.png');
const SIZES = [16, 32, 48, 256];

async function main() {
  console.log('Generating icon.ico from icon.png...');

  // Copy source PNG → build/icon.png (used by extraResources)
  fs.copyFileSync(SRC, DEST_PNG);
  console.log('icon.png copied to build/');

  const buffers = await Promise.all(
    SIZES.map((size) =>
      sharp(SRC)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    ),
  );

  const icoBuffer = await toIco(buffers);
  fs.writeFileSync(DEST, icoBuffer);
  console.log(`icon.ico written (${(icoBuffer.length / 1024).toFixed(1)} KB) → ${DEST}`);
}

main().catch((err) => {
  console.error('Failed to generate icon.ico:', err);
  process.exit(1);
});
