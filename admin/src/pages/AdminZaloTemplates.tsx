// admin/src/pages/AdminZaloTemplates.tsx
//
// Bộ biên tập Zalo ZNS template — Khang soạn template trong Admin Sol,
// editor có:
//   - Counter 400 ký tự live
//   - Lint từ ngữ cấm (3 cấp Critical/Warning/Info)
//   - Preview render Zalo OA chat style
//   - 1-click submit Zalo (sẽ wire API sau)
//
// Phase 1: full UI hardcoded data + lint hoạt động real-time.

import { useState, useMemo } from 'react';
import { lintZNSText, canSubmitTemplate, countChars, extractParams, type LintIssue } from '../lib/zaloLinter';

type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

interface Template {
  code: string;
  zaloManagerName: string;
  tag: '1' | '2' | '3';
  title: string;
  body: string;
  ctaButtons: Array<{ label: string; type: string; value?: string }>;
  status: TemplateStatus;
  charCount: number;
}

// Hardcoded 12 templates Sol đã viết sẵn (Phase 1)
const SEED_TEMPLATES: Template[] = [
  {
    code: 'SOL_WELCOME',
    zaloManagerName: 'Sol — Chào mừng Day 1',
    tag: '2',
    title: 'Chào {name} — anh đã tham gia chương trình Sol!',
    body: '7 ngày đầu là chặng Nhận Diện — anh chỉ cần quan sát.\nCoach cá nhân hoá đã sẵn sàng đồng hành.\n\n— Khang Sol',
    ctaButtons: [
      { label: 'Nghe voice chào mừng', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn/voice/welcome' },
      { label: 'Mở Sol', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn' },
    ],
    status: 'APPROVED',
    charCount: 210,
  },
  {
    code: 'SOL_Q_DAY_MORNING',
    zaloManagerName: 'Sol — Sáng cột mốc 22',
    tag: '2',
    title: 'Hôm nay là cột mốc Ngày 22 của {name}!',
    body: 'Bắt đầu chặng 30 ngày tiếp theo. Anh đã chuẩn bị 3 tuần.\nSol đã sẵn sàng. Khang ở đó.',
    ctaButtons: [
      { label: 'Mở Sol — Cam kết', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn/q-day' },
      { label: 'Gọi Khang', type: 'MAKE_PHONE_CALL', value: '+84912727381' },
    ],
    status: 'APPROVED',
    charCount: 230,
  },
  {
    code: 'SOL_DAILY_CHECKIN',
    zaloManagerName: 'Sol — Nhắc check-in tối',
    tag: '2',
    title: 'Anh ơi, 30 giây check-in tối nay.',
    body: 'Hôm nay anh ở Ngày {day}, streak {streak} ngày.\nSol đợi anh ghi lại 1 dòng.',
    ctaButtons: [
      { label: 'Check-in 30s', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn/checkin' },
    ],
    status: 'APPROVED',
    charCount: 150,
  },
  {
    code: 'SOL_CRISIS_DETECT',
    zaloManagerName: 'Sol — Phát hiện moment khó',
    tag: '2',
    title: 'Mình thấy {name} đang ở moment khó.',
    body: 'Đừng cố một mình. Bài tập 4-7-8 chỉ 4 phút.\nHoặc gọi Khang nếu cần.',
    ctaButtons: [
      { label: 'Mở bài tập', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn/breathing' },
      { label: 'Gọi Khang', type: 'MAKE_PHONE_CALL', value: '+84912727381' },
    ],
    status: 'APPROVED',
    charCount: 170,
  },
];

export function AdminZaloTemplates() {
  const [templates] = useState<Template[]>(SEED_TEMPLATES);
  const [editing, setEditing] = useState<Template | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-sol-ink flex items-center gap-2">
            <span>💬</span> Bộ biên tập Zalo Template
          </h1>
          <p className="text-meta text-sol-ink-2 mt-1">
            Soạn template ZNS — auto check ký tự + lint từ cấm + preview style Zalo.
          </p>
        </div>
        <button onClick={() => setEditing(blankTemplate())} className="btn-primary">
          + Tạo template mới
        </button>
      </div>

      {!editing && (
        <div className="sol-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-sol-soft text-[11px] uppercase tracking-wider font-semibold text-sol-ink-2">
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Zalo Manager</th>
                <th className="px-3 py-2 text-center">Tag</th>
                <th className="px-3 py-2 text-right">Ký tự</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.code} className="border-b border-sol-soft hover:bg-sol-paper">
                  <td className="px-3 py-2.5 font-semibold">{t.code}</td>
                  <td className="px-3 py-2.5 text-meta text-sol-ink-2">{t.zaloManagerName}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sol-green-soft text-sol-green-ink">Tag {t.tag}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-meta">{t.charCount}/400</td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setEditing(t)} className="text-sol-orange-ink hover:underline text-meta">
                      Sửa →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          onCancel={() => setEditing(null)}
          onSave={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ─── Template Editor ─────────────────────────────────────────────────── */
function TemplateEditor({ template, onCancel, onSave }: {
  template: Template;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [code, setCode] = useState(template.code);
  const [name, setName] = useState(template.zaloManagerName);
  const [tag, setTag] = useState(template.tag);
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);
  const [buttons, setButtons] = useState(template.ctaButtons);

  const fullText = useMemo(() => title + '\n' + body, [title, body]);
  const counts = useMemo(() => countChars(title, body), [title, body]);
  const issues = useMemo(() => lintZNSText(fullText), [fullText]);
  const params = useMemo(() => extractParams(fullText), [fullText]);
  const canSubmit = useMemo(() => canSubmitTemplate(fullText) && counts.total <= 400, [fullText, counts]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* LEFT: Editor */}
      <div className="space-y-3">
        <div className="sol-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-h3">Biên tập template</h3>
            <button onClick={onCancel} className="text-sol-ink-3 hover:text-sol-ink text-meta">
              ← Quay lại
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">Code (backend)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className="input-text mt-1" placeholder="SOL_WELCOME" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">Tên Zalo Manager</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-text mt-1" placeholder="Sol — Chào mừng Day 1" />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">Tag Zalo</label>
            <select value={tag} onChange={(e) => setTag(e.target.value as any)} className="input-text mt-1">
              <option value="1">Tag 1 — Transactional (OTP, biến động giao dịch)</option>
              <option value="2">Tag 2 — Customer Care (Sol dùng)</option>
              <option value="3">Tag 3 — Promotion (cần giấy phép)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
              Title <span className="text-sol-ink-2">({counts.title} ký tự)</span>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-text mt-1" />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
              Body <span className="text-sol-ink-2">({counts.body} ký tự)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="input-text mt-1 font-mono text-meta"
            />
          </div>

          {/* Counter total */}
          <div className={`px-3 py-2 rounded-lg text-meta font-semibold ${
            counts.total > 400
              ? 'bg-sol-red-soft text-sol-red-ink'
              : counts.total > 380
                ? 'bg-sol-orange-soft text-sol-orange-ink'
                : 'bg-sol-green-soft text-sol-green-ink'
          }`}>
            Tổng: {counts.total} / 400 ký tự
            {counts.total > 400 && ' — VƯỢT giới hạn, sẽ bị Zalo reject'}
            {counts.total > 380 && counts.total <= 400 && ' — sát giới hạn'}
          </div>

          {/* Params detected */}
          {params.length > 0 && (
            <div className="text-meta text-sol-ink-2">
              Tham số động detected: {params.map((p) => (
                <code key={p} className="bg-sol-soft px-1 py-0.5 rounded mx-1 text-sol-orange-ink">{`{${p}}`}</code>
              ))}
            </div>
          )}

          {/* CTA buttons editor */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
              Nút CTA (tối đa 2)
            </label>
            <div className="space-y-2 mt-1">
              {buttons.map((btn, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_1.5fr_30px] gap-2 items-center">
                  <input
                    value={btn.label}
                    onChange={(e) => updateBtn(i, { ...btn, label: e.target.value })}
                    className="input-text"
                    placeholder="Mở Sol"
                  />
                  <select
                    value={btn.type}
                    onChange={(e) => updateBtn(i, { ...btn, type: e.target.value })}
                    className="input-text"
                  >
                    <option value="OPEN_URL">URL</option>
                    <option value="MAKE_PHONE_CALL">Phone</option>
                    <option value="OPEN_ZALO_CHAT">Zalo Chat</option>
                  </select>
                  <input
                    value={btn.value ?? ''}
                    onChange={(e) => updateBtn(i, { ...btn, value: e.target.value })}
                    className="input-text"
                    placeholder="https://bothuocla.sol.vn/..."
                  />
                  <button
                    onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                    className="text-sol-red-ink hover:bg-sol-red-soft rounded p-1 text-meta"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {buttons.length < 2 && (
                <button
                  onClick={() => setButtons([...buttons, { label: '', type: 'OPEN_URL', value: '' }])}
                  className="text-sol-orange-ink hover:underline text-meta"
                >
                  + Thêm nút CTA
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lint panel */}
        <div className="sol-card p-5">
          <h3 className="text-h3 mb-2">
            Lint kiểm tra ({issues.length} issues)
            {issues.length === 0 && <span className="text-sol-green-ink ml-2">✓ Sạch</span>}
          </h3>
          {issues.length === 0 && (
            <div className="text-meta text-sol-ink-2">
              Không phát hiện từ ngữ cấm. Template sẵn sàng submit Zalo.
            </div>
          )}
          {issues.map((issue, i) => (
            <LintRow key={i} issue={issue} />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Huỷ</button>
          <button className="btn-secondary">Save draft</button>
          <button className="btn-secondary">Test send tôi</button>
          <button
            onClick={onSave}
            disabled={!canSubmit}
            className={`btn-primary ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canSubmit ? 'Cần fix Critical issues trước khi submit' : ''}
          >
            🚀 Submit Zalo
          </button>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="space-y-3">
        <div className="sol-card p-5">
          <h3 className="text-h3 mb-3">Preview Zalo OA chat</h3>
          <ZaloPreview title={title} body={body} buttons={buttons} />
        </div>
      </div>
    </div>
  );

  function updateBtn(i: number, btn: typeof buttons[number]) {
    const next = [...buttons];
    next[i] = btn;
    setButtons(next);
  }
}

/* ─── Lint Row ────────────────────────────────────────────────────────── */
function LintRow({ issue }: { issue: LintIssue }) {
  const colors = {
    CRITICAL: 'bg-sol-red-soft text-sol-red-ink border-sol-red',
    WARNING: 'bg-sol-orange-soft text-sol-orange-ink border-sol-orange',
    INFO: 'bg-sol-green-soft text-sol-green-ink border-sol-green',
  };
  const icons = { CRITICAL: '🔴', WARNING: '🟠', INFO: '🟡' };
  return (
    <div className={`border-l-4 px-3 py-2 my-2 rounded ${colors[issue.level]}`}>
      <div className="flex items-center gap-2 text-meta font-semibold">
        <span>{icons[issue.level]} {issue.level}</span>
        <code className="bg-white/50 px-1.5 py-0.5 rounded text-sol-ink">"{issue.text}"</code>
      </div>
      <div className="text-meta mt-1">{issue.reason}</div>
      {issue.suggestion && (
        <div className="text-meta mt-1">
          ✓ Gợi ý: <code className="bg-white/50 px-1.5 py-0.5 rounded">{issue.suggestion}</code>
        </div>
      )}
    </div>
  );
}

/* ─── Zalo Preview ────────────────────────────────────────────────────── */
function ZaloPreview({
  title, body, buttons,
}: {
  title: string;
  body: string;
  buttons: Array<{ label: string; type: string; value?: string }>;
}) {
  return (
    <div className="bg-sol-paper rounded-xl p-4 max-w-md">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 bg-sol-orange rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">S</div>
        <div className="flex-1">
          <div className="text-meta text-sol-ink-3 font-semibold mb-1">Sol — Đồng hành cai thuốc lá</div>
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
            <div className="font-bold text-body text-sol-ink mb-2">{title || '(chưa có title)'}</div>
            <div className="text-meta text-sol-ink-2 whitespace-pre-line">{body || '(chưa có body)'}</div>
            {buttons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sol-soft space-y-1.5">
                {buttons.map((b, i) => (
                  <button
                    key={i}
                    disabled
                    className="block w-full px-3 py-2 text-left text-sol-orange-ink hover:bg-sol-orange-soft rounded font-semibold text-meta"
                  >
                    {b.type === 'MAKE_PHONE_CALL' ? '📞 ' : b.type === 'OPEN_ZALO_CHAT' ? '💬 ' : '🔗 '}
                    {b.label || '(nút trống)'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-sol-ink-3 mt-1">12:34 · ZNS Sol</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: TemplateStatus }) {
  const map: Record<TemplateStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-sol-soft text-sol-ink-2' },
    PENDING: { label: 'Đang chờ', cls: 'bg-sol-orange-soft text-sol-orange-ink' },
    APPROVED: { label: 'Approved', cls: 'bg-sol-green-soft text-sol-green-ink' },
    REJECTED: { label: 'Rejected', cls: 'bg-sol-red-soft text-sol-red-ink' },
    ARCHIVED: { label: 'Archived', cls: 'bg-sol-soft text-sol-ink-3' },
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status].cls}`}>
      {map[status].label}
    </span>
  );
}

function blankTemplate(): Template {
  return {
    code: 'SOL_NEW',
    zaloManagerName: 'Sol — Template mới',
    tag: '2',
    title: '',
    body: '',
    ctaButtons: [],
    status: 'DRAFT',
    charCount: 0,
  };
}
