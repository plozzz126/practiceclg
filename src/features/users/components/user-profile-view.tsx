"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, School, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { queryKeys } from "@/constants/query-keys";
import { routes } from "@/constants/routes";
import { usersApi } from "@/lib/api/users";
import { formatRating } from "@/lib/utils/format";
import { getInitials } from "@/lib/utils/helpers";
import { useUserStore } from "@/store/user-store";

export function UserProfileView({ userId }: { userId: string }) {
  const currentUser = useUserStore((state) => state.currentUser);
  const userQuery = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => usersApi.getById(userId),
  });

  if (userQuery.isError) {
    return (
      <section className="container py-10 md:py-14">
        <EmptyState
          title="Student not found"
          description="This public profile is unavailable or the link is no longer valid."
          action={
            <Button asChild>
              <Link href={routes.users}>Back to teammates</Link>
            </Button>
          }
        />
      </section>
    );
  }

  const user = userQuery.data;

  return (
    <section className="container py-10 md:py-14">
      <div className="space-y-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href={routes.users}>
            <ArrowLeft />
            Back to teammates
          </Link>
        </Button>

        {user ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <Avatar className="h-24 w-24 rounded-[32px]">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                    <AvatarFallback className="rounded-[32px] bg-slate-100 text-xl text-slate-700">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <div>
                      <h1 className="font-display text-4xl font-semibold text-slate-950">{user.full_name}</h1>
                      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                        <Star className="h-4 w-4" />
                        Rating {formatRating(user.rating)}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <School className="h-4 w-4 text-slate-400" />
                        {user.university || "University is not specified"}
                      </p>
                      <p className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        {user.course ? `Course ${user.course}` : "Course is not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">About</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {user.bio || "This student has not added a public bio yet."}
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Skills</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.skills.length ? (
                      user.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Skills are not specified yet</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Collaboration status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
                  <p>
                    Invitations and join-request actions are part of the next backend slice. This page already provides
                    the public profile surface for that workflow.
                  </p>
                  {currentUser?.id === user.id ? (
                    <Button asChild>
                      <Link href={routes.profile}>Edit my profile</Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      Invite flow arrives with requests API
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">What to look for</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>Check whether the skill stack overlaps with your current project or missing roles.</p>
                  <p>Course and university help estimate schedule alignment and domain familiarity.</p>
                  <p>Use the profile page as a shortlist source before moving into project-level collaboration.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">Loading public profile...</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
