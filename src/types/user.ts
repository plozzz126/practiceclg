import type { Skill } from "@/types/skill";

export interface UserBase {
  id: string;
  full_name: string;
  university?: string | null;
  course?: number | null;
  bio?: string | null;
  avatar_url?: string | null;
  rating: number;
  skills: Skill[];
}

export interface PublicUser extends UserBase {
  created_at: string;
}

export interface CurrentUser extends UserBase {
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  items: PublicUser[];
}

export interface UpdateProfilePayload {
  full_name?: string;
  university?: string;
  course?: number;
  bio?: string;
  avatar_url?: string;
}

export interface UpdateSkillsPayload {
  skill_ids: string[];
}
