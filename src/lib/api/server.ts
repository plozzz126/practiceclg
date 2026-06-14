import "server-only";

import { API_URL } from "@/lib/api/config";
import type { ApiSuccess } from "@/types/api";

export async function serverGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    next: { revalidate: 60 },
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}
