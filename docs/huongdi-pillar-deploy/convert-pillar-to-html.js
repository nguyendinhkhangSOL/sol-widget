#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  HUONGDI.SOL.VN — Pillar Page Builder (Markdown → HTML)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Convert pillar markdown → standalone HTML với:
 *    - Frontmatter YAML → SEO metadata
 *    - Markdown body → HTML semantic
 *    - Inject header + footer thống nhất
 *    - Schema.org Article + FAQPage JSON-LD
 *    - CSS prose styling đồng bộ Sol brand
 *
 *  Usage:
 *    npm install marked                                      # 1 lần duy nhất
 *    node convert-pillar-to-html.js <input.md> <output.html>
 *
 *  Example:
 *    node convert-pillar-to-html.js \
 *      ../huongdi-seo-content/pillar-01-freelancer-chuyen-mon.md \
 *      /var/www/huongdi/public/freelancer-chuyen-mon-tuoi-45/index.html
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// Try load marked, give friendly error if missing
let marked;
try {
  marked = require('marked');
} catch (e) {
  console.error('\n❌ Package "marked" not found.');
  console.error('Install: cd ' + __dirname + ' && npm install marked\n');
  process.exit(1);
}

// ── Parse args ────────────────────────────────────────────────────────
const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node convert-pillar-to-html.js <input.md> <output.html>');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Input file not found: ${inputPath}`);
  process.exit(1);
}

const SCRIPT_DIR = __dirname;
const headerHtml = fs.readFileSync(path.join(SCRIPT_DIR, '..', 'huongdi-layout', 'header.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(SCRIPT_DIR, '..', 'huongdi-layout', 'footer.html'), 'utf8');

// ── Parse frontmatter ─────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };

  const yamlText = m[1];
  const body = m[2];
  const meta = {};
  let currentKey = null;
  let currentList = null;

  for (const line of yamlText.split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('  - ')) {
      // List item
      if (currentList) currentList.push(line.substring(4).replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === '') {
        // Could be list start
        meta[currentKey] = [];
        currentList = meta[currentKey];
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
        currentList = null;
      }
    }
  }
  return { meta, body };
}

// ── Escape HTML attr ──────────────────────────────────────────────────
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Build Article Schema ──────────────────────────────────────────────
function buildArticleSchema(meta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    image: meta.og_image || 'https://huongdi.sol.vn/og/default.jpg',
    datePublished: meta.date || '2026-06-22',
    dateModified: meta.date || '2026-06-22',
    author: {
      '@type': 'Person',
      name: meta.author || 'Khang Sol',
      url: 'https://sol.vn/khang-sol/'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Đi Cùng Sol',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sol.vn/wp-content/uploads/2025/05/Icon_2.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': meta.canonical
    },
    keywords: [meta.primary_keyword, ...(Array.isArray(meta.secondary_keywords) ? meta.secondary_keywords : [])].filter(Boolean).join(', ')
  };
}

// ── Build FAQ schema from H3 in FAQ section ───────────────────────────
function buildFAQSchema(bodyHtml) {
  const faqMatch = bodyHtml.match(/<h2[^>]*>(?:.*Câu Hỏi Thường Gặp.*|.*FAQ.*)<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!faqMatch) return null;
  const faqSection = faqMatch[1];
  const questions = [];
  const qaMatches = [...faqSection.matchAll(/<h3[^>]*>(.*?)<\/h3>\s*([\s\S]*?)(?=<h3|$)/g)];
  for (const m of qaMatches) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    const aHtml = m[2].trim();
    const aText = aHtml.replace(/<[^>]+>/g, '').trim();
    if (q && aText) {
      questions.push({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: aText }
      });
    }
  }
  if (questions.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions
  };
}

// ── Build BreadcrumbList ──────────────────────────────────────────────
function buildBreadcrumbSchema(meta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://huongdi.sol.vn/' },
      { '@type': 'ListItem', position: 2, name: '37 Hướng Đi', item: 'https://huongdi.sol.vn/p3.html' },
      { '@type': 'ListItem', position: 3, name: meta.title, item: meta.canonical }
    ]
  };
}

// ── Main ──────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  Pillar Builder — Markdown → HTML');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}`);

const raw = fs.readFileSync(inputPath, 'utf8');
const { meta, body } = parseFrontmatter(raw);

console.log(`\nMetadata:`);
console.log(`  Title:    ${meta.title}`);
console.log(`  Slug:     ${meta.slug}`);
console.log(`  Keyword:  ${meta.primary_keyword}`);
console.log(`  Canonical: ${meta.canonical}`);

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false
});

// Convert body
const bodyHtml = marked.parse(body);

// Build schemas
const articleSchema = buildArticleSchema(meta);
const breadcrumbSchema = buildBreadcrumbSchema(meta);
const faqSchema = buildFAQSchema(bodyHtml);

const allSchemas = [articleSchema, breadcrumbSchema];
if (faqSchema) allSchemas.push(faqSchema);

console.log(`\nSchemas: Article + Breadcrumb${faqSchema ? ' + FAQPage' : ''}`);

