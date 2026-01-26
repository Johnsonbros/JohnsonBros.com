import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Phone,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { authenticatedFetch, isAuthenticated } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  type: 'job' | 'estimate';
  title: string;
  customerName: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  status: string;
  technicians: Array<{
    id: string;
    name: string;
    colorHex: string;
  }>;
  address: string;
  amount: number;
}

interface CalendarData {
  events: CalendarEvent[];
  employees: Array<{
    id: string;
    name: string;
    colorHex: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  canceled: 'bg-red-100 text-red-800 border-red-300',
  unscheduled: 'bg-gray-100 text-gray-800 border-gray-300',
};

const TYPE_ICONS: Record<string, string> = {
  job: 'J',
  estimate: 'E',
};

export default function AdminCalendar() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  // Calculate week bounds
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  // Format dates for API
  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(weekEnd, 'yyyy-MM-dd');

  // Fetch calendar data
  const { data, isLoading, refetch, isFetching } = useQuery<CalendarData>({
    queryKey: ['admin-calendar', startDate, endDate],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `/api/admin/calendar?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) throw new Error('Failed to fetch calendar');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  // Generate days for the week
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      result.push(addDays(weekStart, i));
    }
    return result;
  }, [weekStart]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    if (!data?.events) return new Map<string, CalendarEvent[]>();

    const map = new Map<string, CalendarEvent[]>();
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      map.set(dayStr, []);
    });

    data.events.forEach(event => {
      const eventDate = format(parseISO(event.startTime), 'yyyy-MM-dd');
      if (map.has(eventDate)) {
        map.get(eventDate)!.push(event);
      }
    });

    // Sort events by start time
    map.forEach((events) => {
      events.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [data?.events, days]);

  const goToPreviousWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-6 w-6 text-johnson-blue" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule Calendar</h1>
              <Badge variant="outline" className="text-xs">
                HCP Mirror
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold min-w-[280px] text-center">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'day')}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-johnson-blue" />
            <span className="ml-2 text-gray-500">Loading calendar...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`text-center py-2 rounded-t-lg ${
                  isSameDay(day, new Date())
                    ? 'bg-johnson-blue text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <div className="text-xs font-medium uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
              </div>
            ))}

            {/* Day Content */}
            {days.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(dayStr) || [];

              return (
                <div
                  key={`content-${day.toISOString()}`}
                  className={`min-h-[400px] bg-white rounded-b-lg border ${
                    isSameDay(day, new Date()) ? 'border-johnson-blue' : 'border-gray-200'
                  }`}
                >
                  <div className="p-2 space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4">
                        No events
                      </div>
                    ) : (
                      dayEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <Card className="mt-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500 text-white">J</Badge>
                <span className="text-sm">Job</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500 text-white">E</Badge>
                <span className="text-sm">Estimate</span>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              {Object.entries(STATUS_COLORS).map(([status, classes]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded border ${classes}`} />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Legend */}
        {data?.employees && data.employees.length > 0 && (
          <Card className="mt-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Technicians</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-4">
                {data.employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: emp.colorHex || '#6366f1' }}
                    />
                    <span className="text-sm">{emp.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const startTime = format(parseISO(event.startTime), 'h:mm a');
  const techColor = event.technicians[0]?.colorHex || '#6366f1';

  return (
    <div
      className={`p-2 rounded border text-xs ${STATUS_COLORS[event.status] || STATUS_COLORS.scheduled}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: techColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Badge
            className={`text-[10px] px-1 py-0 ${
              event.type === 'job' ? 'bg-blue-500' : 'bg-purple-500'
            } text-white`}
          >
            {TYPE_ICONS[event.type]}
          </Badge>
          <span className="font-medium truncate max-w-[100px]">
            {event.customerName}
          </span>
        </div>
        {event.amount > 0 && (
          <span className="text-[10px] font-medium text-green-600">
            ${(event.amount / 100).toFixed(0)}
          </span>
        )}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
        <Clock className="h-3 w-3" />
        {startTime}
      </div>

      {/* Technicians */}
      {event.technicians.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
          <User className="h-3 w-3" />
          {event.technicians.map((t) => t.name.split(' ')[0]).join(', ')}
        </div>
      )}

      {/* Address (truncated) */}
      {event.address && (
        <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{event.address.split(',')[0]}</span>
        </div>
      )}
    </div>
  );
}
