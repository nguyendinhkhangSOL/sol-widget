// lib/markdown.ts
//
// Parse markdown file với YAML frontmatter, convert sang HTML, extract excerpt
// từ section "Hook" để dùng làm post excerpt trong WordPress.

import matter from 'gray-matter';
import { Marked } from 'marked';
// @ts-ignore — marked-footnote không có official types
import markedFootnote from 'marked-footnote';

export interface ParsedFrontmatter {
  title: string;
  slug: string;
  meta_description?: string;
  target_keyword?: string;
  audience?: string;
  word_count_goal?: string;
  estimated_read_time?: string;
  priority?: string;
  [key: string]: any;
}

export interface ParsedMarkdown {
  meta: ParsedFrontmatter;
  html: string;
  excerpt: string;
}

// Marked instance với footnote support
const marked = new Marked();
marked.use(markedFootnote());
marked.use({
  gfm: true,
  breaks: false,
});

export function parseMarkdownFile(md: string): ParsedMarkdown {
  const { data, content } = matter(md);

  // Validate required fields
  if (!data.title) throw new Error('Frontmatter thiếu "title"');
  if (!data.slug) throw new Error('Frontmatter thiếu "slug"');

  // Extract Hook section làm excerpt (trước khi convert HTML)
  const excerpt = extractHookExcerpt(content);

  // Convert MD → HTML
  let html = marked.parse(content) as string;

  // Wrap trong figure cho block editor friendly (Gutenberg classic block)
  // Nếu cần Gutenberg blocks thật, parse thêm — hiện tại WP block editor
  // import HTML thành "Classic" block, vẫn render OK.
  return {
    meta: data as ParsedFrontmatter,
    html,
    excerpt,
  };
}

/**
 * Lấy đoạn Hook (sau "## Hook" đến section tiếp theo) làm excerpt.
 * Bỏ markdown formatting, cắt ≤ 250 ký tự.
 */
function extractHookExcerpt(content: string): string {
  const hookMatch = content.match(/##\s*Hook\s*\n+([\s\S]+?)(?=\n##\s|$)/);
  if (!hookMatch) {
    // Fallback: lấy đoạn đầu tiên không phải header
    const firstPara = content.match(/^(?!---|##|#)([^\n]+(?:\n[^\n]+)*)/m);
    return cleanForExcerpt(firstPara?.[0] ?? '').slice(0, 250);
  }
  return cleanForExcerpt(hookMatch[1]).slice(0, 250);
}

function cleanForExcerpt(text: string): string {
  return text
    .replace(/^>\s*/gm, '')           // Bỏ blockquote
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bỏ bold
    .replace(/\*(.+?)\*/g, '$1')      // Bỏ italic
    .replace(/`(.+?)`/g, '$1')        // Bỏ inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Link → text
    .replace(/\n+/g, ' ')             // Newlines → spaces
    .replace(/\s+/g, ' ')             // Collapse spaces
    .trim();
}
