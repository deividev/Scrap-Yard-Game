const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, '-');
}

function cleanDistElectron() {
  const distElectronPattern = /^dist_electron/;
  const rootDir = process.cwd();
  const items = fs.readdirSync(rootDir);

  items.forEach((item) => {
    if (distElectronPattern.test(item)) {
      const itemPath = path.join(rootDir, item);
      console.log('Removing old build:', item);
      fs.rmSync(itemPath, { recursive: true, force: true });
    }
  });
}

const DEV_FLAGS_PATH = path.join(process.cwd(), 'src', 'app', 'config', 'dev-flags.config.ts');

function setCalibrationFlag(value) {
  let content = fs.readFileSync(DEV_FLAGS_PATH, 'utf8');
  content = content.replace(
    /export const DEV_CALIBRATION_ENABLED = (true|false);/,
    `export const DEV_CALIBRATION_ENABLED = ${value};`
  );
  fs.writeFileSync(DEV_FLAGS_PATH, content, 'utf8');
  console.log(`DEV_CALIBRATION_ENABLED set to ${value}`);
}

try {
  setCalibrationFlag(false);

  console.log('Generating icons...');
  execSync('node scripts/generate-ico.js', { stdio: 'inherit' });

  console.log('Cleaning previous builds...');
  cleanDistElectron();

  console.log('Building web assets...');
  execSync('pnpm run dist', { stdio: 'inherit' });

  // Fix Angular base href for file:// (Electron) so assets load relative to index.html
  try {
    const indexHtmlPath = path.join(process.cwd(), 'dist', 'scrap-yard', 'browser', 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      let html = fs.readFileSync(indexHtmlPath, 'utf8');
      if (html.includes('<base href="/">')) {
        html = html.replace('<base href="/">', '<base href="./">');
        fs.writeFileSync(indexHtmlPath, html, 'utf8');
        console.log('Patched base href in', indexHtmlPath);
      }
    }
  } catch (e) {
    console.warn('Could not patch index.html base href:', e && e.message ? e.message : e);
  }

  const pkg = require(path.join(process.cwd(), 'package.json'));
  const baseBuild = pkg.build || {};

  // Version is the single source of truth from package.json
  const label = pkg.releaseLabel ? `${pkg.releaseLabel}-` : '';
  const fileVersion = `${label}v${pkg.version}`;
  console.log(`Using version from package.json for artifact names: ${fileVersion}`);

  const outDir = path.join(process.cwd(), 'dist_electron');
  console.log('Using electron-builder output dir:', outDir);

  const tmpConfig = Object.assign({}, baseBuild, {
    directories: Object.assign({}, baseBuild.directories || {}, { output: outDir }),
    nsis: Object.assign({}, baseBuild.nsis || {}, {
      artifactName: `\${productName}-${fileVersion}-Setup.\${ext}`,
    }),
    portable: Object.assign({}, baseBuild.portable || {}, {
      artifactName: `\${productName}-${fileVersion}-Portable.\${ext}`,
    }),
  });

  const tmpPath = path.join(process.cwd(), '.electron-builder.tmp.json');
  // electron-builder expects the config object itself in the file (not wrapped under `build`).
  fs.writeFileSync(tmpPath, JSON.stringify(tmpConfig, null, 2));

  console.log('Running electron-builder...');
  // Quote the config path to handle spaces in Windows paths
  execSync(`pnpm exec electron-builder --config "${tmpPath}" --win`, { stdio: 'inherit' });

  // cleanup tmp config
  try {
    fs.unlinkSync(tmpPath);
  } catch (e) {}

  console.log('Packaging complete. Output:', outDir);
} catch (e) {
  console.error('Packaging failed:', e && e.message ? e.message : e);
  setCalibrationFlag(true);
  process.exit(1);
} finally {
  setCalibrationFlag(true);
}
