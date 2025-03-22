// src/lib/services/fileStorage.ts
import { FileItem } from '@/hooks/useFiles';
import { prisma } from '@/lib/auth/prisma-adapter';
import { File as DbFile } from '@prisma/client';
import { WasabiStorageService } from './wasabiStorageService';

/**
 * Servizio per la gestione dei file nell'applicazione
 * Memorizza i metadati nel database e i contenuti su Wasabi
 */
export class FileStorageService {
  /**
   * Salva un file nel sistema
   * - Metadati nel database
   * - Contenuto su Wasabi
   */
  static async saveFile({
    name,
    type,
    size,
    content,
    userId,
    workspaceId,
    path,
    parentId,
    storageKey: existingStorageKey,
    storageUrl: existingStorageUrl
  }: {
    name: string;
    type: string;
    size: number;
    content?: string;
    userId: string;
    workspaceId?: string;
    path: string;
    parentId?: string;
    storageKey?: string;
    storageUrl?: string;
  }): Promise<DbFile> {
    // Assicurati che size sia sempre un numero
    const finalSize = size || 0;
  
    // Controlla se esiste già un file con lo stesso path nello stesso workspace
    const existingFile = await prisma.file.findFirst({
      where: {
        userId,
        workspaceId: workspaceId || null,
        path,
      },
    });
  
    // Variabili per Wasabi
    let storageKey = existingStorageKey;
    let storageUrl: string | undefined | null;
    
    // Se è un file (non cartella) e non ha già una storageKey o il contenuto è cambiato, carica su Wasabi
    if (type !== 'folder' && content !== undefined && !existingStorageKey) {
      try {
        // Genera una nuova chiave per Wasabi
        storageKey = WasabiStorageService.generateFileKey(userId, name);
        
        // Determina il tipo MIME
        const contentType = determineContentType(name, type);
        
        // Carica su Wasabi (anche se content è stringa vuota)
        storageUrl = await WasabiStorageService.uploadFile(storageKey, content, contentType);
        
        console.log(`File ${name} caricato su Wasabi: ${storageUrl}`);
      } catch (error) {
        console.error("Errore durante il caricamento del file su Wasabi:", error);
        // In caso di errore, continua con il salvataggio nel DB ma senza riferimenti a Wasabi
      }
    }
    // Se il file esiste già e ha già dei riferimenti a Wasabi, ma il contenuto è cambiato
    else if (existingFile?.storageKey && content !== undefined) {
      try {
        // Usa lo storageKey esistente
        storageKey = existingFile.storageKey;
        
        // Determina il tipo MIME
        const contentType = determineContentType(name, type);
        
        // Aggiorna il file su Wasabi
        storageUrl = await WasabiStorageService.uploadFile(storageKey, content, contentType);
        
        console.log(`File ${name} aggiornato su Wasabi: ${storageUrl}`);
      } catch (error) {
        console.error("Errore durante l'aggiornamento del file su Wasabi:", error);
        // In caso di errore, mantieni i riferimenti a Wasabi esistenti
        storageKey = existingFile.storageKey;
        storageUrl = existingFile.storageUrl;
      }
    }
  
    if (existingFile) {
      // Se il file esiste, aggiornalo
      return prisma.file.update({
        where: { id: existingFile.id },
        data: {
          name,
          type,
          size: finalSize,
          // Se il file è stato caricato su Wasabi, non memorizzare il contenuto nel DB
          content: storageUrl ? null : content,
          storageKey,
          storageUrl,
          updatedAt: new Date(),
        },
      });
    }
  
    // Se il file non esiste, crealo
    return prisma.file.create({
      data: {
        name,
        type,
        size: finalSize,
        path,
        // Se il file è stato caricato su Wasabi, non memorizzare il contenuto nel DB
        content: storageUrl ? null : content,
        storageKey,
        storageUrl,
        parentId,
        userId,
        workspaceId,
      },
    });
  }

