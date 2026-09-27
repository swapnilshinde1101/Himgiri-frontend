import api from './api';
import type { ApiResponse } from '../types';

export interface EmailSettingsDto {
  id: string;
  smtpHost: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  enableSsl: boolean;
  isConfigured: boolean;
  hasPassword: boolean;
}

export interface UpdateEmailSettingsRequest {
  smtpHost: string;
  smtpPort: number;
  senderEmail: string;
  senderName: string;
  smtpPassword?: string;
  enableSsl: boolean;
  isConfigured: boolean;
}

export interface TestEmailRequest {
  toEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  senderEmail?: string;
  senderName?: string;
  smtpPassword?: string;
  enableSsl?: boolean;
}

export const emailSettingsService = {
  getSettings: async (): Promise<ApiResponse<EmailSettingsDto>> => {
    const response = await api.get<ApiResponse<EmailSettingsDto>>('/email-settings');
    return response.data;
  },

  updateSettings: async (payload: UpdateEmailSettingsRequest): Promise<ApiResponse<EmailSettingsDto>> => {
    const response = await api.put<ApiResponse<EmailSettingsDto>>('/email-settings', payload);
    return response.data;
  },

  testConnection: async (payload: TestEmailRequest): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/email-settings/test', payload);
    return response.data;
  },
};
