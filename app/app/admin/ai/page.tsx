import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from '../AdminLogin';
import { getAiSettings, maskAiSettings } from '@/lib/ai/settings';
import { AiConfigClient } from './AiConfigClient';

export default async function AiConfigPage() {
  if (!isAdminAuthorized()) return <AdminLogin />;

  const settings = await getAiSettings(true);
  const masked = maskAiSettings(settings);

  return (
    <>
      <h1 className="admin-page-title">🤖 AI Mentor Config</h1>
      <p className="admin-page-subtitle">
        Cấu hình AI provider, model, quota. Source: <strong>{settings.source}</strong>.
        Cache 30s.
      </p>

      <AiConfigClient initial={masked} />
    </>
  );
}
