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

// Format time window like "9:00 AM - 11:00 AM EST"
export function formatTimeWindowEST(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime} EST`;
}