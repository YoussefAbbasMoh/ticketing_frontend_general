/**
 * Writes public/firebase-config.js for the FCM service worker from Vite env vars.
 * Run automatically via predev / prebuild.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

const readEnvFile = () => {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const fileEnv = readEnvFile();
const env = { ...fileEnv, ...process.env };

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const outPath = path.join(root, 'public', 'firebase-config.js');
const body = `// Auto-generated — do not edit. Set VITE_FIREBASE_* in .env and run npm run dev/build.
self.FIREBASE_WEB_CONFIG = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(outPath, body, 'utf8');
console.log('[firebase] wrote', path.relative(root, outPath));
