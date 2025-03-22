import { CalendarEvent } from '@/types/calendar';
import { generateUniqueId } from '@/utils/calendarHelpers';

// Chiave per lo storage locale
const STORAGE_KEY = 'calendar_events';

// Carica gli eventi dal localStorage
export const getEvents = (): Promise<CalendarEvent[]> => {
  return new Promise((resolve) => {
    try {
      const storedEvents = localStorage.getItem(STORAGE_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        // Converti le stringhe di date in oggetti Date
        const parsedEvents = events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        resolve(parsedEvents);
      } else {
        resolve([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento degli eventi:', error);
      resolve([]);
    }
  });
};

// Salva un evento
export const saveEvent = (event: CalendarEvent): Promise<CalendarEvent> => {
  return new Promise(async (resolve, reject) => {
    try {
      const events = await getEvents();
      
      let updatedEvent: CalendarEvent;
      let updatedEvents: CalendarEvent[];
      
      if (event.id) {
        // Aggiorna un evento esistente
        updatedEvent = { ...event };
        updatedEvents = events.map(e => e.id === event.id ? updatedEvent : e);
      } else {
        // Crea un nuovo evento
        updatedEvent = { ...event, id: generateUniqueId() };
        updatedEvents = [...events, updatedEvent];
      }
      
      // Salva nel localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
      
      resolve(updatedEvent);
    } catch (error) {
      console.error('Errore nel salvare l\'evento:', error);
      reject(error);
    }
  });
};

// Elimina un evento
export const deleteEvent = (eventId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const events = await getEvents();
      const updatedEvents = events.filter(e => e.id !== eventId);
      
      // Salva nel localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
      
      resolve();
    } catch (error) {
      console.error('Errore nell\'eliminare l\'evento:', error);
      reject(error);
    }
  });
};

// Integrazione con Google Calendar (simulata)
export const syncWithGoogleCalendar = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Qui implementeresti la vera integrazione con l'API di Google Calendar
    console.log('Sincronizzazione con Google Calendar...');
    setTimeout(() => {
      resolve(true);
    }, 1500);
  });
};

// Integrazione con Outlook (simulata)
export const syncWithOutlook = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Qui implementeresti la vera integrazione con l'API di Outlook
    console.log('Sincronizzazione con Outlook...');
    setTimeout(() => {
      resolve(true);
    }, 1500);
  });
};
