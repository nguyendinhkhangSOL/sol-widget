// backend/src/scheduler/emailFunnelTemplates.ts
//
// Sol v3 (12-05-2026) — Email funnel theo 4 chặng tiến hoá:
//   NHẬN DIỆN  (Day 1-7, FREE)        — quan sát mình hút lúc nào, vì sao
//   KIỂM SOÁT  (Day 8-21, 99k)        — giảm tần suất hút có ý thức
//   LÀM CHỦ    (Day 22-51, 199k)      — Q-Day Day 22, cai hẳn 30 ngày
//   NGƯỜI TỰ DO (Day 52+, FREE forever) — Lễ tốt nghiệp Day 52
//
// Total: 51 ngày Sol-active + Day 52 lễ. 99k + 199k = 298k = 1 tháng tiền thuốc.
//
// 12 email templates Sol v3:
//   Day 0  WELCOME              — Khang chào, 7 ngày quan sát
//   Day 4  NHAN_DIEN_MID        — Sol Đồng hành, heatmap insight
//   Day 7  NHAN_DIEN_DONE       — Khang upsell Kiểm Soát 99k
//   Day 11 KIEM_SOAT_MID        — Sol Đồng hành, delay 10 phút
//   Day 17 KIEM_SOAT_HARD       — Khang cảnh báo Day 17 khó
//   Day 21 EVE_Q_DAY            — Khang, mai Q-Day, upsell Làm Chủ 199k
//   Day 22 Q_DAY                — Khang, hôm nay Q-Day, bắt đầu Làm Chủ
//   Day 30 LAM_CHU_WEEK_1       — Sol Đồng hành, body hồi 8 ngày
//   Day 40 LAM_CHU_MID          — Khang, nửa Làm Chủ, autonomy
//   Day 45 PRE_GRAD             — Sol Đồng hành, đọc lại Identity
//   Day 51 EVE_GRAD             — Khang, mai lễ tốt nghiệp
//   Day 52 GRADUATION           — Khang, LỄ TỐT NGHIỆP, Người Tự Do
//
// Variables: {pronoun} {Pronoun} {name} {appUrl}

export interface EmailFunnelTemplate {
  day: number;
  /** Tên chặng — chỉ để code reference, không show user */
  chapter: string;
  /** Voice — quyết định tone */
  voice: 'KHANG' | 'SOL_DONG_HANH';
  subject: string;
  htmlBody: string;
  textBody: string;
}

