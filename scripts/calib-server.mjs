/**
 * calib-server.mjs — Dev-only HTTP server for the machine card calibration tool.
 *
 * Listens on http://localhost:4201.
 * Angular proxy.conf.json forwards /api/calib → this server.
 *
 * POST /api/calib
 *   Body: { machineId: string, slots: MachineCardSlots }
 *   Reads machine-card-slots.config.ts, replaces the matching const block in-place, writes back.
 *   Angular HMR picks up the file change (~300ms hot reload).
 *
 * Uses ONLY Node.js built-in modules — no npm install required.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.resolve(__dirname, '../src/app/config/machine-card-slots.config.ts');
const PORT = 4201;

// ── machineId → const name in the config file ────────────────────────────────
// Add new machines here as you register them in MACHINE_CARD_SLOTS.
const CONST_NAMES = {
  crusher: 'CRUSHER_CARD_SLOTS',
  separator: 'SEPARATOR_CARD_SLOTS',
  smelter: 'SMELTER_CARD_SLOTS',
  assembler: 'ASSEMBLER_CARD_SLOTS',
  packager: 'PACKAGER_CARD_SLOTS',
  recycler: 'RECYCLER_CARD_SLOTS',
  electric_assembler: 'ELECTRIC_ASSEMBLER_CARD_SLOTS',
  electric_packager: 'ELECTRIC_PACKAGER_CARD_SLOTS',
};

// ── Code-gen: rebuild a const block from the slots object ────────────────────
function r3(n) {
  return Number(Number(n).toFixed(3));
}
function q(s) {
  return `'${s}'`;
} // wrap in single quotes

function buildConstBlock(constName, slots) {
  const { canvas: cv, overlay: ov, effects: ef, aspectRatio } = slots;
  const pz = ef.particles.zone;

  return [
    `export const ${constName}: MachineCardSlots = {`,
    `  aspectRatio: '${aspectRatio}',`,
    `  canvas: {`,
    `    led: { cx: ${r3(cv.led.cx)}, cy: ${r3(cv.led.cy)}, r: ${r3(cv.led.r)}${cv.led.ry != null ? `, ry: ${r3(cv.led.ry)}` : ''} },`,
    `    bar: { x: ${r3(cv.bar.x)}, y: ${r3(cv.bar.y)}, w: ${r3(cv.bar.w)}, h: ${r3(cv.bar.h)}, fullFactor: ${cv.bar.fullFactor} },`,
    `  },`,
    `  overlay: {`,
    `    name:   { top: ${q(ov.name.top)},   left: ${q(ov.name.left)},   width: ${q(ov.name.width)},   height: ${q(ov.name.height)} },`,
    `    level:  { top: ${q(ov.level.top)},  left: ${q(ov.level.left)},  width: ${q(ov.level.width)} },`,
    `    led:    { top: ${q(ov.led.top)}, left: ${q(ov.led.left)}${ov.led.width ? `, width: ${q(ov.led.width)}, height: ${q(ov.led.height)}` : ''} },`,
    `    recipe: { bottom: ${q(ov.recipe.bottom)}, left: ${q(ov.recipe.left)}, width: ${q(ov.recipe.width)}, height: ${q(ov.recipe.height)} },`,
    `  },`,
    `  effects: {`,
    `    particles: {`,
    `      type:         '${ef.particles.type}',`,
    `      zone:         { xMin: ${r3(pz.xMin)}, xMax: ${r3(pz.xMax)}, yMin: ${r3(pz.yMin)}, yMax: ${r3(pz.yMax)} },`,
    `      maxCount:     ${ef.particles.maxCount ?? 12},`,
    `      spawnRate:    ${ef.particles.spawnRate ?? 0.1},`,
    `      speedScale:   ${ef.particles.speedScale ?? 1.0},`,
    `      opacityRange: [${(ef.particles.opacityRange ?? [0.55, 0.8]).join(', ')}],`,
    `      sizeRange:    [${(ef.particles.sizeRange ?? [0.018, 0.036]).join(', ')}],`,
    ...(ef.particles.color ? [`      color:        '${ef.particles.color}',`] : []),
    `    },`,
    `    shake: { enabled: ${ef.shake.enabled}, intensityPx: ${ef.shake.intensityPx ?? 0.35}, speedMs: ${ef.shake.speedMs ?? 130} },`,
    `  },`,
    `};`,
  ].join('\n');
}

// ── Replace the const block for the given machine in the source file ──────────
function patchConfigFile(machineId, slots) {
  const constName = CONST_NAMES[machineId];
  if (!constName)
    throw new Error(`Unknown machineId "${machineId}". Add it to CONST_NAMES in calib-server.mjs.`);

  let src = fs.readFileSync(CONFIG_FILE, 'utf8');

  // Match: from "export const CRUSHER_CARD_SLOTS: MachineCardSlots = {"
  // to the FIRST top-level closing ";" (i.e. "};" at start of line, no indent).
  // Inner objects close with "  }," (indented + comma), so "\n};" is unique to top-level.
  const escaped = constName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`export const ${escaped}: MachineCardSlots = \\{[\\s\\S]*?\\n\\};`);

  if (!rx.test(src)) {
    throw new Error(`Could not find "${constName}" block in ${CONFIG_FILE}`);
  }

  const newBlock = buildConstBlock(constName, slots);
  src = src.replace(rx, newBlock);
  fs.writeFileSync(CONFIG_FILE, src, 'utf8');
  return constName;
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS (proxied from Angular dev server, but add headers defensively)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/calib') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { machineId, slots } = JSON.parse(body);
        const constName = patchConfigFile(machineId, slots);
        console.log(`\x1b[32m[calib]\x1b[0m ✓ Updated ${constName}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, constName }));
      } catch (err) {
        console.error(`\x1b[31m[calib]\x1b[0m ✗ ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(`Not found: ${req.url}`);
});

server.listen(PORT, () => {
  console.log(`\x1b[36m[calib-server]\x1b[0m Listening on http://localhost:${PORT}`);
  console.log(`\x1b[36m[calib-server]\x1b[0m Watching: ${CONFIG_FILE}`);
});
