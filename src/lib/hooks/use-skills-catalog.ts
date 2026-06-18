"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { skillsApi } from "@/lib/api/skills";
import { useUserStore } from "@/store/user-store";

export function useSkillsCatalog() {
  const cachedSkills = useUserStore((state) => state.cachedSkills);
  const setCachedSkills = useUserStore((state) => state.setCachedSkills);

  const skillsQuery = useQuery({
    queryKey: queryKeys.skills,
    queryFn: skillsApi.list,
    initialData: cachedSkills.length ? { items: cachedSkills } : undefined,
  });

  useEffect(() => {
    if (skillsQuery.data?.items.length) {
      setCachedSkills(skillsQuery.data.items);
    }
  }, [setCachedSkills, skillsQuery.data]);

  return {
    ...skillsQuery,
    skills: skillsQuery.data?.items ?? [],
  };
}
