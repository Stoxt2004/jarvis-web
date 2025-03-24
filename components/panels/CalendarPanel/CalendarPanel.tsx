"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSession } from 'next-auth/react';
import EventForm from './EventForm';
import EventDetails from './EventDetails';
import CalendarToolbar from './CalendarToolbar';
import ReminderModal from './ReminderModal';
import { saveEvent, getEvents, deleteEvent } from '@/lib/services/calendarService';
import { Panel as PanelType } from '@/lib/store/workspaceStore';
import { CalendarEvent, CalendarView } from '@/types/calendar';
import { toast } from 'sonner';

// Configurazione del localizzatore per le date
const localizer = momentLocalizer(moment);

// Stili coerenti con HomeClient
const styles = {
  calendarPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1A1A2E', // surface color from HomeClient
    color: '#FFFFFF', // text color from HomeClient
    borderRadius: '8px',
    overflow: 'hidden'
  },
  calendarContainer: {
    flex: 1,
    padding: '0 16px 16px',
  },
  calendarEvent: {
    backgroundColor: '#A78BFA', // secondary color from HomeClient
    color: '#FFFFFF',
    borderRadius: '4px',
    padding: '2px 4px',
  }
};

interface CalendarPanelProps {
  panel: PanelType;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ panel }) => {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recupera gli eventi all'avvio e quando cambia la sessione utente
  useEffect(() => {
    const fetchEvents = async () => {
      if (session?.user?.id) {
        setIsLoading(true);
        try {
          // Usa il workspaceId dal content del panel, se disponibile
          const workspaceId = panel.content?.workspaceId || undefined;
          const fetchedEvents = await getEvents(workspaceId);
          setEvents(fetchedEvents);
        } catch (error) {
          console.error("Errore nel recupero degli eventi:", error);
          toast.error("Unable to load events");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchEvents();
  }, [session, panel.content]);
  
  // Aggiorna il titolo del pannello quando cambia la vista
  useEffect(() => {
    if (panel && panel.id) {
      const viewName = view.charAt(0).toUpperCase() + view.slice(1);
      // Qui dovresti utilizzare la funzione appropriata del tuo store per aggiornare il titolo
      // Ad esempio: updatePanelTitle(panel.id, `Calendario - Vista ${viewName}`);
      
      // Poiché non abbiamo accesso diretto alla funzione updatePanelTitle,
      // questa parte andrà implementata quando sarà disponibile nel componente
    }
  }, [view, panel]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsAddingEvent(false);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save events");
      return;
    }
    
    setSelectedEvent({
      id: undefined, // Sarà generato dal server
      title: '',
      description: '',
      location: '',
      start,
      end,
      reminder: false,
      reminderTime: 15,
      // Includi il workspaceId dal panel se disponibile
      workspaceId: panel.content?.workspaceId,
    });
    setIsAddingEvent(true);
  };

  const handleSaveEvent = async (eventData: CalendarEvent) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save events");
      return;
    }
    
    try {
      // Assicurati che il workspaceId sia incluso
      const eventToSave = {
        ...eventData,
        workspaceId: panel.content?.workspaceId || eventData.workspaceId
      };
      
      const savedEvent = await saveEvent(eventToSave);
      
      // Aggiorna la lista eventi locale
      if (eventData.id) {
        // Aggiornamento evento esistente
        setEvents(events.map(e => e.id === eventData.id ? savedEvent : e));
      } else {
        // Nuovo evento
        setEvents([...events, savedEvent]);
      }
      
      setSelectedEvent(null);
      setIsAddingEvent(false);
      
      // Se l'evento ha un promemoria, gestiscilo
      if (savedEvent.reminder) {
        scheduleReminder(savedEvent);
      }
    } catch (error) {
      console.error('Errore nel salvare l\'evento:', error);
      toast.error("Unable to save the event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to delete events");
      return;
    }
    
    try {
      await deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Errore nell\'eliminare l\'evento:', error);
      toast.error("Unable to delete the event");
    }
  };

  const scheduleReminder = (event: CalendarEvent): NodeJS.Timeout | undefined => {
    const reminderTime = new Date(event.start.getTime() - (event.reminderTime * 60 * 1000));
    const now = new Date();
    
    if (reminderTime > now) {
      const timeoutId = setTimeout(() => {
        setShowReminderModal(true);
        // Passa l'evento corrente al modal del promemoria
        setSelectedEvent(event);
      }, reminderTime.getTime() - now.getTime());
      
      // Salva l'ID del timeout per poterlo cancellare se necessario
      return timeoutId;
    }
    return undefined;
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  // Mostra un indicatore di caricamento
  if (isLoading) {
    return (
      <div style={styles.calendarPanel}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Caricamento calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.calendarPanel}>
      <CalendarToolbar 
        view={view}
        date={date}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        onAddEvent={() => {
          if (!session?.user?.id) {
            toast.error("You must be logged in to create events");
            return;
          }
          
          setIsAddingEvent(true);
          setSelectedEvent({
            id: undefined,
            title: '',
            description: '',
            location: '',
            start: new Date(),
            end: new Date(new Date().setHours(new Date().getHours() + 1)),
            reminder: false,
            reminderTime: 15,
            workspaceId: panel.content?.workspaceId
          });
        }}
      />
      
      <div style={styles.calendarContainer}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100% - 50px)' }}
          view={view as View}
          date={date}
          onView={(newView: View) => handleViewChange(newView as CalendarView)}
          onNavigate={handleNavigate}
          selectable={!!session?.user?.id} // Solo gli utenti autenticati possono selezionare slot
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          popup
          components={{
            event: (props: any) => (
              <div style={{
                ...styles.calendarEvent,
                backgroundColor: props.event.color || '#A78BFA'
              }}>
                <span>{props.title}</span>
              </div>
            )
          }}
        />
      </div>
      
      {isAddingEvent && selectedEvent && (
        <EventForm 
          event={selectedEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setIsAddingEvent(false);
            setSelectedEvent(null);
          }}
        />
      )}
      
      {selectedEvent && !isAddingEvent && (
        <EventDetails 
          event={selectedEvent}
          onEdit={() => setIsAddingEvent(true)}
          onDelete={() => selectedEvent.id && handleDeleteEvent(selectedEvent.id)}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      
      {showReminderModal && selectedEvent && (
        <ReminderModal 
          event={selectedEvent}
          onClose={() => setShowReminderModal(false)}
        />
      )}
    </div>
  );
};

export default CalendarPanel;