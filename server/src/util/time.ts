// Time utilities for timezone handling
export const TIMEZONE = process.env.TZ || 'America/New_York';

export function getNowInTZ(): Date {
  return new Date();
}

export function getStartOfDayInTZ(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  
  const startOfDay = new Date(date);
  startOfDay.setFullYear(year, month, day);
  startOfDay.setHours(0, 0, 0, 0);
  
  return startOfDay;
}

export function getEndOfDayInTZ(date: Date = new Date()): Date {
  const startOfDay = getStartOfDayInTZ(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function getTomorrowInTZ(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function formatTimeInTZ(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMinutesFromTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function parseWindowTime(windowStr: string): { start: Date; end: Date } {
  // Parse format like "9:00 AM - 11:00 AM"
  const [startStr, endStr] = windowStr.split(' - ');
  const today = new Date();
  
  const parseTime = (timeStr: string): Date => {
    const [time, period] = timeStr.trim().split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    const result = new Date(today);
    result.setHours(hour24, minutes, 0, 0);
    return result;
  };
  
  return {
    start: parseTime(startStr),
    end: parseTime(endStr),
  };
}