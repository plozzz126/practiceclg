export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  profile: "/profile",
  projects: "/projects",
  users: "/users",
} as const;

export const navigationLinks = [
  { href: routes.projects, label: "Projects" },
  { href: routes.users, label: "People" },
  { href: routes.dashboard, label: "Dashboard" },
] as const;
