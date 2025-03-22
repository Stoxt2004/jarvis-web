export interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    reminder: boolean;
    reminderTime: number; // minuti prima
    color?: string;
  }
  
  export type CalendarView = 'month' | 'week' | 'day' | 'agenda';
  