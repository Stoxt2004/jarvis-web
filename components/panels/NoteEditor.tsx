import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiTrash2, FiX, FiTag, FiPlus, FiStar } from 'react-icons/fi';
import { Note } from '@/lib/services/notesService';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
  onDelete?: () => void;
  availableTags: string[];
}

// Colori disponibili per le note
const AVAILABLE_COLORS = [
  { name: 'Default', value: 'rgba(26, 26, 46, 0.7)' },
  { name: 'Blu', value: '#1e3a8a' },
  { name: 'Verde', value: '#166534' },
  { name: 'Rosso', value: '#991b1b' },
  { name: 'Viola', value: '#5b21b6' },
  { name: 'Ambra', value: '#92400e' },
  { name: 'Grigio', value: '#374151' }
];

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note, 
  onSave, 
  onCancel, 
  onDelete,
  availableTags
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color || AVAILABLE_COLORS[0].value);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  // Imposta il focus all'editor di contenuto quando si apre
  useEffect(() => {
    contentRef.current?.focus();
  }, []);
  
  // Imposta il focus all'input tag quando si apre il tag picker
  useEffect(() => {
    if (showTagPicker) {
      tagInputRef.current?.focus();
    }
  }, [showTagPicker]);
  
  // Tracker per cambiamenti non salvati
  useEffect(() => {
    const hasChanged = 
      title !== note.title || 
      content !== note.content || 
      color !== (note.color || AVAILABLE_COLORS[0].value) ||
      isPinned !== note.isPinned ||
      JSON.stringify(tags) !== JSON.stringify(note.tags || []);
    
    setHasUnsavedChanges(hasChanged);
  }, [title, content, color, isPinned, tags, note]);
  
  // Handler per il salvataggio
  const handleSave = () => {
    onSave({
      ...note,
      title,
      content,
      color,
      isPinned,
      tags
    });
  };
  
  // Handler per l'aggiunta di un tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Considera solo la prima parola (senza spazi)
    const tagToAdd = newTag.trim().split(/\s+/)[0].toLowerCase();
    
    if (!tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
    }
    
    setNewTag('');
  };
  
  // Handler per la rimozione di un tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handler per la selezione di un tag esistente
  const handleSelectExistingTag = (tagToAdd: string) => {
    if (!tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
    }
    setShowTagPicker(false);
  };
  
  // Funzione per controllare se l'utente sta tentando di uscire con modifiche non salvate
  const checkUnsavedChanges = () => {
    if (hasUnsavedChanges) {
      return window.confirm('Hai modifiche non salvate. Sei sicuro di voler uscire?');
    }
    return true;
  };
  
  // Stile dell'editor in base al colore della nota
  const getEditorStyle = () => {
    return {
      backgroundColor: color,
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const
    };
  };
  
  return (
    <div style={getEditorStyle()}>
      {/* Header fisso con pulsanti principali */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: color // Usa lo stesso colore di sfondo per mantenere coerenza
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
          {note.id ? 'Modifica Nota' : 'Nuova Nota'}
        </h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Pulsante appunta */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            style={{
              background: 'none',
              border: 'none',
              color: isPinned ? '#FFC107' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px'
            }}
            title={isPinned ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <FiStar />
          </button>
          
          {/* Pulsante elimina (solo per note esistenti) */}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Sei sicuro di voler eliminare questa nota?')) {
                  onDelete();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#D58D8D', // colore rosa
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px'
              }}
              title="Elimina nota"
            >
              <FiTrash2 />
            </button>
          )}
          
          {/* Pulsante salva */}
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            style={{
              backgroundColor: hasUnsavedChanges ? '#A47864' : 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: hasUnsavedChanges ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiSave />
            <span>Salva</span>
          </button>
          
          {/* Pulsante annulla */}
          <button
            onClick={() => {
              if (checkUnsavedChanges()) {
                onCancel();
              }
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer'
            }}
            title="Annulla"
          >
            <FiX />
          </button>
        </div>
      </div>
      
      {/* Area di contenuto scorrevole che contiene tutto il resto */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Editor con titolo e contenuto */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Titolo */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo della nota"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '4px',
              padding: '12px',
              fontSize: '18px',
              color: '#FFFFFF',
              marginBottom: '16px',
              width: '100%',
              outline: 'none'
            }}
          />
          
          {/* Area di contenuto */}
          <div style={{ 
            borderRadius: '4px', 
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            marginBottom: '16px'
          }}>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Scrivi qui il contenuto della tua nota..."
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px',
                fontSize: '16px',
                color: '#FFFFFF',
                resize: 'none',
                width: '100%',
                outline: 'none',
                lineHeight: '1.5',
                minHeight: '300px' // Garantisce un'altezza minima per la textarea
              }}
            />
          </div>
        
          {/* Footer con tag e colori */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Selezione colore */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Colore nota
                </label>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showColorPicker ? 'Nascondi' : 'Cambia'}
                </button>
              </div>
              
              {showColorPicker && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}>
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: c.value,
                        border: color === c.value ? '2px solid white' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Tag */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <FiTag style={{ marginRight: '4px', display: 'inline' }} />
                  Tag
                </label>
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showTagPicker ? 'Nascondi' : 'Aggiungi tag'}
                </button>
              </div>
              
              {/* Lista dei tag aggiunti */}
              {tags.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}>
                  {tags.map(tag => (
                    <div
                      key={tag}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Editor tag */}
              {showTagPicker && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Aggiungi un tag..."
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#FFFFFF',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleAddTag}
                      style={{
                        backgroundColor: '#A47864',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      disabled={!newTag.trim()}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  
                  {/* Tag suggeriti */}
                  {availableTags.length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '4px'
                      }}>
                        Tag suggeriti:
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap'
                      }}>
                        {availableTags
                          .filter(tag => !tags.includes(tag))
                          .map(tag => (
                            <button
                              key={tag}
                              onClick={() => handleSelectExistingTag(tag)}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              #{tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;