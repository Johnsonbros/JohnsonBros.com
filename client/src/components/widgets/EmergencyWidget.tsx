import { AlertTriangle, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToolOutput } from "@/hooks/use-tool-output";
import type { EmergencyData, EmergencyRequest } from "@/components/widgets/types";

type EmergencyWidgetProps = {
  data?: EmergencyData | null;
  request?: EmergencyRequest;
  phone?: string;
};

export function EmergencyWidget({
  data,
  request,
  phone = "(617) 479-9911",
}: EmergencyWidgetProps) {
  const { data: toolData, isLoading, error } = useToolOutput<EmergencyData>({
    toolName: "emergency_help",
    params: request,
    enabled: !data && !!request,
    initialData: data ?? null,
  });

  const resolvedData = data ?? toolData ?? {};
  const title = resolvedData.title || "Emergency Guidance";
  const urgency = (resolvedData.urgency || "critical").toString();
  const steps = resolvedData.immediateSteps || resolvedData.steps || [];
  const dontDo = resolvedData.doNotDo || [];

  return (
    <Card className="w-full max-w-lg border-2 border-emergency-red bg-emergency-red/10 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emergency-red text-white shadow-md">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg text-emergency-red">{title}</CardTitle>
            <Badge className="mt-1 bg-emergency-red text-white">{urgency.toUpperCase()}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!isLoading && !error && (
          <>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emergency-red">
                <Check className="h-4 w-4 text-service-green" />
                Do This Now
              </div>
              <ul className="mt-2 space-y-2 text-sm text-emergency-red/90">
                {steps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-emergency-red" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {dontDo.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-emergency-red">
                  <X className="h-4 w-4 text-johnson-orange" />
                  Do NOT Do
                </div>
                <ul className="mt-2 space-y-2 text-sm text-emergency-red/90">
                  {dontDo.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-johnson-orange" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a href="tel:+16174799911" className="block">
              <Button variant="brand-urgent" className="w-full">
                Call Now: {phone}
              </Button>
            </a>

            <p className="text-center text-xs text-emergency-red">
              24/7 Emergency Line - We're here to help
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="bg-emergency-red/20 text-emergency-red">
                Rapid response
              </Badge>
              <Badge variant="secondary" className="bg-emergency-red/20 text-emergency-red">
                Licensed techs
              </Badge>
              <Badge variant="secondary" className="bg-emergency-red/20 text-emergency-red">
                24/7 on-call
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
