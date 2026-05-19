import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setUser: (user) => {
        set({ user, token: user.token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      isAuthenticated: () => {
        const { user } = get();
        if (!user) return false;
        // Check token expiry
        return new Date(user.expiresAt) > new Date();
      },
    }),
    {
      name: 'himgiri-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
