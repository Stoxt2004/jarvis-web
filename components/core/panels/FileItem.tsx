// components/core/panels/FileItem.tsx (versione completa)
import React, { useState } from 'react';
import { FiFolder, FiFile, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import { useDragDropStore } from '@/lib/store/dragDropStore';
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
      case 'json':
        return <FiFile size={24} className="text-amber-500" />;
      case 'py':
        return <FiFile size={24} className="text-blue-500" />;
      case 'java':
        return <FiFile size={24} className="text-orange-700" />;
      case 'c':
      case 'cpp':
        return <FiFile size={24} className="text-blue-700" />;
      case 'md':
        return <FiFile size={24} className="text-sky-500" />;
      default:
        return <FiFile size={24} />;
    }
  };
  
  // Gestisce l'inizio del drag
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Solo i file (non le cartelle) possono essere draggati
    if (file.type === 'folder') {
      e.preventDefault();
      return;
    }
    
    console.log('Drag start:', file.name);
    
    // Imposta i dati del drag in modo esplicito
    try {
      const data = JSON.stringify({
        fileId: file.id,
        fileName: file.name,
        fileType: file.type,
        panelId: panelId
      });
      
      // Il MIME type è fondamentale
      e.dataTransfer.setData('application/json', data);
      
      // Assicuriamoci che sia impostato anche come testo (per compatibilità)
      e.dataTransfer.setData('text/plain', file.name);
      
      // Imposta l'effetto di trascinamento
      e.dataTransfer.effectAllowed = 'copy';
      
      // Crea un'immagine di trascinamento personalizzata per un feedback visivo
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.width = '150px';
      dragImage.style.height = '40px';
      dragImage.style.backgroundColor = '#1A1A2E';
      dragImage.style.border = '1px solid #A78BFA';
      dragImage.style.borderRadius = '4px';
      dragImage.style.padding = '8px';
      dragImage.style.display = 'flex';
      dragImage.style.alignItems = 'center';
      dragImage.style.justifyContent = 'center';
      dragImage.style.color = 'white';
      dragImage.style.fontWeight = 'bold';
      dragImage.style.pointerEvents = 'none';
      dragImage.textContent = file.name;
      
      document.body.appendChild(dragImage);
      dragImage.style.top = '-1000px'; // Nascondiamo fuori schermo
      
      // Imposta l'immagine di trascinamento
      e.dataTransfer.setDragImage(dragImage, 75, 20);
      
      // Rimuovi l'elemento dopo un breve periodo
      setTimeout(() => {
        if (dragImage.parentNode) {
          document.body.removeChild(dragImage);
        }
      }, 100);
      
      // Notifica lo store del drag & drop
      startDrag(file.id, file.name, file.type, file.content, panelId);
    } catch (error) {
      console.error("Errore nell'impostazione dei dati drag:", error);
      toast.error("Errore nell'iniziare il trascinamento");
    }
    
    setIsDragging(true);
    
    // Feedback visivo
    toast.info(`Trascina ${file.name} in un editor per aprirlo`, {
      duration: 2000,
      position: 'bottom-right'
    });
  };
  
  // Gestisce la fine del drag
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag end:', file.name);
    setIsDragging(false);
    
    // Verifica se il drop è avvenuto con successo
    if (e.dataTransfer.dropEffect === 'none') {
      console.log('Drop non avvenuto o non riuscito');
    } else {
      console.log('Drop avvenuto con successo con effetto:', e.dataTransfer.dropEffect);
    }
    
    // Notifica lo store che il drag è terminato
    endDrag();
  };
  
  // Previeni il drag durante l'edit o altre operazioni
  const preventDragIfNeeded = (e: React.DragEvent<HTMLDivElement>) => {
    if (file.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer relative ${
        isSelected 
          ? 'bg-primary/20 ring-1 ring-primary' 
          : 'hover:bg-white/5'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable={file.type !== 'folder'}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={preventDragIfNeeded}
      style={{
        transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s',
        transform: isDragging ? 'scale(0.95)' : 'scale(1)'
      }}
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
    </div>
  );
}