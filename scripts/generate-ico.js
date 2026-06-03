/**
 * Generates build/icon.ico from the source PNG using sharp + png-to-ico.
 * Produces a proper 32-bit RGBA ICO with correct color at all sizes.
 * Sizes: 16, 24, 32, 48, 64, 128, 256 px
 */

const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '../src/app/assets/image/Icon_Scrap_Yardl.png');
const DEST = path.join(__dirname, '../build/icon.ico');
const DEST_PNG = path.join(__dirname, '../build/icon.png');
const FAVICON = path.join(__dirname, '../public/favicon.png');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  console.log('Generating icons from source PNG...');

  // Copy source PNG → build/icon.png and public/favicon.png
  fs.copyFileSync(SRC, DEST_PNG);
  fs.copyFileSync(SRC, FAVICON);
  console.log('icon.png copied to build/ and public/');

  const buffers = await Promise.all(
    SIZES.map((size) =>
      sharp(SRC)
        .resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer(),
    ),
  );

  const icoBuffer = await pngToIco(buffers);
  fs.writeFileSync(DEST, icoBuffer);
  console.log(`icon.ico written (${(icoBuffer.length / 1024).toFixed(1)} KB) → ${DEST}`);
}

main().catch((err) => {
  console.error('Failed to generate icon.ico:', err);
  process.exit(1);
});
