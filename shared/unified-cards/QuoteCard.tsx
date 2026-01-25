import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ExternalLink } from 'lucide-react';
import type { QuoteCardPayload } from './types';

interface QuoteCardProps {
  payload: QuoteCardPayload;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss?: () => void;
}

export function QuoteCard({ payload, onAction, onDismiss }: QuoteCardProps) {
  const handleCta = () => {
    if (payload.cta && onAction) {
      onAction(payload.cta.action, payload.cta.payload);
    }
  };

  return (
    <Card className="w-full border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          {payload.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {payload.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Estimated Range</div>
            <div className="text-lg font-semibold text-emerald-700">
              {payload.range.currency ?? 'USD'} {payload.range.min.toLocaleString()} - {payload.range.max.toLocaleString()}
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            Quote
          </Badge>
        </div>

        {payload.disclaimer && (
          <p className="text-xs text-gray-500 italic">{payload.disclaimer}</p>
        )}

        <div className="flex gap-2">
          {payload.cta && (
            <Button onClick={handleCta} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {payload.cta.label}
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" onClick={onDismiss} className="flex-1 text-gray-500">
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
