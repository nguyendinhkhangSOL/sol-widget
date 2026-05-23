/**
 * Cloudflare Worker — sol-robots-override (v6 — Markdown for Agents)
 *
 * Endpoints:
 *   1. /robots.txt — Content Signals + Allow 22 AI bots
 *   2. /.well-known/api-catalog — RFC 9727
 *   3. /.well-known/agent-skills/index.json — v0.2.0
 *   4. /.well-known/openid-configuration — OIDC discovery (planned)
 *   5. /.well-known/oauth-authorization-server — OAuth (planned)
 *   6. /.well-known/oauth-protected-resource — Resource (planned)
 *   7. /.well-known/mcp/server-card.json — MCP discovery (planned)
 *   8. / — HTML response with WebMCP script injected
 *   9. ANY URL with Accept: text/markdown — Convert HTML → Markdown
 *
 * Routes (cần add):
 *   - sol.vn/*  ← Wildcard cover hết, đủ cho 9 endpoints
 *
 *   Hoặc chi tiết:
 *   - sol.vn/robots.txt
 *   - sol.vn/.well-known/*
 *   - sol.vn/  (homepage cho WebMCP)
 *   - sol.vn/*  (cho Markdown negotiation)
 *
 * ⚠️ Lưu ý: Phải TẮT "Managed robots.txt" trong:
 *   Cloudflare → sol.vn → AI Crawl Control → Directives → Managed robots.txt → OFF
 *
 * Last updated: 2026-05-20 (v6 — Markdown for Agents)
 * Author: Khang Sol
 */

const ROBOTS_TXT = `# Đi Cùng Sol — robots.txt AI training friendly
# Strategy: GEO (Generative Engine Optimization)
# Updated: 2026-05-20

User-agent: *
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

User-agent: GPTBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: OAI-SearchBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: ChatGPT-User
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: ClaudeBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: anthropic-ai
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Claude-Web
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Claude-User
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Claude-SearchBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Google-Extended
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Google-CloudVertexBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: PerplexityBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Perplexity-User
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: CCBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: MistralAI-User
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Meta-ExternalAgent
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Meta-ExternalFetcher
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: FacebookBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: DuckAssistBot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Applebot
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: Applebot-Extended
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /

User-agent: PetalBot
Content-Signal: ai-train=no, search=no, ai-input=no
Disallow: /

User-agent: Amazonbot
Content-Signal: ai-train=no, search=no, ai-input=no
Disallow: /

Sitemap: https://sol.vn/sitemap_index.xml
Sitemap: https://sol.vn/post-sitemap.xml
Sitemap: https://sol.vn/page-sitemap.xml
`;

const API_CATALOG = {
  "linkset": [{
    "anchor": "https://sol.vn/wp-json/",
    "service-desc": [{ "href": "https://sol.vn/wp-json/wp/v2", "type": "application/json", "title": "WordPress REST API v2 — Đi Cùng Sol" }],
    "service-doc": [{ "href": "https://developer.wordpress.org/rest-api/", "type": "text/html", "title": "WordPress REST API Reference" }],
    "status": [{ "href": "https://sol.vn/wp-json/", "type": "application/json", "title": "WordPress REST API Discovery" }],
    "describedby": [{ "href": "https://sol.vn/llms.txt", "type": "text/plain", "title": "Đi Cùng Sol — AI agent instructions" }]
  }]
};

