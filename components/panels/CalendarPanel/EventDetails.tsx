// src/components/core/panels/EventDetails.tsx
"use client"

import React from 'react';
import { formatDate, formatTime } from '@/utils/calendarHelpers';
import { CalendarEvent } from '@/types/calendar';

// Stili coerenti con HomeClient
const styles = {
  eventDetailsOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 26, 0.8)', // background color with opacity
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  eventDetails: {
    backgroundColor: '#1A1A2E', // surface color from HomeClient
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    padding: '24px',
    position: 'relative' as const,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  eventInfo: {
    marginBottom: '24px',
  },
  eventDateTime: {
    marginBottom: '16px',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
  },
  eventLocation: {
    marginBottom: '16px',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
  },
  eventDescription: {
    marginBottom: '16px',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
  },
  eventReminder: {
    color: '#A78BFA', // secondary color from HomeClient
    marginBottom: '16px',
  },
  eventActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  btnEdit: {
    backgroundColor: '#A47864', // primary color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnDelete: {
    backgroundColor: '#D58D8D', // rose color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  }
};

interface EventDetailsProps {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onEdit, onDelete, onClose }) => {
  return (
    <div style={styles.eventDetailsOverlay}>
      <div style={styles.eventDetails}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        
        <h3 style={styles.eventTitle}>{event.title}</h3>
        
        <div style={styles.eventInfo}>
          <div style={styles.eventDateTime}>
            <div>
              <strong>Start:</strong> {formatDate(event.start)} alle {formatTime(event.start)}
            </div>
            <div>
              <strong>End:</strong> {formatDate(event.end)} alle {formatTime(event.end)}
            </div>
          </div>
          
          {event.location && (
            <div style={styles.eventLocation}>
              <strong>Place:</strong> {event.location}
            </div>
          )}
          
          {event.description && (
            <div style={styles.eventDescription}>
              <strong>Description:</strong>
              <p>{event.description}</p>
            </div>
          )}
          
          {event.reminder && (
            <div style={styles.eventReminder}>
              <strong>Reminder:</strong> {event.reminderTime} minuti prima
            </div>
          )}
        </div>
        
        <div style={styles.eventActions}>
          <button onClick={onEdit} style={styles.btnEdit}>
            Edit
          </button>
          <button onClick={onDelete} style={styles.btnDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
