// src/components/core/panels/DropZoneWrapper.tsx
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { Panel } from '@/lib/store/workspaceStore';
import { useFiles, FileItem } from '@/hooks/useFiles';
import { toast } from 'sonner';

interface DropZoneWrapperProps {
  children: ReactNode;
  panel: Panel;
  acceptedTypes?: string[]; // Tipi di file accettati dal pannello
  onFileDrop: (file: FileItem) => void;
}

/**
 * Wrapper per permettere il drag and drop tra pannelli
 * Può essere usato per avvolgere qualsiasi pannello che deve accettare file
 */
export default function DropZoneWrapper({ 
  children, 
  panel, 
  acceptedTypes = ['*'],
  onFileDrop 
}: DropZoneWrapperProps) {
  const { draggedFile, setDraggingOver, isDraggingOver, endDrag } = usePanelIntegrationStore();
  const { getFile } = useFiles();
  
  // Gestisce l'entrata nel drop zone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Verifica se c'è un file in drag e se il tipo è accettato
    if (draggedFile) {
      const fileExt = draggedFile.name.split('.').pop()?.toLowerCase() || '';
      const isAccepted = acceptedTypes.includes('*') || 
                         acceptedTypes.includes(fileExt) || 
                         acceptedTypes.includes(draggedFile.type);
      
      if (isAccepted) {
        setDraggingOver(panel.id);
      }
    }
  };
  
  // Gestisce l'uscita dal drop zone
  const handleDragLeave = () => {
    setDraggingOver(null);
  };
  
  // Gestisce il drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Controlla se è un drop da un altro pannello
      const jsonData = e.dataTransfer.getData('application/json');
      
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.fileId) {
          // Ottiene i dettagli del file
          const file = await getFile(data.fileId);
          
          if (!file) {
            toast.error('File non trovato');
            return;
          }
          
          // Verifica se il tipo è accettato
          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          const isAccepted = acceptedTypes.includes('*') || 
                             acceptedTypes.includes(fileExt) || 
                             acceptedTypes.includes(file.type);
          
          if (!isAccepted) {
            toast.error(`Tipo di file non supportato: ${fileExt || file.type}`);
            return;
          }
          
          // Esegue il callback di drop
          onFileDrop(file);
        }
      } else if (e.dataTransfer.files.length > 0) {
        // Gestisce file system drag and drop
        // Questo è per il drag and drop dal file system, non da un altro pannello
        // La logica specifica va implementata in base alle necessità
        toast.info('Drag and drop dal file system non ancora implementato');
      }
    } catch (error) {
      console.error('Errore durante il drop:', error);
      toast.error('Si è verificato un errore durante il drop');
    } finally {
      setDraggingOver(null);
      endDrag();
    }
  };
  
  const isActive = isDraggingOver === panel.id;
  
  return (
    <div
      className="h-full w-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Overlay visibile durante il drag over */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-lg z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-surface-dark p-4 rounded-lg border border-primary shadow-lg">
            <p className="text-white">Rilascia qui per aprire</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Modificatore per EditorPanel che implementa il drag & drop
import EditorPanel from '@/components/core/panels/EditorPanel';
import { useWorkspaceStore } from '@/lib/store/workspaceStore';

export function DroppableEditorPanel(props: { panel: Panel }) {
  const { updatePanelContent } = useWorkspaceStore();
  
  // Tipi di file accettati dall'editor
  const acceptedFileTypes = [
    'js', 'jsx', 'ts', 'tsx', 'html', 'css',
    'json', 'md', 'txt', 'py', 'java', 'c', 'cpp'
  ];
  
  // Funzione che gestisce il drop di un file
  const handleFileDrop = (file: FileItem) => {
    // Determina il linguaggio dal tipo di file
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'txt': 'plaintext'
    };
    
    const language = languageMap[extension] || 'plaintext';
    
    // Aggiorna il contenuto del pannello
    updatePanelContent(props.panel.id, {
      fileName: file.name,
      language,
      value: file.content || '', // Contenuto del file
      fileId: file.id            // ID del file per future operazioni
    });
    
    toast.success(`File "${file.name}" aperto nell'editor`);
  };
  
  return (
    <DropZoneWrapper 
      panel={props.panel} 
      acceptedTypes={acceptedFileTypes}
      onFileDrop={handleFileDrop}
    >
      <EditorPanel panel={props.panel} />
    </DropZoneWrapper>
  );
}