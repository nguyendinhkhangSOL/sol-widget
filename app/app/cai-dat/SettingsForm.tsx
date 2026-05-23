'use client';

import { useState } from 'react';
import type { UserProfile } from '@/lib/profile';

interface Props {
  initialProfile: UserProfile;
}

const PRONOUN_OPTIONS = [
  { value: 'anh', label: 'Anh' },
  { value: 'em', label: 'Em' },
  { value: 'chú', label: 'Chú' },
  { value: 'bác', label: 'Bác' }
];

const ASSISTANT_NAME_OPTIONS = [
  'Sol Đồng hành',
  'Sol Trợ lý',
  'Sol Phó tướng',
  'Sol Anh em'
];

const TRIGGER_SUGGESTIONS = [
  'Cà phê', 'Nhậu', 'Sau bữa ăn', 'Lái xe', 'Stress công việc',
  'Tiếp khách', 'Đêm khuya', 'Sáng sớm vừa ngủ dậy', 'Đi vệ sinh', 'Cuộc họp'
];

const MOOD_OPTIONS = [
  { value: 'improving', label: '📈 Tốt lên (động lực cao)' },
  { value: 'stable', label: '➖ Ổn định (như thường)' },
  { value: 'declining', label: '📉 Đang xuống (cần support)' }
];

const MODE_OPTIONS = [
  { value: 'normal', label: '💬 Bình thường' },
  { value: 'calm', label: '🌿 Bình tĩnh (giảm push)' },
  { value: 'whisper', label: '🌙 Thì thầm (đêm khuya)' },
  { value: 'busy', label: '⚡ Bận (reply ngắn)' }
];

