const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, '-');
}

try {
  console.log('Building web assets...');
  execSync('pnpm run dist', { stdio: 'inherit' });

  // Fix Angular base href for file:// (Electron) so assets load relative to index.html
  try {
    const indexHtmlPath = path.join(process.cwd(), 'dist', 'last-admin-online', 'browser', 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      let html = fs.readFileSync(indexHtmlPath, 'utf8');
      if (html.includes("<base href=\"/\">")) {
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

  const outDir = path.join(process.cwd(), `dist_electron_${timestamp()}`);
  console.log('Using electron-builder output dir:', outDir);

  const tmpConfig = Object.assign({}, baseBuild, {
    directories: Object.assign({}, baseBuild.directories || {}, { output: outDir })
  });

  const tmpPath = path.join(process.cwd(), '.electron-builder.tmp.json');
  // electron-builder expects the config object itself in the file (not wrapped under `build`).
  fs.writeFileSync(tmpPath, JSON.stringify(tmpConfig, null, 2));

  console.log('Running electron-builder...');
  // Quote the config path to handle spaces in Windows paths
  execSync(`pnpm exec electron-builder --config "${tmpPath}" --win`, { stdio: 'inherit' });

  // cleanup tmp config
  try { fs.unlinkSync(tmpPath); } catch (e) {}

  console.log('Packaging complete. Output:', outDir);
} catch (e) {
  console.error('Packaging failed:', e && e.message ? e.message : e);
  process.exit(1);
}
