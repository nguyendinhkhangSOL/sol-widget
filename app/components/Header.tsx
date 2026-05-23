import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-sol-brown text-sol-paper">
      <div className="container-sol py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-sol-paper text-sol-brown flex items-center justify-center font-bold font-serif text-xl">
            S
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm sm:text-base">Đi Cùng Sol</div>
            <div className="text-xs opacity-80 hidden sm:block">Cai thuốc · Việt 45+</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          <Link
            href="/bang-gia"
            className="px-3 py-1.5 rounded-lg hover:bg-sol-paper hover:text-sol-brown transition"
          >
            Bảng giá
          </Link>
          <Link
            href="/cai-dat"
            className="px-3 py-1.5 rounded-lg hover:bg-sol-paper hover:text-sol-brown transition hidden sm:inline"
          >
            Cài đặt
          </Link>
          <Link
            href="/khang-sol"
            className="px-3 py-1.5 rounded-lg hover:bg-sol-paper hover:text-sol-brown transition hidden md:inline"
          >
            Khang Sol
          </Link>
          <Link
            href="/test-ftnd"
            className="px-4 py-1.5 rounded-lg bg-sol-orange text-white font-semibold hover:bg-orange-700 transition"
          >
            Bắt đầu
          </Link>
        </nav>
      </div>
    </header>
  );
}
