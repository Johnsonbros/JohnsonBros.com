import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invokeTool, getChatGptToolOutput } from "@/lib/toolBridge";
import type { BookingConfirmationData } from "@/components/widgets/types";

type BookingConfirmationWidgetProps = {
  data?: BookingConfirmationData | null;
  onReschedule?: () => void;
  rescheduleAction?: {
    label?: string;
    toolName: "book_service_call";
    params: Record<string, unknown>;
  };
};

export function BookingConfirmationWidget({
  data,
  onReschedule,
  rescheduleAction,
}: BookingConfirmationWidgetProps) {
  const chatGptData = getChatGptToolOutput<BookingConfirmationData>();
  const resolvedData = data ?? chatGptData ?? {};

  const customer = resolvedData.customer_name || "Customer";
  const scheduled = resolvedData.scheduled_time || "To be confirmed";
  const address = resolvedData.address || "Address on file";
  const service = resolvedData.service_description || "Plumbing service";
  const jobId = resolvedData.job_id || resolvedData.confirmation_number || "PENDING";

  const handleReschedule = async () => {
    if (rescheduleAction) {
      await invokeTool(rescheduleAction.toolName, rescheduleAction.params);
    }
    onReschedule?.();
  };

  return (
    <Card className="w-full max-w-md border border-service-green/40 bg-gradient-to-br from-service-green/10 via-white to-service-green/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-service-green text-white">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-service-green">
              Appointment Confirmed!
            </CardTitle>
            <p className="text-sm text-service-green/80">Johnson Bros. Plumbing</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-service-green/20 pb-2">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-foreground">{customer}</span>
          </div>
          <div className="flex items-center justify-between border-b border-service-green/20 pb-2">
            <span className="text-muted-foreground">When</span>
            <span className="font-medium text-foreground">{scheduled}</span>
          </div>
          <div className="flex items-center justify-between border-b border-service-green/20 pb-2">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">{service}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium text-foreground">{address}</span>
          </div>
        </div>

        <div className="rounded-lg bg-service-green px-4 py-3 text-center text-white">
          <div className="text-xs uppercase tracking-wide">Confirmation Number</div>
          <div className="text-xl font-bold tracking-widest">{jobId}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-service-green/10 text-service-green">
            Licensed &amp; Insured
          </Badge>
          <Badge variant="secondary" className="bg-service-green/10 text-service-green">
            Same-day availability
          </Badge>
          <Badge variant="secondary" className="bg-service-green/10 text-service-green">
            4.9★ Google Reviews
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
        <div className="text-center">
          Need to reschedule? Call us at{" "}
          <a className="font-semibold text-service-green" href="tel:+16174799911">
            (617) 479-9911
          </a>
        </div>
        {rescheduleAction && (
          <Button variant="outline" onClick={handleReschedule} className="w-full">
            {rescheduleAction.label ?? "Reschedule"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
