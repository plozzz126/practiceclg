import type { Project } from "@/types/project";

export interface DashboardJoinRequest {
  id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string | null;
  created_at: string;
  decided_at?: string | null;
  project_id: string;
  project_title: string;
  project_status: string;
}

export interface DashboardSummary {
  my_projects: Project[];
  recommended_projects: Project[];
  my_requests: DashboardJoinRequest[];
}
