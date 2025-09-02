// Time utilities for timezone handling
// HARDCODED to Eastern Time for all customer-facing displays
export const TIMEZONE = 'America/New_York'; // Always use Eastern Time (EST/EDT)

export function getNowInTZ(): Date {
  return new Date();
}

export function getStartOfDayInTZ(date: Date = new Date()): Date {
  // Get the date string in EST/EDT
  const estDateStr = date.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the date string and create a new Date at midnight EST/EDT
  const [month, day, year] = estDateStr.split('/');
  
  // Create a date string at midnight EST/EDT
  const midnightESTStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
  
  // Convert to a Date object using the EST timezone
  const startOfDay = new Date(midnightESTStr + '-05:00'); // Default to EST
  
  // Adjust for DST if necessary
  const testDate = new Date(midnightESTStr);
  const isDST = testDate.getTimezoneOffset() < new Date(testDate.getFullYear(), 0, 1).getTimezoneOffset();
  if (isDST) {
    return new Date(midnightESTStr + '-04:00'); // EDT
  }
  
  return startOfDay;
}

export function getEndOfDayInTZ(date: Date = new Date()): Date {
  const startOfDay = getStartOfDayInTZ(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function getTomorrowInTZ(): Date {
  // Get current date in EST/EDT
  const now = new Date();
  const estDateStr = now.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse and add one day
  const [month, day, year] = estDateStr.split('/');
  const estDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
  estDate.setDate(estDate.getDate() + 1);
  
  return estDate;
}

export function formatTimeInTZ(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST';
}

export function formatDateTimeInTZ(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST';
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