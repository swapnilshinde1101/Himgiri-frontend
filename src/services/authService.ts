import api from './api';
import type { LoginRequest, AuthUser, ApiResponse, AdminRole } from '../types';

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export const authService = {
  login: async (request: LoginRequest): Promise<AuthUser> => {
    const { data } = await api.post<ApiResponse<AuthUser>>('/auth/login', request, {
      // A wrong password 401 here should never trigger a refresh attempt (there's no
      // session yet to refresh) — LoginPage shows its own error from the caught rejection.
      skipGlobalToast: true,
      skipAuthRefresh: true
    } as any);
    if (data.statusCode !== 200 || !data.data) throw new Error(data.message ?? 'Login failed');

    // Normalize role if it comes back as a number (SmartData Standard)
    const user = data.data;
    if (typeof user.role === 'number') {
        const roleMap: Record<number, AdminRole> = {
            0: 'SuperAdmin',
            1: 'InventoryManager',
            2: 'OrderManager'
        };
        user.role = roleMap[user.role] || 'OrderManager';
    }

    return user;
  },

  // Still goes through the shared `api` instance and its response interceptor — but
  // `skipAuthRefresh` tells that interceptor not to attempt another refresh if this
  // call itself 401s (a failed refresh must never try to refresh itself).
  refresh: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data } = await api.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      { refreshToken },
      { skipGlobalToast: true, skipAuthRefresh: true } as any
    );
    if (data.statusCode !== 200 || !data.data) throw new Error(data.message ?? 'Session expired.');
    return data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      await api.post('/auth/logout', { refreshToken }, { skipGlobalToast: true, skipAuthRefresh: true } as any);
    } catch {
      // Best-effort — the client-side session is cleared regardless of whether this succeeds.
    }
  },
};
