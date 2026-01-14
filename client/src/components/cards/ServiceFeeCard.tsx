import { useQuery } from '@tanstack/react-query';
import { BadgeDollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ServiceFeeCard as ServiceFeeCardType } from '@/lib/cardProtocol';

interface CapacityData {
  overall: {
    state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY';
  };
}

interface ServiceFeeCardProps {
  card: ServiceFeeCardType;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss?: () => void;
}

export function ServiceFeeCard({ card, onAction, onDismiss }: ServiceFeeCardProps) {
  const { data: capacity } = useQuery<CapacityData>({
    queryKey: ['/api/v1/capacity/today'],
    refetchOnWindowFocus: true,
  });

  const amount = card.amount ?? 99;
  const isFeeWaived = card.waived ?? capacity?.overall.state === 'SAME_DAY_FEE_WAIVED';

  const message = card.message ?? (isFeeWaived
    ? "Today's availability lets us waive the $99 visit fee when you book now."
    : 'A licensed technician will assess the issue and the fee is credited toward repairs you approve.');

  return (
    <Card
      className={cn(
        'relative w-full overflow-hidden border shadow-lg',
        isFeeWaived
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
          : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/40'
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -bottom-10 left-0 right-0 h-16 blur-2xl',
          isFeeWaived ? 'bg-emerald-200/60' : 'bg-blue-200/50'
        )}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                isFeeWaived ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              )}
            >
              <BadgeDollarSign className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                {card.title}
              </CardTitle>
              <p className="text-xs text-gray-500">Service call pricing</p>
            </div>
          </div>
          {isFeeWaived && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <Sparkles className="mr-1 h-3 w-3" />
              Fee waived
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3',
            isFeeWaived ? 'border-emerald-200 bg-emerald-50/60' : 'border-blue-200 bg-white'
          )}
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">Visit Service Fee</p>
            <p className="text-xs text-gray-500">Applies to each service visit</p>
          </div>
          <div className="text-right">
            {isFeeWaived ? (
              <>
                <p className="text-xs font-semibold uppercase text-emerald-600">Waived today</p>
                <p className="text-2xl font-bold text-emerald-600">FREE</p>
                <p className="text-xs text-gray-400 line-through">${amount}</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-blue-600">${amount}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600">{message}</p>

        <ul className="space-y-2 text-xs text-gray-500">
          {isFeeWaived ? (
            <>
              <li>High same-day capacity means no service fee today.</li>
              <li>Book now to lock in the waived visit fee.</li>
            </>
          ) : (
            <>
              <li>Includes expert diagnosis and repair recommendations.</li>
              <li>The $99 fee is credited toward approved repairs.</li>
            </>
          )}
        </ul>

        {card.cta && onAction && (
          <Button
            className={cn(
              'w-full',
              isFeeWaived ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            )}
            onClick={() => onAction(card.cta.action, card.cta.payload)}
          >
            {card.cta.label}
          </Button>
        )}

        {onDismiss && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-gray-500">
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
