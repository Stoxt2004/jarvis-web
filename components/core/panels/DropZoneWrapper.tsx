// components/core/panels/DropZoneWrapper.tsx
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDragDropStore } from '@/lib/store/dragDropStore';
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
 * Wrapper per permettere il drag and drop di file
 * Può essere usato per avvolgere qualsiasi pannello che deve accettare file
 */
export default function DropZoneWrapper({ 
  children, 
  panel, 
  acceptedTypes = ['*'],
  onFileDrop 
}: DropZoneWrapperProps) {
  const { draggedFile, setDraggingOver, isDraggingOver, endDrag } = useDragDropStore();
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
  
  // Gestisce il drop del file
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
          
          // Feedback per l'utente
          toast.success(`File "${file.name}" aperto nell'editor`, {
            description: 'Puoi modificare il contenuto e salvarlo',
            duration: 3000
          });
        }
      } else if (e.dataTransfer.files.length > 0) {
        // Gestisce file system drag and drop
        // Questo è per il drag and drop dal file system, non da un altro pannello
        toast.info('Caricamento file da filesystem...', {
          description: 'Per importare file esterni, usa prima la funzione Upload nel File Manager',
          duration: 4000
        });
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
      data-drop-target="true"
    >
      {children}
      
      {/* Overlay visibile durante il drag over */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(26, 26, 46, 0.7)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <motion.div
              className="bg-surface-dark/80 p-5 rounded-lg border border-primary shadow-lg text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-primary"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Rilascia per aprire</p>
              <p className="text-white/60 text-sm">
                {draggedFile ? draggedFile.name : 'File'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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