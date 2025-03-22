"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventForm from './EventForm';
import EventDetails from './EventDetails';
import CalendarToolbar from './CalendarToolbar';
import ReminderModal from './ReminderModal';
import { saveEvent, getEvents, deleteEvent } from '@/lib/services/calendarService';
import { Panel as PanelType } from '@/lib/store/workspaceStore';
import { CalendarEvent, CalendarView } from '@/types/calendar';

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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);

  // Recupera gli eventi all'avvio
  useEffect(() => {
    const fetchEvents = async () => {
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    };
    
    fetchEvents();
  }, []);
  
  // Aggiorna il titolo del pannello quando cambia la vista
  useEffect(() => {
    if (panel) {
      const viewName = view.charAt(0).toUpperCase() + view.slice(1);
      // Utilizza l'API di workspaceStore per aggiornare il titolo
      // Assumendo che panel abbia un ID e che ci sia una funzione per aggiornare il titolo
      if (panel.id) {
        // Qui dovresti usare la funzione appropriata del tuo store
        // Ad esempio: updatePanelTitle(panel.id, `Calendario - Vista ${viewName}`);
      }
    }
  }, [view, panel]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsAddingEvent(false);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setIsAddingEvent(true);
    // Pre-popola il form con l'orario selezionato
    setSelectedEvent({ 
      start, 
      end,
      title: '',
      description: '',
      location: '',
      reminder: false,
      reminderTime: 15 // minuti prima
    });
  };

  const handleSaveEvent = async (eventData: CalendarEvent) => {
    try {
      const savedEvent = await saveEvent(eventData);
      
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
      // Qui potresti aggiungere una notifica di errore
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Errore nell\'eliminare l\'evento:', error);
      // Qui potresti aggiungere una notifica di errore
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

  return (
    <div style={styles.calendarPanel}>
      <CalendarToolbar 
        view={view}
        date={date}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        onAddEvent={() => {
          setIsAddingEvent(true);
          setSelectedEvent({
            start: new Date(),
            end: new Date(new Date().setHours(new Date().getHours() + 1)),
            title: '',
            description: '',
            location: '',
            reminder: false,
            reminderTime: 15
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
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          popup
          components={{
            event: (props: any) => (
              <div style={styles.calendarEvent}>
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
          onDelete={() => handleDeleteEvent(selectedEvent.id!)}
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
