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

try {
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

  // Read game version label from app-meta.config.ts (source of truth for menu display version)
  let fileVersion = pkg.version;
  try {
    const appMetaPath = path.join(process.cwd(), 'src/app/config/app-meta.config.ts');
    const appMetaContent = fs.readFileSync(appMetaPath, 'utf8');
    const match = appMetaContent.match(/APP_VERSION_LABEL\s*=\s*['"]([^'"]+)['"]/);
    if (match) {
      fileVersion = match[1].replace(/\s+/g, '-'); // e.g. 'demo v0.2.0' → 'demo-v0.2.0'
      console.log(`Using game version label for artifact names: ${fileVersion}`);
    }
  } catch (e) {
    console.warn(
      'Could not read APP_VERSION_LABEL, falling back to package.json version:',
      e && e.message ? e.message : e,
    );
  }

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
  process.exit(1);
}
