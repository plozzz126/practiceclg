"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { Skill } from "@/types/skill";

export function SkillPicker({
  skills,
  selectedIds,
  onChange,
}: {
  skills: Skill[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
}) {
  const toggleSkill = (skillId: string) => {
    if (selectedIds.includes(skillId)) {
      onChange(selectedIds.filter((id) => id !== skillId));
      return;
    }

    onChange([...selectedIds, skillId]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const selected = selectedIds.includes(skill.id);

        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => toggleSkill(skill.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              selected
                ? "border-teal-600 bg-teal-600 text-white shadow-soft"
                : "border-border bg-card/80 text-muted-foreground hover:border-teal-400 hover:text-foreground",
            )}
          >
            {selected ? <Check className="h-4 w-4" /> : null}
            {skill.name}
          </button>
        );
      })}
    </div>
  );
}
