// Shared primitives cho Workbook.
// Giữ các building block nhất quán (Section card, Callout, Field).

import { ReactNode } from 'react';

export type AccentColor = 'orange' | 'green' | 'blue' | 'purple' | 'red';

const ACCENT: Record<AccentColor, { bar: string; text: string; bg: string; badge: string }> = {
  orange: { bar: '#B8860B', text: '#B8860B', bg: '#FFF4EA', badge: '#B8860B' },
  green:  { bar: '#B25C2C', text: '#2E7D32', bg: '#E8F5E9', badge: '#B25C2C' },
  blue:   { bar: '#3A7CA5', text: '#1565C0', bg: '#E3F2FD', badge: '#3A7CA5' },
  purple: { bar: '#7B1FA2', text: '#6A1B9A', bg: '#F3E5F5', badge: '#7B1FA2' },
  red:    { bar: '#C62828', text: '#B71C1C', bg: '#FFEBEE', badge: '#C62828' },
};

export function SectionCard({
  id,
  accent = 'orange',
  num,
  icon,
  title,
  subtitle,
  children,
}: {
  id?: string;
  accent?: AccentColor;
  num?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <section
      id={id}
      className="bg-white rounded-2xl p-5 md:p-7 border border-black/5 shadow-card scroll-mt-24 print:shadow-none print:border-black/15 print:break-inside-avoid"
      style={{ borderTop: `4px solid ${a.bar}` }}
    >
      <header className="flex items-start gap-3 mb-4">
        <div
          className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background: a.badge }}
        >
          {icon ?? num ?? ''}
        </div>
        <div>
          <h2 className="text-[17px] md:text-xl font-bold leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-sol-ink/60 mt-0.5">{subtitle}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Callout({
  accent = 'orange',
  icon,
  children,
}: {
  accent?: AccentColor;
  icon: string;
  children: ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className="flex gap-2.5 items-start p-3.5 rounded-xl text-sm mb-4"
      style={{ background: a.bg, color: a.text }}
    >
      <span className="text-base leading-none shrink-0">{icon}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function FieldLabel({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-wider mb-1"
      style={{ color: color ?? 'rgba(44,42,39,.55)' }}
    >
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:border-sol-orange/60 ' +
        (props.className ?? '')
      }
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        'w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm min-h-[70px] focus:outline-none focus:border-sol-orange/60 ' +
        (props.className ?? '')
      }
    />
  );
}
