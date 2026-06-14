export const projectStatusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
] as const;

export type ProjectStatus = (typeof projectStatusOptions)[number]["value"];
