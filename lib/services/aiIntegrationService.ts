// src/lib/services/aiIntegrationService.ts
import { useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore';
import { FileStorageService } from './fileStorage';
import { ParsedCommand } from './openaiService';
import { toast } from 'sonner';

/**
 * Servizio per integrare l'AI con il sistema operativo
 * Fornisce metodi per eseguire azioni di sistema basate sui comandi dell'AI
 */
export class AIIntegrationService {
  /**
   * Esegue un'azione nel sistema basata sul comando analizzato
   */
  static async executeSystemAction(command: ParsedCommand, userId: string): Promise<boolean> {
    try {
      // Recupera le funzioni dallo store
      // Nota: queste funzioni devono essere disponibili nel contesto del componente
      const store = useWorkspaceStore.getState();
      
      switch (command.type) {
        case 'OPEN_APP':
          return await this.openApplication(command.params.appType, store);
          
        case 'CLOSE_APP':
          return await this.closeApplication(command.params.appId, command.params.appType, store);
          
        case 'CREATE_FILE':
          return await this.createFile(command.params, userId, store);
          
        case 'DELETE_FILE':
          return await this.deleteFile(command.params, userId);
          
        case 'SEARCH_FILES':
          // Non richiede azioni di sistema dirette
          return true;
          
        case 'READ_FILE':
          // Se l'utente vuole aprire il file, possiamo aprire un editor
          if (command.params.openFile) {
            return await this.openFile(command.params, userId, store);
          }
          return true;
          
        case 'EXECUTE_CODE':
          // Implementa l'esecuzione del codice (simulata)
          return true;
          
        default:
          // Nessuna azione di sistema da eseguire
          return true;
      }
    } catch (error) {
      console.error('Errore nell\'esecuzione dell\'azione di sistema:', error);
      return false;
    }
  }
  
  /**
   * Apre un'applicazione del tipo specificato
   */
  private static async openApplication(appType: PanelType, store: any): Promise<boolean> {
    if (!appType) {
      toast.error("Tipo di applicazione non specificato");
      return false;
    }
    
    // Posizioni di default per diverse app
    const appDefaults: Record<PanelType, { position: { x: number, y: number }, size: { width: number, height: number } }> = {
      browser: {
        position: { x: 100, y: 100 },
        size: { width: 900, height: 600 }
      },
      editor: {
        position: { x: 150, y: 150 },
        size: { width: 800, height: 500 }
      },
      fileManager: {
        position: { x: 200, y: 100 },
        size: { width: 700, height: 500 }
      },
      terminal: {
        position: { x: 200, y: 200 },
        size: { width: 600, height: 400 }
      },
      notes: {
        position: { x: 250, y: 250 },
        size: { width: 500, height: 400 }
      },
      dashboard: {
        position: { x: 100, y: 100 },
        size: { width: 800, height: 500 }
      }
    };
    
    // Crea titoli appropriati per le app
    const appTitles: Record<PanelType, string> = {
      browser: 'Browser Web',
      editor: 'Editor',
      fileManager: 'File Manager',
      terminal: 'Terminale',
      notes: 'Note',
      dashboard: 'Dashboard'
    };
    
    // Contenuto predefinito per le app
    const appContents: Partial<Record<PanelType, any>> = {
      browser: { url: 'https://www.google.com' },
      editor: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' },
      notes: { text: '' }
    };
    
    // Aggiungi il pannello allo workspace
    store.addPanel({
      type: appType,
      title: appTitles[appType] || `Nuova ${appType}`,
      position: appDefaults[appType].position,
      size: appDefaults[appType].size,
      content: appContents[appType] || {}
    });
    
    return true;
  }
  
  /**
   * Chiude un'applicazione con l'ID o il tipo specificato
   */
  private static async closeApplication(appId: string, appType: string, store: any): Promise<boolean> {
    const { panels, removePanel } = store;
    
    if (appId) {
      // Cerca il pannello con l'ID specificato
      const panelToClose = panels.find((p: any) => p.id === appId);
      if (panelToClose) {
        removePanel(panelToClose.id);
        return true;
      } else {
        toast.error(`Nessun pannello trovato con ID: ${appId}`);
        return false;
      }
    } else if (appType) {
      // Cerca i pannelli del tipo specificato
      const panelsToClose = panels.filter((p: any) => p.type === appType);
      // Chiudi l'ultimo pannello di quel tipo (se ce ne sono)
      if (panelsToClose.length > 0) {
        removePanel(panelsToClose[panelsToClose.length - 1].id);
        return true;
      } else {
        toast.error(`Nessun pannello di tipo ${appType} trovato`);
        return false;
      }
    } else {
      toast.error("Specificare ID pannello o tipo applicazione da chiudere");
      return false;
    }
  }
  
  /**
   * Crea un nuovo file e lo apre nell'editor se richiesto
   */
  private static async createFile(params: any, userId: string, store: any): Promise<boolean> {
    try {
      const { fileName, content = '', type, path = '/', parentId, openInEditor = true } = params;
      
      if (!fileName) {
        toast.error("Nome file non specificato");
        return false;
      }
      
      // Determina il tipo di file dall'estensione se non specificato
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const fileType = type || fileExtension || 'txt';
      
      // Crea il percorso completo
      const filePath = path.endsWith('/') ? `${path}${fileName}` : `${path}/${fileName}`;
      
      // Calcola la dimensione approssimativa del contenuto in byte
      const size = content ? new TextEncoder().encode(content).length : 0;
      
      // Salva il file utilizzando il servizio di storage
      const file = await FileStorageService.saveFile({
        name: fileName,
        type: fileType,
        size,
        content,
        userId,
        path: filePath,
        parentId
      });
      
      // Se richiesto, apri il file nell'editor
      if (openInEditor && file) {
        // Mappa delle estensioni ai linguaggi supportati dall'editor
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
          'txt': 'plaintext'
        };
        
        // Apri il file nell'editor
        store.addPanel({
          type: 'editor',
          title: `Editor - ${fileName}`,
          position: { x: 150, y: 150 },
          size: { width: 800, height: 500 },
          content: { 
            fileName: fileName,
            fileId: file.id,
            language: languageMap[fileExtension] || 'plaintext',
            value: content
          }
        });
      }
      
      return true;
    } catch (error: any) {
      console.error("Errore nella creazione del file:", error);
      toast.error(`Errore nella creazione del file: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Elimina un file con il nome o il percorso specificato
   */
  private static async deleteFile(params: any, userId: string): Promise<boolean> {
    try {
      const { fileName, filePath, fileId } = params;
      
      // Se abbiamo l'ID del file, possiamo eliminarlo direttamente
      if (fileId) {
        await FileStorageService.deleteFile(fileId, userId);
        return true;
      }
      
      // Altrimenti, dobbiamo cercarlo prima per nome o percorso
      if (filePath) {
        const file = await FileStorageService.getFileByPath(filePath, userId);
        if (!file) {
          toast.error(`Nessun file trovato al percorso ${filePath}`);
          return false;
        }
        
        await FileStorageService.deleteFile(file.id, userId);
        return true;
      }
      
      if (fileName) {
        // Cerca i file nella root
        const rootFiles = await FileStorageService.getRootFiles(userId);
        const file = rootFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
        
        if (!file) {
          toast.error(`Nessun file trovato con nome ${fileName}`);
          return false;
        }
        
        await FileStorageService.deleteFile(file.id, userId);
        return true;
      }
      
      toast.error("Specificare nome file, percorso o ID per eliminare un file");
      return false;
    } catch (error: any) {
      console.error("Errore nell'eliminazione del file:", error);
      toast.error(`Errore nell'eliminazione del file: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Apre un file nell'editor
   */
  private static async openFile(params: any, userId: string, store: any): Promise<boolean> {
    try {
      const { fileName, filePath, fileId } = params;
      let file;
      
      // Cerca il file per ID, percorso o nome
      if (fileId) {
        file = await FileStorageService.getFile(fileId, userId);
      } else if (filePath) {
        file = await FileStorageService.getFileByPath(filePath, userId);
      } else if (fileName) {
        // Cerca i file nella root
        const rootFiles = await FileStorageService.getRootFiles(userId);
        file = rootFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      }
      
      if (!file) {
        toast.error("File non trovato");
        return false;
      }
      
      if (file.type === 'folder') {
        // Se è una cartella, apri il file manager e naviga a quella cartella
        store.addPanel({
          type: 'fileManager',
          title: `File Manager - ${file.name}`,
          position: { x: 200, y: 100 },
          size: { width: 700, height: 500 },
          content: { 
            currentFolder: file.id,
            currentPath: file.path
          }
        });
        return true;
      }
      
      // Ottieni l'estensione del file
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Mappa delle estensioni ai linguaggi supportati dall'editor
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
        'txt': 'plaintext'
      };
      
      // Apri il file nell'editor
      store.addPanel({
        type: 'editor',
        title: `Editor - ${file.name}`,
        position: { x: 150, y: 150 },
        size: { width: 800, height: 500 },
        content: { 
          fileName: file.name,
          fileId: file.id,
          language: languageMap[fileExtension] || 'plaintext',
          value: file.content || ''
        }
      });
      
      return true;
    } catch (error: any) {
      console.error("Errore nell'apertura del file:", error);
      toast.error(`Errore nell'apertura del file: ${error.message}`);
      return false;
    }
  }
}