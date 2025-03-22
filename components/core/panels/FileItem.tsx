// components/core/panels/FileItem.tsx
import React, { useState } from 'react';
import { FiFolder, FiFile, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import { useDragDropStore } from '@/lib/store/dragDropStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface FileItemProps {
  file: {
    id: string;
    name: string;
    type: string;
    size?: number;
    content?: string;
    isPublic?: boolean;
    updatedAt: Date;
  };
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  panelId: string;
}

export default function FileItem({ 
  file, 
  isSelected, 
  onSelect, 
  onDoubleClick, 
  onContextMenu,
  panelId
}: FileItemProps) {
  const { startDrag, endDrag } = useDragDropStore();
  const [isDragging, setIsDragging] = useState(false);
  
  // Formatta la dimensione del file
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  // Ottiene l'icona appropriata per il tipo di file
  const getFileIcon = () => {
    if (file.type === 'folder') {
      return <FiFolder size={24} className="text-blue-500" />;
    }
    
    // Icone specifiche per estensione
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return <FiFile size={24} className="text-red-500" />;
      case 'txt':
        return <FiFile size={24} className="text-gray-400" />;
      case 'doc':
      case 'docx':
        return <FiFile size={24} className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FiFile size={24} className="text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FiFile size={24} className="text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FiFile size={24} className="text-purple-500" />;
      case 'js':
      case 'jsx':
        return <FiFile size={24} className="text-yellow-500" />;
      case 'html':
        return <FiFile size={24} className="text-red-500" />;
      case 'css':
        return <FiFile size={24} className="text-blue-500" />;
      default:
        return <FiFile size={24} />;
    }
  };
  
  // Gestisce l'inizio del drag
  const handleDragStart = (e: React.DragEvent) => {
    // Solo i file (non le cartelle) possono essere draggati
    if (file.type === 'folder') {
      e.preventDefault();
      return;
    }
    
    // Imposta i dati del drag
    e.dataTransfer.setData('application/json', JSON.stringify({
      fileId: file.id,
      fileName: file.name,
      fileType: file.type,
      panelId: panelId
    }));
    
    // Crea un'immagine personalizzata per il drag
    const dragPreview = document.createElement('div');
    dragPreview.style.padding = '8px';
    dragPreview.style.background = '#1A1A2E';
    dragPreview.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    dragPreview.style.borderRadius = '4px';
    dragPreview.style.color = 'white';
    dragPreview.style.fontSize = '14px';
    dragPreview.style.display = 'flex';
    dragPreview.style.alignItems = 'center';
    dragPreview.style.gap = '8px';
    dragPreview.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
    <span>${file.name}</span>`;
    
    document.body.appendChild(dragPreview);
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.style.zIndex = '9999';
    
    try {
      e.dataTransfer.setDragImage(dragPreview, 20, 20);
    } catch (error) {
      console.error('Impossibile impostare l\'immagine di drag:', error);
    }
    
    // Imposta lo stato del drag nello store
    startDrag(file.id, file.name, file.type, file.content, panelId);
    setIsDragging(true);
    
    // Feedback visivo per l'utente
    toast.info(`Trascina ${file.name} in un editor per aprirlo`, {
      duration: 1500,
      position: 'bottom-right'
    });
    
    // Cleanup dopo un breve ritardo
    setTimeout(() => {
      if (dragPreview.parentNode) {
        document.body.removeChild(dragPreview);
      }
    }, 100);
  };
  
  // Gestisce la fine del drag
  const handleDragEnd = () => {
    setIsDragging(false);
    endDrag();
  };
  
  return (
    <motion.div
      className={`p-3 rounded-lg cursor-pointer relative ${
        isSelected 
          ? 'bg-primary/20 ring-1 ring-primary' 
          : 'hover:bg-white/5'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable={file.type !== 'folder'} // Solo i file possono essere draggati
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {file.isPublic && (
        <div className="absolute top-1 right-1 text-yellow-500">
          <FiStar size={14} fill="currentColor" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 flex items-center justify-center mb-2">
          {getFileIcon()}
        </div>
        
        <div className="truncate w-full text-sm font-medium">
          {file.name}
        </div>
        
        <div className="text-xs text-white/50">
          {file.type === 'folder' 
            ? new Date(file.updatedAt).toLocaleDateString() 
            : formatFileSize(file.size)
          }
        </div>
      </div>
    </motion.div>
  );
}