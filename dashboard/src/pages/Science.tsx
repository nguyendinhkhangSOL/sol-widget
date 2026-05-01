// dashboard/src/pages/Science.tsx
//
// Trang tham khảo nghiên cứu — đặt ở /science. Đây là bài viết HTML
// dạng dài (article) liệt kê toàn bộ nguồn lâm sàng SOL dùng để dựng
// đồng hồ + 4 vòng cơ quan + identity progression. Mục tiêu: minh bạch
// với user 45+ trí thức/cẩn thận.
//
// Nội dung viết theo phong cách "founder-to-reader" — ngắn, có nguồn,
// in được. Khi có wiki bài chi tiết hơn ở sol.vn, link sang đó.

import { Link } from 'react-router-dom';

export function Science() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pb-24 print:p-0">
      <div className="print:hidden mb-4">
        <Link to="/" className="text-meta text-sol-ink-3 underline">
          ← Về Tổng quan
        </Link>
      </div>

      <article className="prose-article">
        <header className="mb-6 print:mb-4">
          <div className="text-meta uppercase tracking-wider text-sol-ink-3 font-semibold">
            Tham khảo nghiên cứu
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-sol-ink mt-1">
            Cơ sở khoa học của đồng hồ + hành trình SOL
          </h1>
          <p className="text-body text-sol-ink-2 mt-2 leading-relaxed">
            Trang này liệt kê đầy đủ nguồn lâm sàng dùng để dựng "đồng hồ
            cơ thể", "4 vòng cơ quan" và "tiến trình danh tính" trên dashboard.
            Mọi con số đều có thể truy ngược về một nghiên cứu hoặc hướng
            dẫn của tổ chức y tế công cộng.
          </p>
          <button
            onClick={() => window.print()}
            className="sol-btn-secondary sol-btn-sm mt-3 print:hidden"
          >
            🖨️ In / lưu PDF
          </button>
        </header>

        {/* ─── Nguồn chính ─── */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            1. Các nguồn chính
          </h2>
          <p className="text-body text-sol-ink-2 leading-relaxed">
            SOL dùng tổng hợp 4 nguồn chuẩn quốc tế + một số nghiên cứu lâm sàng
            đã peer-review:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-body text-sol-ink-2">
            <li>
              <strong>WHO Tobacco Free Initiative</strong> —{' '}
              <a
                href="https://www.who.int/health-topics/tobacco"
                target="_blank"
                rel="noreferrer"
                className="text-sol-blue underline"
              >
                who.int/health-topics/tobacco
              </a>
            </li>
            <li>
              <strong>NHS Smokefree (Anh)</strong> —{' '}
              <a
                href="https://www.nhs.uk/better-health/quit-smoking/"
                target="_blank"
                rel="noreferrer"
                className="text-sol-blue underline"
              >
                nhs.uk/better-health/quit-smoking
              </a>
            </li>
            <li>
              <strong>CDC Smoking & Tobacco Use (Mỹ)</strong> —{' '}
              <a
                href="https://www.cdc.gov/tobacco/quit_smoking/how_to_quit/benefits/"
                target="_blank"
                rel="noreferrer"
                className="text-sol-blue underline"
              >
                cdc.gov/tobacco/quit_smoking/how_to_quit/benefits
              </a>
            </li>
            <li>
              <strong>Smokefree.gov</strong> (US National Cancer Institute) —{' '}
              <a
                href="https://smokefree.gov"
                target="_blank"
                rel="noreferrer"
                className="text-sol-blue underline"
              >
                smokefree.gov
              </a>
            </li>
            <li>
              <strong>2020 Surgeon General's Report</strong> — Smoking
              Cessation: A Report of the Surgeon General (US Dept. of Health
              and Human Services).
            </li>
          </ul>
        </section>

        {/* ─── Bảng mốc thể lý ─── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            2. Đồng hồ thể lý — các mốc cụ thể
          </h2>
          <p className="text-body text-sol-ink-2 leading-relaxed mb-3">
            Mỗi badge thời gian trên dashboard ứng với một thay đổi sinh học
            đã được ghi nhận. Bảng dưới đây trích nguyên văn nguồn:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-meta border border-sol-line">
              <thead className="bg-sol-paper text-[11px] uppercase tracking-wider text-sol-ink-3">
                <tr>
                  <th className="text-left p-2 border-b border-sol-line">Thời điểm</th>
                  <th className="text-left p-2 border-b border-sol-line">Hiện tượng</th>
                  <th className="text-left p-2 border-b border-sol-line">Nguồn</th>
                </tr>
              </thead>
              <tbody className="text-sol-ink-2">
                <Row time="20 phút" event="Nhịp tim + huyết áp về bình thường" source="Mahmud A & Feely J (2003) Hypertension; CDC Health Benefits of Quitting" />
                <Row time="8 giờ" event="CO trong máu giảm 50% (half-life CO ~4–6h)" source="NHS Smokefree; Surgeon General Report 2010" />
                <Row time="12 giờ" event="CO máu gần bình thường" source="NHS Smokefree" />
                <Row time="24 giờ" event="Nguy cơ MI bắt đầu giảm" source="CDC Health Benefits of Quitting" />
                <Row time="48 giờ" event="Vị giác/khứu giác phục hồi (đầu dây thần kinh mọc lại)" source="NHS Smokefree; NCI Smokefree.gov" />
                <Row time="72 giờ" event="Phế quản giãn, đỉnh withdrawal" source="Hughes JR (2007) — Effects of abstinence from tobacco. Nicotine Tob Res. 9(3):315–327" />
                <Row time="1 tuần" event="9/10 người tái phát trong tuần đầu — vượt qua = lợi thế lớn" source="Hughes JR (2009) Treating Tobacco Use" />
                <Row time="2 tuần" event="Receptor nicotine (nAChR) downregulate ~40%" source="Mamede M et al. (2007) — J Nucl Med 48(11):1829–35" />
                <Row time="3 tuần" event="Mạch thần kinh thói quen mới hình thành" source="Lally P et al. (2010) — Eur J Soc Psychol; habit formation 18–254 ngày, trung bình 66" />
                <Row time="30 ngày" event="< 10% người làm được trong lần đầu thử" source="Hughes JR (2009); American Lung Association" />
                <Row time="3 tháng" event="Cilia phổi tái tạo, dung tích +10%" source="NHS Smokefree; Surgeon General 2020" />
                <Row time="9 tháng" event="Ho mãn tính + khó thở giảm rõ rệt" source="NHS Smokefree" />
                <Row time="1 năm" event="Nguy cơ bệnh mạch vành (CHD) giảm 50%" source="Surgeon General 1990 + 2020; AHA Guidelines" />
                <Row time="5 năm" event="Nguy cơ đột quỵ ≈ người chưa từng hút" source="Surgeon General 2020; Stroke Journal meta-analyses" />
                <Row time="10 năm" event="Nguy cơ ung thư phổi giảm 50%" source="IARC Tobacco Smoke Monograph; Surgeon General" />
                <Row time="15 năm" event="Nguy cơ CHD ≈ người chưa từng hút" source="Surgeon General 2020" />
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 4 vòng cơ quan ─── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            3. Bốn vòng cơ quan — cách tính
          </h2>
          <p className="text-body text-sol-ink-2 leading-relaxed mb-2">
            Bốn vòng <strong>Tim mạch / Phổi / Não bộ / Miễn dịch</strong> dùng
            đường cong tiệm cận mũ:
          </p>
          <pre className="bg-sol-paper border border-sol-line rounded-lg p-3 text-meta overflow-x-auto">
            recovery(t) = 1 − e^(−t / τ)
          </pre>
          <p className="text-body text-sol-ink-2 leading-relaxed mt-2">
            Mỗi cơ quan có tham số τ (tau) khác nhau, được calibrate để vòng
            tiến độ khớp với mốc lâm sàng đã biết:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-body text-sol-ink-2">
            <li><strong>Tim mạch — τ = 48 giờ</strong> (phục hồi nhanh; HR/BP 20 phút, MI 24h)</li>
            <li><strong>Phổi — τ ≈ 5 tháng (3 500 giờ)</strong> (cilia mọc lại 1–9 tháng)</li>
            <li><strong>Não bộ — τ ≈ 2 tuần (350 giờ)</strong> (nAChR reset 2–4 tuần)</li>
            <li><strong>Miễn dịch — τ ≈ 5 tuần (900 giờ)</strong> (bạch cầu/phản ứng viêm 1–3 tháng)</li>
          </ul>
          <div className="bg-sol-green-soft border border-sol-green/30 rounded-xl p-3 mt-4 text-meta">
            <strong className="text-sol-green-ink">✓ Cá nhân hoá v2 (đã triển khai).</strong>{' '}
            Khi bạn điền <code className="bg-white px-1 rounded text-[11px]">yearsSmoked</code>{' '}
            (số năm đã hút) trong Hồ sơ, τ sẽ được nhân với hệ số:
            <code className="block mt-1 bg-white p-1.5 rounded text-[11px]">
              τ_personalized = τ_base × (1 + yearsSmoked × factor)
            </code>
            <span className="block mt-2">
              Hệ số factor: <strong>phổi 0.020</strong>, <strong>não 0.015</strong>,{' '}
              <strong>miễn dịch 0.010</strong>, <strong>tim 0.005</strong> — phổi và não nhạy
              nhất với độ dài hút thuốc, tim & miễn dịch ít nhạy hơn. Cap mức tối
              đa = 2× để không quá lớn (yearsSmoked &gt; 50).
            </span>
            <span className="block mt-2 text-sol-ink-2">
              Ví dụ: hút 30 năm → τ_phổi × 1.60 (chậm hơn 60%), τ_não × 1.45.
              Hút 5 năm → τ_phổi × 1.10, gần baseline.
            </span>
          </div>
          <div className="bg-sol-orange-soft border border-sol-orange/30 rounded-xl p-3 mt-3 text-meta">
            <strong className="text-sol-orange-ink">⚠️ Vẫn còn limitation.</strong>{' '}
            Mô hình chưa tính đến: tuổi, gen chuyển hoá nicotine (CYP2A6), bệnh
            nền (COPD, tiểu đường), hay liều hút (số điếu × năm). Roadmap v3 sẽ
            bổ sung age + cigsPerDay khi có đủ data từ ≥ 500 user.
          </div>
        </section>

        {/* ─── 4 phase tâm lý ─── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            4. Bốn giai đoạn tâm lý-hành vi (workbook)
          </h2>
          <p className="text-body text-sol-ink-2 leading-relaxed mb-2">
            SOL hiện hỗ trợ <strong>2 ngôn ngữ</strong> cho 4 giai đoạn — mặc
            định "Hình ảnh" (Việt hoá), có thể đổi sang "Khoa học" trong{' '}
            <em>Cài đặt → Tuỳ chọn nâng cao</em>:
          </p>
          <table className="w-full text-meta border border-sol-line mt-2">
            <thead className="bg-sol-paper text-[11px] uppercase tracking-wider text-sol-ink-3">
              <tr>
                <th className="text-left p-2 border-b border-sol-line">Tuần</th>
                <th className="text-left p-2 border-b border-sol-line">Hình ảnh (default)</th>
                <th className="text-left p-2 border-b border-sol-line">Khoa học</th>
                <th className="text-left p-2 border-b border-sol-line">Cơ sở</th>
              </tr>
            </thead>
            <tbody className="text-sol-ink-2">
              <tr className="border-b border-sol-line">
                <td className="p-2 font-semibold whitespace-nowrap align-top">1 (D1–7)</td>
                <td className="p-2 align-top">Chiến Trường</td>
                <td className="p-2 align-top">Withdrawal Week</td>
                <td className="p-2 text-sol-ink-3 align-top">Hughes 2007: 75–95% triệu chứng đỉnh ngày 3, giảm dần đến ngày 7</td>
              </tr>
              <tr className="border-b border-sol-line">
                <td className="p-2 font-semibold whitespace-nowrap align-top">2 (D8–14)</td>
                <td className="p-2 align-top">Đống Tro Tàn</td>
                <td className="p-2 align-top">Slump Week</td>
                <td className="p-2 text-sol-ink-3 align-top">Anhedonia + low mood do dopamine chưa cân bằng (Cook JW 2017)</td>
              </tr>
              <tr className="border-b border-sol-line">
                <td className="p-2 font-semibold whitespace-nowrap align-top">3 (D15–21)</td>
                <td className="p-2 align-top">Ánh Bình Minh</td>
                <td className="p-2 align-top">Habit Reset</td>
                <td className="p-2 text-sol-ink-3 align-top">Automaticity (Lally 2010); ~21 ngày là sàn cho habit đơn giản</td>
              </tr>
              <tr className="border-b border-sol-line">
                <td className="p-2 font-semibold whitespace-nowrap align-top">4 (D22–30)</td>
                <td className="p-2 align-top">Tự Do</td>
                <td className="p-2 align-top">Consolidation</td>
                <td className="p-2 text-sol-ink-3 align-top">Relapse rate giảm ~50% so với W1 (Hughes 2009)</td>
              </tr>
            </tbody>
          </table>
          <p className="text-meta text-sol-ink-3 mt-3 italic">
            Tên hình ảnh thân thuộc cho người Việt 45+; tên khoa học sát thuật ngữ
            cessation literature. Cùng một thực thể, hai cách gọi.
          </p>
        </section>

        {/* ─── Identity ─── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            5. Tiến trình "danh tính" (identity progression)
          </h2>
          <p className="text-body text-sol-ink-2 leading-relaxed">
            7 mốc danh tính (Người mới bắt đầu → Người sống sót 72h → … →
            Người ánh sáng → Người đồng hành Sol) dựa trên 3 lý thuyết
            cessation psychology:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-body text-sol-ink-2">
            <li>
              <strong>Identity-based behavior change</strong> — Oyserman D et
              al. (2017): hành vi mới gắn vào identity thì giữ lâu hơn gắn
              vào willpower.
            </li>
            <li>
              <strong>Self-determination theory</strong> — Deci & Ryan:
              autonomy + competence + relatedness. 7 mốc cho cảm giác{' '}
              <em>competence</em> tăng dần.
            </li>
            <li>
              <strong>Stages of Change</strong> — Prochaska & DiClemente
              (1983). SOL không dùng tên gốc (Action / Maintenance) mà tự đặt
              tên thân thuộc hơn.
            </li>
          </ul>
        </section>

        {/* ─── Tuyên bố ─── */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="text-xl font-bold text-sol-ink mt-6 mb-2">
            6. Tuyên bố (disclaimer)
          </h2>
          <div className="bg-sol-paper rounded-xl border border-sol-line p-4 text-meta text-sol-ink-2 leading-relaxed">
            <p>
              SOL là <strong>công cụ đồng hành</strong> cho hành trình cai
              thuốc — KHÔNG phải dịch vụ y tế và KHÔNG thay thế tư vấn của
              bác sĩ.
            </p>
            <p className="mt-2">
              Các con số phục hồi cơ quan trên dashboard là <em>xấp xỉ
              thống kê</em>, không phải chẩn đoán cá nhân. Nếu bạn có bệnh
              nền (cao huyết áp, tim mạch, COPD, đái tháo đường, đang mang
              thai…) hãy tham khảo bác sĩ trước khi bắt đầu.
            </p>
            <p className="mt-2">
              Nếu bạn đang dùng thuốc hỗ trợ cai (NRT — Nicotine Replacement
              Therapy, Bupropion, Varenicline…), tiếp tục theo chỉ định của
              bác sĩ. SOL chỉ bổ sung phần đồng hành tinh thần + theo dõi
              hành vi, không thay thế dược phẩm.
            </p>
          </div>
        </section>

        <footer className="mt-10 text-meta text-sol-ink-3 border-t border-sol-line pt-4">
          Tài liệu này được Khang Sol biên soạn dựa trên các nguồn công khai.
          Cập nhật lần cuối khi có nghiên cứu mới hoặc khuyến nghị y tế thay
          đổi. Phản hồi: <a href="mailto:khang@sol.vn" className="text-sol-blue underline">khang@sol.vn</a>.
        </footer>
      </article>
    </div>
  );
}

function Row({ time, event, source }: { time: string; event: string; source: string }) {
  return (
    <tr className="border-b border-sol-line">
      <td className="p-2 font-semibold text-sol-ink whitespace-nowrap align-top">{time}</td>
      <td className="p-2 align-top">{event}</td>
      <td className="p-2 text-meta text-sol-ink-3 align-top">{source}</td>
    </tr>
  );
}
