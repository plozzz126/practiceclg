"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { usersApi } from "@/lib/api/users";
import { formatRelativeDate } from "@/lib/utils/format";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export function NotificationCenter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.currentUser);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => usersApi.listMyNotifications(),
    enabled: Boolean(accessToken && currentUser),
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => usersApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => usersApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  if (!accessToken || !currentUser) {
    return null;
  }

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="fixed right-4 top-16 z-50 border-border/80 bg-card/90 backdrop-blur-xl md:right-6 md:top-20"
          aria-label="Открыть уведомления"
          title="Уведомления"
        >
          <Bell />
          {unreadCount ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Уведомления</p>
            <p className="text-xs text-muted-foreground">Заявки, ответы и важные обновления по проектам.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={!unreadCount || markAllReadMutation.isPending}
          >
            <CheckCheck />
            Прочитать все
          </Button>
        </div>
        <DropdownMenuSeparator />
        {notifications.length ? (
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="items-start"
                onSelect={(event) => {
                  event.preventDefault();
                  if (!item.read_at) {
                    markReadMutation.mutate(item.id);
                  }
                  if (item.link) {
                    router.push(item.link);
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {!item.read_at ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{formatRelativeDate(item.created_at)}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Пока пусто. Новые события появятся здесь.</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