export const EMAIL_FUNNEL_TEMPLATES: EmailFunnelTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CHẶNG 1 — NHẬN DIỆN (Day 1-7, FREE)
  // ═══════════════════════════════════════════════════════════════════════
  {
    day: 0,
    chapter: 'WELCOME',
    voice: 'KHANG',
    subject: 'Chào {name} — 7 ngày tới mình chỉ cần {pronoun} quan sát',
    htmlBody: `
<p><strong>{Pronoun} ơi,</strong></p>
<p>Mình là Khang. Sinh năm 1976. Hút điếu đầu tiên năm 15 tuổi — 30 năm rồi mới bỏ được.</p>
<p>Mình đã thử bỏ nhiều lần. Lần đầu thời sinh viên, cha mình nói trước khi tàu chạy <em>"Con bỏ thuốc đi"</em> — mình gật đầu, tự hứa. Lời hứa đó treo mãi 30 năm. Sau này khi suy nghĩ về lời cha nói, trên tay mình vẫn đang cầm điếu thuốc.</p>
<p>Lần cuối — 22 tháng 12 âm lịch năm 2020 (cận Tết Tân Sửu), 8 ngày trước Tết — mình quyết định nhảy thẳng. Đến nay đã hơn 5 năm Tự Do.</p>
<p>Mình biết không phải ai cũng có moment 'nhảy thẳng' đó. Mình đã may. Có thể {pronoun} không có cùng may.</p>
<p>Sol là kiến trúc 4 chặng mình xếp lại sau khi đã thử mọi cách:</p>
<ol>
  <li><strong>🌱 Nhận Diện (7 ngày miễn phí)</strong> — quan sát mình hút lúc nào, vì sao</li>
  <li><strong>🟡 Kiểm Soát (14 ngày · 99k)</strong> — giảm tần suất hút có ý thức</li>
  <li><strong>🔴 Làm Chủ (30 ngày · 199k)</strong> — Q-Day Day 22, cai hẳn</li>
  <li><strong>🌟 Người Tự Do (Day 52+, miễn phí mãi)</strong> — Lễ tốt nghiệp</li>
</ol>
<p><strong>Tuần này {pronoun} không cần bỏ.</strong> Chỉ cần ghi điếu khi nhớ. Sol sẽ học cùng {pronoun}.</p>
<p style="margin-top: 24px;"><a href="{appUrl}" style="display: inline-block; background: #2E7D32; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Mở app — Ngày 1 Nhận Diện đang đợi</a></p>
<p style="margin-top: 24px; color: #8B6914; font-style: italic;">— Khang Sol, Người Đã Đi Qua</p>
    `,
    textBody: `{Pronoun} ơi,

Mình là Khang. Hút 30 năm (từ 15 tuổi). Tự Do 5 năm (từ Q-Day 22 tháng Chạp Tân Sửu).

Sol có 4 chặng:
🌱 Nhận Diện (7 ngày miễn phí) — quan sát
🟡 Kiểm Soát (14 ngày, 99k) — giảm tần suất
🔴 Làm Chủ (30 ngày, 199k) — cai hẳn, Q-Day Day 22
🌟 Người Tự Do (Day 52+) — miễn phí mãi

Tuần này {pronoun} không cần bỏ. Chỉ quan sát. Mở app: {appUrl}

— Khang Sol`,
  },

  {
    day: 4,
    chapter: 'NHAN_DIEN_MID',
    voice: 'SOL_DONG_HANH',
    subject: '{Pronoun} đã thấy gì trong 4 ngày Nhận Diện?',
    htmlBody: `
<p><strong>Sol đã ghi nhận của {pronoun}:</strong></p>
<p>Đến giữa tuần Nhận Diện, hầu hết anh em đã thấy 1 trong 3 điều:</p>
<ol>
  <li><strong>Peak hour rõ rệt</strong> — 1-2 giờ trong ngày {pronoun} hút nhiều nhất</li>
  <li><strong>Top trigger</strong> — STRESS hoặc EATING hoặc IDLE chiếm 70% lý do</li>
  <li><strong>Có điếu hút mà không nhớ vì sao</strong> — đó là tự động, kẻ thù lớn nhất</li>
</ol>
<p>Mở app xem heatmap của riêng {pronoun} — Sol vẽ 24 giờ × 4 ngày qua.</p>
<p style="margin-top: 20px;"><a href="{appUrl}" style="color: #2E7D32; font-weight: 600;">Xem heatmap →</a></p>
    `,
    textBody: `Đến giữa tuần Nhận Diện, hầu hết anh em đã thấy peak hour + top trigger + điếu hút tự động. Mở app xem của {pronoun}: {appUrl}

— Sol`,
  },

  {
    day: 7,
    chapter: 'NHAN_DIEN_DONE',
    voice: 'KHANG',
    subject: '{Pronoun} đã hoàn thành Nhận Diện · vào Kiểm Soát?',
    htmlBody: `
<p><strong>Chúc mừng {pronoun}!</strong></p>
<p>1 tuần trước {pronoun} không biết hút lúc nào, vì sao. Bây giờ {pronoun} biết. <strong>Đó là chiến thắng đầu tiên.</strong></p>
<p>14 ngày tiếp theo Sol gọi là <strong>Kiểm Soát</strong> — giảm tần suất hút có ý thức. {Pronoun} sẽ:</p>
<ul>
  <li>Học delay 10 phút khi thèm — phá vòng lặp não</li>
  <li>Viết Plan B cho ≥3 trigger lớn nhất</li>
  <li>Tuần thứ 3 chuẩn bị Q-Day — Day 22 = bắt đầu cai hẳn</li>
</ul>
<p>Mục tiêu Kiểm Soát: <strong>giảm 30% số điếu/ngày</strong>. Nếu sau 14 ngày {pronoun} không giảm được — Sol hoàn 99k. Không hỏi gì.</p>
<p style="margin-top: 24px;"><a href="{appUrl}/paywall?tier=KHOI_DONG" style="display: inline-block; background: #B8860B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">🟡 Vào Kiểm Soát — 99k cho 14 ngày</a></p>
<p style="margin-top: 16px; color: #8B6914;">Hoặc tiếp Nhận Diện miễn phí — Sol vẫn ở đây, chỉ là ít message hơn.</p>
<p style="margin-top: 20px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `Chúc mừng {pronoun}! 1 tuần trước {pronoun} không biết hút lúc nào. Bây giờ {pronoun} biết.

14 ngày tiếp theo là Kiểm Soát — giảm 30% số điếu. Không giảm được → hoàn 99k.

Vào Kiểm Soát: {appUrl}/paywall?tier=KHOI_DONG

— Khang`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHẶNG 2 — KIỂM SOÁT (Day 8-21, 99k)
  // ═══════════════════════════════════════════════════════════════════════
  {
    day: 11,
    chapter: 'KIEM_SOAT_MID',
    voice: 'SOL_DONG_HANH',
    subject: 'Delay 10 phút — kỹ thuật cơ bản nhất của Kiểm Soát',
    htmlBody: `
<p>Khi cơn thèm đến, não {pronoun} bảo "hút ngay". Não không chờ được.</p>
<p><strong>Delay 10 phút</strong> là kỹ thuật cơ bản nhất nhưng hiệu quả nhất:</p>
<ol>
  <li>Khi thèm → mở app, bấm "Delay" → đếm ngược 10 phút</li>
  <li>Trong 10 phút đó: uống 1 cốc nước lạnh + đi 200 bước</li>
  <li>Hết 10 phút: 70% trường hợp cơn thèm tự qua</li>
</ol>
<p>Lý do: cơn thèm peak ở 90 giây và tự decay sau 3-5 phút. Delay 10 phút đảm bảo {pronoun} qua được peak.</p>
<p>Hôm nay {pronoun} thử delay 1 lần. Sol sẽ đếm cùng.</p>
<p style="margin-top: 20px;"><a href="{appUrl}" style="color: #B8860B; font-weight: 600;">Mở app delay →</a></p>
    `,
    textBody: `Khi thèm, delay 10 phút: uống nước + đi 200 bước. Cơn thèm peak 90 giây, decay 3-5 phút. {Pronoun} sẽ qua được. Mở app: {appUrl}

— Sol`,
  },

  {
    day: 17,
    chapter: 'KIEM_SOAT_HARD',
    voice: 'KHANG',
    subject: 'Day 17 thường khó nhất Kiểm Soát — Sol bên {pronoun}',
    htmlBody: `
<p><strong>{Pronoun} ơi,</strong></p>
<p>Mình viết mail này lúc 21h tối Day 17 vì <strong>đêm nay có thể là đêm khó nhất</strong> Kiểm Soát.</p>
<p>Lúc mình ở giai đoạn này thì:</p>
<ul>
  <li>Não đã quen với việc giảm — nhưng chưa thoả</li>
  <li>4 ngày nữa tới Q-Day — não sợ commit</li>
  <li>21-22h là giờ thèm peak (sau cơm + trước ngủ)</li>
</ul>
<p>Nếu cơn thèm lên 8/10, {pronoun} mở app → check-in. Sol sẽ <strong>tự động hiện 3 lý do {pronoun} đã viết</strong>. Đọc lại 3 lần. Đi bộ ra ban công 5 phút.</p>
<p>Đêm Day 17 mình đã làm như vậy. Nếu {pronoun} qua được đêm nay, 4 ngày tới Q-Day sẽ dễ hơn nhiều.</p>
<p>Sol bên {pronoun}.</p>
<p style="margin-top: 24px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `{Pronoun} ơi, Day 17 thường khó nhất Kiểm Soát. 21-22h là peak. Nếu thèm 8/10, mở app check-in — Sol sẽ replay 3 lý do {pronoun} đã viết. Sol bên {pronoun}.

— Khang`,
  },

  {
    day: 21,
    chapter: 'EVE_Q_DAY',
    voice: 'KHANG',
    subject: 'Đêm trước Q-Day · mai {pronoun} cam kết · gói Làm Chủ?',
    htmlBody: `
<p><strong>{Pronoun} ơi,</strong></p>
<p>Đêm nay là đêm cuối của Kiểm Soát. Mai 7h sáng Sol sẽ gửi {pronoun} màn hình <strong>Q-Day Ceremony</strong> — chỗ {pronoun} bấm "Tôi cam kết".</p>
<p>Đêm nay mình mong {pronoun}:</p>
<ul>
  <li>Đọc lại 3 lý do {pronoun} đã viết tuần đầu</li>
  <li>Đọc lại Plan B cho top trigger</li>
  <li>Hút điếu cuối cùng nếu muốn — không xấu hổ</li>
  <li>Ngủ sớm</li>
</ul>
<p>Mai sáng đồng hồ Tự Do của {pronoun} sẽ bật — bắt đầu chặng <strong>Làm Chủ 30 ngày</strong>.</p>
<p style="margin-top: 24px;"><a href="{appUrl}/paywall?tier=DONG_HANH" style="display: inline-block; background: #B25C2C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">🔴 Vào Làm Chủ — 199k cho 30 ngày</a></p>
<p style="margin-top: 16px; color: #8B6914;">99k Kiểm Soát + 199k Làm Chủ = <strong>298.000đ tổng</strong> = đúng 1 tháng tiền thuốc {pronoun} đang hút. Tự chia ra, {pronoun} không mất gì.</p>
<p style="margin-top: 20px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `Đêm nay đêm cuối Kiểm Soát. Mai 7h sáng Q-Day Ceremony — Day 22, bắt đầu Làm Chủ 30 ngày.

Vào Làm Chủ 199k: {appUrl}/paywall?tier=DONG_HANH

99k + 199k = 298k = 1 tháng tiền thuốc. {Pronoun} không mất gì.

— Khang`,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHẶNG 3 — LÀM CHỦ (Day 22-51, 199k)
  // ═══════════════════════════════════════════════════════════════════════
  {
    day: 22,
    chapter: 'Q_DAY',
    voice: 'KHANG',
    subject: '🌅 Hôm nay là Q-Day · bắt đầu Làm Chủ',
    htmlBody: `
<p style="font-size: 32px; text-align: center; margin: 16px 0;">🌅</p>
<p style="text-align: center; font-size: 22px; font-weight: 700;">Hôm nay là Q-Day của {pronoun}</p>
<p style="text-align: center; color: #B25C2C; font-weight: 600;">Day 22 · Bắt đầu chặng Làm Chủ 30 ngày</p>
<p>{Pronoun} đã chuẩn bị 3 tuần — 7 ngày Nhận Diện + 14 ngày Kiểm Soát. Sol đã đo nhịp của {pronoun}. Đội Sol đã sẵn sàng.</p>
<p>Mở app, bấm "Tôi cam kết" — đồng hồ Tự Do bắt đầu chạy từ giây đó.</p>
<p style="margin-top: 24px;"><a href="{appUrl}" style="display: inline-block; background: #B25C2C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">🌅 Mở Q-Day Ceremony</a></p>
<p style="margin-top: 24px;"><strong>24 giờ tới là 24 giờ khó nhất sinh học.</strong> Sol sẽ check-in mỗi giờ. {Pronoun} không một mình.</p>
<p style="margin-top: 24px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `Hôm nay là Q-Day. Day 22 · bắt đầu Làm Chủ 30 ngày. {Pronoun} đã chuẩn bị 3 tuần. Mở app bấm "Tôi cam kết": {appUrl}

24 giờ tới khó nhất. Sol check-in mỗi giờ.

— Khang`,
  },

  {
    day: 30,
    chapter: 'LAM_CHU_WEEK_1',
    voice: 'SOL_DONG_HANH',
    subject: '8 ngày sạch sau Q-Day · body {pronoun} đã hồi',
    htmlBody: `
<p><strong>8 ngày sạch sau Q-Day.</strong></p>
<p>Theo NHS + CDC, body {pronoun} đã:</p>
<ul>
  <li><strong>20 phút sau:</strong> nhịp tim + huyết áp về normal</li>
  <li><strong>12 giờ sau:</strong> CO trong máu về 0</li>
  <li><strong>2-3 ngày sau:</strong> taste + smell receptor bắt đầu hồi</li>
  <li><strong>1 tuần (8 ngày trước):</strong> nicotin gần như sạch khỏi máu</li>
</ul>
<p>Body {pronoun} đã làm xong phần khó nhất. Còn não — phần đó cần 22 ngày tiếp tới Day 52.</p>
<p>Tuần này nếu có slip — Sol vẫn ở đây, đồng hồ không reset. Sol biết slip không phải thất bại.</p>
<p style="margin-top: 20px;"><a href="{appUrl}" style="color: #B25C2C; font-weight: 600;">Xem body recovery rings →</a></p>
    `,
    textBody: `8 ngày sạch. Body {pronoun} đã hồi: tim, CO, taste, smell, máu. Còn não cần 22 ngày tiếp tới Day 52. Slip không reset. Mở app: {appUrl}

— Sol`,
  },

  {
    day: 40,
    chapter: 'LAM_CHU_MID',
    voice: 'KHANG',
    subject: '{Pronoun} đã đi nửa Làm Chủ · nửa còn lại nhẹ hơn',
    htmlBody: `
<p><strong>{Pronoun} ơi,</strong></p>
<p>Day 40 = giữa Làm Chủ. 18 ngày sạch sau Q-Day. Mình nhớ giai đoạn này của mình — lúc đó mình đã quên app vài ngày liền. Đó là dấu hiệu tốt.</p>
<p>Nửa còn lại Sol giảm dần message — không phải vì bỏ {pronoun}, mà vì <strong>{pronoun} đã không cần Sol nhiều như trước</strong>. Đó là autonomy mode.</p>
<p>Còn 11 ngày là Day 51 — kết Làm Chủ. Còn 12 ngày là Day 52 — Lễ Tốt Nghiệp.</p>
<p>Bây giờ — nghỉ thôi. {Pronoun} đang làm tốt.</p>
<p style="margin-top: 20px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `Day 40 = giữa Làm Chủ. 18 ngày sạch. Sol sẽ giảm message — vì {pronoun} đã không cần Sol nhiều như trước. Còn 12 ngày tới Lễ Tốt Nghiệp.

— Khang`,
  },

  {
    day: 45,
    chapter: 'PRE_GRAD',
    voice: 'SOL_DONG_HANH',
    subject: 'Còn 7 ngày tốt nghiệp · viết lại Identity',
    htmlBody: `
<p><strong>Còn 7 ngày tới Day 52 — Lễ Tốt Nghiệp Người Tự Do.</strong></p>
<p>Hôm nay Sol gợi ý {pronoun} mở Sổ Hành Trình → tab <strong>Bản Thân</strong> → đọc lại 7 câu identity {pronoun} đã viết hồi Kiểm Soát.</p>
<p>So sánh với cảm xúc bây giờ. {Pronoun} sẽ thấy mình khác.</p>
<p>Nếu thấy có câu muốn viết lại — viết lại. Đây là dấu hiệu identity đã thật sự đổi.</p>
<p style="margin-top: 20px;"><a href="{appUrl}/workbook?tab=prep" style="color: #B25C2C; font-weight: 600;">Mở Bản Thân →</a></p>
    `,
    textBody: `Còn 7 ngày tốt nghiệp. Mở Sổ Hành Trình → tab Bản Thân → đọc 7 câu Identity. So với bây giờ {pronoun} sẽ thấy khác.

— Sol`,
  },

  {
    day: 51,
    chapter: 'EVE_GRAD',
    voice: 'KHANG',
    subject: 'Đêm trước Lễ Tốt Nghiệp · mai {pronoun} là Người Tự Do',
    htmlBody: `
<p><strong>{Pronoun} ơi,</strong></p>
<p>Đêm nay là Day 51 — đêm cuối của Làm Chủ. Mai là <strong>Day 52 · Lễ Tốt Nghiệp</strong>.</p>
<p>{Pronoun} đã đi qua:</p>
<ul>
  <li>7 ngày Nhận Diện — quan sát mình</li>
  <li>14 ngày Kiểm Soát — giảm tần suất</li>
  <li>30 ngày Làm Chủ — cai hẳn sau Q-Day</li>
</ul>
<p><strong>51 ngày. Tổng cộng 298.000đ — đúng 1 tháng tiền thuốc {pronoun} đã từng đốt.</strong></p>
<p>Đêm nay mình mong {pronoun} ngồi 30 phút viết ra 5-10 thay đổi {pronoun} đã thấy ở mình. Mai Sol sẽ gửi PDF Album Hành Trình — nhưng trước đó {pronoun} cần tự nhận diện thay đổi.</p>
<p>Mai từ Day 52, {pronoun} là <strong>Người Tự Do</strong> — Sol miễn phí mãi mãi. Mình đợi {pronoun} ở lễ tốt nghiệp.</p>
<p style="margin-top: 20px; color: #8B6914; font-style: italic;">— Khang</p>
    `,
    textBody: `Đêm nay Day 51 — đêm cuối Làm Chủ. Mai Day 52 Lễ Tốt Nghiệp.

51 ngày. 298k tổng = 1 tháng tiền thuốc. Đêm nay viết 5-10 thay đổi {pronoun} đã thấy.

Mai {pronoun} là Người Tự Do — Sol miễn phí mãi.

— Khang`,
  },

  {
    day: 52,
    chapter: 'GRADUATION',
    voice: 'KHANG',
    subject: '🌟 Day 52 · {Pronoun} đã tốt nghiệp · Người Tự Do',
    htmlBody: `
<p style="text-align: center; font-size: 40px; margin: 16px 0;">🌟</p>
<p style="text-align: center; font-size: 22px; font-weight: 700; color: #5C3A1E;">{Pronoun} đã đi qua 52 ngày.</p>
<p style="text-align: center; color: #8B6914; font-weight: 600;">Sol Day 52 · Lễ Tốt Nghiệp · Người Tự Do</p>
<p><strong>{Pronoun} ơi,</strong></p>
<p>Cách đây 52 ngày {pronoun} là người hút thuốc lá. Bây giờ {pronoun} là người không hút.</p>
<p>Không phải "đang cố không hút". Là <strong>không phải</strong> người hút. Identity đã đổi.</p>
<p>Đây là chặng <strong>🌟 Người Tự Do</strong> — Sol mở quyền vĩnh viễn cho {pronoun}, miễn phí mãi mãi. {Pronoun} có thể:</p>
<ul>
  <li>Truy cập Sổ Hành Trình đầy đủ — bản 51 ngày của riêng {pronoun}</li>
  <li>Đọc & viết cộng đồng cohort</li>
  <li>Huy hiệu Người Tự Do vĩnh viễn</li>
  <li>Đại Sứ Sol (tuỳ chọn) — mentor 1 anh em mới đang vào Sol</li>
</ul>
<p>Mình muốn {pronoun} làm 1 việc cuối cho Sol: <strong>kể câu chuyện của {pronoun} trong 1 đoạn ngắn</strong>. Sol sẽ dùng (ẩn danh) để giúp anh em mới tin rằng họ làm được.</p>
<p style="margin-top: 24px;"><a href="{appUrl}" style="display: inline-block; background: linear-gradient(135deg, #5C3A1E 0%, #B8860B 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">🌟 Mở Người Tự Do · Đại Sứ Sol</a></p>
<p style="margin-top: 24px; color: #8B6914; font-style: italic;">— Khang Sol<br>Người Đã Đi Qua, đã đi cùng {pronoun} 52 ngày</p>
    `,
    textBody: `{Pronoun} đã đi qua 52 ngày. Identity đã đổi.

Đây là Người Tự Do — Sol miễn phí mãi mãi. Đại Sứ Sol (tuỳ chọn): {appUrl}

— Khang Sol`,
  },
];
