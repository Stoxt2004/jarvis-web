"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiPlus, FiSearch, FiX, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Panel as PanelType } from '@/lib/store/workspaceStore';
import { Note, getNotes, saveNote, deleteNote, createEmptyNote, getUniqueTags } from '@/lib/services/notesService';
import NoteCard from '@/components/panels/NoteCard';
import NoteEditor from '@/components/panels/NoteEditor';

// Stili consistenti con il tema dell'applicazione
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1A1A2E', // surface color
    color: '#FFFFFF',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  header: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: 1,
    marginRight: '16px'
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    flex: 1,
    outline: 'none',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  contentArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto' as const
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px'
  },
  tag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  noNotesMessage: {
    textAlign: 'center' as const,
    marginTop: '32px',
    color: 'rgba(255, 255, 255, 0.6)'
  },
  button: {
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#A47864', // primary color
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  iconButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer'
  },
  activeFilter: {
    backgroundColor: '#A47864', // primary color
    color: '#FFFFFF'
  }
};

interface NotesPanelProps {
  panel: PanelType;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ panel }) => {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recupera le note quando il componente viene montato
  useEffect(() => {
    const fetchNotes = async () => {
      if (session?.user?.id) {
        setIsLoading(true);
        try {
          // Usa il workspaceId dal content del panel, se disponibile
          const workspaceId = panel.content?.workspaceId;
          const fetchedNotes = await getNotes(workspaceId);
          setNotes(fetchedNotes);
          setFilteredNotes(fetchedNotes);
          
          // Recupera i tag disponibili
          const tags = await getUniqueTags(workspaceId);
          setAvailableTags(tags);
        } catch (error) {
          console.error("Errore nel recupero delle note:", error);
          toast.error("You must be logged in to delete notes");
          setIsLoading(false);
        }
      }
    };
    
    fetchNotes();
  }, [session, panel.content]);

  // Filtra le note in base al termine di ricerca e al tag selezionato
  useEffect(() => {
    let filtered = [...notes];
    
    // Filtra per tag se selezionato
    if (selectedTag) {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }
    
    // Filtra per termine di ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) || 
        note.content.toLowerCase().includes(term)
      );
    }
    
    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedTag]);

  // Gestisce la creazione di una nuova nota
  const handleCreateNote = () => {
    if (!session?.user?.id) {
      toast.error("Unable to load notes");
      return;
    }
    
    const newNote = createEmptyNote(panel.content?.workspaceId);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  // Gestisce il salvataggio di una nota
  const handleSaveNote = async (note: Note) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save notes");
      return;
    }
    
    try {
      const savedNote = await saveNote(note);
      
      // Aggiorna la lista delle note
      if (note.id) {
        // Aggiornamento di una nota esistente
        setNotes(notes.map(n => n.id === note.id ? savedNote : n));
      } else {
        // Aggiunta di una nuova nota
        setNotes([savedNote, ...notes]);
      }
      
      // Aggiorna la lista dei tag disponibili
      const updatedTags = await getUniqueTags(panel.content?.workspaceId);
      setAvailableTags(updatedTags);
      
      setIsEditing(false);
      setSelectedNote(null);
    } catch (error) {
      console.error("Errore nel salvataggio della nota:", error);
    }
  };

  // Gestisce l'eliminazione di una nota
  const handleDeleteNote = async (noteId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to save notes");
      return;
    }
    
    try {
      await deleteNote(noteId);
      
      // Rimuovi la nota dalla lista
      setNotes(notes.filter(note => note.id !== noteId));
      
      // Se la nota eliminata era selezionata, deselezionala
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      
      // Aggiorna la lista dei tag disponibili
      const updatedTags = await getUniqueTags(panel.content?.workspaceId);
      setAvailableTags(updatedTags);
    } catch (error) {
      console.error("Errore nell'eliminazione della nota:", error);
    }
  };

  // Gestisce il click su un tag
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      // Se il tag è già selezionato, deselezionalo
      setSelectedTag(null);
    } else {
      // Altrimenti, selezionalo
      setSelectedTag(tag);
    }
  };

  // Gestisce il click su una nota
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  // Mostra un indicatore di caricamento
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading notes...</div>
        </div>
      </div>
    );
  }

  // Se l'editor è aperto, mostra solo l'editor
  if (isEditing && selectedNote) {
    return (
      <div style={styles.container}>
        <NoteEditor 
          note={selectedNote} 
          onSave={handleSaveNote} 
          onCancel={() => {
            setIsEditing(false);
            setSelectedNote(null);
          }}
          onDelete={selectedNote.id ? () => handleDeleteNote(selectedNote.id!) : undefined}
          availableTags={availableTags}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header con barra di ricerca e pulsanti */}
      <div style={styles.header}>
        <div style={styles.searchBar}>
          <FiSearch style={{ marginRight: '8px', color: 'rgba(255, 255, 255, 0.5)' }} />
          <input 
            type="text" 
            placeholder="Cerca nelle note..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.5)' }}
              onClick={() => setSearchTerm('')}
            >
              <FiX />
            </button>
          )}
        </div>
        
        <div style={styles.buttonGroup}>
          <button 
            style={{
              ...styles.iconButton,
              ...(viewMode === 'grid' ? styles.activeFilter : {})
            }}
            onClick={() => setViewMode('grid')}
            title="Vista griglia"
          >
            <FiGrid />
          </button>
          
          <button 
            style={{
              ...styles.iconButton,
              ...(viewMode === 'list' ? styles.activeFilter : {})
            }}
            onClick={() => setViewMode('list')}
            title="Vista lista"
          >
            <FiList />
          </button>
          
          <button 
            style={styles.button}
            onClick={handleCreateNote}
          >
            <FiPlus />
            <span>Nuova nota</span>
          </button>
        </div>
      </div>
      
      <div style={styles.contentArea}>
        {/* Tags filtro */}
        {availableTags.length > 0 && (
          <div style={styles.tagsContainer}>
            <button 
              style={{
                ...styles.tag,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
              onClick={() => setSelectedTag(null)}
            >
              <FiFilter style={{ marginRight: '4px' }} />
              Tutti
            </button>
            
            {availableTags.map(tag => (
              <button 
                key={tag} 
                style={{
                  ...styles.tag,
                  backgroundColor: selectedTag === tag ? '#A47864' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedTag === tag ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'
                }}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        
        {/* Note */}
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <motion.div 
              style={styles.noNotesMessage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {searchTerm || selectedTag ? 
                'Nessuna nota corrisponde ai criteri di ricerca.' : 
                'Non hai ancora nessuna nota. Crea la tua prima nota!'}
            </motion.div>
          ) : (
            <div style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id || Math.random().toString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  onClick={() => handleNoteClick(note)}
                >
                  <NoteCard 
                    note={note} 
                    compact={viewMode === 'list'}
                    onPin={async () => {
                      const updatedNote = { ...note, isPinned: !note.isPinned };
                      await handleSaveNote(updatedNote);
                    }}
                    onDelete={() => note.id && handleDeleteNote(note.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotesPanel;