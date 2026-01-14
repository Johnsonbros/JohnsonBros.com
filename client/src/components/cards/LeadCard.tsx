import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Phone, MessageSquare, Loader2 } from 'lucide-react';
import type { LeadCard as LeadCardType } from '@/lib/cardProtocol';

interface LeadCardProps {
  card: LeadCardType;
  onSubmit: (data: { name: string; phone: string; issueDescription: string }) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function LeadCard({ card, onSubmit, onDismiss, isLoading }: LeadCardProps) {
  const [name, setName] = useState(card.prefill?.name || '');
  const [phone, setPhone] = useState(card.prefill?.phone || '');
  const [issueDescription, setIssueDescription] = useState(card.prefill?.issueDescription || '');

  // Sync state with prefill props when they change
  useEffect(() => {
    if (card.prefill?.name !== undefined) {
      setName(card.prefill.name);
    }
  }, [card.prefill?.name]);

  useEffect(() => {
    if (card.prefill?.phone !== undefined) {
      setPhone(card.prefill.phone);
    }
  }, [card.prefill?.phone]);

  useEffect(() => {
    if (card.prefill?.issueDescription !== undefined) {
      setIssueDescription(card.prefill.issueDescription);
    }
  }, [card.prefill?.issueDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, phone, issueDescription });
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          {card.title}
        </CardTitle>
        {card.message && (
          <CardDescription className="text-sm text-gray-600">
            {card.message}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Your Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(617) 555-1234"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue" className="text-sm font-medium text-gray-700">
              What do you need a quote on?
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Textarea
                id="issue"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe what you'd like a quote for..."
                className="pl-10 min-h-[80px] resize-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Continue'
              )}
            </Button>
            {onDismiss && (
              <Button
                type="button"
                variant="ghost"
                onClick={onDismiss}
                className="text-gray-500"
              >
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
