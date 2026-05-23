import { redirect } from 'next/navigation';

// Deprecated: /dang-ky email-first flow đã chuyển sang /onboarding phone-first
export default function DeprecatedDangKy() {
  redirect('/test-ftnd');
}
