/**
 * dev-start.mjs — Development launcher.
 *
 * Starts:
 *   1. calib-server  (port 4201) — writes slot changes to machine-card-slots.config.ts
 *   2. ng serve      (port 4200) — Angular dev server with proxy to calib-server
 *
 * Usage:  npm run start:calib
 *
 * Both processes share stdout/stderr with the terminal.
 * Killing this process (Ctrl+C) also kills both children.
 */

import { spawn } from 'node:child_process';

const procs = [];

function launch(cmd, args, label, color) {
  const prefix = `\x1b[${color}m[${label}]\x1b[0m `;
  const child = spawn(cmd, args, { shell: true });

  child.stdout.on('data', (d) => process.stdout.write(prefix + d));
  child.stderr.on('data', (d) => process.stderr.write(prefix + d));
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`);
    // If either process exits unexpectedly, kill the other
    procs.forEach((p) => {
      try {
        p.kill();
      } catch {}
    });
    process.exit(code ?? 0);
  });

  procs.push(child);
  return child;
}

process.on('SIGINT', () => {
  procs.forEach((p) => {
    try {
      p.kill('SIGINT');
    } catch {}
  });
  process.exit(0);
});
process.on('SIGTERM', () => {
  procs.forEach((p) => {
    try {
      p.kill('SIGTERM');
    } catch {}
  });
  process.exit(0);
});

// 1. Calib server (starts immediately)
launch('node', ['scripts/calib-server.mjs'], 'calib', '36');

// 2. ng serve with proxy (brief delay to let Node print its "listening" line first)
setTimeout(() => {
  launch('ng', ['serve', '--proxy-config', 'proxy.conf.json'], 'ng', '35');
}, 300);