// ── Compose final HTML ────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">

  <!-- ═══════ SEO META ═══════ -->
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta name="keywords" content="${esc([meta.primary_keyword, ...(Array.isArray(meta.secondary_keywords) ? meta.secondary_keywords : [])].filter(Boolean).join(', '))}">
  <link rel="canonical" href="${esc(meta.canonical)}">
  <meta name="author" content="${esc(meta.author || 'Khang Sol')}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="language" content="vi-VN">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${esc(meta.canonical)}">
  <meta property="og:image" content="${esc(meta.og_image || 'https://huongdi.sol.vn/og/default.jpg')}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:site_name" content="Đi Cùng Sol — Hướng Đi U45">
  <meta property="article:author" content="${esc(meta.author || 'Khang Sol')}">
  <meta property="article:published_time" content="${esc(meta.date || '2026-06-22')}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(meta.title)}">
  <meta name="twitter:description" content="${esc(meta.description)}">
  <meta name="twitter:image" content="${esc(meta.og_image || 'https://huongdi.sol.vn/og/default.jpg')}">

  <!-- JSON-LD Schemas -->
${allSchemas.map(s => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2).split('\n').map(l => '  ' + l).join('\n')}\n  </script>`).join('\n')}

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="https://sol.vn/wp-content/uploads/2025/05/Icon_2.png">

  <!-- Prose Styles -->
  <style>
    :root {
      --sol-primary: #d97706;
      --sol-primary-dark: #b45309;
      --sol-text: #1c1917;
      --sol-text-secondary: #44403c;
      --sol-bg: #ffffff;
      --sol-bg-soft: #fafaf9;
      --sol-border: rgba(0,0,0,0.08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      font-size: 17px;
      line-height: 1.7;
      color: var(--sol-text);
      background: var(--sol-bg);
      -webkit-font-smoothing: antialiased;
    }

    /* Article container */
    .pillar-article {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 20px 60px;
    }

    /* Article meta */
    .pillar-meta {
      color: #78716c;
      font-size: 14px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--sol-border);
    }
    .pillar-meta a {
      color: var(--sol-primary);
      text-decoration: none;
    }
    .pillar-meta a:hover { text-decoration: underline; }

    /* Headings */
    h1 {
      font-size: 36px;
      line-height: 1.2;
      font-weight: 800;
      margin: 0 0 24px;
      color: var(--sol-text);
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 28px;
      line-height: 1.3;
      font-weight: 700;
      margin: 48px 0 16px;
      color: var(--sol-text);
      letter-spacing: -0.01em;
      padding-top: 8px;
    }
    h3 {
      font-size: 21px;
      line-height: 1.35;
      font-weight: 700;
      margin: 32px 0 12px;
      color: var(--sol-text);
    }

    /* Paragraph */
    p {
      margin: 0 0 20px;
      color: var(--sol-text-secondary);
    }

    /* Inline elements */
    strong { color: var(--sol-text); font-weight: 700; }
    em { color: var(--sol-text); font-style: italic; }

    /* Links */
    a {
      color: var(--sol-primary);
      text-decoration: none;
      border-bottom: 1px solid rgba(217, 119, 6, 0.3);
      transition: border-color 0.2s, color 0.2s;
    }
    a:hover {
      color: var(--sol-primary-dark);
      border-bottom-color: var(--sol-primary-dark);
    }

    /* Lists */
    ul, ol {
      margin: 0 0 20px;
      padding-left: 28px;
    }
    li {
      margin-bottom: 8px;
      color: var(--sol-text-secondary);
    }
    li::marker { color: var(--sol-primary); }

    /* Blockquote */
    blockquote {
      border-left: 4px solid var(--sol-primary);
      padding: 12px 20px;
      margin: 24px 0;
      background: #fffbeb;
      color: var(--sol-text);
      border-radius: 4px;
    }
    blockquote p { margin: 0; }

    /* Code */
    code {
      background: #f5f5f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
      font-size: 0.9em;
      color: var(--sol-primary-dark);
    }

    /* HR */
    hr {
      border: 0;
      border-top: 1px solid var(--sol-border);
      margin: 48px 0;
    }

    /* CTA boxes (custom shortcode rendering) */
    .pillar-article p:has(> a[href*="/p1.html"]) {
      /* Highlight CTA paragraph */
    }

    /* Mobile */
    @media (max-width: 640px) {
      .pillar-article {
        padding: 24px 16px 40px;
      }
      h1 { font-size: 28px; }
      h2 { font-size: 22px; margin-top: 40px; }
      h3 { font-size: 18px; margin-top: 28px; }
      body { font-size: 16px; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      :root {
        --sol-text: #f5f5f4;
        --sol-text-secondary: #d6d3d1;
        --sol-bg: #0c0a09;
        --sol-bg-soft: #1c1917;
        --sol-border: rgba(255,255,255,0.08);
      }
      blockquote {
        background: rgba(245, 158, 11, 0.08);
      }
      code {
        background: rgba(255, 255, 255, 0.05);
        color: #fbbf24;
      }
    }
  </style>
</head>
<body>

<!-- SOL-HEADER-START -->
${headerHtml.trim()}
<!-- SOL-HEADER-END -->

<main class="pillar-article" role="main">
  <article itemscope itemtype="https://schema.org/Article">
    ${bodyHtml.replace(/<p>\*([^*]+)\*<\/p>/g, '<div class="pillar-meta">$1</div>').replace(/<p>(\*[^*<]+(?:Cập nhật|Reading time|Tác giả)[^*<]*\*)<\/p>/gi, m => m.replace(/\*/g, '').replace(/<p>/, '<div class="pillar-meta">').replace(/<\/p>$/, '</div>'))}
  </article>
</main>

<!-- SOL-FOOTER-START -->
${footerHtml.trim()}
<!-- SOL-FOOTER-END -->

</body>
</html>
`;

// ── Write output ──────────────────────────────────────────────────────
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\n📁 Created directory: ${outDir}`);
}

fs.writeFileSync(outputPath, html, 'utf8');

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  ✅ Generated: ${outputPath}`);
console.log(`  Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log('═══════════════════════════════════════════════════════════════════');
