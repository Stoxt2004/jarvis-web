// src/hooks/useFiles.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Definizione dei tipi
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  content?: string;
  parentId?: string | null;
  workspaceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}

export function useFiles() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Recupera i file nella root o in una cartella specifica
   */
  const getFiles = useCallback(async (folderId?: string, workspaceId?: string): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/api/files/folder';
      const params = new URLSearchParams();
      
      if (folderId) {
        params.append('id', folderId);
      }
      
      if (workspaceId) {
        params.append('workspace', workspaceId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei file');
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante il recupero dei file');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recupera un file specifico per ID
   */
  const getFile = useCallback(async (fileId: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?id=${fileId}`);
      
      if (!response.ok) {
        throw new Error('Errore nel recupero del file');
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante il recupero del file');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recupera un file dal percorso
   */
  const getFileByPath = useCallback(async (path: string, workspaceId?: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `/api/files?path=${encodeURIComponent(path)}`;
      
      if (workspaceId) {
        url += `&workspace=${workspaceId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Errore nel recupero del file');
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante il recupero del file');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Salva un nuovo file
   */
  const saveFile = useCallback(async (file: {
    name: string;
    type: string;
    size: number;
    content?: string;
    path: string;
    parentId?: string;
    workspaceId?: string;
  }): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nel salvataggio del file');
      }
      
      const data = await response.json();
      toast.success(`File "${file.name}" salvato con successo`);
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio del file');
      toast.error(`Errore nel salvataggio di "${file.name}": ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Aggiorna un file esistente
   */
  const updateFile = useCallback(async (fileId: string, updates: {
    content?: string;
    size?: number;
    newName?: string;
  }): Promise<FileItem | null> => {
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
          ...updates,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'aggiornamento del file');
      }
      
      const data = await response.json();
      
      if (updates.newName) {
        toast.success(`File rinominato in "${updates.newName}"`);
      } else {
        toast.success('File aggiornato con successo');
      }
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento del file');
      toast.error(`Errore nell'aggiornamento del file: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Elimina un file
   */
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nell\'eliminazione del file');
      }
      
      toast.success('File eliminato con successo');
      return true;
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'eliminazione del file');
      toast.error(`Errore nell'eliminazione del file: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crea una nuova cartella
   */
  const createFolder = useCallback(async (folderName: string, parentId?: string, workspaceId?: string): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parentId,
          workspaceId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nella creazione della cartella');
      }
      
      const data = await response.json();
      toast.success(`Cartella "${folderName}" creata con successo`);
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione della cartella');
      toast.error(`Errore nella creazione della cartella: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ottieni i file recenti
   */
  const getRecentFiles = useCallback(async (limit: number = 5): Promise<FileItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei file recenti');
      }
      
      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Errore durante il recupero dei file recenti');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carica un file da un'istanza di File del browser
   */
  const uploadFile = useCallback(async (
    file: File, 
    parentId?: string, 
    workspaceId?: string
  ): Promise<FileItem | null> => {
    setIsLoading(true);
    setError(null);
    const size = file.size;
    try {
      // Determina il percorso in base al parent
      let parentPath = '/';
      
      if (parentId) {
        const parentFolder = await getFile(parentId);
        if (parentFolder && parentFolder.type === 'folder') {
          parentPath = parentFolder.path;
        }
      }
      
      const path = `${parentPath === '/' ? '' : parentPath}/${file.name}`;
      
      // Leggi il contenuto del file
      let content;
      
      // Leggi il contenuto solo se è un file di testo
      const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb'];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (textExtensions.includes(extension)) {
        content = await readFileContent(file);
      } else {
        // Per file binari, imposta una nota che indica la presenza di contenuto binario
        // o converti in base64 per memorizzazione nel database
        content = '[Binary content]'; // Oppure memorizza un indicatore
      }
      
      // Crea un nuovo file
      const fileData = {
        name: file.name,
        type: extension || file.type,
        size: file.size, // Questa dovrebbe essere la dimensione effettiva del file
        path,
        content,
        parentId,
        workspaceId,
      };
      
      return saveFile(fileData);
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento del file');
      toast.error(`Errore nel caricamento di "${file.name}": ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getFile, saveFile]);

  /**
   * Download di un file
   */
  const downloadFile = useCallback(async (fileId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ottieni il file
      const file = await getFile(fileId);
      
      if (!file) {
        throw new Error('File non trovato');
      }
      
      // Crea un blob dal contenuto
      if (file.content) {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Crea un link di download e fai clic su di esso
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Pulisci l'URL
        URL.revokeObjectURL(url);
        
        return true;
      } else {
        throw new Error('Il file non ha contenuto');
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante il download del file');
      toast.error(`Errore nel download del file: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getFile]);

  /**
   * Funzione di utilità per leggere il contenuto di un file
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Errore nella lettura del file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file'));
      };
      
      reader.readAsText(file);
    });
  };

  /**
   * Calcola lo spazio di archiviazione utilizzato dall'utente
   */
  const getUserStorageUsage = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files/usage');
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dell\'utilizzo dello storage');
      }
      
      const data = await response.json();
      return data.usage || 0;
    } catch (err: any) {
      setError(err.message || 'Errore durante il recupero dell\'utilizzo dello storage');
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getFiles,
    getFile,
    getFileByPath,
    saveFile,
    updateFile,
    deleteFile,
    createFolder,
    getRecentFiles,
    uploadFile,
    downloadFile,
    getUserStorageUsage
  };
}