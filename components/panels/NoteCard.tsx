import React from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiStar, FiClock } from 'react-icons/fi';
import { Note } from '@/lib/services/notesService';

interface NoteCardProps {
  note: Note;
  compact?: boolean;
  onPin: () => void;
  onDelete: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, compact = false, onPin, onDelete }) => {
  // Funzione per formattare la data
  const formatDate = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Oggi';
    } else if (diffDays === 1) {
      return 'Ieri';
    } else if (diffDays < 7) {
      return `${diffDays} giorni fa`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Estrae un breve sommario dal contenuto
  const getSummary = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  // Gestisce il click sui pulsanti per evitare il bubble al parent
  const handleButtonClick = (event: React.MouseEvent, callback: () => void) => {
    event.stopPropagation();
    callback();
  };
  
  // Stile card in base al colore della nota e alla modalità
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: note.color || 'rgba(26, 26, 46, 0.7)',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.2s ease',
      position: 'relative' as const,
      height: compact ? 'auto' : '200px',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden'
    };
    
    // Se è in modalità compatta, modifichiamo lo stile
    if (compact) {
      return {
        ...baseStyle,
        flexDirection: 'row' as const,
        alignItems: 'center',
        padding: '12px 16px',
        height: 'auto'
      };
    }
    
    return baseStyle;
  };
  
  return (
    <motion.div
      style={getCardStyle()}
      whileHover={{ 
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        transform: 'translateY(-2px)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Indicatore nota appuntata */}
      {note.isPinned && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: '#FFC107'
        }}>
          <FiStar />
        </div>
      )}
      
      {/* Titolo */}
      <div style={{
        marginBottom: compact ? 0 : '8px',
        paddingRight: note.isPinned ? '24px' : '0',
        flex: compact ? 1 : 'none'
      }}>
        <h3 style={{ 
          fontSize: compact ? '14px' : '16px', 
          fontWeight: 600,
          marginBottom: compact ? '0' : '4px',
          color: '#FFFFFF'
        }}>
          {note.title || 'Senza titolo'}
        </h3>
        
        {/* Mostra le prime righe del contenuto in modalità griglia */}
        {!compact && (
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px',
            maxHeight: '80px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            textOverflow: 'ellipsis'
          }}>
            {note.content ? getSummary(note.content) : 'Nessun contenuto'}
          </div>
        )}
      </div>
      
      {/* Footer con data e tag */}
      <div style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FiClock style={{ marginRight: '4px' }} />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Pulsante appunta nota */}
          <button
            onClick={(e) => handleButtonClick(e, onPin)}
            style={{
              background: 'none',
              border: 'none',
              color: note.isPinned ? '#FFC107' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            title={note.isPinned ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <FiStar />
          </button>
          
          {/* Pulsante elimina nota */}
          <button
            onClick={(e) => handleButtonClick(e, onDelete)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            title="Elimina nota"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      
      {/* Tag nel footer */}
      {note.tags.length > 0 && !compact && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: '4px',
          marginTop: '8px'
        }}>
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span style={{
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default NoteCard;