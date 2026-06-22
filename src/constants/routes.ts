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
  { href: routes.projects, label: "Проекты" },
  { href: routes.users, label: "Люди" },
  { href: routes.dashboard, label: "Дашборд" },
] as const;
