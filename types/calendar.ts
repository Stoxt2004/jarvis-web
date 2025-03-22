// src/types/calendar.ts
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
  workspaceId?: string; // Aggiunto per supportare gli eventi specifici per workspace
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';