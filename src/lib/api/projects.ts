"use client";

import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type { UserListResponse } from "@/types/user";
import type {
  CreateProjectInvitationPayload,
  CreateJoinRequestPayload,
  CreateProjectDocumentPayload,
  CreateProjectMessagePayload,
  CreateProjectPayload,
  CreateProjectTaskPayload,
  InviteCandidateFilters,
  ProjectDocument,
  ProjectDocumentsResponse,
  Project,
  ProjectInvitation,
  ProjectInvitationListResponse,
  ProjectFilters,
  ProjectJoinRequest,
  ProjectJoinRequestsResponse,
  ProjectListResponse,
  ProjectMessage,
  ProjectMessagesResponse,
  ProjectTask,
  ProjectTasksResponse,
  ReviewJoinRequestPayload,
  ReviewProjectInvitationPayload,
  UpdateProjectPayload,
  UpdateProjectTaskPayload,
} from "@/types/project";

export const projectsApi = {
  async list(params?: ProjectFilters) {
    const response = await apiClient.get<ApiSuccess<ProjectListResponse>>("/projects", {
      params,
    });
    return response.data.data;
  },
  async listMine() {
    const response = await apiClient.get<ApiSuccess<ProjectListResponse>>("/projects/mine");
    return response.data.data;
  },
  async listParticipating() {
    const response = await apiClient.get<ApiSuccess<ProjectListResponse>>("/projects/participating");
    return response.data.data;
  },
  async getById(id: string) {
    const response = await apiClient.get<ApiSuccess<Project>>(`/projects/${id}`);
    return response.data.data;
  },
  async listDocuments(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectDocumentsResponse>>(`/projects/${projectId}/documents`);
    return response.data.data;
  },
  async createDocument(projectId: string, payload: CreateProjectDocumentPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectDocument>>(`/projects/${projectId}/documents`, payload);
    return response.data.data;
  },
  async deleteDocument(projectId: string, documentId: string) {
    const response = await apiClient.delete<ApiSuccess<{ message: string }>>(
      `/projects/${projectId}/documents/${documentId}`,
    );
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
  async listTasks(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectTasksResponse>>(`/projects/${projectId}/tasks`);
    return response.data.data;
  },
  async createTask(projectId: string, payload: CreateProjectTaskPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectTask>>(`/projects/${projectId}/tasks`, payload);
    return response.data.data;
  },
  async updateTask(projectId: string, taskId: string, payload: UpdateProjectTaskPayload) {
    const response = await apiClient.put<ApiSuccess<ProjectTask>>(`/projects/${projectId}/tasks/${taskId}`, payload);
    return response.data.data;
  },
  async deleteTask(projectId: string, taskId: string) {
    const response = await apiClient.delete<ApiSuccess<{ message: string }>>(`/projects/${projectId}/tasks/${taskId}`);
    return response.data.data;
  },
  async listJoinRequests(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectJoinRequestsResponse>>(`/projects/${projectId}/join-requests`);
    return response.data.data;
  },
  async getMyJoinRequest(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectJoinRequest | null>>(`/projects/${projectId}/join-requests/mine`);
    return response.data.data;
  },
  async submitJoinRequest(projectId: string, payload: CreateJoinRequestPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectJoinRequest>>(`/projects/${projectId}/join-requests`, payload);
    return response.data.data;
  },
  async reviewJoinRequest(projectId: string, requestId: string, payload: ReviewJoinRequestPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectJoinRequest>>(
      `/projects/${projectId}/join-requests/${requestId}/decision`,
      payload,
    );
    return response.data.data;
  },
  async listMessages(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectMessagesResponse>>(`/projects/${projectId}/messages`);
    return response.data.data;
  },
  async createMessage(projectId: string, payload: CreateProjectMessagePayload) {
    const response = await apiClient.post<ApiSuccess<ProjectMessage>>(`/projects/${projectId}/messages`, payload);
    return response.data.data;
  },
  async listInviteCandidates(projectId: string, params?: InviteCandidateFilters) {
    const response = await apiClient.get<ApiSuccess<UserListResponse>>(`/projects/${projectId}/invite-candidates`, {
      params,
    });
    return response.data.data;
  },
  async listProjectInvitations(projectId: string) {
    const response = await apiClient.get<ApiSuccess<ProjectInvitationListResponse>>(`/projects/${projectId}/invitations`);
    return response.data.data;
  },
  async createInvitation(projectId: string, payload: CreateProjectInvitationPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectInvitation>>(`/projects/${projectId}/invitations`, payload);
    return response.data.data;
  },
  async listMyInvitations() {
    const response = await apiClient.get<ApiSuccess<ProjectInvitationListResponse>>("/projects/invitations/mine");
    return response.data.data;
  },
  async reviewInvitation(invitationId: string, payload: ReviewProjectInvitationPayload) {
    const response = await apiClient.post<ApiSuccess<ProjectInvitation>>(
      `/projects/invitations/${invitationId}/decision`,
      payload,
    );
    return response.data.data;
  },
};
