// src/lib/services/notesService.ts
import { toast } from 'sonner';

export interface Note {
  id?: string;
  title: string;
  content: string;
  color?: string;
  isPinned: boolean;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
  workspaceId?: string;
}

/**
 * Recupera le note dell'utente
 */
export const getNotes = async (
  workspaceId?: string, 
  tag?: string
): Promise<Note[]> => {
  try {
    let url = '/api/notes';
    const params = new URLSearchParams();
    
    if (workspaceId) {
      params.append('workspaceId', workspaceId);
    }
    
    if (tag) {
      params.append('tag', tag);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Errore nel recupero delle note: ${response.status}`);
    }
    
    const notes = await response.json();
    
    // Converti le stringhe di date in oggetti Date
    return notes.map((note: any) => ({
      ...note,
      createdAt: note.createdAt ? new Date(note.createdAt) : undefined,
      updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined
    }));
  } catch (error) {
    console.error('Errore nel caricamento delle note:', error);
    toast.error('Impossibile caricare le note');
    return [];
  }
};

/**
 * Recupera una nota specifica
 */
export const getNote = async (
  noteId: string
): Promise<Note | null> => {
  try {
    const response = await fetch(`/api/notes?id=${noteId}`);
    
    if (!response.ok) {
      throw new Error(`Errore nel recupero della nota: ${response.status}`);
    }
    
    const note = await response.json();
    
    return {
      ...note,
      createdAt: note.createdAt ? new Date(note.createdAt) : undefined,
      updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined
    };
  } catch (error) {
    console.error('Errore nel caricamento della nota:', error);
    toast.error('Impossibile caricare la nota');
    return null;
  }
};

/**
 * Salva una nota (crea o aggiorna)
 */
export const saveNote = async (note: Note): Promise<Note> => {
  try {
    const method = note.id ? 'PUT' : 'POST';
    const url = '/api/notes';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    
    if (!response.ok) {
      throw new Error(`Errore nel salvataggio della nota: ${response.status}`);
    }
    
    const savedNote = await response.json();
    
    toast.success(note.id ? 'Nota aggiornata' : 'Nota creata');
    
    return {
      ...savedNote,
      createdAt: savedNote.createdAt ? new Date(savedNote.createdAt) : undefined,
      updatedAt: savedNote.updatedAt ? new Date(savedNote.updatedAt) : undefined
    };
  } catch (error) {
    console.error('Errore nel salvare la nota:', error);
    toast.error('Impossibile salvare la nota');
    throw error;
  }
};

/**
 * Elimina una nota
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/notes?id=${noteId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Errore nell'eliminazione della nota: ${response.status}`);
    }
    
    toast.success('Nota eliminata');
  } catch (error) {
    console.error('Errore nell\'eliminazione della nota:', error);
    toast.error('Impossibile eliminare la nota');
    throw error;
  }
};

/**
 * Ottieni tutti i tag unici dalle note
 */
export const getUniqueTags = async (workspaceId?: string): Promise<string[]> => {
  try {
    const notes = await getNotes(workspaceId);
    
    // Estrai tutti i tag e rimuovi i duplicati
    const allTags = notes.reduce((tags: string[], note) => {
      return [...tags, ...note.tags];
    }, []);
    
    return Array.from(new Set(allTags)).sort();
  } catch (error) {
    console.error('Errore nel recupero dei tag:', error);
    return [];
  }
};

/**
 * Funzione per creare una nuova nota vuota
 */
export const createEmptyNote = (workspaceId?: string): Note => {
  return {
    title: 'Nuova nota',
    content: '',
    isPinned: false,
    tags: [],
    workspaceId
  };
};