export const projectStatusOptions = [
  { label: "Черновик", value: "draft" },
  { label: "Открыт", value: "open" },
  { label: "Закрыт", value: "closed" },
  { label: "В архиве", value: "archived" },
] as const;

export type ProjectStatus = (typeof projectStatusOptions)[number]["value"];

export function getProjectStatusLabel(status?: ProjectStatus | string | null) {
  return projectStatusOptions.find((item) => item.value === status)?.label ?? "Открыт";
}
