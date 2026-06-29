export const queryKeys = {
  skills: ["skills"] as const,
  me: ["me"] as const,
  projects: (params?: Record<string, string | number | undefined>) =>
    ["projects", params ?? {}] as const,
  myProjects: ["projects", "mine"] as const,
  participatingProjects: ["projects", "participating"] as const,
  project: (id: string) => ["project", id] as const,
  projectDocuments: (id: string) => ["project", id, "documents"] as const,
  projectTasks: (id: string) => ["project", id, "tasks"] as const,
  projectJoinRequests: (id: string) => ["project", id, "join-requests"] as const,
  projectMyJoinRequest: (id: string) => ["project", id, "join-request", "mine"] as const,
  projectInviteCandidates: (id: string, params?: Record<string, string | number | undefined>) =>
    ["project", id, "invite-candidates", params ?? {}] as const,
  projectInvitations: (id: string) => ["project", id, "invitations"] as const,
  myProjectInvitations: ["projects", "invitations", "mine"] as const,
  projectMessages: (id: string) => ["project", id, "messages"] as const,
  notifications: ["notifications"] as const,
  users: (params?: Record<string, string | number | undefined>) =>
    ["users", params ?? {}] as const,
  user: (id: string) => ["user", id] as const,
  dashboard: ["dashboard"] as const,
} as const;
