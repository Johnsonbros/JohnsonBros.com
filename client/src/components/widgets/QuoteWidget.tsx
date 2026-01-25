import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolOutput } from "@/hooks/use-tool-output";
import { invokeTool, ToolName } from "@/lib/toolBridge";
import type { QuoteData, QuoteRequest } from "@/components/widgets/types";

type QuoteWidgetProps = {
  data?: QuoteData | null;
  request?: QuoteRequest;
  action?: {
    label: string;
    toolName: ToolName;
    params: Record<string, unknown>;
  };
};

const urgencyStyles: Record<string, string> = {
  routine: "bg-service-green/20 text-service-green",
  soon: "bg-johnson-orange/20 text-johnson-orange",
  urgent: "bg-emergency-red/20 text-emergency-red",
  emergency: "bg-emergency-red text-white",
};

export function QuoteWidget({ data, request, action }: QuoteWidgetProps) {
  const { data: toolData, isLoading, error } = useToolOutput<QuoteData>({
    toolName: "get_quote",
    params: request,
    enabled: !data && !!request,
    initialData: data ?? null,
  });

  const resolvedData = data ?? toolData ?? {};
  const service = resolvedData.service_type || resolvedData.service || "Plumbing Service";
  const priceMin = resolvedData.price_range?.min ?? resolvedData.estimate_min ?? 99;
  const priceMax = resolvedData.price_range?.max ?? resolvedData.estimate_max ?? 500;
  const duration = resolvedData.estimated_duration || resolvedData.duration || "1-3 hours";
  const urgency = resolvedData.urgency || "routine";

  const handleAction = async () => {
    if (!action) return;
    await invokeTool(action.toolName, action.params);
  };

  return (
    <Card className="w-full max-w-md border border-primary/40 bg-gradient-to-br from-primary/10 via-white to-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
            $
          </div>
          <div>
            <CardTitle className="text-lg text-primary">Instant Estimate</CardTitle>
            <p className="text-sm text-primary/80">{service}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && (
          <>
            <div className="rounded-xl bg-white/80 p-4 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Estimated Cost Range
              </div>
              <div className="text-3xl font-bold text-primary">
                ${priceMin} - ${priceMax}
              </div>
              <div className="text-xs text-muted-foreground">
                Final price depends on specific work needed
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">{service}</span>
              </div>
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <span className="text-muted-foreground">Est. Duration</span>
                <span className="font-medium text-foreground">{duration}</span>
              </div>
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <span className="text-muted-foreground">Priority</span>
                <Badge className={urgencyStyles[urgency] ?? "bg-muted text-muted-foreground"}>
                  {urgency.toString().toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service Call</span>
                <span className="font-medium text-foreground">
                  $99 (waived if we do the work)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Transparent pricing
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Licensed &amp; insured
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Rated 4.9★
              </Badge>
            </div>
          </>
        )}

        {action && (
          <Button variant="brand-primary" className="w-full" onClick={handleAction}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
