export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseInputDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

export function adjustDateForWeekends(date: Date): Date {
  const adjustedDate = new Date(date);
  
  while (isWeekend(adjustedDate)) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
}

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }
  
  return result;
}

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let businessDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

export function getNextMonday(date: Date): Date {
  const nextMonday = new Date(date);
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) { // Sunday
    nextMonday.setDate(date.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    nextMonday.setDate(date.getDate() + 2);
  }
  
  return nextMonday;
}

export function createDateRange(startDate: Date, endDate: Date, scale: 'Day' | 'Week' | 'Month' = 'Day'): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    
    switch (scale) {
      case 'Day':
        current.setDate(current.getDate() + 1);
        break;
      case 'Week':
        current.setDate(current.getDate() + 7);
        break;
      case 'Month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }
  
  return dates;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeek = getWeekNumber(firstDay);
  const lastWeek = getWeekNumber(lastDay);
  
  return lastWeek - firstWeek + 1;
}

export function getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
