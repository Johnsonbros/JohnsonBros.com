// Time utilities for Eastern Time formatting
// HARDCODED to Eastern Time for all customer-facing displays
export const TIMEZONE = 'America/New_York';

export function formatTimeEST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST';
}

export function formatDateTimeEST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' EST';
}

export function formatDateEST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getCurrentTimeEST(): string {
  return formatTimeEST(new Date());
}

// Convert 24-hour time to 12-hour format with AM/PM
export function convert24to12Hour(time24: string): string {
  // Handle time strings like "15:00" or "9:00"
  const [hours, minutes] = time24.split(':').map(num => parseInt(num, 10));
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Format time window like "9:00 AM - 11:00 AM"
export function formatTimeWindowEST(startTime: string, endTime: string): string {
  const start12 = convert24to12Hour(startTime);
  const end12 = convert24to12Hour(endTime);
  return `${start12} - ${end12}`;
}