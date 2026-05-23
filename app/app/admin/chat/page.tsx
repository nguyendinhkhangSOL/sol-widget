import { query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { AdminLogin } from '../AdminLogin';
import { AdminChatClient } from './AdminChatClient';

interface PageProps {
  searchParams: { thread?: string };
}

interface ThreadRow {
  id: number;
  session_id: string;
  member_id: number | null;
  display_name: string;
  phone: string | null;
  cohort: string | null;
  status: string;
  unread_admin: number;
  message_count: number;
  last_message_at: string;
  minutes_since_last: number;
  last_message_preview: string | null;
}

interface MessageRow {
  id: number;
  sender_type: 'user' | 'admin' | 'ai' | 'system';
  sender_name: string | null;
  content: string;
  content_type: string;
  is_read: boolean;
  created_at: string;
}

export default async function AdminChatPage({ searchParams }: PageProps) {
  if (!isAdminAuthorized()) return <AdminLogin />;

  const threads = await query<ThreadRow>(`SELECT * FROM v_admin_inbox LIMIT 50`);

  let selectedThread: ThreadRow | null = null;
  let messages: MessageRow[] = [];

  if (searchParams.thread) {
    const threadId = parseInt(searchParams.thread, 10);
    selectedThread = threads.find(t => t.id === threadId) || null;
    if (selectedThread) {
      messages = await query<MessageRow>(
        `SELECT id, sender_type, sender_name, content, content_type, is_read, created_at
         FROM chat_messages
         WHERE thread_id = $1 AND is_deleted = FALSE
         ORDER BY created_at ASC LIMIT 200`,
        [threadId]
      );
      await query(
        `UPDATE chat_messages SET is_read = TRUE, read_at = NOW()
         WHERE thread_id = $1 AND sender_type = 'user' AND is_read = FALSE`,
        [threadId]
      );
      await query(`UPDATE chat_threads SET unread_admin = 0 WHERE id = $1`, [threadId]);
    }
  }

  return (
    <>
      <h1 className="admin-page-title">💬 Chat Inbox</h1>
      <p className="admin-page-subtitle">{threads.length} threads · {threads.reduce((sum, t) => sum + t.unread_admin, 0)} unread</p>

      <AdminChatClient
        threads={threads}
        selectedThread={selectedThread}
        messages={messages}
      />
    </>
  );
}
