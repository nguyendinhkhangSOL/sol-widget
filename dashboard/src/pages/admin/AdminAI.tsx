// dashboard/src/pages/admin/AdminAI.tsx
// Quản lý kết nối AI — chọn nhà cung cấp, nhập API key, chọn model,
// test kết nối, và lưu. Là trang trung tâm mà founder dùng hàng tuần.
//
// Refactor: dùng design system mới — .sol-card, .sol-input, .sol-select,
// .sol-btn-primary, .sol-alert-*, .sol-field-label, design tokens (text-h3,
// text-meta, sol-ink-2/3, sol-line) thay cho chuỗi Tailwind utility dài.

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

type AiSettingsResp = Awaited<ReturnType<typeof api.adminGetAiSettings>>;
type ProviderId = 'anthropic' | 'openai' | 'gemini';

interface Draft {
  enabled: boolean;
  provider: ProviderId;
  apiKeyInput: string; // empty = không đổi key đã lưu
  modelPrimary: string;
  modelEscalated: string;
  dailyQuotaMsgs: number;
  maxOutputTokens: number;
  temperature: number;
}

function providerMeta(id: ProviderId) {
  switch (id) {
    case 'anthropic':
      return {
        label: 'Anthropic Claude',
        blurb: 'Khuyên dùng cho SOL — tự nhiên với tiếng Việt, an toàn trong chủ đề nhạy cảm.',
        keyPlaceholder: 'sk-ant-…',
        keyDocsUrl: 'https://console.anthropic.com/settings/keys',
      };
    case 'openai':
      return {
        label: 'OpenAI (GPT)',
        blurb: 'Giá rẻ, nhanh. Thường dùng cho nhu cầu khối lượng lớn.',
        keyPlaceholder: 'sk-…',
        keyDocsUrl: 'https://platform.openai.com/api-keys',
      };
    case 'gemini':
      return {
        label: 'Google Gemini',
        blurb: 'Miễn phí tier tốt, phù hợp thử nghiệm.',
        keyPlaceholder: 'AI…',
        keyDocsUrl: 'https://aistudio.google.com/apikey',
      };
  }
}

