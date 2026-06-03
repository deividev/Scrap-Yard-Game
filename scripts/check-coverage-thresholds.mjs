import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const angularConfigPath = path.join(workspaceRoot, 'angular.json');
const angularConfig = JSON.parse(readFileSync(angularConfigPath, 'utf8'));
const projects = angularConfig.projects ?? {};
const [projectName, projectConfig] = Object.entries(projects)[0] ?? [];

if (!projectName || !projectConfig) {
  console.error('Coverage threshold check failed: no Angular project was found in angular.json.');
  process.exit(1);
}

const thresholds = projectConfig.architect?.test?.options?.coverageThresholds;

if (!thresholds) {
  console.error('Coverage threshold check failed: coverageThresholds are missing in angular.json.');
  process.exit(1);
}

const summaryCandidates = [
  path.join(workspaceRoot, 'coverage', projectName, 'coverage-summary.json'),
  path.join(workspaceRoot, 'coverage', 'coverage-summary.json'),
];

const summaryPath = summaryCandidates.find((candidate) => existsSync(candidate));

if (!summaryPath) {
  console.error(
    'Coverage threshold check failed: coverage-summary.json was not generated. Ensure json-summary is enabled in coverageReporters.',
  );
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const totals = summary.total;
const metrics = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

for (const metric of metrics) {
  const actual = totals?.[metric]?.pct;
  const minimum = thresholds[metric];

  if (typeof minimum !== 'number' || typeof actual !== 'number') {
    continue;
  }

  if (actual < minimum) {
    failures.push(`${metric}: ${actual}% < ${minimum}%`);
  }
}

if (failures.length > 0) {
  console.error('Coverage threshold check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Coverage thresholds verified from ${path.relative(workspaceRoot, summaryPath)}: ` +
    metrics
      .filter((metric) => typeof thresholds[metric] === 'number')
      .map((metric) => `${metric} ${totals[metric].pct}% >= ${thresholds[metric]}%`)
      .join(', '),
);