import { useMemo, useState } from 'react';
import { CardRenderer } from '@/components/cards/CardRenderer';
import type { CardIntent } from '@/lib/cardProtocol';

type ThemeMode = 'light' | 'dark';

const sampleCards: CardIntent[] = [
  {
    id: '0d1e1a50-5f2a-4ed0-9af7-9a36b17ce3fd',
    type: 'date_picker',
    version: "1",
    title: 'Pick a service date',
    priority: 'medium',
    message: 'Choose the date that works best for your visit.',
    availableDates: [
      {
        date: '2024-10-14',
        slotsAvailable: 4,
        capacityState: 'AVAILABLE',
      },
      {
        date: '2024-10-15',
        slotsAvailable: 2,
        capacityState: 'LIMITED_SAME_DAY',
      },
      {
        date: '2024-10-16',
        slotsAvailable: 0,
        capacityState: 'NEXT_DAY',
      },
    ],
  },
  {
    id: 'a51b8d6c-b72c-469f-8a5f-6f9a5cd4d0c0',
    type: 'time_picker',
    version: "1",
    title: 'Select a time window',
    priority: 'medium',
    message: 'We recommend the earliest slots for faster service.',
    selectedDate: '2024-10-14',
    slots: [
      {
        id: 'slot-1',
        label: 'Early Bird',
        timeWindow: 'MORNING',
        startTime: '8:00 AM',
        endTime: '9:00 AM',
        available: true,
        technicianCount: 3,
      },
      {
        id: 'slot-2',
        label: 'Popular',
        timeWindow: 'MIDDAY',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        available: true,
        technicianCount: 1,
      },
      {
        id: 'slot-3',
        label: 'Afternoon',
        timeWindow: 'AFTERNOON',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        available: false,
        technicianCount: 0,
      },
    ],
  },
  {
    id: '4f1c06b0-1e11-4c8f-b5d6-9c1c86f9df54',
    type: 'booking_confirmation',
    version: "1",
    title: 'Booking Confirmed',
    priority: 'high',
    message: 'We are all set! Your technician is assigned and on their way.',
    booking: {
      jobId: 'JB-10423',
      confirmationNumber: '840219',
      serviceType: 'Emergency drain cleaning',
      scheduledDate: 'Mon, Oct 14',
      scheduledTime: '8:00 AM - 9:00 AM',
      estimatedArrival: '8:15 AM',
      address: '124 Main Street, Quincy, MA',
      customerName: 'Taylor Smith',
      phone: '(555) 555-0199',
    },
    cta: {
      label: 'View details',
      action: 'open_booking',
      payload: {
        bookingId: 'JB-10423',
      },
    },
  },
  {
    id: 'c1e5a1a9-1ce2-4b8b-8f43-8c6fe0f6c06b',
    type: 'service_recommendation',
    version: "1",
    title: 'Recommended service',
    priority: 'medium',
    summary: 'Based on your description, these services are the best fit.',
    priceRange: {
      min: 149,
      max: 289,
      currency: 'USD',
    },
    cta: {
      label: 'Book service',
      action: 'book_recommended_service',
      payload: {
        source: 'card-gallery',
      },
    },
  },
  {
    id: '0e4f8b5f-4f87-46ba-9e46-77cc247e4f1c',
    type: 'service_fee',
    version: "1",
    title: 'Service Fee Details',
    priority: 'medium',
    amount: 99,
    message: 'We charge a $99 service call fee for the visit, credited toward approved repairs.',
    cta: {
      label: 'Book a visit',
      action: 'book_service_call',
      payload: {
        source: 'card-gallery',
      },
    },
  },
  {
    id: 'b49ac12d-5b50-49d9-9691-9c5ac8de694e',
    type: 'service_fee',
    version: "1",
    title: 'Service Fee Waived',
    priority: 'high',
    amount: 99,
    waived: true,
    message: 'High same-day availability means the $99 visit fee is waived for bookings today.',
    cta: {
      label: 'Lock in waived fee',
      action: 'book_service_call',
      payload: {
        source: 'card-gallery',
      },
    },
  },
];

export default function CardGalleryPage() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const activeCard = useMemo(
    () => sampleCards.find(card => card.id === activeCardId) ?? sampleCards[0],
    [activeCardId]
  );

  const handleAction = (action: string, payload?: Record<string, unknown>) => {
    console.log('[Card Gallery] Action', action, payload);
  };

  const handleDismiss = (cardId: string) => {
    console.log('[Card Gallery] Dismissed', cardId);
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
          <div className="w-full lg:w-1/3">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm shadow-black/5 dark:border-border/80 dark:shadow-black/40">
              <h1 className="text-2xl font-semibold">Card Gallery</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Inspect each recommendation card in isolation across themes.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Theme
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(['light', 'dark'] as ThemeMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTheme(mode)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          theme === mode
                            ? 'border-johnson-blue bg-johnson-blue/10 text-johnson-blue'
                            : 'border-border/60 text-muted-foreground hover:border-johnson-blue/50 hover:text-foreground'
                        }`}
                      >
                        {mode === 'light' ? 'Light' : 'Dark'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cards
                  </p>
                  <div className="mt-2 space-y-2">
                    {sampleCards.map(card => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setActiveCardId(card.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                          activeCard.id === card.id
                            ? 'border-johnson-blue bg-johnson-blue/10 text-johnson-blue'
                            : 'border-border/60 text-muted-foreground hover:border-johnson-blue/50 hover:text-foreground'
                        }`}
                      >
                        <span className="font-medium capitalize">
                          {card.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">{card.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm shadow-black/5 dark:border-border/80 dark:shadow-black/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active card</p>
                  <h2 className="text-xl font-semibold capitalize">
                    {activeCard.type.replace('_', ' ')}
                  </h2>
                </div>
                <div className="text-xs text-muted-foreground">
                  Interactions are logged to the console.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-border/80 bg-muted/40 p-6">
              <CardRenderer
                card={activeCard}
                onAction={handleAction}
                onDismiss={handleDismiss}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
