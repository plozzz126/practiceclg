"use client";

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_URL } from "@/lib/api/config";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import type { ApiErrorResponse, ApiSuccess } from "@/types/api";
import type { AuthResponse } from "@/types/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

const rawClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/register")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    return apiClient(originalRequest);
  },
);

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    forceLogout();
    return null;
  }

  useAuthStore.getState().setRefreshing(true);

  refreshPromise = rawClient
    .post<ApiSuccess<AuthResponse>>("/auth/refresh", {
      refresh_token: refreshToken,
    })
    .then((response) => {
      useAuthStore.getState().setSession(response.data.data.tokens);
      useUserStore.getState().setCurrentUser(response.data.data.user);
      return response.data.data.tokens.access_token;
    })
    .catch(() => {
      forceLogout();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
      useAuthStore.getState().setRefreshing(false);
    });

  return refreshPromise;
}

export function forceLogout() {
  useAuthStore.getState().clearSession();
  useUserStore.getState().clearUser();
}
