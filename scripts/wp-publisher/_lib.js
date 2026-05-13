// Sol v4 — Shared lib cho WP REST API client
// Dùng chung cho test-auth, list-pages, update-page, bulk-fix-seo, import-wiki.

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Load .env ──────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('✗ Không tìm thấy .env');
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

const env = loadEnv();
const { WP_URL, WP_USERNAME, WP_APP_PASSWORD } = env;

if (!WP_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
  console.error('✗ Thiếu WP_URL, WP_USERNAME hoặc WP_APP_PASSWORD trong .env');
  process.exit(1);
}

const cleanPassword = WP_APP_PASSWORD.replace(/\s+/g, '');
const AUTH = 'Basic ' + Buffer.from(`${WP_USERNAME}:${cleanPassword}`).toString('base64');

// ─── HTTP helper ────────────────────────────────────────────────────
function request(method, pathName, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, WP_URL);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: {
          'Authorization': AUTH,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'SolWpPublisher/1.0',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
        timeout: 30000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = raw; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(`HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = parsed;
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

const api = {
  get:    (p)      => request('GET', p),
  post:   (p, b)   => request('POST', p, b),
  put:    (p, b)   => request('PUT', p, b),
  delete: (p)      => request('DELETE', p),
};

module.exports = { api, WP_URL, WP_USERNAME };
