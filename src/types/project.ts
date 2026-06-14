import type { ProjectStatus } from "@/constants/project-status";
import type { Skill } from "@/types/skill";
import type { PublicUser } from "@/types/user";

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  deadline?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  owner: PublicUser;
  required_skills: Skill[];
  participants_count: number;
}

export interface ProjectListResponse {
  items: Project[];
}

export interface ProjectFilters {
  query?: string;
  skills?: string;
  status?: ProjectStatus | "";
  sort?: "asc" | "desc";
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  deadline?: string;
  status?: ProjectStatus;
  required_skill_ids?: string[];
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  deadline?: string;
  status?: ProjectStatus;
  required_skill_ids?: string[];
}
