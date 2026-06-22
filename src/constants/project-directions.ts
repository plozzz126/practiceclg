export const projectDirections = [
  { value: "web", label: "Веб", tone: "teal" },
  { value: "mobile", label: "Мобильная разработка", tone: "cyan" },
  { value: "ai", label: "AI / ML", tone: "violet" },
  { value: "data", label: "Данные", tone: "amber" },
  { value: "design", label: "Дизайн", tone: "pink" },
  { value: "hackathon", label: "Хакатон", tone: "orange" },
  { value: "ctf", label: "CTF", tone: "red" },
  { value: "cybersecurity", label: "Кибербезопасность", tone: "emerald" },
  { value: "startup", label: "Стартап", tone: "lime" },
  { value: "education", label: "Образование", tone: "blue" },
  { value: "research", label: "Исследование", tone: "slate" },
  { value: "open_source", label: "Открытый код", tone: "indigo" },
] as const;

export type ProjectDirection = (typeof projectDirections)[number]["value"];

export function getProjectDirectionLabel(direction?: string | null) {
  return projectDirections.find((item) => item.value === direction)?.label ?? "Веб";
}
