// admin/src/pages/AdminZaloTemplates.tsx
//
// Sol v3 (12-05-2026) — Phase 2: wire backend CRUD API.
// Bộ biên tập Zalo ZNS template:
//   - Counter 400 ký tự live
//   - Lint từ ngữ cấm (3 cấp Critical/Warning/Info)
//   - Preview render Zalo OA chat style
//   - Save draft / Submit Zalo qua API thật

import { useState, useMemo, useEffect } from 'react';
import { lintZNSText, canSubmitTemplate, countChars, extractParams, type LintIssue } from '../lib/zaloLinter';
import { zaloApi, type ZaloTemplate, type ZaloTemplateStatus } from '../services/api';

// Type editing — partial vì có thể chưa tồn tại trong DB (đang tạo mới)
interface EditingTemplate {
  isNew: boolean;
  code: string;
  zaloManagerName: string;
  tag: '1' | '2' | '3';
  title: string;
  body: string;
  ctaButtons: Array<{ label: string; type: string; value?: string }>;
}

export function AdminZaloTemplates() {
  const [templates, setTemplates] = useState<ZaloTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await zaloApi.listTemplates();
      setTemplates(r.items);
    } catch (err: any) {
      setError('Không tải được danh sách: ' + (err?.message ?? 'unknown'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

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
        {!editing && (
          <button onClick={() => setEditing(blankTemplate())} className="btn-primary">
            + Tạo template mới
          </button>
        )}
      </div>

      {error && (
        <div className="bg-sol-red-soft border border-sol-red/30 text-sol-red-ink rounded-xl p-3 text-meta">
          {error}
        </div>
      )}

      {!editing && (
        <div className="sol-card overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-meta text-sol-ink-2">Đang tải template...</div>
          )}
          {!loading && templates.length === 0 && (
            <div className="p-8 text-center text-meta text-sol-ink-2">
              Chưa có template nào. Bấm <strong>+ Tạo template mới</strong> để bắt đầu.
            </div>
          )}
          {!loading && templates.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="bg-sol-soft text-[11px] uppercase tracking-wider font-semibold text-sol-ink-2">
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Zalo Manager</th>
                  <th className="px-3 py-2 text-center">Tag</th>
                  <th className="px-3 py-2 text-right">Ký tự</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-sol-soft hover:bg-sol-paper">
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
                      <button
                        onClick={() => setEditing(toEditing(t))}
                        className="text-sol-orange-ink hover:underline text-meta"
                      >
                        Sửa →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ─── Template Editor ─────────────────────────────────────────────────── */
function TemplateEditor({ template, onCancel, onSaved }: {
  template: EditingTemplate;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(template.code);
  const [name, setName] = useState(template.zaloManagerName);
  const [tag, setTag] = useState(template.tag);
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);
  const [buttons, setButtons] = useState(template.ctaButtons);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fullText = useMemo(() => title + '\n' + body, [title, body]);
  const counts = useMemo(() => countChars(title, body), [title, body]);
  const issues = useMemo(() => lintZNSText(fullText), [fullText]);
  const params = useMemo(() => extractParams(fullText), [fullText]);
  const canSubmit = useMemo(
    () => canSubmitTemplate(fullText) && counts.total <= 400,
    [fullText, counts]
  );

  async function handleSave(action: 'draft' | 'submit' | 'test') {
    setSaving(true);
    setActionMsg(null);

    // Filter CTA buttons rỗng (label trống)
    const cleanButtons = buttons.filter((b) => b.label.trim().length > 0);

    // Client-side validate trước khi gọi API
    if (!code.trim() || !/^SOL_[A-Z0-9_]+$/.test(code)) {
      setActionMsg({ type: 'error', text: 'Code phải dạng SOL_XXX uppercase (vd SOL_WELCOME)' });
      setSaving(false);
      return;
    }
    if (name.trim().length < 10) {
      setActionMsg({ type: 'error', text: 'Tên Zalo Manager phải ≥ 10 ký tự (Khang đọc cho dễ tra)' });
      setSaving(false);
      return;
    }
    if (title.trim().length === 0 || body.trim().length === 0) {
      setActionMsg({ type: 'error', text: 'Title + Body không được để trống' });
      setSaving(false);
      return;
    }

    try {
      // Bước 1: ensure template tồn tại trong DB
      let templateCode = code;
      if (template.isNew) {
        await zaloApi.createTemplate({
          code,
          zaloManagerName: name,
          tag,
          title,
          body,
          ctaButtons: cleanButtons,
        });
      } else {
        await zaloApi.updateTemplate(template.code, {
          zaloManagerName: name,
          tag,
          title,
          body,
          ctaButtons: cleanButtons,
        });
        templateCode = template.code;
      }

      // Bước 2: action tiếp theo
      if (action === 'submit') {
        const r = await zaloApi.submitTemplate(templateCode);
        setActionMsg({ type: 'success', text: r.message ?? 'Submit Zalo OK!' });
      } else if (action === 'test') {
        const r = await zaloApi.testSendTemplate(templateCode);
        setActionMsg({ type: 'success', text: r.message });
      } else {
        setActionMsg({ type: 'success', text: 'Đã lưu draft.' });
      }

      if (action === 'draft' || action === 'submit') {
        setTimeout(onSaved, 800);
      }
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: 'Lỗi: ' + (err?.body?.error ?? err?.message ?? 'unknown'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* LEFT: Editor */}
      <div className="space-y-3">
        <div className="sol-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-h3">
              {template.isNew ? 'Tạo template mới' : `Sửa: ${template.code}`}
            </h3>
            <button
              onClick={onCancel}
              className="text-sol-ink-3 hover:text-sol-ink text-meta"
            >
              ← Quay lại
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
                Code (backend) {!template.isNew && <span className="text-sol-ink-3">— readonly</span>}
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={!template.isNew}
                className="input-text mt-1 bg-white border-2 border-sol-line focus:border-sol-orange focus:ring-1 focus:ring-sol-orange"
                placeholder="SOL_WELCOME"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
                Tên Zalo Manager
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-text mt-1 bg-white border-2 border-sol-line focus:border-sol-orange focus:ring-1 focus:ring-sol-orange"
                placeholder="Sol — Chào mừng Day 1"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">Tag Zalo</label>
            <select value={tag} onChange={(e) => setTag(e.target.value as any)} className="input-text mt-1 bg-white border-2 border-sol-line focus:border-sol-orange focus:ring-1 focus:ring-sol-orange">
              <option value="1">Tag 1 — Transactional (OTP, giao dịch)</option>
              <option value="2">Tag 2 — Customer Care (Sol dùng)</option>
              <option value="3">Tag 3 — Promotion (cần giấy phép)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
              Title <span className="text-sol-ink-2">({counts.title} ký tự)</span>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-text mt-1 bg-white border-2 border-sol-line focus:border-sol-orange focus:ring-1 focus:ring-sol-orange" />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-sol-ink-3">
              Body <span className="text-sol-ink-2">({counts.body} ký tự)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border-2 border-sol-orange/40 bg-sol-paper focus:bg-white focus:border-sol-orange focus:ring-2 focus:ring-sol-orange/30 focus:outline-none font-mono text-body text-sol-ink resize-y"
              placeholder="Body tin nhắn ZNS — nội dung chính. Có thể dùng tham số động {name}, {day}, {streak}..."
            />
          </div>

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

          {params.length > 0 && (
            <div className="text-meta text-sol-ink-2">
              Tham số động: {params.map((p) => (
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
                  onClick={() => setButtons([...buttons, { label: 'Mở Sol', type: 'OPEN_URL', value: 'https://bothuocla.sol.vn' }])}
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

        {actionMsg && (
          <div className={`rounded-xl p-3 text-meta ${
            actionMsg.type === 'success'
              ? 'bg-sol-green-soft text-sol-green-ink border border-sol-green/30'
              : 'bg-sol-red-soft text-sol-red-ink border border-sol-red/30'
          }`}>
            {actionMsg.text}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary" disabled={saving}>Huỷ</button>
          <button
            onClick={() => handleSave('draft')}
            className="btn-secondary"
            disabled={saving}
          >
            {saving ? 'Đang lưu…' : 'Save draft'}
          </button>
          <button
            onClick={() => handleSave('test')}
            className="btn-secondary"
            disabled={saving || template.isNew}
            title={template.isNew ? 'Save draft trước' : ''}
          >
            Test send tôi
          </button>
          <button
            onClick={() => handleSave('submit')}
            disabled={!canSubmit || saving}
            className={`btn-primary ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canSubmit ? 'Cần fix Critical issues + dưới 400 ký tự' : ''}
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
          <div className="text-[10px] text-sol-ink-3 mt-1">ZNS Sol · just now</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: ZaloTemplateStatus }) {
  const map: Record<ZaloTemplateStatus, { label: string; cls: string }> = {
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

function blankTemplate(): EditingTemplate {
  return {
    isNew: true,
    code: 'SOL_NEW',
    zaloManagerName: 'Sol — Template mới',
    tag: '2',
    title: '',
    body: '',
    ctaButtons: [],
  };
}

function toEditing(t: ZaloTemplate): EditingTemplate {
  return {
    isNew: false,
    code: t.code,
    zaloManagerName: t.zaloManagerName,
    tag: t.tag,
    title: t.title,
    body: t.body,
    ctaButtons: (t.ctaButtons as any) ?? [],
  };
}
