import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Sun, Sunrise, Sunset, Moon, Check, Loader2, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { TimePickerCard as TimePickerCardType } from '@/lib/cardProtocol';

interface TimeSlot {
  id: string;
  label: string;
  timeWindow: 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING';
  startTime?: string;
  endTime?: string;
  available: boolean;
  technicianCount?: number;
}

interface TimePickerCardProps {
  card: TimePickerCardType;
  onSelectSlot: (slotId: string, timeWindow: string) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

const TIME_WINDOW_CONFIG = {
  MORNING: {
    icon: Sunrise,
    label: 'Morning',
    timeRange: '7:00 AM - 12:00 PM',
    gradient: 'from-amber-50 to-orange-50',
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-200',
    selectedBg: 'bg-amber-500',
  },
  MIDDAY: {
    icon: Sun,
    label: 'Midday',
    timeRange: '11:00 AM - 2:00 PM',
    gradient: 'from-yellow-50 to-amber-50',
    iconColor: 'text-yellow-500',
    borderColor: 'border-yellow-200',
    selectedBg: 'bg-yellow-500',
  },
  AFTERNOON: {
    icon: Sunset,
    label: 'Afternoon',
    timeRange: '12:00 PM - 5:00 PM',
    gradient: 'from-orange-50 to-rose-50',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-200',
    selectedBg: 'bg-orange-500',
  },
  EVENING: {
    icon: Moon,
    label: 'Evening',
    timeRange: '5:00 PM - 9:00 PM',
    gradient: 'from-indigo-50 to-purple-50',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-200',
    selectedBg: 'bg-indigo-500',
  },
};

export function TimePickerCard({ card, onSelectSlot, onDismiss, isLoading }: TimePickerCardProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(card.selectedSlot || null);

  // Sync selected slot with card prop when it changes
  useEffect(() => {
    setSelectedSlotId(card.selectedSlot || null);
  }, [card.selectedSlot]);

  const formattedDate = card.selectedDate
    ? format(parseISO(card.selectedDate), 'EEEE, MMMM d')
    : 'Selected Date';

  const handleSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlotId(slot.id);
    onSelectSlot(slot.id, slot.timeWindow);
  };

  const defaultSlots: TimeSlot[] = [
    { id: 'morning', label: 'Morning', timeWindow: 'MORNING', available: true, technicianCount: 2 },
    { id: 'midday', label: 'Midday', timeWindow: 'MIDDAY', available: true, technicianCount: 1 },
    { id: 'afternoon', label: 'Afternoon', timeWindow: 'AFTERNOON', available: true, technicianCount: 3 },
    { id: 'evening', label: 'Evening', timeWindow: 'EVENING', available: false, technicianCount: 0 },
  ];

  const slots = card.slots || defaultSlots;

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          {card.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {card.message || `Select a time window for ${formattedDate}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.map((slot) => {
          const config = TIME_WINDOW_CONFIG[slot.timeWindow];
          const Icon = config.icon;
          const isSelected = selectedSlotId === slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => handleSelect(slot)}
              disabled={!slot.available || isLoading}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? `${config.selectedBg} text-white border-transparent shadow-lg scale-[1.02]`
                  : slot.available
                    ? `bg-gradient-to-r ${config.gradient} ${config.borderColor} hover:shadow-md hover:scale-[1.01]`
                    : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm'}
                  `}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : config.iconColor}`} />
                  </div>
                  <div>
                    <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {slot.label}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {slot.startTime && slot.endTime 
                        ? `${slot.startTime} - ${slot.endTime}`
                        : config.timeRange
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {slot.available && slot.technicianCount !== undefined && slot.technicianCount > 0 && (
                    <div className={`
                      flex items-center gap-1 text-xs px-2 py-1 rounded-full
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-600'}
                    `}>
                      <Users className="w-3 h-3" />
                      {slot.technicianCount}
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <Check className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                  )}
                  
                  {!slot.available && (
                    <span className="text-xs text-gray-400">Unavailable</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Checking availability...</span>
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
