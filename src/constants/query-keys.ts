export const queryKeys = {
  skills: ["skills"] as const,
  me: ["me"] as const,
  projects: (params?: Record<string, string | number | undefined>) =>
    ["projects", params ?? {}] as const,
  project: (id: string) => ["project", id] as const,
  users: (params?: Record<string, string | number | undefined>) =>
    ["users", params ?? {}] as const,
  user: (id: string) => ["user", id] as const,
  dashboard: ["dashboard"] as const,
} as const;
