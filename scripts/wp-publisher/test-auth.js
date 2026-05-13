#!/usr/bin/env node
/**
 * Sol v4 — Test WP Application Password auth
 *
 * Usage: node test-auth.js
 *
 * Đọc .env → gọi GET /wp-json/wp/v2/users/me → in info user nếu auth OK.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Load .env ──────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('✗ Không tìm thấy .env — anh copy .env.example sang .env và điền giá trị.');
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
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

// Basic auth: username:app-password → base64
// Application Password có space — WP yêu cầu loại bỏ space khi gửi
const cleanPassword = WP_APP_PASSWORD.replace(/\s+/g, '');
const auth = Buffer.from(`${WP_USERNAME}:${cleanPassword}`).toString('base64');

const url = new URL('/wp-json/wp/v2/users/me?context=edit', WP_URL);

console.log(`▶ Đang test với:`);
console.log(`  WP_URL:      ${WP_URL}`);
console.log(`  WP_USERNAME: ${WP_USERNAME}`);
console.log(`  Password:    ${cleanPassword.slice(0, 4)}...${cleanPassword.slice(-4)} (${cleanPassword.length} chars)`);
console.log('');

const req = https.get(
  url.href,
  {
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'SolWpPublisher/1.0',
      'Accept': 'application/json',
    },
    timeout: 15000,
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log(`HTTP ${res.statusCode}`);
      console.log('');
      try {
        const data = JSON.parse(body);
        if (res.statusCode === 200) {
          console.log('✓ AUTH OK — Application Password hoạt động.');
          console.log('');
          console.log(`  User ID:       ${data.id}`);
          console.log(`  Username:      ${data.username || data.slug}`);
          console.log(`  Display name:  ${data.name}`);
          console.log(`  Email:         ${data.email}`);
          console.log(`  Roles:         ${(data.roles || []).join(', ')}`);
          console.log(`  Capabilities:  ${Object.keys(data.capabilities || {}).filter((k) => data.capabilities[k]).slice(0, 8).join(', ')}...`);
        } else {
          console.error('✗ AUTH THẤT BẠI');
          console.error(JSON.stringify(data, null, 2));
        }
      } catch (e) {
        console.error('✗ Không parse được response:');
        console.error(body.slice(0, 500));
      }
    });
  },
);

req.on('error', (e) => {
  console.error('✗ Network error:', e.message);
});

req.on('timeout', () => {
  console.error('✗ Timeout sau 15s');
  req.destroy();
});
