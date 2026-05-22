// dashboard/src/lib/toast.tsx
//
// Toast component đơn giản — thay `alert()` mọi nơi trong dashboard.
// Day 6 (2026-05-21): UI/UX refactor.
//
// Usage:
//   1. Wrap root <App/> với <ToastProvider> (đã làm trong main.tsx)
//   2. Trong component bất kỳ: `const toast = useToast(); toast.show('Hello')`
//
// Variants:
//   toast.show('msg')                     // info (default)
//   toast.success('msg')                  // green ✓
//   toast.error('msg')                    // red ⚠
//   toast.info('msg', { title: '🧘' })    // custom icon
//
// Toast auto-dismiss 4s. Nhiều toast stack từ dưới lên. Click X để đóng sớm.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'info' | 'success' | 'error' | 'crisis';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  title?: string;
  /** Tự đóng sau ms. Default 4000. -1 = không tự đóng (user phải click). */
  duration?: number;
}

interface ToastApi {
  show: (msg: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>) => void;
  success: (msg: string, title?: string) => void;
  error: (msg: string, title?: string) => void;
  info: (msg: string, title?: string) => void;
  /** Crisis style — persist (no auto-dismiss), max-width rộng hơn, dùng cho SOS exercises */
  crisis: (msg: string, title?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (msg: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>) => {
      const id = nextId++;
      const item: ToastItem = {
        id,
        message: msg,
        variant: opts?.variant ?? 'info',
        title: opts?.title,
        duration: opts?.duration ?? 4000,
      };
      setItems((prev) => [...prev, item]);
      if (item.duration && item.duration > 0) {
        const t = setTimeout(() => dismiss(id), item.duration);
        timeoutsRef.current.set(id, t);
      }
    },
    [dismiss],
  );

  const api: ToastApi = {
    show,
    success: (msg, title) => show(msg, { variant: 'success', title }),
    error: (msg, title) => show(msg, { variant: 'error', title }),
    info: (msg, title) => show(msg, { variant: 'info', title }),
    crisis: (msg, title) => show(msg, { variant: 'crisis', title, duration: -1 }),
    dismiss,
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback — KHÔNG throw, vì có thể chạy trong test/storybook
    // mà không có Provider. Console warn để dev nhìn thấy.
    if (typeof console !== 'undefined') {
      console.warn('[toast] useToast() called outside ToastProvider. Falling back to alert().');
    }
    return {
      show: (msg) => typeof window !== 'undefined' && window.alert(msg),
      success: (msg) => typeof window !== 'undefined' && window.alert('✓ ' + msg),
      error: (msg) => typeof window !== 'undefined' && window.alert('⚠ ' + msg),
      info: (msg) => typeof window !== 'undefined' && window.alert(msg),
      crisis: (msg) => typeof window !== 'undefined' && window.alert(msg),
      dismiss: () => {},
    };
  }
  return ctx;
}

// ─── Viewport — stack toast top-right desktop, bottom-center mobile ──────
function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed z-[100] pointer-events-none
        bottom-24 inset-x-3 flex flex-col-reverse gap-2
        md:bottom-auto md:top-5 md:right-5 md:left-auto md:inset-x-auto md:max-w-sm md:w-full md:flex-col"
    >
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const styles = variantStyles[item.variant];
  return (
    <div
      role={item.variant === 'error' || item.variant === 'crisis' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' || item.variant === 'crisis' ? 'assertive' : 'polite'}
      className={`pointer-events-auto rounded-xl border shadow-lg
        animate-[toastIn_180ms_ease-out]
        ${item.variant === 'crisis' ? 'p-5' : 'p-3'}
        ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl leading-none mt-0.5 ${styles.iconColor}`} aria-hidden="true">
          {item.title ?? styles.icon}
        </span>
        <div className={`flex-1 text-body ${styles.textColor} whitespace-pre-line`}>
          {item.message}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng"
          className={`flex-shrink-0 text-meta ${styles.textColor} opacity-60 hover:opacity-100 px-1 min-h-tap`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const variantStyles: Record<ToastVariant, {
  bg: string; border: string; textColor: string; iconColor: string; icon: string;
}> = {
  info: {
    bg: 'bg-sol-paper',
    border: 'border-sol-line',
    textColor: 'text-sol-ink',
    iconColor: 'text-sol-blue',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-sol-green-soft',
    border: 'border-sol-green',
    textColor: 'text-sol-green-ink',
    iconColor: 'text-sol-green',
    icon: '✓',
  },
  error: {
    bg: 'bg-sol-red-soft',
    border: 'border-sol-red',
    textColor: 'text-sol-red-ink',
    iconColor: 'text-sol-red',
    icon: '⚠️',
  },
  crisis: {
    bg: 'bg-sol-paper',
    border: 'border-sol-orange',
    textColor: 'text-sol-ink',
    iconColor: 'text-sol-orange',
    icon: '🆘',
  },
};