export function SettingsForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger input state
  const [newTrigger, setNewTrigger] = useState('');

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          pronouns: profile.pronouns,
          assistant_name: profile.assistant_name,
          quit_reasons: profile.quit_reasons,
          top_triggers: profile.top_triggers,
          age: profile.age,
          years_smoked: profile.years_smoked,
          cigarettes_per_day: profile.cigarettes_per_day,
          quiet_hours_start: profile.quiet_hours_start,
          quiet_hours_end: profile.quiet_hours_end,
          preferred_morning_time: profile.preferred_morning_time,
          preferred_evening_time: profile.preferred_evening_time,
          current_mood: profile.current_mood,
          mode: profile.mode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setSaved(true);
      if (data.profile) setProfile(data.profile);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile(p => ({ ...p, [key]: value }));
  }

  function updateQuitReason(index: number, value: string) {
    const next = [...profile.quit_reasons];
    next[index] = value;
    setProfile(p => ({ ...p, quit_reasons: next.filter(r => r.trim()) }));
  }

  function addQuitReason() {
    if (profile.quit_reasons.length < 5) {
      setProfile(p => ({ ...p, quit_reasons: [...p.quit_reasons, ''] }));
    }
  }

  function removeQuitReason(index: number) {
    setProfile(p => ({ ...p, quit_reasons: p.quit_reasons.filter((_, i) => i !== index) }));
  }

  function toggleTrigger(trigger: string) {
    const has = profile.top_triggers.includes(trigger);
    if (has) {
      setProfile(p => ({ ...p, top_triggers: p.top_triggers.filter(t => t !== trigger) }));
    } else if (profile.top_triggers.length < 10) {
      setProfile(p => ({ ...p, top_triggers: [...p.top_triggers, trigger] }));
    }
  }

  function addCustomTrigger() {
    const t = newTrigger.trim();
    if (t && !profile.top_triggers.includes(t) && profile.top_triggers.length < 10) {
      setProfile(p => ({ ...p, top_triggers: [...p.top_triggers, t] }));
      setNewTrigger('');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Trial / cohort badge */}
      <div className="card-sol bg-sol-cream border-l-4 border-sol-orange">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-sol-ink2">Cohort của anh: <strong className="text-sol-brown">{profile.cohort || 'Chưa làm Test FTND'}</strong> {profile.ftnd_score !== null && `(FTND ${profile.ftnd_score}/10)`}</p>
            <p className="text-sm text-sol-ink2">SĐT Zalo: <strong>{profile.phone}</strong></p>
          </div>
          {profile.trial_ends_at && (
            <span className="text-xs bg-sol-orange text-white px-3 py-1 rounded-full">
              Trial đến {new Date(profile.trial_ends_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Danh xưng */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-1">1. Anh muốn Sol gọi anh như thế nào?</h2>
        <p className="text-sm text-sol-ink2 mb-4">Sol sẽ dùng cách xưng này trong mọi tin nhắn</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {PRONOUN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField('pronouns', opt.value)}
              className={`px-4 py-2 rounded-lg border-2 transition ${
                profile.pronouns === opt.value
                  ? 'border-sol-orange bg-sol-orange/10 text-sol-brown font-semibold'
                  : 'border-sol-cream hover:border-sol-orange text-sol-ink2'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-sol-ink2 mb-1">Hoặc tự nhập:</label>
        <input
          type="text"
          value={PRONOUN_OPTIONS.find(o => o.value === profile.pronouns) ? '' : profile.pronouns}
          onChange={(e) => updateField('pronouns', e.target.value)}
          placeholder="vd: Ngài, Đại ca, Sếp..."
          className="input-sol"
          maxLength={20}
        />
      </div>

      {/* Tên gọi Sol */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-1">2. Anh gọi Sol là gì?</h2>
        <p className="text-sm text-sol-ink2 mb-4">Tên này sẽ hiện trên đầu mỗi reply của AI</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {ASSISTANT_NAME_OPTIONS.map(name => (
            <button
              key={name}
              type="button"
              onClick={() => updateField('assistant_name', name)}
              className={`px-4 py-2 rounded-lg border-2 text-sm transition ${
                profile.assistant_name === name
                  ? 'border-sol-orange bg-sol-orange/10 text-sol-brown font-semibold'
                  : 'border-sol-cream hover:border-sol-orange text-sol-ink2'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <label className="block text-xs text-sol-ink2 mb-1">Hoặc tự đặt tên (vd: "Sol Vợ yêu", "Sol Khang"):</label>
        <input
          type="text"
          value={ASSISTANT_NAME_OPTIONS.includes(profile.assistant_name) ? '' : profile.assistant_name}
          onChange={(e) => updateField('assistant_name', e.target.value)}
          placeholder="Sol ..."
          className="input-sol"
          maxLength={50}
        />
      </div>

      {/* Lý do bỏ thuốc */}
      <div className="card-sol border-l-4 border-sol-orange">
        <h2 className="text-lg font-bold text-sol-brown mb-1">3. Lý do anh muốn bỏ thuốc <span className="text-sol-orange">⭐</span></h2>
        <p className="text-sm text-sol-ink2 mb-4">
          QUAN TRỌNG NHẤT — Sol AI sẽ <strong>replay nguyên văn</strong> các câu này khi anh thèm thuốc.
          Viết thật, gần gũi (vd: "vì cu Tí", "vì bà ngoại doạ chết", "không muốn mất 5 năm nữa")
        </p>

        <div className="space-y-2">
          {profile.quit_reasons.map((reason, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => updateQuitReason(idx, e.target.value)}
                placeholder={`Lý do ${idx + 1}...`}
                className="input-sol flex-1"
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => removeQuitReason(idx)}
                className="text-sol-ink2 hover:text-sol-red px-2"
              >
                ✕
              </button>
            </div>
          ))}
          {profile.quit_reasons.length < 5 && (
            <button
              type="button"
              onClick={addQuitReason}
              className="text-sm text-sol-orange hover:underline"
            >
              + Thêm lý do ({profile.quit_reasons.length}/5)
            </button>
          )}
        </div>
      </div>

      {/* Top triggers */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-1">4. Tình huống khiến anh thèm thuốc</h2>
        <p className="text-sm text-sol-ink2 mb-4">Click chọn / bỏ chọn — Sol AI sẽ chuẩn bị plan B sẵn cho từng tình huống</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {TRIGGER_SUGGESTIONS.map(t => {
            const selected = profile.top_triggers.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTrigger(t)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  selected
                    ? 'bg-sol-orange text-white font-semibold'
                    : 'bg-sol-cream text-sol-ink2 hover:bg-sol-orange/20'
                }`}
              >
                {selected && '✓ '}{t}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTrigger(); } }}
            placeholder="Tình huống khác (vd: đi câu, gặp khách hàng)..."
            className="input-sol flex-1"
            maxLength={50}
          />
          <button
            type="button"
            onClick={addCustomTrigger}
            className="btn-secondary text-sm"
          >
            Thêm
          </button>
        </div>
        <p className="text-xs text-sol-ink2 mt-2">{profile.top_triggers.length}/10 tình huống đã chọn</p>
      </div>

      {/* Thông tin cá nhân */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-4">5. Thông tin cá nhân (giúp Sol AI hiểu hơn)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Tuổi</label>
            <input
              type="number" min={15} max={99}
              value={profile.age ?? ''}
              onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="input-sol"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Hút bao nhiêu năm?</label>
            <input
              type="number" min={0} max={70}
              value={profile.years_smoked ?? ''}
              onChange={(e) => updateField('years_smoked', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="input-sol"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Số điếu/ngày</label>
            <input
              type="number" min={1} max={100}
              value={profile.cigarettes_per_day ?? ''}
              onChange={(e) => updateField('cigarettes_per_day', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="input-sol"
            />
          </div>
        </div>
      </div>

      {/* Thời gian nhận tin nhắn */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-1">6. Thời gian nhận tin nhắn từ Sol</h2>
        <p className="text-sm text-sol-ink2 mb-4">Sol KHÔNG nhắn anh trong giờ yên tĩnh (vd: lúc ngủ)</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Bắt đầu yên tĩnh</label>
            <input
              type="time"
              value={profile.quiet_hours_start}
              onChange={(e) => updateField('quiet_hours_start', e.target.value)}
              className="input-sol"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Kết thúc yên tĩnh</label>
            <input
              type="time"
              value={profile.quiet_hours_end}
              onChange={(e) => updateField('quiet_hours_end', e.target.value)}
              className="input-sol"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Tin sáng (động lực)</label>
            <input
              type="time"
              value={profile.preferred_morning_time}
              onChange={(e) => updateField('preferred_morning_time', e.target.value)}
              className="input-sol"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sol-brown mb-1">Tin tối (check-in)</label>
            <input
              type="time"
              value={profile.preferred_evening_time}
              onChange={(e) => updateField('preferred_evening_time', e.target.value)}
              className="input-sol"
            />
          </div>
        </div>
      </div>

      {/* Mood + Mode */}
      <div className="card-sol">
        <h2 className="text-lg font-bold text-sol-brown mb-4">7. Tâm trạng + Chế độ chat</h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-sol-brown mb-2">Hôm nay anh thế nào?</label>
          <div className="flex flex-col gap-2">
            {MOOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('current_mood', opt.value as any)}
                className={`px-4 py-2 rounded-lg border-2 text-left text-sm transition ${
                  profile.current_mood === opt.value
                    ? 'border-sol-orange bg-sol-orange/10 text-sol-brown font-semibold'
                    : 'border-sol-cream hover:border-sol-orange text-sol-ink2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-sol-brown mb-2">Chế độ chat Sol</label>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('mode', opt.value as any)}
                className={`px-3 py-2 rounded-lg border-2 text-sm transition ${
                  profile.mode === opt.value
                    ? 'border-sol-orange bg-sol-orange/10 text-sol-brown font-semibold'
                    : 'border-sol-cream hover:border-sol-orange text-sol-ink2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 z-30">
        {error && (
          <div className="card-sol bg-red-50 border border-red-200 text-red-700 text-sm mb-2">
            ⚠️ {error}
          </div>
        )}
        {saved && (
          <div className="card-sol bg-green-50 border border-sol-green text-sol-green text-sm font-semibold mb-2">
            ✓ Đã lưu! Sol AI sẽ áp dụng ngay câu chat tiếp theo.
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full text-lg disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : '💾 Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}
