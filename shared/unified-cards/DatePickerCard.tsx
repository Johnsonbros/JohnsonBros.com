import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { addDays, addWeeks, format, isToday, isTomorrow, startOfWeek } from 'date-fns';
import type { DatePickerCardPayload } from './types';

interface DatePickerCardProps {
  payload: DatePickerCardPayload;
  onSelectDate: (date: string) => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function DatePickerCard({ payload, onSelectDate, onDismiss, isLoading }: DatePickerCardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(payload.selectedDate || null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    setSelectedDate(payload.selectedDate || null);
  }, [payload.selectedDate]);

  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const availabilityMap = new Map(
    payload.availableDates?.map((dateEntry) => [dateEntry.date, dateEntry]) || []
  );

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = availabilityMap.get(dateStr);

    if (!availability) return { available: false, state: null, slots: 0 };

    return {
      available: (availability.slotsAvailable ?? 0) > 0,
      state: availability.capacityState ?? null,
      slots: availability.slotsAvailable ?? 0,
    };
  };

  const handleSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = getDateStatus(date);
    if (!status.available) return;

    setSelectedDate(dateStr);
    onSelectDate(dateStr);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  };

  return (
    <Card className="w-full border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          {payload.title}
        </CardTitle>
        {payload.message && (
          <CardDescription className="text-sm text-gray-600">
            {payload.message}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 3}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const status = getDateStatus(date);
            const isSelected = selectedDate === dateStr;
            const isPast = date < today && !isToday(date);

            return (
              <button
                key={dateStr}
                onClick={() => handleSelect(date)}
                disabled={!status.available || isPast || isLoading}
                className={`
                  relative flex flex-col items-center p-2 rounded-lg transition-all
                  ${isSelected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : status.available && !isPast
                      ? 'bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span className={`text-[10px] uppercase font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {getDateLabel(date)}
                </span>
                <span className={`text-lg font-semibold ${isSelected ? 'text-white' : ''}`}>
                  {format(date, 'd')}
                </span>

                {status.state === 'SAME_DAY_FEE_WAIVED' && status.available && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-yellow-400' : 'bg-green-500'}`}>
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {status.available && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                    {status.slots} slot{status.slots !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 justify-center pt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-white" />
            </div>
            <span>Fee waived</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span>Unavailable</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Loading availability...</span>
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
