// lib/wp-client.ts
//
// WordPress REST API client. Authenticate qua Application Password
// (WP 5.6+ hỗ trợ mặc định, không cần plugin).
//
// Reference: https://developer.wordpress.org/rest-api/

interface WpPost {
  id: number;
  slug: string;
  link: string;
  status: string;
  title: { rendered: string };
}

interface WpCategory {
  id: number;
  slug: string;
  name: string;
}

interface WpUser {
  id: number;
  name: string;
  slug: string;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish' | 'private';
  categories: number[];
  author?: number;
  meta?: Record<string, string>;
}

export class WpClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(baseUrl: string, user: string, appPassword: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${appPassword}`).toString('base64');
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/wp-json/wp/v2${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: this.authHeader,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let detail = body;
      try {
        const parsed = JSON.parse(body);
        detail = parsed.message ?? parsed.code ?? body;
      } catch {
        /* keep raw body */
      }
      throw new Error(`WP REST ${res.status} (${path}): ${detail}`);
    }
    return (await res.json()) as T;
  }

  /**
   * Health check — verify credentials + REST API hoạt động.
   * Trả về user info nếu OK, throw nếu fail.
   */
  async whoAmI(): Promise<WpUser> {
    return this.request<WpUser>('/users/me?context=edit');
  }

  /**
   * Tìm category theo slug. Trả về null nếu không tìm thấy.
   */
  async getCategoryIdBySlug(slug: string): Promise<number | null> {
    const cats = await this.request<WpCategory[]>(
      `/categories?slug=${encodeURIComponent(slug)}&per_page=10`,
    );
    return cats[0]?.id ?? null;
  }

  /**
   * Check post đã tồn tại theo slug. Search cả draft + publish + private.
   */
  async getPostBySlug(slug: string): Promise<WpPost | null> {
    const posts = await this.request<WpPost[]>(
      `/posts?slug=${encodeURIComponent(slug)}&status=publish,draft,private,future&per_page=1&context=edit`,
    );
    return posts[0] ?? null;
  }

  /**
   * Tạo post mới. Trả về post object với id + link.
   */
  async createPost(input: CreatePostInput): Promise<WpPost> {
    return this.request<WpPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update meta của post đã tồn tại (vd để patch lại Rank Math sau).
   */
  async updatePostMeta(postId: number, meta: Record<string, string>): Promise<void> {
    await this.request<WpPost>(`/posts/${postId}`, {
      method: 'POST', // WP REST chấp nhận POST cho update
      body: JSON.stringify({ meta }),
    });
  }

  /**
   * Health check Rank Math meta keys đã được register vào REST.
   * Cần plugin sol-rank-math-rest.php active (xem README).
   */
  async checkRankMathRestRegistered(): Promise<boolean> {
    try {
      // Lấy 1 post bất kỳ với context=edit, kiểm tra field 'meta' có chứa key Rank Math
      const posts = await this.request<Array<WpPost & { meta?: Record<string, any> }>>(
        '/posts?per_page=1&context=edit',
      );
      if (posts.length === 0) {
        // Chưa có post nào — không thể verify, assume OK
        return true;
      }
      return Object.prototype.hasOwnProperty.call(posts[0].meta ?? {}, 'rank_math_focus_keyword');
    } catch {
      return false;
    }
  }
}
