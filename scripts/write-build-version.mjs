#!/usr/bin/env node
/**
 * Writes deploy metadata before each Vite build.
 * Vercel sets VERCEL_GIT_COMMIT_SHA; locally we use a timestamp id.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.VITE_APP_BUILD_ID ||
  `local-${Date.now().toString(36)}`;

const meta = {
  buildId,
  builtAt: new Date().toISOString(),
  app: 'detectra-ai',
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'version.json'), `${JSON.stringify(meta, null, 2)}\n`);

const templatePath = path.join(publicDir, 'sw.template.js');
const swPath = path.join(publicDir, 'sw.js');
if (fs.existsSync(templatePath)) {
  const sw = fs.readFileSync(templatePath, 'utf8').replaceAll('__BUILD_ID__', buildId);
  fs.writeFileSync(swPath, sw);
}

fs.writeFileSync(
  path.join(root, '.env.build'),
  `VITE_APP_BUILD_ID=${buildId}\n`,
);

console.log(`[build] deploy id: ${buildId}`);
