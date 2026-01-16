import { useState } from 'react';
import { format, addDays, addWeeks, startOfWeek, isToday, isTomorrow } from 'date-fns';
import { callTool, sendFollowUp, useWidgetState } from '../hooks/useOpenAiGlobal';
import type { DatePickerToolOutput, DatePickerAvailability } from '../types';

interface DatePickerCardProps {
  data: DatePickerToolOutput;
}

interface DatePickerState {
  selectedDate: string | null;
  weekOffset: number;
}

export function DatePickerCard({ data }: DatePickerCardProps) {
  const [state, setState] = useWidgetState<DatePickerState>({
    selectedDate: data.selectedDate || null,
    weekOffset: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, state?.weekOffset || 0), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const availabilityMap = new Map<string, DatePickerAvailability>(
    data.availableDates?.map((d) => [d.date, d]) || []
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

  const handleSelect = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = getDateStatus(date);
    if (!status.available) return;

    setState({ ...state!, selectedDate: dateStr });
    setIsSubmitting(true);

    try {
      await callTool('search_availability', {
        date: dateStr,
        serviceType: data.serviceType || 'general_plumbing',
      });
      await sendFollowUp(`I'd like to book for ${format(date, 'EEEE, MMMM d, yyyy')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  };

  const getCapacityBadge = (capacityState: string | null) => {
    switch (capacityState) {
      case 'SAME_DAY_FEE_WAIVED':
        return <span className="text-xs text-green-600 font-medium">Fee Waived!</span>;
      case 'LIMITED_SAME_DAY':
        return <span className="text-xs text-orange-600 font-medium">Limited</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      {data.message && (
        <p className="text-sm text-gray-600 mb-4">{data.message}</p>
      )}

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setState({ ...state!, weekOffset: Math.max(0, (state?.weekOffset || 0) - 1) })}
          disabled={(state?.weekOffset || 0) === 0}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setState({ ...state!, weekOffset: (state?.weekOffset || 0) + 1 })}
          disabled={(state?.weekOffset || 0) >= 3}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const status = getDateStatus(date);
          const isSelected = state?.selectedDate === dateStr;
          const isPast = date < today && !isToday(date);

          return (
            <button
              key={dateStr}
              onClick={() => handleSelect(date)}
              disabled={!status.available || isPast || isSubmitting}
              className={`
                flex flex-col items-center p-2 rounded-lg text-center transition-all
                ${isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' : ''}
                ${status.available && !isPast && !isSelected ? 'bg-blue-50 hover:bg-blue-100 text-gray-900' : ''}
                ${!status.available || isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-xs font-medium">{getDateLabel(date)}</span>
              <span className="text-lg font-bold">{format(date, 'd')}</span>
              {status.available && getCapacityBadge(status.state)}
              {status.available && status.slots > 0 && (
                <span className="text-xs opacity-75">{status.slots} slots</span>
              )}
            </button>
          );
        })}
      </div>

      {isSubmitting && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading available times...</span>
        </div>
      )}
    </div>
  );
}
