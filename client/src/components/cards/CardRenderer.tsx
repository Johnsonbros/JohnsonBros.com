import type { CardIntent } from '@/lib/cardProtocol';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerCard } from './DatePickerCard';
import { TimePickerCard } from './TimePickerCard';
import { LeadCard as LeadCaptureCard } from './LeadCard';
import { BookingConfirmationCard as AppointmentConfirmationCard } from './BookingConfirmationCard';
import { NewCustomerInfoCard } from './NewCustomerInfoCard';
import { ReturningCustomerLookupCard } from './ReturningCustomerLookupCard';

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
          card={card}
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
          card={card}
          onSelectDate={(date) => onAction('SELECT_DATE', { cardId: card.id, date, serviceId: card.serviceId })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'time_picker':
      return (
        <TimePickerCard
          card={card}
          onSelectSlot={(slotId, timeWindow) => onAction('SELECT_TIME', { cardId: card.id, slotId, timeWindow, date: card.selectedDate })}
          onDismiss={handleDismiss}
          isLoading={isLoading}
        />
      );

    case 'booking_confirmation':
      return (
        <AppointmentConfirmationCard
          card={{ ...card, title: card.title ?? 'Booking Confirmed' }}
          onAction={onAction}
          onDismiss={handleDismiss}
        />
      );

    case 'service_recommendation':
      return (
        <Card className="w-full border-blue-200/70 bg-gradient-to-br from-white to-blue-50/30 shadow-lg dark:border-blue-900/40 dark:from-slate-900 dark:to-slate-950/40">
          <div className="space-y-3">
            <div className="space-y-2 px-5 pt-5 sm:px-6">
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.summary}</p>
              {card.priceRange && (
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                  ${card.priceRange.min} - ${card.priceRange.max}
                </p>
              )}
            </div>
            {card.cta && (
              <div className="px-5 pb-5 sm:px-6">
                <Button
                  onClick={() => onAction(card.cta!.action, card.cta!.payload)}
                  className="w-full"
                >
                  {card.cta.label}
                </Button>
              </div>
            )}
          </div>
        </Card>
      );

    case 'estimate_range':
      return (
        <Card className="w-full border-green-200/70 bg-gradient-to-br from-white to-green-50/30 shadow-lg dark:border-green-900/40 dark:from-slate-900 dark:to-slate-950/40">
          <div className="space-y-3 px-5 py-5 sm:px-6">
            <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.summary}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-300">
              ${card.range.min} - ${card.range.max}
            </p>
            {card.disclaimer && (
              <p className="text-xs text-muted-foreground italic">{card.disclaimer}</p>
            )}
          </div>
        </Card>
      );

    default:
      return null;
  }
}
