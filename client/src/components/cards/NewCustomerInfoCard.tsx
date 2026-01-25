import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import type { NewCustomerInfoCard as NewCustomerInfoCardType } from '@/lib/cardProtocol';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface NewCustomerInfoCardProps {
  card: NewCustomerInfoCardType;
  onSubmit: (data: CustomerFormData) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function NewCustomerInfoCard({ card, onSubmit, onDismiss, isLoading }: NewCustomerInfoCardProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: card.prefill?.firstName || '',
    lastName: card.prefill?.lastName || '',
    phone: card.prefill?.phone || '',
    email: card.prefill?.email || '',
    address: {
      line1: card.prefill?.address?.line1 || '',
      line2: card.prefill?.address?.line2 || '',
      city: card.prefill?.address?.city || '',
      state: card.prefill?.address?.state || 'MA',
      zip: card.prefill?.address?.zip || '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const updateField = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: keyof CustomerFormData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                placeholder="(617) 555-1234"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-gray-700">
              Email (optional)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-blue-600" />
              Service Address
            </div>
            
            <div className="space-y-1.5">
              <Input
                value={formData.address.line1}
                onChange={(e) => updateAddress('line1', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Input
                value={formData.address.line2}
                onChange={(e) => updateAddress('line2', e.target.value)}
                placeholder="Apt/Unit (optional)"
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-3 space-y-1.5">
                <Input
                  value={formData.address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  placeholder="City"
                  required
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Input
                  value={formData.address.state}
                  onChange={(e) => updateAddress('state', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="MA"
                  maxLength={2}
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Input
                  value={formData.address.zip}
                  onChange={(e) => updateAddress('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="02169"
                  maxLength={5}
                  required
                />
              </div>
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
                  Saving...
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
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
