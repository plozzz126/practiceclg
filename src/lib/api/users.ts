"use client";

import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type {
  CurrentUser,
  NotificationListResponse,
  PublicUser,
  UpdatePrivacyPayload,
  UpdateProfilePayload,
  UpdateSkillsPayload,
  UserListResponse,
} from "@/types/user";

export const usersApi = {
  async getMe() {
    const response = await apiClient.get<ApiSuccess<CurrentUser>>("/users/me");
    return response.data.data;
  },
  async updateMe(payload: UpdateProfilePayload) {
    const response = await apiClient.put<ApiSuccess<CurrentUser>>("/users/me", payload);
    return response.data.data;
  },
  async updateMyPrivacy(payload: UpdatePrivacyPayload) {
    const response = await apiClient.put<ApiSuccess<CurrentUser>>("/users/me/privacy", payload);
    return response.data.data;
  },
  async updateMySkills(payload: UpdateSkillsPayload) {
    const response = await apiClient.put<ApiSuccess<CurrentUser>>("/users/me/skills", payload);
    return response.data.data;
  },
  async deleteMe() {
    const response = await apiClient.delete<ApiSuccess<{ message: string }>>("/users/me");
    return response.data.data;
  },
  async listMyNotifications() {
    const response = await apiClient.get<ApiSuccess<NotificationListResponse>>("/users/me/notifications");
    return response.data.data;
  },
  async markNotificationRead(id: string) {
    const response = await apiClient.post<ApiSuccess<{ message: string }>>(`/users/me/notifications/${id}/read`);
    return response.data.data;
  },
  async markAllNotificationsRead() {
    const response = await apiClient.post<ApiSuccess<{ message: string }>>("/users/me/notifications/read-all");
    return response.data.data;
  },
  async list(params?: Record<string, string | number | undefined>) {
    const response = await apiClient.get<ApiSuccess<UserListResponse>>("/users", { params });
    return response.data.data;
  },
  async getById(id: string) {
    const response = await apiClient.get<ApiSuccess<PublicUser>>(`/users/${id}`);
    return response.data.data;
  },
};
