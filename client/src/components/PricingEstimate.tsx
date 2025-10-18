import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, DollarSign, Clock, AlertTriangle, Calendar, Gift } from "lucide-react";

interface PricingEstimateProps {
  service: any;
  selectedDate: string;
  selectedTimeSlot: any;
  severity: string;
  isFeeWaived: boolean;
  onFeeWaiverChange: (waived: boolean) => void;
}

export function PricingEstimate({
  service,
  selectedDate,
  selectedTimeSlot,
  severity,
  isFeeWaived,
  onFeeWaiverChange,
}: PricingEstimateProps) {
  // Calculate base price
  const basePrice = service?.price || 150;

  // Calculate additional fees
  let additionalFees = 0;
  const fees: Array<{ name: string; amount: number; icon: any; description: string }> = [];

  // Emergency fee
  if (severity === "emergency") {
    fees.push({
      name: "Emergency Service",
      amount: 100,
      icon: AlertTriangle,
      description: "Priority response for urgent issues",
    });
    additionalFees += 100;
  }

  // Same-day fee
  if (selectedDate) {
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) {
      fees.push({
        name: "Same-Day Service",
        amount: 50,
        icon: Calendar,
        description: "Expedited scheduling for today",
      });
      additionalFees += 50;
    }
  }

  // After-hours fee
  if (selectedTimeSlot) {
    const startTime = new Date(selectedTimeSlot.startTime);
    const hour = startTime.getHours();
    if (hour < 8 || hour >= 18) {
      fees.push({
        name: "After-Hours Service",
        amount: 75,
        icon: Clock,
        description: "Service outside business hours",
      });
      additionalFees += 75;
    }
  }

  // Apply fee waiver
  let serviceFee = 99;
  if (isFeeWaived) {
    serviceFee = 0;
  }

  const total = basePrice + additionalFees + serviceFee;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          {/* Service Base Price */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold">Base Service Price</p>
                <p className="text-sm text-gray-600">{service?.name}</p>
              </div>
            </div>
            <span className="text-lg font-semibold">${basePrice}</span>
          </div>

          {/* Service Fee */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold">Diagnostic Service Fee</p>
                <p className="text-sm text-gray-600">Applied toward repairs if approved</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFeeWaived ? (
                <>
                  <span className="line-through text-gray-400">$99</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Gift className="w-3 h-3 mr-1" />
                    WAIVED
                  </Badge>
                </>
              ) : (
                <span className="text-lg font-semibold">$99</span>
              )}
            </div>
          </div>

          {/* Additional Fees */}
          {fees.length > 0 && (
            <>
              <p className="font-semibold mb-3">Additional Fees</p>
              {fees.map((fee, index) => {
                const Icon = fee.icon;
                return (
                  <div key={index} className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{fee.name}</p>
                        <p className="text-xs text-gray-600">{fee.description}</p>
                      </div>
                    </div>
                    <span className="font-medium">+${fee.amount}</span>
                  </div>
                );
              })}
              <div className="border-b mb-4"></div>
            </>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-lg font-bold">Estimated Total</p>
              <p className="text-sm text-gray-600">Due at time of service</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-johnson-blue">${total}</p>
              {isFeeWaived && (
                <p className="text-sm text-green-600 font-medium">You save $99!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotional Offer */}
      {!isFeeWaived && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="fee-waiver"
                checked={isFeeWaived}
                onCheckedChange={onFeeWaiverChange}
              />
              <div className="flex-1">
                <label htmlFor="fee-waiver" className="cursor-pointer">
                  <p className="font-semibold text-green-900">Special Offer Available!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Book now and get the $99 service fee waived! This limited-time offer
                    saves you money on your plumbing service.
                  </p>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This is an estimate based on typical service requirements</li>
              <li>Final price may vary based on the complexity of repairs needed</li>
              <li>Technician will provide exact quote after diagnosis</li>
              <li>No repairs will be done without your approval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}