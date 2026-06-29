"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usersApi } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/utils/helpers";
import { useUserStore } from "@/store/user-store";
import type { CurrentUser } from "@/types/user";

export function PrivacySettingsForm({ currentUser }: { currentUser: CurrentUser }) {
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [allowInvites, setAllowInvites] = useState(currentUser.allow_project_invites);

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMyPrivacy({
        allow_project_invites: allowInvites,
      }),
    onSuccess: (response) => {
      setCurrentUser(response);
      setAllowInvites(response.allow_project_invites);
      toast.success("Настройки конфиденциальности сохранены.");
    },
    onError: (error) => {
      setAllowInvites(currentUser.allow_project_invites);
      toast.error(getApiErrorMessage(error, "Не удалось сохранить настройки конфиденциальности."));
    },
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Конфиденциальность</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Управляй тем, могут ли лиды проектов находить тебя в поиске для приглашения и отправлять личные инвайты.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-[12px] border border-border bg-muted/40 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Разрешить приглашения в проекты</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Если выключить, твой профиль не будет показываться в поиске кандидатов для приглашения, и новые инвайты
                в проекты больше не придут.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-teal-500"
                checked={allowInvites}
                onChange={(event) => setAllowInvites(event.target.checked)}
              />
              {allowInvites ? "Приглашения включены" : "Приглашения отключены"}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохраняем..." : "Сохранить настройки"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAllowInvites(currentUser.allow_project_invites)}
            disabled={updateMutation.isPending}
          >
            Отменить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
