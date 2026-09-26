import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser) => void;
  // A refresh only returns new tokens, not the full profile — this updates just
  // those fields on the existing user rather than requiring a fresh setUser call.
  updateTokens: (token: string, refreshToken: string, expiresAt: string) => void;
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

      updateTokens: (token, refreshToken, expiresAt) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, token, refreshToken, expiresAt },
          token,
        });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      isAuthenticated: () => {
        // This is a client-side routing gate, not the real security boundary (the API
        // enforces that per request). It deliberately does NOT check the access token's
        // own expiry — that token is short-lived by design (15 min) and silently renewed
        // by the api.ts interceptor via the refresh token, so checking it here would force
        // a full logout-and-redirect every 15 minutes regardless of session validity.
        // Presence of a refresh token means there's a session that can still be renewed;
        // if that refresh token is itself expired/revoked, the next API call's failed
        // silent-refresh attempt is what actually logs the user out.
        const { user } = get();
        return !!user?.refreshToken;
      },
    }),
    {
      name: 'himgiri-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
