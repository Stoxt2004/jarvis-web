// Versione rivista di DropZoneWrapper.tsx
import React, { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Panel } from '@/lib/store/workspaceStore';
import { useFiles, FileItem } from '@/hooks/useFiles';

interface DropZoneWrapperProps {
  children: ReactNode;
  panel: Panel;
  acceptedTypes?: string[]; // Tipi di file accettati dal pannello
  onFileDrop: (file: FileItem) => void;
}

export default function DropZoneWrapper({ 
  children, 
  panel, 
  acceptedTypes = ['*'],
  onFileDrop 
}: DropZoneWrapperProps) {
  const [isOver, setIsOver] = useState(false);
  const { getFile } = useFiles();
  
  // Gestisce l'entrata nel drop zone
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Consenti esplicitamente il drop con un effetto visivo
    e.dataTransfer.dropEffect = 'copy';
    
    // Debug
    console.log('Drag over:', panel.type, 'Tipi di dati:', e.dataTransfer.types);
    
    // Non impostiamo lo stato "isOver" ad ogni evento dragOver per ottimizzare le prestazioni
    if (!isOver) {
      setIsOver(true);
    }
  };
  
  // Gestisce l'uscita dal drop zone
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verifica che l'uscita sia effettivamente dal container e non da un elemento figlio
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    console.log('Drag leave panel:', panel.title);
    setIsOver(false);
  };
  
  // Gestisce il drop del file
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop su panel:', panel.title);
    console.log('Tipi di dati disponibili:', e.dataTransfer.types);
    
    setIsOver(false);
    
    try {
      // Log per debug
      for (let type of e.dataTransfer.types) {
        console.log(`Dati di tipo ${type}:`, e.dataTransfer.getData(type));
      }
      
      // Verifica se ci sono dati JSON
      if (e.dataTransfer.types.includes('application/json')) {
        const jsonData = e.dataTransfer.getData('application/json');
        console.log('Dati JSON ricevuti:', jsonData);
        
        if (jsonData) {
          try {
            const data = JSON.parse(jsonData);
            console.log('Dati deserializzati:', data);
            
            if (data.fileId) {
              // Ottiene i dettagli del file
              const file = await getFile(data.fileId);
              
              if (!file) {
                toast.error('File non trovato');
                return;
              }
              
              console.log('File recuperato per apertura:', file);
              
              // Verifica se il tipo è accettato
              const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
              const isAccepted = acceptedTypes.includes('*') || 
                                acceptedTypes.includes(fileExt) || 
                                acceptedTypes.includes(file.type);
              
              if (!isAccepted) {
                toast.error(`Tipo di file non supportato: ${fileExt || file.type}`);
                return;
              }
              
              // PUNTO CRITICO: Esegue il callback di drop e verifica che funzioni
              console.log('Invocando onFileDrop con:', file);
              onFileDrop(file);
              
              // Feedback per l'utente
              toast.success(`File "${file.name}" aperto nell'editor`, {
                description: 'Puoi modificare il contenuto e salvarlo',
                duration: 3000
              });
            }
          } catch (parseError) {
            console.error('Errore nel parsing JSON:', parseError);
            toast.error('Formato dati non valido');
          }
        }
      }
    } catch (error) {
      console.error('Errore durante il drop:', error);
      toast.error('Si è verificato un errore durante il drop');
    }
  };
  
  return (
    <div
      className={`h-full w-full relative ${isOver ? 'drop-active' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-drop-target="true"
    >
      {children}
      
      {/* Overlay visibile durante il drag over */}
      {isOver && (
        <div
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-surface-dark/70 backdrop-blur-sm"
        >
          <div
            className="bg-surface-dark/80 p-5 rounded-lg border border-primary shadow-lg text-center"
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
            <p className="text-white/60 text-sm">File</p>
          </div>
        </div>
      )}
    </div>
  );
}