"use client";

import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type {
  AuthResponse,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
} from "@/types/auth";
import type { CurrentUser } from "@/types/user";

export const authApi = {
  async register(payload: RegisterPayload) {
    const response = await apiClient.post<ApiSuccess<CurrentUser>>("/auth/register", payload);
    return response.data.data;
  },
  async login(payload: LoginPayload) {
    const response = await apiClient.post<ApiSuccess<AuthResponse>>("/auth/login", payload);
    return response.data.data;
  },
  async refresh(payload: RefreshPayload) {
    const response = await apiClient.post<ApiSuccess<AuthResponse>>("/auth/refresh", payload);
    return response.data.data;
  },
  async logout(refreshToken: string) {
    const response = await apiClient.post<ApiSuccess<{ message: string }>>("/auth/logout", {
      refresh_token: refreshToken,
    });
    return response.data.data;
  },
};
