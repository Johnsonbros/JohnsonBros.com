import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Phone, Siren, ExternalLink } from 'lucide-react';
import type { EmergencyInstructionsCardPayload } from './types';

interface EmergencyInstructionsCardProps {
  payload: EmergencyInstructionsCardPayload;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss?: () => void;
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function EmergencyInstructionsCard({ payload, onAction, onDismiss }: EmergencyInstructionsCardProps) {
  const severity = payload.severity ?? 'high';
  const badgeTone = severity === 'critical' ? 'destructive' : 'secondary';

  const handleCta = () => {
    if (payload.cta && onAction) {
      onAction(payload.cta.action, payload.cta.payload);
    }
  };

  return (
    <Card className="w-full border-red-200 bg-gradient-to-br from-white to-red-50/40 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Siren className="w-4 h-4 text-red-600" />
          </div>
          {payload.title}
          <Badge variant={badgeTone} className="ml-auto">
            {SEVERITY_LABELS[severity] ?? 'Alert'}
          </Badge>
        </CardTitle>
        {payload.message && (
          <CardDescription className="text-sm text-gray-600">
            {payload.message}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={severity === 'critical' ? 'destructive' : 'default'}>
          <AlertTitle>Immediate steps</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {payload.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {(payload.contactPhone || payload.contactLabel) && (
          <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-red-500" />
            <span className="font-medium">{payload.contactLabel ?? 'Call immediately'}:</span>
            <span>{payload.contactPhone ?? '911'}</span>
          </div>
        )}

        <div className="flex gap-2">
          {payload.cta && (
            <Button onClick={handleCta} className="flex-1 bg-red-600 hover:bg-red-700">
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
