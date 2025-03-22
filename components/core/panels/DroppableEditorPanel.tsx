// DroppableEditorPanel.tsx
import React from 'react';
import { Panel, PanelContentType, useWorkspaceStore } from '@/lib/store/workspaceStore';
import DropZoneWrapper from './DropZoneWrapper';
import EditorPanel from './EditorPanel';
import { FileItem, useFiles } from '@/hooks/useFiles';
import { useFileSystemStore } from '@/lib/store/fileSystemStore';

export function DroppableEditorPanel(props: { panel: Panel }) {
  const { updatePanelContent } = useWorkspaceStore();
  const { getFile } = useFiles();
  const { addModifiedFileId, markDataAsChanged } = useFileSystemStore();
  
  // Definire qui i tipi di file accettati
  const acceptedFileTypes = [
    'js', 'jsx', 'ts', 'tsx', 'html', 'css',
    'json', 'md', 'txt', 'py', 'java', 'c', 'cpp'
  ];
  
  // Funzione che gestisce il drop di un file
  const handleFileDrop = async (file: FileItem) => {
    console.log('File ricevuto nell\'editor per apertura:', file);
    const uniqueTimestamp = Date.now();
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
    
    // Verifica se è necessario caricare il contenuto completo
    let fileContent = file.content;
    if (!fileContent && file.id) {
      try {
        // Carica il contenuto completo del file
        const fullFile = await getFile(file.id);
        if (fullFile) {
          fileContent = fullFile.content;
          console.log('Contenuto caricato per il file:', fileContent);
        }
      } catch (error) {
        console.error('Errore nel caricamento del contenuto completo:', error);
      }
    }
    
    // Crea l'oggetto content con il timestamp
    const content: PanelContentType = {
      fileName: file.name,
      language,
      value: fileContent || '',
      fileId: file.id,
      timestamp: Date.now() // Aggiungi un timestamp univoco
    };
    
    console.log('Aggiornando il contenuto del pannello con:', content);
    
    // Aggiorna il contenuto del pannello
    updatePanelContent(props.panel.id, {
      fileName: file.name,
      language,
      value: fileContent || '',
      fileId: file.id,
      timestamp: uniqueTimestamp // Assicurati che sia univoco
    });
    
    // Segnala che il file è stato aperto
    if (file.id) {
      addModifiedFileId(file.id);
      markDataAsChanged();
    }
    
    console.log('Pannello editor aggiornato con il nuovo file');
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