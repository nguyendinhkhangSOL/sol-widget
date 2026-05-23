import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-sol-brown text-sol-paper mt-16">
      <div className="container-sol py-10 text-center">
        <div className="mb-4">
          <div className="font-bold text-lg">Đi Cùng Sol</div>
          <p className="text-sm opacity-80 mt-1">
            App đồng hành cai thuốc lá cho nam giới Việt 45+
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm mb-6">
          <Link href="/" className="hover:text-sol-orange">Trang chủ</Link>
          <Link href="/test-ftnd" className="hover:text-sol-orange">Test FTND</Link>
          <Link href="/bang-gia" className="hover:text-sol-orange">Chi phí</Link>
          <Link href="/khang-sol" className="hover:text-sol-orange">Khang Sol</Link>
          <a href="https://sol.vn" target="_blank" rel="noopener noreferrer" className="hover:text-sol-orange">
            Wiki sol.vn
          </a>
          <a href="https://fb.com/groups/dicungsol" target="_blank" rel="noopener noreferrer" className="hover:text-sol-orange">
            Cộng đồng FB
          </a>
        </div>

        <p className="text-xs opacity-60 max-w-2xl mx-auto mb-2">
          © 2026 Đi Cùng Sol · Dự án độc lập của Khang Sol (Nguyễn Đình Khang) ·
          <a href="mailto:nguyendinhkhang@gmail.com" className="ml-1 underline hover:text-sol-orange">
            Liên hệ
          </a>
        </p>

        <p className="text-xs opacity-50">
          Sol KHÔNG phải sản phẩm y tế · Khang KHÔNG phải bác sĩ · Sol KHÔNG hứa cai 100%
        </p>
      </div>
    </footer>
  );
}