export function AdminAI() {
  const [data, setData] = useState<AiSettingsResp | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    sample?: string;
    error?: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const d = await api.adminGetAiSettings();
      setData(d);
      setDraft({
        enabled: d.current.enabled,
        provider: d.current.provider,
        apiKeyInput: '',
        modelPrimary: d.current.modelPrimary,
        modelEscalated: d.current.modelEscalated,
        dailyQuotaMsgs: d.current.dailyQuotaMsgs,
        maxOutputTokens: d.current.maxOutputTokens,
        temperature: d.current.temperature,
      });
    } catch (e: any) {
      setErr(e?.message ?? 'Không tải được cấu hình AI.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const currentProviderCatalog = useMemo(() => {
    if (!data || !draft) return null;
    return data.providers.find((p) => p.id === draft.provider) ?? null;
  }, [data, draft]);

  function changeProvider(next: ProviderId) {
    if (!data || !draft) return;
    const meta = data.providers.find((p) => p.id === next)!;
    const sameAsCurrent = data.current.provider === next;
    setDraft({
      ...draft,
      provider: next,
      modelPrimary: sameAsCurrent ? data.current.modelPrimary : meta.defaultModelPrimary,
      modelEscalated: sameAsCurrent ? data.current.modelEscalated : meta.defaultModelEscalated,
      apiKeyInput: '',
    });
    setTestResult(null);
  }

  async function testConnection() {
    if (!draft) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.adminTestAi({
        provider: draft.provider,
        apiKey: draft.apiKeyInput || undefined,
        model: draft.modelPrimary,
      });
      setTestResult(r);
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message ?? 'Không kết nối được.' });
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErr(null);
    try {
      await api.adminPatchAiSettings({
        enabled: draft.enabled,
        provider: draft.provider,
        apiKey: draft.apiKeyInput || undefined,
        modelPrimary: draft.modelPrimary,
        modelEscalated: draft.modelEscalated,
        dailyQuotaMsgs: draft.dailyQuotaMsgs,
        maxOutputTokens: draft.maxOutputTokens,
        temperature: draft.temperature,
      });
      setToast('Đã lưu cấu hình AI.');
      setTimeout(() => setToast(null), 2500);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? 'Không lưu được.');
    } finally {
      setSaving(false);
    }
  }

  if (err && !data) {
    return <div className="sol-alert-danger">{err}</div>;
  }
  if (!data || !draft) {
    return (
      <div className="p-8 text-center text-body text-sol-ink-3">Đang tải…</div>
    );
  }

  const meta = providerMeta(draft.provider);
  const providerChanged = draft.provider !== data.current.provider;
  const keyMasked = data.current.apiKeyMasked || '(chưa có key)';
  const keySource =
    data.current.source === 'db'
      ? 'đang dùng key lưu trong DB'
      : 'đang dùng key từ biến môi trường (env)';

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 bg-sol-green text-white px-5 py-3 rounded-lg shadow-pop z-50 text-body font-medium animate-slide-up">
          {toast}
        </div>
      )}

      {err && <div className="sol-alert-danger">{err}</div>}

      {/* 1. Bật/tắt AI */}
      <section className="sol-card-padded">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-h3 text-sol-ink">Kích hoạt AI mentor</h2>
            <p className="text-meta text-sol-ink-2 mt-1">
              Khi tắt, widget sẽ dùng phản hồi mẫu cứng (scripted). Bật khi đã có API key hợp lệ.
            </p>
          </div>
          <button
            onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition flex-shrink-0 ${
              draft.enabled ? 'bg-sol-green' : 'bg-sol-line-strong'
            }`}
            aria-pressed={draft.enabled}
            aria-label="Bật/tắt AI mentor"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                draft.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 2. Chọn provider */}
      <section className="sol-card-padded space-y-4">
        <div>
          <h2 className="text-h3 text-sol-ink">Nhà cung cấp AI</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Chọn một trong ba nhà cung cấp bên dưới. Mỗi cái có bảng giá và điểm mạnh riêng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.providers.map((p) => {
            const selected = draft.provider === p.id;
            const pm = providerMeta(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => changeProvider(p.id)}
                className={`text-left p-4 rounded-2xl border-2 transition ${
                  selected
                    ? 'border-sol-green bg-sol-green-soft shadow-card'
                    : 'border-sol-line hover:border-sol-line-strong bg-sol-paper'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-body font-semibold text-sol-ink">{pm.label}</div>
                  {selected && (
                    <span className="sol-badge-green flex-shrink-0">đang chọn</span>
                  )}
                </div>
                <p className="text-meta text-sol-ink-2 mt-2 leading-relaxed">{pm.blurb}</p>
              </button>
            );
          })}
        </div>

        {/* Dropdown thay thế (đảm bảo có listbox đúng như yêu cầu) */}
        <div className="pt-3 border-t border-sol-line">
          <label className="sol-field-label">Hoặc chọn từ danh sách</label>
          <select
            value={draft.provider}
            onChange={(e) => changeProvider(e.target.value as ProviderId)}
            className="sol-select md:max-w-sm"
          >
            {data.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {providerMeta(p.id).label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 3. API key */}
      <section className="sol-card-padded space-y-3">
        <div>
          <h2 className="text-h3 text-sol-ink">API key cho {meta.label}</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Key được lưu mã hoá trong DB.{' '}
            {providerChanged ? (
              <span className="text-sol-orange-ink font-medium">
                Bạn vừa đổi sang provider mới — cần nhập key của provider này.
              </span>
            ) : (
              <>
                Key hiện tại:{' '}
                <code className="bg-sol-soft px-2 py-0.5 rounded text-meta font-mono">
                  {keyMasked}
                </code>{' '}
                <span className="text-sol-ink-3">({keySource})</span>
              </>
            )}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft.apiKeyInput}
            onChange={(e) => setDraft({ ...draft, apiKeyInput: e.target.value })}
            placeholder={
              providerChanged
                ? `Dán key mới (${meta.keyPlaceholder})`
                : `Để trống nếu không đổi · (${meta.keyPlaceholder})`
            }
            className="sol-input flex-1 min-w-[260px] font-mono"
          />
          <a
            href={meta.keyDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sol-btn-secondary"
          >
            Lấy key ↗
          </a>
        </div>
      </section>

      {/* 4. Model */}
      <section className="sol-card-padded space-y-4">
        <div>
          <h2 className="text-h3 text-sol-ink">Lựa chọn model</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Model chính cho hầu hết câu trả lời. Model nâng cao cho tình huống căng (SOS, crisis).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Model chính (primary)">
            <select
              value={draft.modelPrimary}
              onChange={(e) => setDraft({ ...draft, modelPrimary: e.target.value })}
              className="sol-select"
            >
              {currentProviderCatalog?.availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Model nâng cao (escalated)">
            <select
              value={draft.modelEscalated}
              onChange={(e) => setDraft({ ...draft, modelEscalated: e.target.value })}
              className="sol-select"
            >
              {currentProviderCatalog?.availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* 5. Giới hạn + sampling */}
      <section className="sol-card-padded space-y-4">
        <div>
          <h2 className="text-h3 text-sol-ink">Giới hạn & tham số</h2>
          <p className="text-meta text-sol-ink-2 mt-1">
            Kiểm soát chi phí và tính cách của AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Quota / user / ngày (tin nhắn)">
            <input
              type="number"
              min={1}
              max={10000}
              value={draft.dailyQuotaMsgs}
              onChange={(e) =>
                setDraft({ ...draft, dailyQuotaMsgs: parseInt(e.target.value || '0', 10) })
              }
              className="sol-input"
            />
          </Field>

          <Field label="Max tokens output">
            <input
              type="number"
              min={50}
              max={4000}
              step={50}
              value={draft.maxOutputTokens}
              onChange={(e) =>
                setDraft({ ...draft, maxOutputTokens: parseInt(e.target.value || '0', 10) })
              }
              className="sol-input"
            />
          </Field>

          <Field label={`Nhiệt độ (${draft.temperature.toFixed(2)})`}>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={draft.temperature}
              onChange={(e) =>
                setDraft({ ...draft, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-sol-green"
            />
            <div className="flex justify-between text-meta text-sol-ink-3 mt-1">
              <span>0 · chính xác</span>
              <span>1.5 · sáng tạo</span>
            </div>
          </Field>
        </div>
      </section>

      {/* 6. Actions */}
      <section className="sol-card-padded space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testConnection}
            disabled={testing}
            className="sol-btn bg-sol-blue text-white hover:bg-sol-blue-ink focus-visible:ring-sol-blue"
          >
            {testing ? 'Đang test…' : '🔌 Test kết nối'}
          </button>
          <button onClick={save} disabled={saving} className="sol-btn-primary">
            {saving ? 'Đang lưu…' : '💾 Lưu cấu hình'}
          </button>
          <button
            onClick={load}
            disabled={saving || testing}
            className="sol-btn-secondary"
          >
            Huỷ thay đổi
          </button>
        </div>

        {testResult &&
          (testResult.ok ? (
            <div className="sol-alert-success">
              <div className="font-semibold text-body">
                ✓ Kết nối OK {testResult.latencyMs ? `· ${testResult.latencyMs}ms` : ''}
              </div>
              {testResult.sample && (
                <div className="text-meta mt-1.5 italic opacity-90">
                  Phản hồi mẫu: "{testResult.sample}"
                </div>
              )}
            </div>
          ) : (
            <div className="sol-alert-danger">
              <div className="font-semibold text-body">✗ Không kết nối được</div>
              {testResult.error && <div className="text-meta mt-1.5">{testResult.error}</div>}
            </div>
          ))}
      </section>

      <p className="text-meta text-sol-ink-3 pt-2">
        Lưu ý: key được che khi trả về dashboard. Nếu bạn đổi provider, hãy nhớ test kết nối trước
        khi bấm lưu.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="sol-field-label">{label}</div>
      {children}
    </label>
  );
}
