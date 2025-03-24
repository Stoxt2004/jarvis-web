// lib/events/aiEvents.ts
// Sistema di eventi per aggiornare tutti i componenti che dipendono dalle statistiche AI

type EventCallback = () => void;

class AIEventEmitter {
  private listeners: Record<string, EventCallback[]> = {};

  // Aggiunge un listener per un evento specifico
  public on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Rimuove un listener
  public off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  // Emette un evento e chiama tutti i listener registrati
  public emit(event: string): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Errore nell\'esecuzione del callback:', err);
      }
    });
  }
}

// Crea e esporta una singola istanza
export const aiEvents = new AIEventEmitter();

// Eventi predefiniti
export const AI_EVENTS = {
  REQUEST_SENT: 'ai_request_sent',
  LIMIT_REACHED: 'ai_limit_reached'
};