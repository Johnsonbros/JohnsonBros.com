import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, User, Phone, MapPin, Check, Loader2 } from 'lucide-react';
import type { ReturningCustomerLookupCard as ReturningCustomerLookupCardType } from '@/lib/cardProtocol';

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
}

interface ReturningCustomerLookupCardProps {
  card: ReturningCustomerLookupCardType;
  onSearch: (query: string) => void;
  onSelectCustomer: (customer: CustomerResult) => void;
  onNewCustomer: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function ReturningCustomerLookupCard({
  card,
  onSearch,
  onSelectCustomer,
  onNewCustomer,
  onDismiss,
  isLoading,
}: ReturningCustomerLookupCardProps) {
  const [searchValue, setSearchValue] = useState(card.searchValue || '');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const handleSelect = (customer: CustomerResult) => {
    setSelectedId(customer.id);
    onSelectCustomer(customer);
  };

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          {card.title}
        </CardTitle>
        {card.message && (
          <CardDescription className="text-sm text-gray-600">
            {card.message}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Phone or email..."
              className="pl-10"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading || !searchValue.trim()}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {card.results && card.results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Found {card.results.length} customer{card.results.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {card.results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedId === customer.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {customer.address}
                        </div>
                      )}
                    </div>
                    {selectedId === customer.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {card.results && card.results.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3">No customers found</p>
            <Button
              onClick={onNewCustomer}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <User className="w-4 h-4 mr-2" />
              Create New Customer
            </Button>
          </div>
        )}

        {!card.results && (
          <div className="text-center py-2">
            <Button
              onClick={onNewCustomer}
              variant="link"
              className="text-blue-600"
            >
              I'm a new customer
            </Button>
          </div>
        )}

        {onDismiss && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onDismiss} className="text-gray-500">
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
