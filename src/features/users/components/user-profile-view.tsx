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
          title="Профиль не найден"
          description="Публичный профиль недоступен или ссылка больше неактуальна."
          action={
            <Button asChild>
              <Link href={routes.users}>Назад к тиммейтам</Link>
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
            Назад к тиммейтам
          </Link>
        </Button>

        {user ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <Avatar className="h-24 w-24 rounded-[8px]">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                    <AvatarFallback className="rounded-[8px] bg-muted text-xl text-foreground">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <div>
                      <h1 className="font-display text-4xl font-semibold text-foreground">{user.full_name}</h1>
                      <p className="tone-warning-soft mt-2 inline-flex items-center gap-2 rounded-[6px] border px-3 py-1 text-sm font-medium">
                        <Star className="h-4 w-4" />
                        Рейтинг {formatRating(user.rating)}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        {user.university || "Университет не указан"}
                      </p>
                      <p className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        {user.course ? `Курс ${user.course}` : "Курс не указан"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">О студенте</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {user.bio || "Этот студент пока не добавил публичное описание."}
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Навыки</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.skills.length ? (
                      user.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Навыки пока не указаны</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Статус сотрудничества</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <p>
                    Инвайты и действия по заявкам будут привязаны к следующему backend-этапу. Уже сейчас эта страница
                    дает полноценный публичный профиль для такого сценария.
                  </p>
                  {currentUser?.id === user.id ? (
                    <Button asChild>
                      <Link href={routes.profile}>Редактировать мой профиль</Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      Инвайты появятся вместе с API заявок
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">На что смотреть</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>Смотри, пересекается ли стек с твоим проектом или с недостающими ролями в команде.</p>
                  <p>Курс и университет помогают понять загрузку, контекст и предметную близость.</p>
                  <p>Используй профиль как шортлист перед переходом к заявкам и работе внутри проекта.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Загружаем публичный профиль...</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
