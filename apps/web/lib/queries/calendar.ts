import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type HostCalendarResponse = components["schemas"]["HostCalendarResponse"];
export type HostCalendarDay = components["schemas"]["HostCalendarDay"];
export type CalendarRuleCreate = components["schemas"]["CalendarRuleCreate"];
export type CalendarRuleResponse = components["schemas"]["app__listings__schemas__CalendarRuleResponse"];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function useHostCalendar(unitId: string | undefined, checkIn: string, checkOut: string) {
  const params: Record<string, string> = { check_in: checkIn, check_out: checkOut };
  if (unitId) params.unit_id = unitId;
  return useQuery({
    queryKey: ["host-calendar", unitId ?? "all", checkIn, checkOut],
    queryFn: async () => {
      const { data } = await api.get<HostCalendarResponse>("/host/calendar", {
        params,
      });
      return data;
    },
    enabled: Boolean(checkIn && checkOut),
  });
}

export function useDefaultHostCalendarRange(unitId: string, days = 90) {
  const today = toISODate(new Date());
  const end = new Date();
  end.setDate(end.getDate() + days);
  const checkOut = toISODate(end);
  return useHostCalendar(unitId, today, checkOut);
}

export function useCreateCalendarRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, payload }: { unitId: string; payload: CalendarRuleCreate }) => {
      const { data } = await api.post<CalendarRuleResponse>(`/listings/${unitId}/calendar`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["host-calendar", variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ["availability", variables.unitId] });
    },
  });
}
