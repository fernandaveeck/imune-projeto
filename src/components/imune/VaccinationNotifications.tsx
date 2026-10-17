import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Syringe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listPets } from "@/lib/imune/api";
import { formatShortDate, parseDateOnly, todayDateOnly } from "@/lib/imune/format";
import type { PetListItem } from "@/lib/imune/types";

const READ_NOTIFICATIONS_STORAGE_KEY = "imune:read-vaccination-notifications:v2";

interface VaccinationNotification {
  id: string;
  petId: string;
  petName: string;
  vaccineName: string;
  applicationDate: string;
  daysUntilApplication: number;
}

function getStorageKey(userId: string): string {
  return `${READ_NOTIFICATIONS_STORAGE_KEY}:${userId}`;
}

function loadReadNotificationIds(userId: string): string[] {
  if (!userId || typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(getStorageKey(userId));
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveReadNotificationIds(userId: string, ids: string[]): void {
  if (!userId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(ids));
  } catch {}
}

function getVaccinationNotifications(pets: PetListItem[], today: Date): VaccinationNotification[] {
  const uniquePets = new Map<string, PetListItem>();
  for (const pet of pets) uniquePets.set(pet.id, pet);
  const notifications: VaccinationNotification[] = [];
  const seenVaccineIds = new Set<string>();

  for (const pet of uniquePets.values()) {
    for (const vaccine of pet.vaccinations) {
      if (seenVaccineIds.has(vaccine.id)) continue;
      seenVaccineIds.add(vaccine.id);

      const daysUntilApplication = differenceInCalendarDays(
        parseDateOnly(vaccine.administered_at),
        today,
      );
      if (daysUntilApplication < 0 || daysUntilApplication > 10) continue;

      notifications.push({
        id: `${vaccine.id}:application:${vaccine.administered_at}:${daysUntilApplication === 0 ? "today" : "upcoming"}`,
        petId: pet.id,
        petName: pet.name,
        vaccineName: vaccine.name,
        applicationDate: vaccine.administered_at,
        daysUntilApplication,
      });
    }
  }

  return notifications.sort(
    (a, b) =>
      b.daysUntilApplication - a.daysUntilApplication ||
      a.petName.localeCompare(b.petName, "pt-BR") ||
      a.vaccineName.localeCompare(b.vaccineName, "pt-BR"),
  );
}

function dueLabel(daysUntilApplication: number): string {
  if (daysUntilApplication === 0) return "Venceu hoje";
  if (daysUntilApplication === 1) return "Vence amanhã";
  return `Vence em ${daysUntilApplication} dias`;
}

export function VaccinationNotifications({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [readState, setReadState] = useState<{ userId: string; ids: string[] }>({
    userId: "",
    ids: [],
  });

  const mineQuery = useQuery({
    queryKey: ["pets", "mine", userId],
    queryFn: () => listPets("mine", userId),
    enabled: Boolean(userId),
  });
  const sharedQuery = useQuery({
    queryKey: ["pets", "shared", userId],
    queryFn: () => listPets("shared", userId),
    enabled: Boolean(userId),
  });
  const today = todayDateOnly();
  const todayTimestamp = today.getTime();

  useEffect(() => {
    if (!userId) {
      setReadState({ userId: "", ids: [] });
      return;
    }

    setReadState({ userId, ids: loadReadNotificationIds(userId) });
  }, [userId]);

  const notifications = useMemo(
    () =>
      getVaccinationNotifications(
        [...(mineQuery.data ?? []), ...(sharedQuery.data ?? [])],
        new Date(todayTimestamp),
      ),
    [mineQuery.data, sharedQuery.data, todayTimestamp],
  );
  const readIds = readState.userId === userId ? new Set(readState.ids) : new Set<string>();
  const unreadCount =
    readState.userId === userId
      ? notifications.filter((notification) => !readIds.has(notification.id)).length
      : 0;

  const markNotificationsAsRead = useCallback(() => {
    if (!userId || notifications.length === 0) return;

    const existingIds =
      readState.userId === userId ? readState.ids : loadReadNotificationIds(userId);
    const nextIdSet = new Set(existingIds);
    const newIds = notifications
      .map((notification) => notification.id)
      .filter((id) => !nextIdSet.has(id));
    if (newIds.length === 0) return;

    const nextIds = [...nextIdSet, ...newIds];
    setReadState({ userId, ids: nextIds });
    saveReadNotificationIds(userId, nextIds);
  }, [notifications, readState.ids, readState.userId, userId]);

  const queryIsPending = mineQuery.isPending || sharedQuery.isPending;
  const queryHasError = mineQuery.isError || sharedQuery.isError;

  useEffect(() => {
    if (open && !queryIsPending && !queryHasError) markNotificationsAsRead();
  }, [markNotificationsAsRead, open, queryHasError, queryIsPending]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) markNotificationsAsRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
          className="relative h-11 w-11 rounded-xl bg-secondary/70 text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="flex max-h-[min(70vh,32rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-border/70 bg-brand-surface/60 px-4 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Syringe className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                Vacinas próximas
              </h2>
              {unreadCount > 0 ? (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full border-destructive/20 bg-destructive/10 px-2 text-[10px] text-destructive"
                >
                  {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Datas de aplicação previstas para hoje ou os próximos 10 dias.
            </p>
          </div>
        </div>

        {queryIsPending ? (
          <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            Buscando vacinações...
          </div>
        ) : queryHasError ? (
          <div className="px-5 py-7 text-center">
            <p className="text-sm font-medium text-foreground">
              Não foi possível carregar as notificações.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => {
                if (mineQuery.isError) void mineQuery.refetch();
                if (sharedQuery.isError) void sharedQuery.refetch();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-success-surface text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">Tudo em dia</p>
            <p className="mx-auto mt-1 max-w-56 text-xs leading-relaxed text-muted-foreground">
              Nenhuma aplicação prevista nos próximos 10 dias.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {notifications.map((notification, index) => (
              <Link
                key={notification.id}
                to="/pets/$id"
                params={{ id: notification.petId }}
                onClick={() => setOpen(false)}
                aria-label={`${notification.petName}, ${notification.vaccineName}; data da aplicação ${formatShortDate(notification.applicationDate)}; ${dueLabel(notification.daysUntilApplication)}. Abrir histórico de vacinação.`}
                className={`group relative block px-4 py-3.5 transition-colors hover:bg-brand-surface/65 focus-visible:bg-brand-surface/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                  index < notifications.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <span className="absolute right-4 top-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                  <ChevronRight className="h-4 w-4" />
                </span>
                <div className="min-w-0 pr-6">
                  <p className="break-words text-sm font-semibold leading-snug text-foreground">
                    {notification.petName}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {notification.vaccineName}
                  </p>
                </div>
                <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="break-words">
                      Data da aplicação: {formatShortDate(notification.applicationDate)}
                    </span>
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
                  >
                    {dueLabel(notification.daysUntilApplication)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
