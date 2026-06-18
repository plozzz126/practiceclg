"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageIntro } from "@/components/layout/page-intro";
import { UserCard } from "@/components/user/user-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/constants/query-keys";
import { useSkillsCatalog } from "@/lib/hooks/use-skills-catalog";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { usersApi } from "@/lib/api/users";

export function UsersBrowser() {
  const { skills } = useSkillsCatalog();
  const [query, setQuery] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("all");
  const [course, setCourse] = useState("");
  const [university, setUniversity] = useState("");
  const [rating, setRating] = useState("0");

  const debouncedQuery = useDebouncedValue(query);
  const debouncedUniversity = useDebouncedValue(university);

  const params = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      skill: selectedSkillId === "all" ? undefined : selectedSkillId,
      course: course ? Number(course) : undefined,
      university: debouncedUniversity || undefined,
      rating: Number(rating) > 0 ? Number(rating) : undefined,
    }),
    [course, debouncedQuery, debouncedUniversity, rating, selectedSkillId],
  );

  const usersQuery = useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => usersApi.list(params),
  });

  return (
    <section className="container py-10 md:py-14">
      <div className="space-y-8">
        <PageIntro
          eyebrow="Teammates"
          title="Find students by skills, course, university and rating."
          description="Explore public profiles and shortlist people who match your stack or study direction."
        />

        <Card>
          <CardContent className="grid gap-5 p-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="student-query">Search by name</Label>
              <Input
                id="student-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Aruzhan, Daniyar, Alina..."
              />
            </div>

            <div className="space-y-2">
              <Label>Skill</Label>
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                type="number"
                min={1}
                max={8}
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                placeholder="1-8"
              />
            </div>

            <div>
              <Label htmlFor="rating">Min rating</Label>
              <Input
                id="rating"
                type="number"
                min={0}
                max={5}
                step="0.5"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                placeholder="Search by university name"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setSelectedSkillId("all");
                  setCourse("");
                  setUniversity("");
                  setRating("0");
                }}
              >
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {usersQuery.data?.items.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {usersQuery.data.items.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No students match these filters"
            description="Try another skill, widen the university filter or remove the rating threshold."
          />
        )}
      </div>
    </section>
  );
}
