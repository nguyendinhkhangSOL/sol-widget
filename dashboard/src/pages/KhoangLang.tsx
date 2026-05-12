/**
 * KHOẢNG LẶNG — Anonymous Confessions Feed
 * Tab "Đọc" trong app — đàn ông VN 45+ đọc anonymous, react nhẹ, viết tự nguyện.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Confession = {
  id: string;
  content: string;
  readCount: number;
  reactCount: number;
  pinnedAt: string | null;
  createdAt: string;
  autoTag: string | null;
  myReactions: number[];
  hasRead: boolean;
};

const REACTION_ICONS: Record<number, string> = {
  1: '👍',
  2: '🙏',
  3: 'Tôi cũng vậy',
  4: 'Đang cố',
  5: 'Nghe lúc 2h sáng',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return 'vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  return `${weeks} tuần trước`;
}

export function KhoangLang() {
  const [items, setItems] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [writeContent, setWriteContent] = useState('');
  const [writeError, setWriteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.confessionsList();
      setItems(res.items);
      // Mark all visible as read
      res.items.forEach((c) => {
        if (!c.hasRead) {
          api.confessionsRead(c.id).catch(() => {});
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReact(id: string, type: 1 | 2 | 3 | 4 | 5) {
    try {
      const res = await api.confessionsReact(id, type);
      setItems((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const newReactions =
            res.toggled === 'on'
              ? [...c.myReactions, type]
              : c.myReactions.filter((r) => r !== type);
          return {
            ...c,
            myReactions: newReactions,
            reactCount: c.reactCount + (res.toggled === 'on' ? 1 : -1),
          };
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit() {
    setWriteError(null);
    if (writeContent.trim().length < 20) {
      setWriteError('Anh viết ít nhất 20 ký tự.');
      return;
    }
    setSubmitting(true);
    try {
      await api.confessionsCreate(writeContent);
      setWriteContent('');
      setShowWriteForm(false);
      await load();
    } catch (err: any) {
      setWriteError(err.body?.error || 'Có lỗi xảy ra. Anh thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: '#5C3A1E', margin: '0 0 4px' }}>Khoảng Lặng</h1>
        <p style={{ color: '#8A857C', fontSize: 14, margin: 0 }}>
          Anh em viết, anh em đọc. Không tên. Không bị phán xét.
        </p>
      </header>

      <div style={{ marginBottom: 20, textAlign: 'right' }}>
        {!showWriteForm ? (
          <button
            onClick={() => setShowWriteForm(true)}
            style={{
              background: 'transparent',
              border: '1px solid #B25C2C',
              color: '#B25C2C',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            + Viết của riêng anh (anonymous)
          </button>
        ) : (
          <div
            style={{
              background: '#FFF4EA',
              border: '1px solid #E8DFC8',
              borderRadius: 12,
              padding: 16,
              textAlign: 'left',
            }}
          >
            <p style={{ fontSize: 13, color: '#5C3A1E', margin: '0 0 8px' }}>
              <strong>Anh viết anonymous.</strong> Không ai biết là anh. Khang đọc trước khi xuất bản.
            </p>
            <textarea
              value={writeContent}
              onChange={(e) => setWriteContent(e.target.value)}
              placeholder="Hôm nay anh sao? Viết những gì anh muốn anh em khác biết..."
              rows={5}
              maxLength={800}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #E8DFC8',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 12, color: '#8A857C', marginTop: 4 }}>
              {writeContent.length}/800 ký tự
            </div>
            {writeError && (
              <div style={{ fontSize: 13, color: '#8B2D2D', marginTop: 8 }}>{writeError}</div>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowWriteForm(false);
                  setWriteContent('');
                  setWriteError(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #C9BFA8',
                  color: '#5A5650',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Để sau
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: '#B25C2C',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 8,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Đang gửi…' : 'Gửi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>Đang tải…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8A857C', padding: 40 }}>
          Chưa có ai viết. Anh muốn là người đầu tiên?
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((c) => (
            <article
              key={c.id}
              style={{
                background: 'white',
                border: '1px solid #E8DFC8',
                borderRadius: 12,
                padding: 18,
                ...(c.pinnedAt ? { borderLeft: '4px solid #B25C2C' } : {}),
              }}
            >
              {c.pinnedAt && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#B25C2C',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  📌 Pinned
                </div>
              )}
              <p
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  color: '#2C2A27',
                  margin: '0 0 12px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {c.content}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: '#8A857C',
                  flexWrap: 'wrap',
                }}
              >
                <span>— anonymous · {timeAgo(c.createdAt)}</span>
                <span>· {c.readCount} anh em đã đọc</span>
                {c.autoTag && (
                  <span
                    style={{
                      background: '#FFF4EA',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      color: '#B25C2C',
                    }}
                  >
                    {c.autoTag}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #F5EFE3',
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {[1, 2, 3, 4, 5].map((type) => {
                  const isActive = c.myReactions.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleReact(c.id, type as 1 | 2 | 3 | 4 | 5)}
                      style={{
                        background: isActive ? '#B25C2C' : 'transparent',
                        color: isActive ? 'white' : '#5C3A1E',
                        border: '1px solid #E8DFC8',
                        padding: '4px 10px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: 12.5,
                      }}
                    >
                      {REACTION_ICONS[type]}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
