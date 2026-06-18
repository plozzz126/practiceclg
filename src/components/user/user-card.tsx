import Link from "next/link";
import { GraduationCap, School, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRating } from "@/lib/utils/format";
import { getInitials } from "@/lib/utils/helpers";
import type { PublicUser } from "@/types/user";

export function UserCard({
  user,
  action,
}: {
  user: PublicUser;
  action?: React.ReactNode;
}) {
  return (
    <Card className="h-full transition hover:-translate-y-1">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-3xl">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
            <AvatarFallback className="rounded-3xl bg-slate-100 text-slate-700">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-display text-2xl font-semibold text-slate-950">{user.full_name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <School className="h-4 w-4" />
                  {user.university || "University not set"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {user.course ? `Course ${user.course}` : "Course not set"}
                </span>
              </div>
            </div>
            <Badge className="w-fit bg-amber-50 text-amber-800" variant="outline">
              <Star className="mr-1 h-3.5 w-3.5" />
              Rating {formatRating(user.rating)}
            </Badge>
          </div>
        </div>

        <p className="line-clamp-4 text-sm leading-6 text-slate-600">
          {user.bio || "This student has not added a short introduction yet."}
        </p>

        <div className="flex flex-wrap gap-2">
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

        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={`/users/${user.id}`}>View profile</Link>
          </Button>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
