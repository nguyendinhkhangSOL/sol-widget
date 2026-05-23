import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getMemberByPhone, getMemberIdFromSession, loadProfile } from '@/lib/profile';
import { validateVietnamesePhone } from '@/lib/vietqr';
import { SettingsForm } from './SettingsForm';

export const metadata: Metadata = {
  title: 'Cài đặt cá nhân',
  description: 'Cài đặt danh xưng, lý do bỏ thuốc, thời gian nhận tin nhắn — Sol sẽ AI personalize cho anh.',
  robots: { index: false, follow: false }
};

interface PageProps {
  searchParams: { p?: string; phone?: string };
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const phoneParam = searchParams.p || searchParams.phone;

  let memberId: number | null = null;

  if (phoneParam) {
    const check = validateVietnamesePhone(phoneParam);
    if (check.valid && check.cleaned) {
      memberId = await getMemberByPhone(check.cleaned);
    }
  } else {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sol_session')?.value;
    if (sessionId) memberId = await getMemberIdFromSession(sessionId);
  }

  if (!memberId) {
    return (
      <>
        <Header />
        <main className="container-sol py-12 text-center">
          <div className="card-sol max-w-md mx-auto">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-sol-brown mb-3">Cần đăng ký trước</h1>
            <p className="text-sol-ink2 mb-6">
              Trang cài đặt chỉ available cho member đã đăng ký 7 ngày Nhận Diện.
            </p>
            <a href="/test-ftnd" className="btn-primary">Làm Test FTND để bắt đầu</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const profile = await loadProfile(memberId);
  if (!profile) {
    redirect('/test-ftnd');
  }

  return (
    <>
      <Header />
      <main id="main" className="container-sol py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-sol-brown mb-2">
            Cài đặt cá nhân
          </h1>
          <p className="text-sol-ink2">
            Anh điền càng kỹ — Sol AI càng phù hợp với anh
          </p>
        </div>

        <SettingsForm initialProfile={profile} />
      </main>
      <Footer />
    </>
  );
}
