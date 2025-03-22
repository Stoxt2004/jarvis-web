// src/lib/services/fileStorage.ts
import { FileItem } from '@/hooks/useFiles';
import { prisma } from '@/lib/auth/prisma-adapter';
import { File as DbFile } from '@prisma/client';

/**
 * Servizio per la gestione dei file nell'applicazione
 * Supporta il salvataggio nel database e l'integrazione con servizi cloud
 */
export class FileStorageService {
  /**
   * Salva un file nel database
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
  }: {
    name: string;
    type: string;
    size: number;
    content?: string;
    userId: string;
    workspaceId?: string;
    path: string;
    parentId?: string;
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
  
    if (existingFile) {
      // Se il file esiste, aggiornalo
      return prisma.file.update({
        where: { id: existingFile.id },
        data: {
          name,
          type,
          size: finalSize, // Usa il valore garantito qui
          content,
          updatedAt: new Date(),
        },
      });
    }
  
    // Se il file non esiste, crealo
    return prisma.file.create({
      data: {
        name,
        type,
        size: finalSize, // E anche qui
        path,
        content,
        parentId,
        userId,
        workspaceId,
      },
    });
  }

  /**
   * Recupera un file dal database
   */
  static async getFile(fileId: string, userId: string): Promise<DbFile | null> {
    return prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });
  }

  /**
   * Recupera un file dal percorso
   */
  static async getFileByPath(path: string, userId: string, workspaceId?: string): Promise<DbFile | null> {
    return prisma.file.findFirst({
      where: {
        path,
        userId,
        workspaceId: workspaceId || null,
      },
    });
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
    }

    

    // Elimina il file
    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });
  }
  
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

    // Aggiorna il nome e il percorso del file
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
   * Ottieni file con tag
   */
  static async getFilesByTag(userId: string, tag: string): Promise<DbFile[]> {
    // In una vera implementazione, dovresti avere una tabella di tag
    // Per ora, simuliamo cercando nei metadati JSON
    return prisma.file.findMany({
      where: {
        userId,
        // Questo è un esempio semplificato, in una vera implementazione
        // dovresti usare una relazione many-to-many tra file e tag
      },
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