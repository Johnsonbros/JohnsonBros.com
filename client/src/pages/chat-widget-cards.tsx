import { AppointmentCard, QuoteCard, EmergencyCard } from '@/components/chat/SharedChatCards';

export default function ChatWidgetCardsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Chat Widget Card Preview</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sample renderings of the compact cards used inside the Johnson Bros chat widget.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Appointment confirmation
            </h2>
            <AppointmentCard
              data={{
                date: 'Tomorrow · 9:00 AM',
                service: 'General Plumbing',
                address: '124 Main Street, Quincy, MA',
                confirmationNumber: 'JB-10423',
              }}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Service quote
            </h2>
            <QuoteCard
              data={{
                price: '99',
                service: 'Drain Cleaning',
              }}
              onBookNow={() => undefined}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Emergency guidance
            </h2>
            <EmergencyCard />
          </div>
        </div>
      </div>
    </div>
  );
}
