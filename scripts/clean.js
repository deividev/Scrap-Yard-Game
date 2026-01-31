const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function killWindowsProcesses() {
  try { execSync('taskkill /F /IM "Last Admin Online.exe"', { stdio: 'ignore' }); } catch (e) {}
  try { execSync('taskkill /F /IM "Last Admin Online Setup 0.0.0.exe"', { stdio: 'ignore' }); } catch (e) {}
  try { execSync('taskkill /F /IM "electron.exe"', { stdio: 'ignore' }); } catch (e) {}
}

async function removeWithRetries(target, retries = 6, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true });
        console.log(`Removed: ${target}`);
      }
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

(async () => {
  try {
    if (process.platform === 'win32') killWindowsProcesses();

    const root = process.cwd();
    const targets = [path.join(root, 'dist'), path.join(root, 'dist_electron')];

    for (const t of targets) {
      await removeWithRetries(t);
    }

    console.log('Clean complete.');
    process.exit(0);
  } catch (e) {
    console.error('Clean failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
