// src/components/core/panels/ReminderModal.tsx
"use client"

import React, { useEffect } from 'react';
import { formatDate, formatTime } from '@/utils/calendarHelpers';
import { CalendarEvent } from '@/types/calendar';

// Stili coerenti con HomeClient
const styles = {
  reminderModalOverlay: {
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
  reminderModal: {
    backgroundColor: '#1A1A2E', // surface color from HomeClient
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    color: '#FFFFFF',
  },
  reminderContent: {
    marginBottom: '24px',
  },
  reminderTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#A78BFA', // secondary color from HomeClient
    marginBottom: '8px',
  },
  reminderTime: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
    marginBottom: '8px',
  },
  reminderLocation: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
  },
  reminderActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  btnClose: {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnSnooze: {
    backgroundColor: '#A47864', // primary color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  }
};

interface ReminderModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    // Riproduci un suono di notifica quando il promemoria appare
    // Puoi implementare un suono di notifica qui
    // Ad esempio:
    // const audio = new Audio('/sounds/notification.mp3');
    // audio.play();
    
    // Vibrazione (se supportata)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }, []);

  return (
    <div style={styles.reminderModalOverlay}>
      <div style={styles.reminderModal}>
        <h3>Promemoria Evento</h3>
        <div style={styles.reminderContent}>
          <p style={styles.reminderTitle}>{event.title}</p>
          <p style={styles.reminderTime}>
            {formatDate(event.start)} alle {formatTime(event.start)}
          </p>
          {event.location && (
            <p style={styles.reminderLocation}>Luogo: {event.location}</p>
          )}
        </div>
        <div style={styles.reminderActions}>
          <button onClick={onClose} style={styles.btnClose}>
            Chiudi
          </button>
          <button onClick={() => {
            // Qui potresti implementare la logica per posticipare il promemoria
            console.log('Posticipa promemoria');
            onClose();
          }} style={styles.btnSnooze}>
            Posticipa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
