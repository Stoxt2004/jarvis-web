// src/components/core/panels/CalendarToolbar.tsx
"use client"

import React from 'react';
import { CalendarView } from '@/types/calendar';
import { formatMonthYear } from '@/utils/calendarHelpers';

// Stili coerenti con HomeClient
const styles = {
  calendarToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#1A1A2E', // surface color from HomeClient
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  calendarNavigation: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navButton: {
    backgroundColor: '#A78BFA', // secondary color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  currentDate: {
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 500,
    marginLeft: '8px',
  },
  viewSelector: {
    display: 'flex',
    gap: '4px',
  },
  viewButton: {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)', // textMuted from HomeClient
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  activeView: {
    backgroundColor: '#A47864', // primary color from HomeClient
    color: '#FFFFFF',
    border: '1px solid #A47864',
  },
  addEventButton: {
    backgroundColor: '#4CAF50', // accent color from HomeClient
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  }
};

interface CalendarToolbarProps {
  view: CalendarView;
  date: Date;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (date: Date) => void;
  onAddEvent: () => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({ view, date, onViewChange, onNavigate, onAddEvent }) => {
  return (
    <div style={styles.calendarToolbar}>
      <div style={styles.calendarNavigation}>
        <button 
          style={styles.navButton} 
          onClick={() => onNavigate(new Date())}
        >
          Oggi
        </button>
        <button 
          style={styles.navButton} 
          onClick={() => {
            const newDate = new Date(date);
            if (view === 'month') {
              newDate.setMonth(date.getMonth() - 1);
            } else if (view === 'week') {
              newDate.setDate(date.getDate() - 7);
            } else {
              newDate.setDate(date.getDate() - 1);
            }
            onNavigate(newDate);
          }}
        >
          &lt;
        </button>
        <button 
          style={styles.navButton} 
          onClick={() => {
            const newDate = new Date(date);
            if (view === 'month') {
              newDate.setMonth(date.getMonth() + 1);
            } else if (view === 'week') {
              newDate.setDate(date.getDate() + 7);
            } else {
              newDate.setDate(date.getDate() + 1);
            }
            onNavigate(newDate);
          }}
        >
          &gt;
        </button>
        <span style={styles.currentDate}>
          {formatMonthYear(date, view)}
        </span>
      </div>
      
      <div style={styles.viewSelector}>
        <button 
          style={{
            ...styles.viewButton,
            ...(view === 'month' ? styles.activeView : {})
          }} 
          onClick={() => onViewChange('month')}
        >
          Mese
        </button>
        <button 
          style={{
            ...styles.viewButton,
            ...(view === 'week' ? styles.activeView : {})
          }} 
          onClick={() => onViewChange('week')}
        >
          Settimana
        </button>
        <button 
          style={{
            ...styles.viewButton,
            ...(view === 'day' ? styles.activeView : {})
          }} 
          onClick={() => onViewChange('day')}
        >
          Giorno
        </button>
        <button 
          style={{
            ...styles.viewButton,
            ...(view === 'agenda' ? styles.activeView : {})
          }} 
          onClick={() => onViewChange('agenda')}
        >
          Agenda
        </button>
      </div>
      
      <button style={styles.addEventButton} onClick={onAddEvent}>
        + Nuovo Evento
      </button>
    </div>
  );
};

export default CalendarToolbar;
