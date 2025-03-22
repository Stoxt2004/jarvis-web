// src/lib/services/calendarService.ts
import { CalendarEvent } from '@/types/calendar';
import { toast } from 'sonner';

/**
 * Recupera gli eventi dal database tramite API
 */
export const getEvents = async (workspaceId?: string): Promise<CalendarEvent[]> => {
  try {
    let url = '/api/calendar';
    if (workspaceId) {
      url += `?workspaceId=${workspaceId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Errore nel recupero degli eventi: ${response.status}`);
    }
    
    const events = await response.json();
    
    // Converti le stringhe di date in oggetti Date
    return events.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }));
  } catch (error) {
    console.error('Errore nel caricamento degli eventi:', error);
    toast.error('Impossibile caricare gli eventi');
    return [];
  }
};

/**
 * Recupera un singolo evento per ID
 */
export const getEvent = async (eventId: string): Promise<CalendarEvent | null> => {
  try {
    const response = await fetch(`/api/calendar?id=${eventId}`);
    
    if (!response.ok) {
      throw new Error(`Errore nel recupero dell'evento: ${response.status}`);
    }
    
    const event = await response.json();
    
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    };
  } catch (error) {
    console.error('Errore nel caricamento dell\'evento:', error);
    toast.error('Impossibile caricare l\'evento');
    return null;
  }
};

/**
 * Salva un evento nel database
 */
export const saveEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  try {
    const method = event.id ? 'PUT' : 'POST';
    const url = '/api/calendar';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      throw new Error(`Errore nel salvataggio dell'evento: ${response.status}`);
    }
    
    const savedEvent = await response.json();
    
    toast.success(event.id ? 'Evento aggiornato con successo' : 'Evento creato con successo');
    
    return {
      ...savedEvent,
      start: new Date(savedEvent.start),
      end: new Date(savedEvent.end)
    };
  } catch (error) {
    console.error('Errore nel salvare l\'evento:', error);
    toast.error('Impossibile salvare l\'evento');
    throw error;
  }
};

/**
 * Elimina un evento dal database
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/calendar?id=${eventId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Errore nell'eliminazione dell'evento: ${response.status}`);
    }
    
    toast.success('Evento eliminato con successo');
  } catch (error) {
    console.error('Errore nell\'eliminare l\'evento:', error);
    toast.error('Impossibile eliminare l\'evento');
    throw error;
  }
};

// Funzione helper per ottenere gli eventi da un intervallo di date
export const getEventsByDateRange = async (
  start: Date, 
  end: Date, 
  workspaceId?: string
): Promise<CalendarEvent[]> => {
  const events = await getEvents(workspaceId);
  
  return events.filter(event => 
    (event.start >= start && event.start <= end) || 
    (event.end >= start && event.end <= end) ||
    (event.start <= start && event.end >= end)
  );
};

// Funzione per verificare se ci sono eventi in un giorno specifico
export const hasEventsOnDay = async (day: Date, workspaceId?: string): Promise<boolean> => {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  
  const events = await getEventsByDateRange(start, end, workspaceId);
  return events.length > 0;
};