import { Calculator, DollarSign, Info, Check, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

interface Service {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  popular?: boolean;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface PricingCalculatorProps {
  onBookService: (estimate?: number) => void;
  services?: Service[];
  addons?: Addon[];
  emergencyFee?: number;
  showComparison?: boolean;
}

const defaultServices: Service[] = [
  { id: 'drain', name: 'Drain Cleaning', basePrice: 199, description: 'Clear clogs and blockages', popular: true },
  { id: 'leak', name: 'Leak Repair', basePrice: 249, description: 'Fix leaks and drips' },
  { id: 'water-heater', name: 'Water Heater Service', basePrice: 399, description: 'Repair or maintenance' },
  { id: 'toilet', name: 'Toilet Repair', basePrice: 179, description: 'Fix running or broken toilets' },
  { id: 'pipe', name: 'Pipe Repair/Replace', basePrice: 599, description: 'Fix or replace pipes' },
];

const defaultAddons: Addon[] = [
  { id: 'emergency', name: 'Emergency Service', price: 99, description: 'Same-day priority service' },
  { id: 'warranty', name: 'Extended Warranty', price: 49, description: '1-year parts and labor' },
  { id: 'inspection', name: 'Full Inspection', price: 79, description: 'Complete plumbing check' },
  { id: 'prevention', name: 'Preventive Treatment', price: 39, description: 'Prevent future issues' },
];

export function PricingCalculator({
  onBookService,
  services = defaultServices,
  addons = defaultAddons,
  emergencyFee = 99,
  showComparison = true
}: PricingCalculatorProps) {
  const [selectedService, setSelectedService] = useState<string>(services[0]?.id || '');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [complexity, setComplexity] = useState([1]); // 1-3 scale
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [savings, setSavings] = useState(0);

  // Calculate pricing
  useEffect(() => {
    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    let basePrice = service.basePrice;
    
    // Apply complexity multiplier
    const complexityMultiplier = 1 + (complexity[0] - 1) * 0.25; // 1x, 1.25x, 1.5x
    basePrice = basePrice * complexityMultiplier;

    // Add selected addons
    const addonsTotal = selectedAddons.reduce((sum, addonId) => {
      const addon = addons.find(a => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    const calculatedSubtotal = basePrice + addonsTotal;
    setSubtotal(calculatedSubtotal);

    // Calculate savings (example: 10% off for online booking)
    const calculatedSavings = calculatedSubtotal * 0.1;
    setSavings(calculatedSavings);

    setTotal(calculatedSubtotal - calculatedSavings + emergencyFee);
  }, [selectedService, selectedAddons, complexity, services, addons, emergencyFee]);

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const competitorPrice = Math.round(total * 1.35); // Show competitor as 35% more expensive

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-johnson-blue text-white">
            <Calculator className="h-3 w-3 mr-1" />
            INSTANT ESTIMATE
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Calculate Your Service Cost
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get an instant estimate for your plumbing service. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Calculator Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Service Selection */}
              <div className="mb-6">
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-johnson-blue">1.</span> Select Your Service
                </Label>
                <RadioGroup value={selectedService} onValueChange={setSelectedService}>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`relative flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedService === service.id ? 'border-johnson-blue bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem value={service.id} id={service.id} />
                        <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{service.name}</span>
                              {service.popular && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Popular
                                </Badge>
                              )}
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-lg text-johnson-blue">
                              ${service.basePrice}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Separator className="my-6" />

              {/* Complexity Slider */}
              <div className="mb-6">
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-johnson-blue">2.</span> Job Complexity
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adjust based on the severity of your issue</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={complexity}
                    onValueChange={setComplexity}
                    min={1}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Simple</span>
                    <span>Moderate</span>
                    <span>Complex</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Add-ons */}
              <div className="mb-6">
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-johnson-blue">3.</span> Additional Services (Optional)
                </Label>
                <div className="space-y-3">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedAddons.includes(addon.id) ? 'border-johnson-blue bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{addon.name}</span>
                            {addon.description && (
                              <p className="text-sm text-gray-600">{addon.description}</p>
                            )}
                          </div>
                          <span className="font-bold text-johnson-blue">+${addon.price}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Estimate</h3>
              
              {/* Selected Service */}
              {selectedServiceData && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{selectedServiceData.name}</span>
                    <span className="font-medium">${(selectedServiceData.basePrice * (1 + (complexity[0] - 1) * 0.25)).toFixed(2)}</span>
                  </div>
                  
                  {/* Selected Addons */}
                  {selectedAddons.map(addonId => {
                    const addon = addons.find(a => a.id === addonId);
                    if (!addon) return null;
                    return (
                      <div key={addon.id} className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 ml-4">+ {addon.name}</span>
                        <span className="text-sm font-medium">${addon.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator className="my-4" />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Online Booking Discount</span>
                  <span>-${savings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">${emergencyFee}</span>
                    <Badge variant="secondary" className="text-xs">Waivable</Badge>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-gray-900">Estimated Total</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-johnson-blue">${total.toFixed(2)}</div>
                  <p className="text-xs text-green-600">You save ${savings.toFixed(2)}</p>
                </div>
              </div>

              {/* Competitor Comparison */}
              {showComparison && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Competitor Average</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm line-through text-gray-500">${competitorPrice}</span>
                      <Badge className="ml-2 bg-green-600 text-white text-xs">
                        Save {Math.round(((competitorPrice - total) / competitorPrice) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <Button
                onClick={() => {
                  sessionStorage.setItem('pricing_estimate', JSON.stringify({
                    service: selectedServiceData,
                    addons: selectedAddons.map(id => addons.find(a => a.id === id)),
                    total,
                    savings
                  }));
                  onBookService(total);
                }}
                className="w-full bg-johnson-orange hover:bg-orange-600 font-bold shadow-lg"
                size="lg"
              >
                Book This Service • ${total.toFixed(2)}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Final price confirmed after inspection
              </p>

              {/* Trust Badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  No hidden fees
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  Price match guarantee
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  100% satisfaction guaranteed
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}