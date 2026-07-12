#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  HUONGDI.SOL.VN — Sitemap Updater
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Append URL mới vào sitemap.xml (idempotent — không duplicate)
 *
 *  Usage:
 *    node update-sitemap.js <sitemap_path> <new_url> [priority]
 *
 *  Example:
 *    node update-sitemap.js /var/www/huongdi/public/sitemap.xml \
 *      https://huongdi.sol.vn/freelancer-chuyen-mon-tuoi-45/ 0.9
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');

const [, , sitemapPath, newUrl, priority = '0.9'] = process.argv;

if (!sitemapPath || !newUrl) {
  console.error('Usage: node update-sitemap.js <sitemap_path> <new_url> [priority]');
  process.exit(1);
}

if (!fs.existsSync(sitemapPath)) {
  console.error(`❌ Sitemap not found: ${sitemapPath}`);
  process.exit(1);
}

let sitemap = fs.readFileSync(sitemapPath, 'utf8');

// Check if URL already exists
if (sitemap.includes(`<loc>${newUrl}</loc>`)) {
  console.log(`⏭️  URL already in sitemap: ${newUrl}`);
  process.exit(0);
}

const today = new Date().toISOString().split('T')[0];
const newEntry = `
  <url>
    <loc>${newUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;

// Insert before </urlset>
sitemap = sitemap.replace('</urlset>', newEntry + '\n</urlset>');

fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`✅ Added to sitemap: ${newUrl} (priority ${priority})`);
