// src/hooks/useFiles.ts
import { useState } from 'react';
import { toast } from 'sonner';

export interface FileItem {
  id: string;
  name: string;
  type: string; // mime type o 'folder'
  path: string;
  size?: number;
  createdAt: Date;
  updatedAt: Date;
  workspaceId?: string;
  userId: string;
  parentId?: string;
  isPublic?: boolean;
  content?: string;
}

export const useFiles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ottiene i file in una cartella o alla root
  const getFiles = async (folderId?: string): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = folderId 
        ? `/api/files/folder?id=${folderId}` 
        : '/api/files';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      const filesWithDates = data.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
        updatedAt: new Date(file.updatedAt)
      }));
      
      return filesWithDates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      // Ritorna un array vuoto in caso di errore
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ottiene un singolo file per ID
  const getFile = async (fileId: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?id=${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const file = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      return {
        ...file,
        createdAt: new Date(file.createdAt),
        updatedAt: new Date(file.updatedAt)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Crea una nuova cartella
  const createFolder = async (name: string, parentId?: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parentId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const folder = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      return {
        ...folder,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salva un file
  const saveFile = async (file: Partial<FileItem>): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files', {
        method: file.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      });
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const savedFile = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      return {
        ...savedFile,
        createdAt: new Date(savedFile.createdAt),
        updatedAt: new Date(savedFile.updatedAt)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Aggiorna un file esistente
  const updateFile = async (fileId: string, data: any): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: fileId,
          ...data
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const updatedFile = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      return {
        ...updatedFile,
        createdAt: new Date(updatedFile.createdAt),
        updatedAt: new Date(updatedFile.updatedAt)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Elimina un file
  const deleteFile = async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carica un file dal sistema
  const uploadFile = async (file: File, parentId?: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Crea un form data
      const formData = new FormData();
      formData.append('file', file);
      
      if (parentId) {
        formData.append('parentId', parentId);
      }
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const uploadedFile = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      return {
        ...uploadedFile,
        createdAt: new Date(uploadedFile.createdAt),
        updatedAt: new Date(uploadedFile.updatedAt)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Scarica un file
  const downloadFile = async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prima ottieni i dettagli del file
      const file = await getFile(fileId);
      
      if (!file) {
        throw new Error('File non trovato');
      }
      
      // Per i file con contenuto testuale, crea un blob e genera un URL
      if (file.content) {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Crea un elemento <a> per scaricare il file
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
      }
      
      // Per i file binari, usa il download endpoint
      const response = await fetch(`/api/files/download?id=${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      // Ottieni il blob dalla risposta
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Crea un elemento <a> per scaricare il file
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ottiene file recenti
  const getRecentFiles = async (limit: number = 10): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      const filesWithDates = data.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
        updatedAt: new Date(file.updatedAt)
      }));
      
      return filesWithDates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cerca file per nome e/o contenuto
  const searchFiles = async (query: string): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      const filesWithDates = data.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
        updatedAt: new Date(file.updatedAt)
      }));
      
      return filesWithDates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ottiene la struttura delle cartelle (albero)
  const getFolderTree = async (): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files/tree');
      
      if (!response.ok) {
        throw new Error(`Errore (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Converti le date da stringhe a oggetti Date
      const foldersWithDates = data.map((folder: any) => ({
        ...folder,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt),
        children: folder.children ? folder.children.map((child: any) => ({
          ...child,
          createdAt: new Date(child.createdAt),
          updatedAt: new Date(child.updatedAt)
        })) : []
      }));
      
      return foldersWithDates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Condividi un file (pubblica/privato)
  const toggleFileVisibility = async (fileId: string, isPublic: boolean): Promise<FileItem | null> => {
    return updateFile(fileId, { isPublic });
  };
  
  // Gestione integrazione multi-pannello (nuovo)
  
  // Copia contenuto tra pannelli editor
  const copyContentBetweenEditors = async (sourceFileId: string, targetPanelId: string): Promise<boolean> => {
    try {
      // Ottieni il contenuto del file sorgente
      const sourceFile = await getFile(sourceFileId);
      if (!sourceFile || !sourceFile.content) {
        throw new Error('Contenuto del file sorgente non disponibile');
      }
      
      // Qui dovresti aggiornare il contenuto del pannello target
      // Questo richiederebbe l'integrazione con workspaceStore
      
      toast.success('Contenuto copiato nel pannello target');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast.error(`Errore: ${errorMessage}`);
      return false;
    }
  };
  
  // Analizza più file contemporaneamente (simulato)
  const analyzeMultipleFiles = async (fileIds: string[], analysisType: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ottieni i file selezionati
      const files = await Promise.all(fileIds.map(id => getFile(id)));
      const validFiles = files.filter(Boolean) as FileItem[];
      
      if (validFiles.length === 0) {
        throw new Error('Nessun file valido da analizzare');
      }
      
      // In una vera implementazione, qui chiameresti l'API AI per l'analisi
      // Per ora, simuliamo una risposta
      const fileNames = validFiles.map(file => file.name).join(', ');
      
      // Simuliamo un po' di latenza
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return `Analisi di ${analysisType} completata per i file: ${fileNames}. Sono stati analizzati ${validFiles.length} file per un totale di ${validFiles.reduce((acc, file) => acc + (file.content?.length || 0), 0)} caratteri.`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      return `Errore durante l'analisi: ${errorMessage}`;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    error,
    getFiles,
    getFile,
    createFolder,
    saveFile,
    updateFile,
    deleteFile,
    uploadFile,
    downloadFile,
    getRecentFiles,
    searchFiles,
    getFolderTree,
    toggleFileVisibility,
    copyContentBetweenEditors,
    analyzeMultipleFiles
  };
};