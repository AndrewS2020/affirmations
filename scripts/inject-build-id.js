#!/usr/bin/env node
// Post-build step: Vite copies public/* verbatim into dist/. We want sw.js
// to contain a fresh CACHE_NAME on every build so the browser detects a new
// service worker and the installed PWA actually updates. To keep public/sw.js
// always holding a stable `__BUILD_ID__` placeholder in the repo, this script
// rewrites dist/sw.js (the file that is actually served) right after vite build.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SW_DIST = resolve(ROOT, 'dist/sw.js');

const BUILD_ID = String(Math.floor(Date.now() / 1000));
const placeholder = 'const CACHE_NAME =\'affirmations-pwa-__BUILD_ID__\';';
const replacement = `const CACHE_NAME = 'affirmations-pwa-${BUILD_ID}';`;

const original = readFileSync(SW_DIST, 'utf8');

if (!original.includes(placeholder)) {
  console.error(`[inject-build-id] ERROR: placeholder not found in ${SW_DIST}`);
  console.error('Expected to find:', placeholder);
  process.exit(1);
}

const updated = original.replace(placeholder, replacement);
writeFileSync(SW_DIST, updated, 'utf8');
console.log(`[inject-build-id] ✅ dist/sw.js CACHE_NAME set to affirmations-pwa-${BUILD_ID}`);
