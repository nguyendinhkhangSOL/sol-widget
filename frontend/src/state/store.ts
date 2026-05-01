// frontend/src/state/store.ts
// Zustand store. Single source of truth for widget UI.

import { create } from 'zustand';
import type { ConversationState, Message, User, WidgetMode } from '../types';

export type WidgetView = 'greeting' | 'chat' | 'checkin' | 'exercise' | 'crisis' | 'inbox' | 'settings' | 'journey' | 'paywall' | 'refund' | 'voice';

interface WidgetStore {
  // Lifecycle
  initialized: boolean;
  expanded: boolean;
  view: WidgetView;
  rageCount: number;
  lastCloseAt: number;

  // Auth
  token: string | null;
  user: User | null;

  // Conversation
  state: ConversationState;
  messages: Message[];
  unreadCount: number;
  typing: boolean;

  // Actions
  init: (token: string | null) => void;
  setUser: (user: User) => void;
  setExpanded: (expanded: boolean) => void;
  setView: (view: WidgetView) => void;
  setState: (state: ConversationState) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  markAllRead: () => void;
  setTyping: (typing: boolean) => void;
  setMode: (mode: WidgetMode) => void;
  bumpRage: () => void;
  reset: () => void;
}

export const useStore = create<WidgetStore>((set, get) => ({
  initialized: false,
  expanded: false,
  view: 'greeting',
  rageCount: 0,
  lastCloseAt: 0,

  token: null,
  user: null,

  state: 'IDLE',
  messages: [],
  unreadCount: 0,
  typing: false,

  init: (token) => set({ initialized: true, token }),

  setUser: (user) => set({ user, state: user.state }),

  setExpanded: (expanded) => {
    const now = Date.now();
    const prev = get().lastCloseAt;
    if (!expanded && now - prev < 3000) {
      set((s) => ({ rageCount: s.rageCount + 1, lastCloseAt: now, expanded: false }));
      return;
    }
    set({ expanded, lastCloseAt: expanded ? get().lastCloseAt : now });
  },

  setView: (view) => set({ view }),

  setState: (state) => {
    set({ state });
    // Auto-switch view for structured flows.
    if (state === 'CHECKIN_FLOW') set({ view: 'checkin' });
    else if (state === 'EXERCISE_FLOW') set({ view: 'exercise' });
    else if (state === 'CRISIS_MODE') set({ view: 'crisis' });
  },

  setMessages: (messages) => {
    const unread = messages.filter((m) => m.role === 'ASSISTANT' && !m.readAt).length;
    set({ messages, unreadCount: unread });
  },

  addMessage: (message) =>
    set((s) => {
      const msgs = [...s.messages, message];
      const isUnread = message.role === 'ASSISTANT' && !message.readAt && !s.expanded;
      return {
        messages: msgs,
        unreadCount: isUnread ? s.unreadCount + 1 : s.unreadCount,
      };
    }),

  markAllRead: () => set({ unreadCount: 0 }),

  setTyping: (typing) => set({ typing }),

  setMode: (mode) => {
    const u = get().user;
    if (!u) return;
    set({ user: { ...u, settings: { ...u.settings, mode } } });
  },

  bumpRage: () => set((s) => ({ rageCount: s.rageCount + 1 })),

  reset: () =>
    set({
      initialized: false,
      expanded: false,
      view: 'greeting',
      token: null,
      user: null,
      state: 'IDLE',
      messages: [],
      unreadCount: 0,
      rageCount: 0,
    }),
}));
