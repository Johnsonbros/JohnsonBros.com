import type { CardIntent } from '@/lib/cardProtocol';
import { NewCustomerInfoCard } from './NewCustomerInfoCard';
import { ReturningCustomerLookupCard } from './ReturningCustomerLookupCard';
import {
  AppointmentConfirmationCard,
  DatePickerCard,
  LeadCaptureCard,
  TimePickerCard,
} from '@johnsonbros/unified-cards';

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
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{card.summary}</p>
          {card.priceRange && (
            <p className="text-sm font-medium text-blue-600 mb-3">
              ${card.priceRange.min} - ${card.priceRange.max}
            </p>
          )}
          {card.cta && (
            <button
              onClick={() => onAction(card.cta!.action, card.cta!.payload)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {card.cta.label}
            </button>
          )}
        </div>
      );

    case 'estimate_range':
      return (
        <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{card.summary}</p>
          <p className="text-lg font-bold text-green-600 mb-2">
            ${card.range.min} - ${card.range.max}
          </p>
          {card.disclaimer && (
            <p className="text-xs text-gray-500 italic">{card.disclaimer}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