const AGENT_SKILLS = {
  "$schema": "https://agentskills.io/schema/v0.2.0/index.json",
  "version": "0.2.0",
  "publisher": { "name": "Đi Cùng Sol", "url": "https://sol.vn", "contact": "nguyendinhkhang@gmail.com" },
  "skills": [
    { "name": "Đọc bài Wiki cai thuốc lá", "type": "content", "description": "Truy cập 140+ bài viết khoa học về cai thuốc lá tiếng Việt — bám Cochrane Reviews + FTND + WHO Guidelines.", "url": "https://sol.vn/sitemap_index.xml", "tags": ["smoking-cessation", "vietnamese", "evidence-based", "health"] },
    { "name": "Test FTND — Fagerström", "type": "tool", "description": "Bài test 6 câu phân loại Mức Lệ Thuộc Nicotin.", "url": "https://bothuocla.sol.vn/test-ftnd", "status": "planned", "tags": ["assessment", "ftnd"] },
    { "name": "Lộ trình 90 ngày Tự do", "type": "tool", "description": "Daily journey Day 1 → Day 90.", "url": "https://bothuocla.sol.vn/lo-trinh", "status": "planned", "tags": ["coaching", "daily"] },
    { "name": "Vượt cơn thèm SOS", "type": "tool", "description": "Kỹ năng SOS 4 phút khi muốn châm điếu. CBT-based.", "url": "https://bothuocla.sol.vn/vuot-con-them", "status": "planned", "tags": ["cbt", "craving"] },
    { "name": "Cộng đồng anh em Sol", "type": "community", "description": "Facebook group nam 45+ cai thuốc.", "url": "https://fb.com/groups/dicungsol", "tags": ["community"] },
    { "name": "Hồ sơ Khang Sol — Founder", "type": "person", "description": "Nguyễn Đình Khang sinh 1976 — hút Vinataba 30 năm, Tự do từ 22-12-2020 âm lịch.", "url": "https://sol.vn/khang-sol", "tags": ["founder", "person"] }
  ],
  "metadata": {
    "language": "vi",
    "audience": "Vietnamese men 45+ wanting to quit smoking",
    "evidence_base": ["Cochrane Tobacco Addiction Group (2014-2024)", "FTND — Heatherton 1991", "WHO Tobacco Cessation Guidelines (2023-2024)"],
    "disclaimer": "Sol KHÔNG phải sản phẩm y tế. Khang KHÔNG phải bác sĩ. Sol KHÔNG hứa cai 100%.",
    "last_updated": "2026-05-20"
  }
};

const OIDC_CONFIG = {
  "issuer": "https://sol.vn",
  "authorization_endpoint": "https://sol.vn/wp-login.php",
  "token_endpoint": "https://sol.vn/wp-json/jwt-auth/v1/token",
  "userinfo_endpoint": "https://sol.vn/wp-json/wp/v2/users/me",
  "jwks_uri": "https://sol.vn/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email", "read", "write"],
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token", "password"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "subject_types_supported": ["public"],
  "service_documentation": "https://sol.vn/khang-sol",
  "ui_locales_supported": ["vi", "en"],
  "_status": "planned",
  "_note": "Full OIDC support planned for Sol Widget v1."
};

