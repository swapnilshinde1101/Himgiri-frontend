import api from './api';
import type { LoginRequest, AuthUser, ApiResponse } from '../types';

export const authService = {
  login: async (request: LoginRequest): Promise<AuthUser> => {
    const { data } = await api.post<ApiResponse<AuthUser>>('/auth/login', request);
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
};
