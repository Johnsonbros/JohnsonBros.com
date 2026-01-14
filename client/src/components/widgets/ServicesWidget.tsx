import { Wrench } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolOutput } from "@/hooks/use-tool-output";
import type { ServicesData, ServicesRequest } from "@/components/widgets/types";

type ServicesWidgetProps = {
  data?: ServicesData | null;
  request?: ServicesRequest;
};

const formatPrice = (min?: number, max?: number) => {
  if (!min && !max) return "Call for pricing";
  if (min && max && min !== max) return `$${min} - $${max}`;
  const value = min ?? max ?? 0;
  return value ? `$${value}` : "Call for pricing";
};

export function ServicesWidget({ data, request }: ServicesWidgetProps) {
  const { data: toolData, isLoading, error } = useToolOutput<ServicesData>({
    toolName: "get_services",
    params: request,
    enabled: !data,
    initialData: data ?? null,
  });

  const resolvedData = data ?? toolData ?? {};
  const services = resolvedData.services ?? [];
  const businessName = resolvedData.business?.name || "Johnson Bros. Plumbing";

  return (
    <Card className="w-full max-w-xl border border-border bg-card shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-johnson-orange text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Our Services</CardTitle>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && services.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No services available right now.
          </div>
        )}

        {!isLoading && !error && services.length > 0 && (
          <div className="space-y-3">
            {services.slice(0, 8).map((service) => {
              const priceMin = service.priceRange?.min ?? service.price_min;
              const priceMax = service.priceRange?.max ?? service.price_max;
              const duration = service.estimatedDuration || service.duration;
              const isEmergency = service.isEmergency || service.is_emergency;

              return (
                <div
                  key={service.name ?? service.title ?? service.description}
                  className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {service.name || service.title}
                      </span>
                      {isEmergency && (
                        <Badge variant="destructive" className="text-[10px]">
                          24/7
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-service-green">
                      {formatPrice(priceMin, priceMax)}
                    </div>
                    {duration && (
                      <div className="text-xs text-muted-foreground">{duration}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="bg-johnson-orange/10 text-johnson-orange">
            Licensed &amp; Insured
          </Badge>
          <Badge variant="secondary" className="bg-johnson-orange/10 text-johnson-orange">
            15+ years local
          </Badge>
          <Badge variant="secondary" className="bg-johnson-orange/10 text-johnson-orange">
            Same-day options
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        $99 service call fee waived when we do the work
      </CardFooter>
    </Card>
  );
}
