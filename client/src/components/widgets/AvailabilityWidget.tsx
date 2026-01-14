import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolOutput } from "@/hooks/use-tool-output";
import type {
  AvailabilityData,
  AvailabilityRequest,
  AvailabilitySlot,
} from "@/components/widgets/types";

type AvailabilityWidgetProps = {
  data?: AvailabilityData | null;
  request?: AvailabilityRequest;
  onSelectSlot?: (slot: AvailabilitySlot) => void;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export function AvailabilityWidget({
  data,
  request,
  onSelectSlot,
}: AvailabilityWidgetProps) {
  const { data: toolData, isLoading, error } = useToolOutput<AvailabilityData>({
    toolName: "search_availability",
    params: request,
    enabled: !data && !!request,
    initialData: data ?? null,
  });

  const resolvedData = data ?? toolData ?? {};
  const slots =
    resolvedData.available_slots?.filter((slot) => slot.available !== false) ??
    resolvedData.windows?.filter((slot) => slot.available !== false) ??
    [];

  const serviceType =
    resolvedData.service_type || request?.serviceType || "Plumbing Service";

  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
      const day = formatDate(slot.start_time);
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const days = Object.keys(groupedSlots);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const handleSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    onSelectSlot?.(slot);
  };

  return (
    <Card className="w-full max-w-lg border border-border bg-card shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Available Appointments</CardTitle>
            <p className="text-sm text-muted-foreground">{serviceType}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && days.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No available slots found for the requested dates.
          </div>
        )}

        {!isLoading && !error && days.length > 0 && (
          <div className="space-y-4">
            {days.slice(0, 5).map((day) => (
              <div key={day} className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {day}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {groupedSlots[day].slice(0, 6).map((slot) => {
                    const label = slot.formatted_time || formatTime(slot.start_time);
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time &&
                      selectedSlot?.end_time === slot.end_time;
                    return (
                      <Button
                        key={slot.start_time}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelect(slot)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Live availability
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            24/7 emergency
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            South Shore experts
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