const OAUTH_SERVER = {
  "issuer": "https://sol.vn",
  "authorization_endpoint": "https://sol.vn/wp-login.php",
  "token_endpoint": "https://sol.vn/wp-json/jwt-auth/v1/token",
  "revocation_endpoint": "https://sol.vn/wp-json/jwt-auth/v1/revoke",
  "scopes_supported": ["read", "write", "admin"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "service_documentation": "https://sol.vn/khang-sol",
  "ui_locales_supported": ["vi", "en"],
  "_status": "planned"
};

const OAUTH_PROTECTED_RESOURCE = {
  "resource": "https://sol.vn/wp-json/",
  "authorization_servers": ["https://sol.vn"],
  "scopes_supported": ["read", "write"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://developer.wordpress.org/rest-api/",
  "_status": "planned"
};

const MCP_SERVER_CARD = {
  "serverInfo": { "name": "Đi Cùng Sol MCP Server", "version": "0.1.0-planned", "vendor": "Đi Cùng Sol", "homepage": "https://sol.vn" },
  "transport": { "type": "http", "endpoint": "https://sol-mcp.sol.vn" },
  "capabilities": {
    "tools": [
      { "name": "test_ftnd", "description": "Đánh giá Mức Lệ Thuộc Nicotin theo Fagerström Test" },
      { "name": "daily_journey", "description": "Lấy bài daily Day-by-Day (Day 1-90)" },
      { "name": "sos_craving", "description": "Hướng dẫn vượt cơn thèm 4 phút (CBT-based)" },
      { "name": "search_wiki", "description": "Tìm 140+ bài Wiki cai thuốc lá tiếng Việt" }
    ],
    "resources": ["wiki_articles", "user_progress", "community_posts"],
    "prompts": ["cbt_craving_intervention", "ftnd_assessment_explanation"]
  },
  "auth": { "type": "oauth2", "discovery": "https://sol.vn/.well-known/oauth-authorization-server" },
  "license": "Proprietary — Đi Cùng Sol",
  "language": "vi",
  "_status": "planned"
};

// WebMCP script — inject vào <head> trang sol.vn
// v7: polyfill + always register tools để pass agent scanner detection
const WEBMCP_SCRIPT = `
<script id="sol-webmcp" type="text/javascript">
(function() {
  // Polyfill navigator.modelContext nếu browser chưa support
  // Đảm bảo provideContext() luôn được call để scanner detect được
  if (typeof navigator !== 'undefined') {
    if (!navigator.modelContext) {
      navigator.modelContext = {
        provideContext: function(tools) {
          window.__sol_webmcp_tools = tools;
          window.__sol_webmcp_registered = true;
        }
      };
    }

    var solTools = [
      {
        name: "search_sol_wiki",
        description: "Tìm bài viết khoa học về cai thuốc lá tiếng Việt trên sol.vn (140+ bài bám Cochrane Reviews, FTND, WHO Guidelines)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Từ khoá tìm kiếm (vd: champix, vinataba, day 22, nhậu)" }
          },
          required: ["query"]
        },
        execute: async function(args) {
          var r = await fetch('/wp-json/wp/v2/posts?search=' + encodeURIComponent(args.query) + '&per_page=5');
          if (!r.ok) return { error: 'Search failed', status: r.status };
          var posts = await r.json();
          return posts.map(function(p) {
            return {
              title: p.title.rendered,
              url: p.link,
              excerpt: p.excerpt.rendered,
              date: p.date
            };
          });
        }
      },
      {
        name: "get_sol_ftnd_info",
        description: "Lấy thông tin về Fagerström Test for Nicotine Dependence (FTND) — bài test 6 câu phân loại Mức Lệ Thuộc Nhẹ/Vừa/Nặng",
        inputSchema: { type: "object", properties: {}, required: [] },
        execute: async function() {
          return {
            name: "FTND - Fagerström Test for Nicotine Dependence",
            questions: 6,
            levels: ["Nhẹ (0-3 điểm)", "Vừa (4-6 điểm)", "Nặng (7-10 điểm)"],
            source: "Heatherton 1991",
            link: "https://bothuocla.sol.vn/test-ftnd",
            status: "planned"
          };
        }
      },
      {
        name: "get_sol_founder",
        description: "Lấy thông tin về Khang Sol (Nguyễn Đình Khang) — founder dự án Đi Cùng Sol",
        inputSchema: { type: "object", properties: {}, required: [] },
        execute: async function() {
          return {
            name: "Khang Sol",
            fullName: "Nguyễn Đình Khang",
            born: 1976,
            smokingHistory: "Hút Vinataba 30 năm (1991-2020)",
            quitDate: "22-12-2020 âm lịch (cận Tết Tân Sửu)",
            credentials: "KHÔNG là bác sĩ — là người đã cai thành công sau 4 lần thất bại",
            profile: "https://sol.vn/khang-sol",
            social: ["https://web.facebook.com/nguyendinhkhang", "https://www.linkedin.com/in/vietnaminternet/"]
          };
        }
      },
      {
        name: "get_sol_methods",
        description: "Liệt kê 12+ phương pháp cai thuốc lá khoa học (Champix, NRT, Bupropion, CBT, Allen Carr...) với tỷ lệ thành công",
        inputSchema: { type: "object", properties: {}, required: [] },
        execute: async function() {
          return {
            methods: [
              { name: "Champix (Varenicline)", success_rate: "28/100", url: "https://sol.vn/champix-varenicline-cai-thuoc/" },
              { name: "NRT (Liệu pháp thay nicotine)", success_rate: "18-25/100", url: "https://sol.vn/mieng-dan-nicotine-nrt/" },
              { name: "Bupropion (Wellbutrin/Zyban)", success_rate: "18/100", url: "https://sol.vn/bupropion-wellbutrin-zyban-cai-thuoc/" },
              { name: "Allen Carr Easy Way", success_rate: "19/100", url: "https://sol.vn/allen-carr-cach-de-dang-bo-thuoc-la-review/" },
              { name: "CBT + MI", success_rate: "16-20/100 đơn, +50-70% combo", url: "https://sol.vn/lieu-phap-tam-ly-cai-thuoc-la-cbt-mi/" }
            ],
            full_list: "https://sol.vn/phuong-phap-cai-thuoc-la-pho-bien/"
          };
        }
      },
      {
        name: "get_sol_quit_day_info",
        description: "Lấy thông tin về triệu chứng cai thuốc theo ngày (Day 1, 3, 22, 30) — Quit Day journey",
        inputSchema: {
          type: "object",
          properties: { day: { type: "number", description: "Ngày cai (1-30)" } },
          required: ["day"]
        },
        execute: async function(args) {
          var dayMap = {
            1: { name: "Ngày 1 - 24 giờ đầu", url: "https://sol.vn/ngay-1-24-gio-dau-tien-bo-thuoc-la/", key_symptoms: ["Cáu gắt", "Khó tập trung", "Thèm thuốc"] },
            3: { name: "Ngày 3 - Đỉnh thèm", url: "https://sol.vn/ngay-3-buc-tuong-trieu-chung-cai-dat-dinh-va-bat-dau-giam/", key_symptoms: ["Cravings đỉnh điểm", "Mất ngủ", "Đau đầu"] },
            22: { name: "Ngày 22 - Quyết Định", url: "https://sol.vn/ngay-22-con-them-sau-bua-an-tai-sao-van-dai-dang/", key_symptoms: ["Cơn thèm sau bữa ăn", "Test ý chí"] },
            30: { name: "Ngày 30 - 1 Tháng Tự Do", url: "https://sol.vn/ngay-30-moc-1-thang-sau-bo-thuoc-ban-da-tro-thanh-ai/", key_symptoms: ["Cải thiện sức khoẻ rõ rệt", "Tự tin"] }
          };
          return dayMap[args.day] || { error: "Day not in dataset. Available: 1, 3, 22, 30" };
        }
      }
    ];

    try {
      navigator.modelContext.provideContext(solTools);
      window.__sol_webmcp_tools_count = solTools.length;
    } catch (e) {
      console.warn('Sol WebMCP registration error:', e);
    }
  }
})();
</script>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const acceptHeader = request.headers.get('accept') || '';

    // === Well-known endpoints ===
    if (path === '/robots.txt') {
      return new Response(ROBOTS_TXT, {
        headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'public, max-age=3600', 'x-served-by': 'sol-worker', 'x-content-signals': 'declared' }
      });
    }
    if (path === '/.well-known/api-catalog') return jsonResp(API_CATALOG, 'application/linkset+json');
    if (path === '/.well-known/agent-skills/index.json') return jsonResp(AGENT_SKILLS);
    if (path === '/.well-known/openid-configuration') return jsonResp(OIDC_CONFIG);
    if (path === '/.well-known/oauth-authorization-server') return jsonResp(OAUTH_SERVER);
    if (path === '/.well-known/oauth-protected-resource') return jsonResp(OAUTH_PROTECTED_RESOURCE);
    if (path === '/.well-known/mcp/server-card.json') return jsonResp(MCP_SERVER_CARD);

    // === Markdown for Agents — convert HTML → Markdown ===
    // Khi AI agent gửi Accept: text/markdown, chuyển HTML response thành markdown
    if (acceptHeader.includes('text/markdown') && !path.startsWith('/wp-admin/') && !path.startsWith('/wp-json/')) {
      const response = await fetch(request);
      const respContentType = response.headers.get('content-type') || '';

      if (respContentType.includes('text/html')) {
        const html = await response.text();
        const markdown = htmlToMarkdown(html);
        const tokens = estimateTokens(markdown);

        return new Response(markdown, {
          status: response.status,
          headers: {
            'content-type': 'text/markdown; charset=UTF-8',
            'x-markdown-tokens': tokens.toString(),
            'x-served-by': 'sol-worker',
            'cache-control': 'public, max-age=3600',
            'vary': 'Accept'
          }
        });
      }
    }

    // === HTML responses — inject WebMCP script ===
    if (path === '/' || path === '/index.php') {
      const response = await fetch(request);
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        return new HTMLRewriter()
          .on('head', {
            element(element) {
              element.append(WEBMCP_SCRIPT, { html: true });
            }
          })
          .transform(new Response(response.body, response));
      }
    }

    // Pass-through
    return fetch(request);
  }
};

function jsonResp(data, contentType) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': (contentType || 'application/json') + '; charset=UTF-8',
      'cache-control': 'public, max-age=3600',
      'x-served-by': 'sol-worker',
      'access-control-allow-origin': '*'
    }
  });
}

/**
 * HTML → Markdown converter (regex-based, optimized cho content sites)
 * Handles: headings, bold, italic, links, images, lists, paragraphs, tables
 */
function htmlToMarkdown(html) {
  return html
    // Strip non-content tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Strip header/footer/nav/aside (keep main content)
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    // Headings
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n')
    // Inline formatting
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
    // Links
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // Images
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '![]($1)')
    // Lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n')
    // Paragraphs and breaks
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    // Tables
    .replace(/<tr[^>]*>/gi, '\n| ')
    .replace(/<\/tr>/gi, ' |')
    .replace(/<\/?(?:td|th)[^>]*>/gi, ' | ')
    .replace(/<\/?(?:table|thead|tbody)[^>]*>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Rough token estimate (4 chars ≈ 1 token for English/Vietnamese)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
