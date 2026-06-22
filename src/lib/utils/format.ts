export function formatDate(value?: string | null) {
  if (!value) {
    return "Без дедлайна";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeDate(value?: string | null) {
  if (!value) {
    return "Нет недавней активности";
  }

  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(days) >= 1) {
    return formatter.format(days, "day");
  }

  const hours = Math.round(diff / (1000 * 60 * 60));
  if (Math.abs(hours) >= 1) {
    return formatter.format(hours, "hour");
  }

  const minutes = Math.round(diff / (1000 * 60));
  return formatter.format(minutes, "minute");
}

export function formatRating(value: number) {
  return value.toFixed(1);
}
