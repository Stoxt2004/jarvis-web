// components/core/panels/FileItem.tsx
import React, { useState } from 'react';
import { FiFolder, FiFile, FiStar } from 'react-icons/fi';
import { useDragDropStore } from '@/lib/store/dragDropStore';
import { toast } from 'sonner';
import { useFiles, FileItem as FileItemType } from '@/hooks/useFiles';
import { useFileSystemStore } from '@/lib/store/fileSystemStore';

// Definizione esplicita di FileItemProps
interface FileItemProps {
  file: FileItemType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  panelId: string;
  onFileDropped?: (fileId: string, targetFolderId: string) => void;
  icon?: React.ReactNode;
}

export default function FileItem({ 
  file, 
  isSelected, 
  onSelect, 
  onDoubleClick, 
  onContextMenu,
  panelId,
  onFileDropped,
  icon
}: FileItemProps) {
  const { startDrag, endDrag } = useDragDropStore();
  const { addModifiedFileId, markDataAsChanged } = useFileSystemStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { moveFile } = useFiles();
  
  // Formatta la dimensione del file (implementata localmente)
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  // Ottiene l'icona appropriata per il tipo di file (implementata localmente)
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
      default:
        return <FiFile size={24} />;
    }
  };
  
  // Gestisce l'inizio del drag
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag start:', file.name, 'ID:', file.id);
    
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
      e.dataTransfer.effectAllowed = 'all'; // Modifica: consenti tutti gli effetti
      
      // Notifica lo store del drag & drop
      startDrag(file.id, file.name, file.type, file.content, panelId);
    } catch (error) {
      console.error("Errore nell'impostazione dei dati drag:", error);
      toast.error("Error starting the drag");
    }
    
    setIsDragging(true);
  };
  
  // Gestisce la fine del drag
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag end:', file.name, 'Effect:', e.dataTransfer.dropEffect);
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
  
  // Nuove funzioni per gestire il drop sulle cartelle
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Accetta il drop solo se è una cartella
    if (file.type === 'folder') {
      e.preventDefault(); // Importante: previene il comportamento di default
      e.stopPropagation();
      
      // Debug del tipi di dati disponibili
      console.log('DragOver su cartella:', file.name, 'Tipi di dati:', e.dataTransfer.types);
      
      // Imposta l'effetto di drop
      e.dataTransfer.dropEffect = 'move';
      
      // Cambia l'aspetto visivo per indicare che è un target di drop valido
      if (!isDropTarget) {
        setIsDropTarget(true);
      }
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Assicurati che il drag leave sia effettivamente fuori dall'elemento
    // e non ad un elemento figlio
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsDropTarget(false);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    
    // Gestisci il drop solo se questo è una cartella
    if (file.type !== 'folder') {
      console.log('Drop ignorato - non è una cartella');
      return;
    }
    
    console.log('Drop su cartella:', file.name, 'ID:', file.id);
    console.log('Tipi di dati disponibili:', e.dataTransfer.types);
    
    // Estrai i dati JSON
    const jsonData = e.dataTransfer.getData('application/json');
    if (!jsonData) {
      console.error('Nessun dato JSON trovato nel drop');
      return;
    }
    
    console.log('Dati JSON ricevuti:', jsonData);
    
    try {
      const draggedFile = JSON.parse(jsonData);
      console.log('Dati file trascinato:', draggedFile);
      
      // Non permettere di spostare una cartella dentro sé stessa o un file nella sua stessa posizione
      if (draggedFile.fileId === file.id) {
        toast.error("You can't move an element into itself");
        return;
      }

      // NUOVO: Verifica aggiuntiva per file nulli
      if (!draggedFile.fileId || !file.id) {
        console.error('ID file mancante:', { draggedFileId: draggedFile.fileId, targetFolderId: file.id });
        toast.error("Operation could not be completed: missing file data.");
        return;
      }
      
      console.log(`Spostamento del file ${draggedFile.fileName} (${draggedFile.fileId}) nella cartella ${file.name} (${file.id})`);
      
      // NUOVO: Feedback immediato
      toast.loading(`Moving ${draggedFile.fileName}...`);
      
      // Esegui lo spostamento del file
      const result = await moveFile(draggedFile.fileId, file.id);
      
      if (result) {
        // IMPORTANTE: Notifica lo store che i dati sono cambiati
        console.log('Contrassegno file come modificato:', draggedFile.fileId);
        addModifiedFileId(draggedFile.fileId);
        markDataAsChanged();
        
        toast.success(`${draggedFile.fileName} moved in ${file.name}`);
        
        // Notifica il padre per aggiornare la lista dei file
        if (onFileDropped) {
          console.log('Chiamata callback onFileDropped');
          onFileDropped(draggedFile.fileId, file.id);
        }
      } else {
        toast.error(`Impossible move ${draggedFile.fileName}`);
      }
    } catch (error) {
      console.error('Errore nello spostamento del file:', error);
      toast.error('Error moving the file.');
    }
  };
  
  // Aggiungi un attributo data- per identificare meglio l'elemento nel DOM
  const dataAttributes = {
    'data-file-id': file.id,
    'data-file-type': file.type,
    'data-is-folder': file.type === 'folder' ? 'true' : 'false'
  };
  
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer relative ${
        isSelected 
          ? 'bg-primary/20 ring-1 ring-primary' 
          : isDropTarget 
            ? 'bg-green-500/20 ring-1 ring-green-500' 
            : 'hover:bg-white/5'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable={true} // Rendi tutti gli elementi trascinabili
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver} // Aggiungiamo anche un handler per dragEnter
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s',
        transform: isDragging ? 'scale(0.95)' : isDropTarget ? 'scale(1.05)' : 'scale(1)'
      }}
      {...dataAttributes}
    >
      {file.isPublic && (
        <div className="absolute top-1 right-1 text-yellow-500">
          <FiStar size={14} fill="currentColor" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 flex items-center justify-center mb-2">
          {icon || getFileIcon()}
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