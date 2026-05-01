import { create } from 'zustand';
import type { CheckIn, Roadmap, User } from '../types';
import { api } from '../services/api';

interface DashStore {
  user: User | null;
  roadmap: Roadmap | null;
  checkins: CheckIn[];
  loading: boolean;

  bootstrap: () => Promise<void>;
  refreshCheckins: () => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

export const useStore = create<DashStore>((set, get) => ({
  user: null,
  roadmap: null,
  checkins: [],
  loading: false,

  bootstrap: async () => {
    set({ loading: true });
    try {
      const [user, roadmap, checkinsRes] = await Promise.all([
        api.getMe(),
        api.getRoadmap(),
        api.getCheckins(60),
      ]);
      set({ user, roadmap, checkins: checkinsRes.checkins ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  refreshCheckins: async () => {
    const res = await api.getCheckins(60);
    set({ checkins: res.checkins ?? [] });
  },

  setUser: (u) => set({ user: u }),

  logout: () => {
    localStorage.removeItem('sol_token');
    set({ user: null, roadmap: null, checkins: [] });
  },
}));