  /**
   * Recupera un file completo (metadati + contenuto)
   */
  static async getFile(fileId: string, userId: string): Promise<DbFile | null> {
    // Trova il file nel database
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });
    
    if (!file) {
      return null;
    }
    
    // Se è una cartella o non ha una chiave di storage, restituisci il file così com'è
    if (file.type === 'folder' || !file.storageKey) {
      return file;
    }
    
    try {
      // Recupera il contenuto da Wasabi
      const content = await WasabiStorageService.downloadFile(file.storageKey);
      
      // Per i file di testo, converti il buffer in stringa
      if (isTextFile(file.name, file.type)) {
        return {
          ...file,
          content: content.toString('utf-8'),
        };
      }
      
      // Per altri tipi di file, non includere il contenuto binario nella risposta
      return file;
    } catch (error) {
      console.error('Errore durante il recupero del file da Wasabi:', error);
      // Restituisci il file senza contenuto in caso di errore
      return file;
    }
  }

  /**
   * Recupera un file dal percorso
   */
  static async getFileByPath(path: string, userId: string, workspaceId?: string): Promise<DbFile | null> {
    const file = await prisma.file.findFirst({
      where: {
        path,
        userId,
        workspaceId: workspaceId || null,
      },
    });
    
    if (!file) {
      return null;
    }
    
    // Se è richiesto il contenuto, recuperalo da Wasabi
    if (file.storageKey && file.type !== 'folder') {
      return this.getFile(file.id, userId);
    }
    
    return file;
  }

  /**
   * Recupera i file in una cartella
   */
  static async getFilesInFolder(folderId: string | null, userId: string, workspaceId?: string): Promise<DbFile[]> {
    return prisma.file.findMany({
      where: {
        parentId: folderId,
        userId,
        workspaceId: workspaceId || null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Recupera i file nella root di un workspace
   */
  static async getRootFiles(userId: string, workspaceId?: string): Promise<DbFile[]> {
    return prisma.file.findMany({
      where: {
        parentId: null,
        userId,
        workspaceId: workspaceId || null,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  /**
   * Elimina un file
   */
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    // Prima verifica se il file esiste ed è posseduto dall'utente
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      throw new Error('File non trovato o non autorizzato');
    }

    // Se è una cartella, elimina ricorsivamente tutti i file al suo interno
    if (file.type === 'folder') {
      const childFiles = await prisma.file.findMany({
        where: {
          parentId: fileId,
        },
      });

      // Elimina ricorsivamente ogni file figlio
      for (const childFile of childFiles) {
        await FileStorageService.deleteFile(childFile.id, userId);
      }
    } else if (file.storageKey) {
      // Se non è una cartella e ha una chiave di storage, elimina il file da Wasabi
      try {
        await WasabiStorageService.deleteFile(file.storageKey);
      } catch (error) {
        console.error('Errore durante l\'eliminazione del file da Wasabi:', error);
        // Continua anche in caso di errore nell'eliminazione da Wasabi
      }
    }

    // Elimina il file dal database
    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });
  }
  
  /**
   * Sposta un file in una nuova cartella
   */
  static async moveFile(fileId: string, targetFolderId: string, userId: string): Promise<FileItem> {
    // Verifica che l'utente sia il proprietario sia del file che della cartella
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId }
    });
    
    if (!file) {
      throw new Error("File non trovato o non autorizzato");
    }
    
    const targetFolder = await prisma.file.findFirst({
      where: { id: targetFolderId, type: 'folder', userId }
    });
    
    if (!targetFolder) {
      throw new Error("Cartella di destinazione non trovata o non autorizzata");
    }
    
    // Costruisci il nuovo percorso del file
    const newPath = targetFolder.path === '/' 
      ? `/${targetFolder.name}/${file.name}` 
      : `${targetFolder.path}/${file.name}`;
    
    // Aggiorna il file nel database
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        parentId: targetFolderId,
        path: newPath
      }
    });
    
    // Converti il risultato in FileItem
    return {
      id: updatedFile.id,
      name: updatedFile.name,
      type: updatedFile.type,
      path: updatedFile.path,
      size: updatedFile.size,
      createdAt: updatedFile.createdAt,
      updatedAt: updatedFile.updatedAt,
      userId: updatedFile.userId,
      parentId: updatedFile.parentId || undefined, // Converti null in undefined
      isPublic: updatedFile.isPublic || false,
      content: updatedFile.content || undefined
    };
  }

  /**
   * Rinomina un file
   */
  static async renameFile(fileId: string, newName: string, userId: string): Promise<DbFile> {
    // Verifica se il file esiste ed è posseduto dall'utente
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      throw new Error('File non trovato o non autorizzato');
    }

    // Calcola il nuovo percorso
    const pathParts = file.path.split('/');
    pathParts.pop(); // Rimuovi il nome del file attuale
    const newPath = [...pathParts, newName].join('/');

    // Controlla se esiste già un file con lo stesso nome nella stessa directory
    const existingFile = await prisma.file.findFirst({
      where: {
        path: newPath,
        userId,
        workspaceId: file.workspaceId,
        id: { not: fileId }, // Esclude il file stesso
      },
    });

    if (existingFile) {
      throw new Error('Esiste già un file con questo nome nella stessa cartella');
    }

    // Se il file ha un contenuto su Wasabi, rinominalo
    if (file.storageKey && file.type !== 'folder') {
      try {
        // Genera una nuova chiave per Wasabi
        const newStorageKey = WasabiStorageService.generateFileKey(userId, newName);
        
        // Scarica il contenuto del file
        const content = await WasabiStorageService.downloadFile(file.storageKey);
        
        // Carica il file con la nuova chiave
        const contentType = determineContentType(newName, file.type);
        const storageUrl = await WasabiStorageService.uploadFile(newStorageKey, content, contentType);
        
        // Elimina il vecchio file
        await WasabiStorageService.deleteFile(file.storageKey);
        
        // Aggiorna il file nel database
        return prisma.file.update({
          where: { id: fileId },
          data: {
            name: newName,
            path: newPath,
            storageKey: newStorageKey,
            storageUrl,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Errore durante la rinominazione del file su Wasabi:', error);
        throw new Error(`Errore durante la rinominazione del file: ${error}`);
      }
    }

    // Se è una cartella o non ha contenuto, aggiorna solo i metadati
    return prisma.file.update({
      where: { id: fileId },
      data: {
        name: newName,
        path: newPath,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Crea una nuova cartella
   */
  static async createFolder(name: string, parentId: string | null, userId: string, workspaceId?: string): Promise<DbFile> {
    // Determina il percorso della nuova cartella
    let path: string;
    
    if (parentId) {
      const parentFolder = await prisma.file.findUnique({
        where: { id: parentId },
      });
      
      if (!parentFolder) {
        throw new Error('Cartella genitore non trovata');
      }
      
      path = `${parentFolder.path}/${name}`;
    } else {
      path = `/${name}`;
    }
    
    // Verifica se esiste già una cartella con lo stesso nome
    const existingFolder = await prisma.file.findFirst({
      where: {
        path,
        userId,
        workspaceId: workspaceId || null,
      },
    });
    
    if (existingFolder) {
      throw new Error('Esiste già una cartella con questo nome');
    }
    
    // Crea la cartella
    return prisma.file.create({
      data: {
        name,
        type: 'folder',
        size: 0,
        path,
        parentId,
        userId,
        workspaceId,
      },
    });
  }

  /**
   * Ottieni file recenti
   */
  static async getRecentFiles(userId: string, limit: number = 5): Promise<DbFile[]> {
    return prisma.file.findMany({
      where: {
        userId,
        type: { not: 'folder' }, // Escludi le cartelle
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Calcola lo spazio totale utilizzato dall'utente
   */
  static async getUserStorageUsage(userId: string): Promise<number> {
    const result = await prisma.file.aggregate({
      where: {
        userId,
        type: { not: 'folder' }, // Escludi le cartelle dal calcolo
      },
      _sum: {
        size: true,
      },
    });
    
    return result._sum.size || 0;
  }
}

/**
 * Funzioni di utilità
 */

/**
 * Determina il tipo di contenuto MIME in base all'estensione del file
 */
function determineContentType(fileName: string, fileType: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Testo
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    // JavaScript/JSON
    'js': 'application/javascript',
    'json': 'application/json',
    // Immagini
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    // Documenti
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archivi
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'gz': 'application/gzip',
    // Altri
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
  };
  
  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension];
  }
  
  // Tipo generico basato sul tipo di file
  if (fileType === 'image') return 'image/png';
  if (fileType === 'video') return 'video/mp4';
  if (fileType === 'audio') return 'audio/mpeg';
  
  // Usa application/octet-stream come fallback
  return 'application/octet-stream';
}

/**
 * Verifica se un file è di tipo testuale
 */
function isTextFile(fileName: string, fileType: string): boolean {
  const textExtensions = [
    'txt', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'md', 
    'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs',
    'swift', 'kt', 'sh', 'bat', 'ps1', 'sql', 'xml', 'yaml', 'yml',
    'toml', 'ini', 'cfg', 'conf'
  ];
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension && textExtensions.includes(extension)) {
    return true;
  }
  
  // Tipi generici
  return ['text', 'code'].includes(fileType);
}