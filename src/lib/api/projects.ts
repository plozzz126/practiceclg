"use client";

import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateProjectPayload,
  Project,
  ProjectFilters,
  ProjectListResponse,
  UpdateProjectPayload,
} from "@/types/project";

export const projectsApi = {
  async list(params?: ProjectFilters) {
    const response = await apiClient.get<ApiSuccess<ProjectListResponse>>("/projects", {
      params,
    });
    return response.data.data;
  },
  async getById(id: string) {
    const response = await apiClient.get<ApiSuccess<Project>>(`/projects/${id}`);
    return response.data.data;
  },
  async create(payload: CreateProjectPayload) {
    const response = await apiClient.post<ApiSuccess<Project>>("/projects", payload);
    return response.data.data;
  },
  async update(id: string, payload: UpdateProjectPayload) {
    const response = await apiClient.put<ApiSuccess<Project>>(`/projects/${id}`, payload);
    return response.data.data;
  },
  async delete(id: string) {
    const response = await apiClient.delete<ApiSuccess<{ message: string }>>(`/projects/${id}`);
    return response.data.data;
  },
};
