"use client";

import { apiClient } from "@/lib/api/client";
import type { ApiSuccess } from "@/types/api";
import type { SkillsResponse } from "@/types/skill";

export const skillsApi = {
  async list() {
    const response = await apiClient.get<ApiSuccess<SkillsResponse>>("/skills");
    return response.data.data;
  },
};
