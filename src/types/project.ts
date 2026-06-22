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
