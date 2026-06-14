import type { ApiErrorResponse } from "@/types/api";

export function getInitials(name?: string | null) {
  if (!name) {
    return "EM";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function buildQueryString(
  params: Record<string, string | number | undefined | null>,
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { response?: { data?: ApiErrorResponse } };
    if (candidate.response?.data?.errors?.length) {
      return candidate.response.data.errors[0]?.message ?? fallback;
    }

    if (candidate.response?.data?.message) {
      return candidate.response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
