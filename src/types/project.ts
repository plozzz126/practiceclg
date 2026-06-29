import type { ProjectStatus } from "@/constants/project-status";
import type { ProjectDirection } from "@/constants/project-directions";
import type { Skill } from "@/types/skill";
import type { PublicUser } from "@/types/user";

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  deadline?: string | null;
  status: ProjectStatus;
  direction: ProjectDirection;
  team_size: number;
  required_roles: string[];
  created_at: string;
  updated_at: string;
  owner: PublicUser;
  required_skills: Skill[];
  participants_count: number;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  done: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTasksResponse {
  items: ProjectTask[];
}

export type JoinRequestStatus = "pending" | "accepted" | "rejected";

export interface ProjectJoinRequest {
  id: string;
  project_id: string;
  user_id: string;
  message?: string | null;
  status: JoinRequestStatus;
  created_at: string;
  decided_at?: string | null;
  user: PublicUser;
}

export interface ProjectJoinRequestsResponse {
  items: ProjectJoinRequest[];
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: PublicUser;
}

export interface ProjectMessagesResponse {
  items: ProjectMessage[];
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  url: string;
  description?: string | null;
  created_by: string;
  created_at: string;
}

export interface ProjectDocumentsResponse {
  items: ProjectDocument[];
}

export interface ProjectListResponse {
  items: Project[];
}

export interface ProjectFilters {
  query?: string;
  skills?: string;
  status?: ProjectStatus | "";
  direction?: ProjectDirection | "";
  sort?: "asc" | "desc" | "deadline";
}

export interface InviteCandidateFilters {
  query?: string;
  skills?: string;
  course?: number;
  university?: string;
  rating?: number;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  deadline?: string;
  status?: ProjectStatus;
  direction?: ProjectDirection;
  team_size?: number;
  required_roles?: string[];
  required_skill_ids?: string[];
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  deadline?: string;
  status?: ProjectStatus;
  direction?: ProjectDirection;
  team_size?: number;
  required_roles?: string[];
  required_skill_ids?: string[];
}

export interface CreateProjectTaskPayload {
  title: string;
  description?: string;
  due_date?: string;
}

export interface UpdateProjectTaskPayload {
  title?: string;
  description?: string;
  due_date?: string;
  done?: boolean;
}

export interface CreateJoinRequestPayload {
  message?: string;
}

export interface ReviewJoinRequestPayload {
  decision: Extract<JoinRequestStatus, "accepted" | "rejected">;
}

export interface CreateProjectMessagePayload {
  body: string;
}

export interface CreateProjectDocumentPayload {
  title: string;
  url: string;
  description?: string;
}

export interface InvitationProjectSummary {
  id: string;
  title: string;
  direction: ProjectDirection;
  status: ProjectStatus;
  deadline?: string | null;
  team_size: number;
  participants_count: number;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id: string;
  message?: string | null;
  status: JoinRequestStatus;
  created_at: string;
  decided_at?: string | null;
  project: InvitationProjectSummary;
  sender: PublicUser;
  recipient: PublicUser;
}

export interface ProjectInvitationListResponse {
  items: ProjectInvitation[];
}

export interface CreateProjectInvitationPayload {
  recipient_id: string;
  message?: string;
}

export interface ReviewProjectInvitationPayload {
  decision: Extract<JoinRequestStatus, "accepted" | "rejected">;
}
