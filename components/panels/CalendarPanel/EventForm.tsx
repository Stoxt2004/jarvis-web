// src/components/core/panels/EventForm.tsx
"use client"

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { formatDateForInput } from '@/utils/calendarHelpers';
import { CalendarEvent } from '@/types/calendar';

// Stili coerenti con HomeClient
const styles = {
  eventFormOverlay: {
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
  eventForm: {
    backgroundColor: '#1A1A2E', // surface color from HomeClient
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    padding: '24px',
    color: '#FFFFFF',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  formControl: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0F0F1A', // background color from HomeClient
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    color: '#FFFFFF',
    fontSize: '14px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnSave: {
    backgroundColor: '#4CAF50', // accent color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  }
};

interface EventFormProps {
  event: CalendarEvent;
  onSave: (event: CalendarEvent) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CalendarEvent>({
    id: '',
    title: '',
    description: '',
    location: '',
    start: new Date(),
    end: new Date(),
    reminder: false,
    reminderTime: 15 // minuti prima
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start: event.start || new Date(),
        end: event.end || new Date(new Date().setHours(new Date().getHours() + 1))
      });
    }
  }, [event]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: new Date(value)
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={styles.eventFormOverlay}>
      <div style={styles.eventForm}>
        <h3>{formData.id ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="title">Titolo</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={styles.formControl}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              style={styles.formControl}
              rows={3}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="location">Luogo</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              style={styles.formControl}
            />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="start">Data e ora di inizio</label>
              <input
                type="datetime-local"
                id="start"
                name="start"
                value={formatDateForInput(formData.start)}
                onChange={handleDateTimeChange}
                required
                style={styles.formControl}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="end">Data e ora di fine</label>
              <input
                type="datetime-local"
                id="end"
                name="end"
                value={formatDateForInput(formData.end)}
                onChange={handleDateTimeChange}
                required
                style={styles.formControl}
              />
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="reminder"
                name="reminder"
                checked={formData.reminder}
                onChange={handleChange}
              />
              <label htmlFor="reminder">Imposta promemoria</label>
            </div>
          </div>
          
          {formData.reminder && (
            <div style={styles.formGroup}>
              <label htmlFor="reminderTime">Minuti prima</label>
              <select
                id="reminderTime"
                name="reminderTime"
                value={formData.reminderTime}
                onChange={handleChange}
                style={styles.formControl}
              >
                <option value="5">5 minuti</option>
                <option value="10">10 minuti</option>
                <option value="15">15 minuti</option>
                <option value="30">30 minuti</option>
                <option value="60">1 ora</option>
                <option value="1440">1 giorno</option>
              </select>
            </div>
          )}
          
          <div style={styles.formActions}>
            <button type="button" onClick={onCancel} style={styles.btnCancel}>
              Annulla
            </button>
            <button type="submit" style={styles.btnSave}>
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
