import type { CardIntent } from '@/lib/cardProtocol';
import { NewCustomerInfoCard } from './NewCustomerInfoCard';
import { ReturningCustomerLookupCard } from './ReturningCustomerLookupCard';
import { DatePickerCard } from './DatePickerCard';
import { TimePickerCard } from './TimePickerCard';
import { BookingConfirmationCard } from './BookingConfirmationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CardRendererProps {
  card: CardIntent;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss: (cardId: string) => void;
  isLoading?: boolean;
}

export function CardRenderer({ card, onAction, onDismiss, isLoading }: CardRendererProps) {
  const handleDismiss = () => onDismiss(card.id);

  switch (card.type) {
    case 'lead_card':
      return (
        <LeadCaptureCard
          payload={card}
          onSubmit={(data) => onAction('SUBMIT_LEAD', { cardId: card.id, ...data })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'new_customer_info':
      return (
        <NewCustomerInfoCard
          card={card}
          onSubmit={(data) => onAction('SUBMIT_CUSTOMER_INFO', { cardId: card.id, ...data })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'returning_customer_lookup':
      return (
        <ReturningCustomerLookupCard
          card={card}
          onSearch={(query) => onAction('SEARCH_CUSTOMER', { cardId: card.id, query })}
          onSelectCustomer={(customer) => onAction('SELECT_CUSTOMER', { cardId: card.id, customer })}
          onNewCustomer={() => onAction('NEW_CUSTOMER', { cardId: card.id })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'date_picker':
      return (
        <DatePickerCard
          payload={card}
          onSelectDate={(date) => onAction('SELECT_DATE', { cardId: card.id, date, serviceId: card.serviceId })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'time_picker':
      return (
        <TimePickerCard
          payload={card}
          onSelectSlot={(slotId, timeWindow) => onAction('SELECT_TIME', { cardId: card.id, slotId, timeWindow, date: card.selectedDate })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'booking_confirmation':
      return (
        <AppointmentConfirmationCard
          payload={{ ...card, title: card.title ?? 'Booking Confirmed' }}
          onAction={onAction}
          onDismiss={handleDismiss}
        />
      );

    case 'service_recommendation':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {card.priceRange && (
              <p className="text-sm font-medium text-primary">
                ${card.priceRange.min} - ${card.priceRange.max}
              </p>
            )}
            {card.cta && (
              <Button
                onClick={() => onAction(card.cta!.action, card.cta!.payload)}
                className="w-full"
              >
                {card.cta.label}
              </Button>
            )}
          </CardContent>
        </Card>
      );

    case 'estimate_range':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-semibold text-primary">
              ${card.range.min} - ${card.range.max}
            </p>
            {card.disclaimer && (
              <p className="text-xs text-muted-foreground italic">{card.disclaimer}</p>
            )}
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}
