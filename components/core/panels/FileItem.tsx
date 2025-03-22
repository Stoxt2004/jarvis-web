// src/components/core/panels/FileItem.tsx
import React, { useState } from 'react';
import { FiFolder, FiFile, FiCopy, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { useWorkspaceStore } from '@/lib/store/workspaceStore';
import { motion } from 'framer-motion';

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
  const { startDrag, endDrag } = usePanelIntegrationStore();
  const [isDragging, setIsDragging] = useState(false);
  const { panels } = useWorkspaceStore();
  
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
    
    // Aggiungi un'immagine di preview del drag (opzionale)
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `<div class="p-2 bg-surface-dark rounded border border-white/10 text-sm flex items-center gap-2">
      ${getFileIcon().props.className} ${file.name}
    </div>`;
    document.body.appendChild(dragImage);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Imposta lo stato del drag nello store
    startDrag(file.id, file.name, file.type, file.content, panelId);
    setIsDragging(true);
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
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent)}
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