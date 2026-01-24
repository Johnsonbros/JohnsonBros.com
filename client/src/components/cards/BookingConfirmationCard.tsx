import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Calendar, Clock, MapPin, User, Phone, Wrench, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BookingConfirmationCard as BookingConfirmationCardType } from '@/lib/cardProtocol';

export interface BookingConfirmationCardProps {
  card: BookingConfirmationCardType;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function BookingConfirmationCard({ card, onAction, onDismiss }: BookingConfirmationCardProps) {
  const { toast } = useToast();
  const { booking } = card;

  const copyConfirmation = () => {
    const text = `Booking Confirmation #${booking.confirmationNumber || booking.jobId}
Service: ${booking.serviceType}
Date: ${booking.scheduledDate}
Time: ${booking.scheduledTime}
Address: ${booking.address}`;
    
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Confirmation details copied to clipboard',
    });
  };

  const handleCta = () => {
    if (card.cta && onAction) {
      onAction(card.cta.action, card.cta.payload);
    }
  };

  return (
    <Card className="w-full border-green-200 bg-gradient-to-br from-white to-green-50/30 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Booking Confirmed!</h3>
            {booking.confirmationNumber && (
              <p className="text-green-100 text-sm">
                Confirmation #{booking.confirmationNumber}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {card.message && (
          <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-100">
            {card.message}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Service</div>
              <div className="font-medium text-gray-900">{booking.serviceType}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</div>
              <div className="font-medium text-gray-900">{booking.scheduledDate}</div>
              <div className="text-sm text-gray-600">{booking.scheduledTime}</div>
              {booking.estimatedArrival && (
                <div className="text-xs text-green-600 mt-1">
                  Est. arrival: {booking.estimatedArrival}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Service Address</div>
              <div className="font-medium text-gray-900">{booking.address}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Customer</div>
              <div className="font-medium text-gray-900">{booking.customerName}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {booking.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyConfirmation}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy Details
          </Button>
          
          {card.cta && (
            <Button
              onClick={handleCta}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {card.cta.label}
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          You'll receive a confirmation text and reminder before your appointment.
        </p>
      </CardContent>
    </Card>
  );
}
