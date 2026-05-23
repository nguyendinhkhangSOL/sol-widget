import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Khang Sol — Founder Đi Cùng Sol',
  description: 'Nguyễn Đình Khang (sinh 1976) — hút Vinataba 30 năm (1991-2020), thử bỏ 4 lần thất bại, lần thứ 5 thành công ngày 22-12-2020 âm lịch, nay hơn 5 năm Tự do.',
  alternates: { canonical: 'https://bothuocla.sol.vn/khang-sol' }
};

export default function KhangSolPage() {
  return (
    <>
      <Header />

      <main id="main" className="container-sol py-8">
        {/* Person Schema JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Khang Sol',
              alternateName: 'Nguyễn Đình Khang',
              url: 'https://sol.vn/khang-sol',
              jobTitle: 'Founder dự án Đi Cùng Sol',
              birthDate: '1976',
              description: 'Hút Vinataba 30 năm (1991-2020). Thử bỏ 4 lần thất bại. Lần thứ 5 thành công 22-12-2020 âm lịch — hơn 5 năm Tự do. KHÔNG phải bác sĩ.',
              knowsAbout: [
                'Cai thuốc lá',
                'Fagerström Test for Nicotine Dependence (FTND)',
                'CBT — Cognitive Behavioral Therapy',
                'Smoking cessation for Vietnamese men 45+',
                'Cochrane Tobacco Addiction Reviews'
              ],
              sameAs: [
                'https://web.facebook.com/nguyendinhkhang',
                'https://www.linkedin.com/in/vietnaminternet/'
              ]
            })
          }}
        />

        <div className="text-center mb-8">
          <div className="inline-block w-24 h-24 rounded-full bg-sol-brown text-white text-5xl font-bold font-serif flex items-center justify-center mb-4">
            K
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-2">
            Khang Sol
          </h1>
          <p className="text-sol-ink2 text-lg">
            Nguyễn Đình Khang · Founder Đi Cùng Sol
          </p>
        </div>

        <div className="card-sol mb-6">
          <h2 className="text-xl font-bold text-sol-brown mb-4">Câu chuyện của Khang</h2>

          <div className="prose prose-sol max-w-none text-sol-ink leading-relaxed">
            <p>
              <strong>Mình tên Khang. Sinh 1976.</strong>
            </p>

            <p>
              Bắt đầu hút năm 15 tuổi (1991). Vinataba. Bố mình hút. Anh mình hút. Bạn cùng lớp hút. Mình hút theo.
            </p>

            <p>
              30 năm sau, mình hút 1-2 gói/ngày khi deadline dồn. Đêm ho. Vợ nhăn. Con gái thì nói thẳng: <em>"Bố hôi lắm."</em>
            </p>

            <p className="font-semibold text-sol-brown mt-6 mb-3">Mình đã thử bỏ 4 lần. Fail cả 4.</p>

            <ul className="space-y-2">
              <li>
                <strong>Lần 1 (1995):</strong> Bố chở mình ra ga tàu đi học xa.
                Lời hứa thuần. Fail tại trường trong tuần đầu.
              </li>
              <li>
                <strong>Lần 2 (2008):</strong> Đau dạ dày, bác sĩ doạ ung thư.
                Bỏ được 3 tháng. Cơn sợ phai → hút lại.
              </li>
              <li>
                <strong>Lần 3 (2012):</strong> "Khi cưới sẽ bỏ. Khi có con sẽ bỏ."
                Cưới rồi. Có con rồi. Vẫn hút.
              </li>
              <li>
                <strong>Lần 4 (2018-2019):</strong> Thử mọi thứ — Allen Carr, QuitNow, Smoke Free, nước súc miệng,
                hỏi bác sĩ về Champix (BS không kê đơn). Tất cả fail.
              </li>
            </ul>

            <p className="font-semibold text-sol-brown mt-6 mb-3">Lần thứ 5 — bất chợt.</p>

            <p>
              <strong>22-12-2020 âm lịch (cận Tết Tân Sửu).</strong> Sáng đó mình tỉnh dậy, đang cầm điếu,
              thì bỗng nghĩ: <em>"Việc hôm nay không đáng trả bằng sức khoẻ 10 năm tới."</em>
            </p>

            <p>
              Mình bỏ điếu xuống. Không hứa ai. Không tuyên bố. Chỉ <strong>thay đổi cách nhìn</strong>.
            </p>

            <p>
              <strong>Đến hôm nay (2026) — hơn 5 năm Tự do.</strong>
            </p>

            <p className="font-semibold text-sol-orange mt-6 mb-3">Tại sao mình làm Sol?</p>

            <p>
              30 năm hút mà <strong>không có ai đi cùng</strong>. Mình ước có Sol lúc đó.
              Bây giờ mình muốn đi cùng anh em.
            </p>

            <p>
              Sol KHÔNG phải sản phẩm y tế. Mình KHÔNG phải bác sĩ.
              Sol bám khoa học (Cochrane Reviews, FTND, WHO Guidelines) + trải nghiệm thực chiến của mình.
            </p>

            <p className="text-sm text-sol-ink2 italic mt-6">
              Anh đọc đến đây — cảm ơn. Nếu anh muốn đi cùng,{' '}
              <Link href="/test-ftnd" className="text-sol-orange underline font-semibold">làm Test FTND 2 phút</Link>{' '}
              để Sol đề xuất lộ trình phù hợp.
            </p>
          </div>
        </div>

        {/* Quick facts */}
        <div className="card-sol bg-sol-cream mb-6">
          <h2 className="font-bold text-sol-brown mb-3">Quick facts</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-sol-ink2">Tên thật:</dt><dd className="font-semibold text-sol-brown">Nguyễn Đình Khang</dd></div>
            <div><dt className="text-sol-ink2">Sinh năm:</dt><dd className="font-semibold text-sol-brown">1976</dd></div>
            <div><dt className="text-sol-ink2">Bắt đầu hút:</dt><dd className="font-semibold text-sol-brown">1991 (15 tuổi)</dd></div>
            <div><dt className="text-sol-ink2">Tự do:</dt><dd className="font-semibold text-sol-brown">22-12-2020 âm lịch</dd></div>
            <div><dt className="text-sol-ink2">Số lần fail:</dt><dd className="font-semibold text-sol-brown">4 lần</dd></div>
            <div><dt className="text-sol-ink2">Background:</dt><dd className="font-semibold text-sol-brown">CNTT 20 năm</dd></div>
            <div><dt className="text-sol-ink2">Sol thành lập:</dt><dd className="font-semibold text-sol-brown">2026</dd></div>
            <div><dt className="text-sol-ink2">Vai trò:</dt><dd className="font-semibold text-sol-brown">Founder</dd></div>
          </dl>
        </div>

        {/* Social */}
        <div className="card-sol mb-6">
          <h2 className="font-bold text-sol-brown mb-3">Hồ sơ + Liên kết</h2>
          <div className="flex flex-col gap-2 text-sm">
            <a href="https://sol.vn/khang-sol" target="_blank" rel="noopener noreferrer" className="text-sol-orange hover:underline">
              📄 Person Entity Hub trên sol.vn
            </a>
            <a href="https://web.facebook.com/nguyendinhkhang" target="_blank" rel="noopener noreferrer" className="text-sol-orange hover:underline">
              📘 Facebook cá nhân
            </a>
            <a href="https://www.linkedin.com/in/vietnaminternet/" target="_blank" rel="noopener noreferrer" className="text-sol-orange hover:underline">
              💼 LinkedIn
            </a>
            <a href="mailto:nguyendinhkhang@gmail.com" className="text-sol-orange hover:underline">
              ✉️ nguyendinhkhang@gmail.com
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <Link href="/test-ftnd" className="btn-primary">
            Làm Test FTND để bắt đầu →
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
