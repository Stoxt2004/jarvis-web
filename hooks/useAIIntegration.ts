// src/hooks/useAIIntegration.ts
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore';
import { ParsedCommand, parseUserCommand, executeCommand } from '@/lib/services/openaiService';
import { toast } from 'sonner';

/**
 * Hook personalizzato per integrare l'AI con il sistema
 * Gestisce l'elaborazione dei comandi e l'esecuzione delle azioni
 */
export function useAIIntegration() {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);
  const { addPanel, panels, removePanel, updatePanelContent } = useWorkspaceStore();

  /**
   * Elabora un comando dell'utente
   */
  const processCommand = useCallback(async (userInput: string): Promise<{
    response: string;
    command: ParsedCommand;
  }> => {
    setIsProcessing(true);
    
    try {
      // 1. Analizza il comando dell'utente
      const parsedCommand = await parseUserCommand(userInput, session?.user?.id || '');
      setLastCommand(parsedCommand);
      
      // 2. Esegui il comando per ottenere una risposta testuale
      let response: string;
      
      // Se l'utente è autenticato, esegui il comando
      if (session?.user?.id) {
        response = await executeCommand(parsedCommand, session.user.id);
        
        // 3. Esegui azioni reali nel sistema
        await executeSystemAction(parsedCommand);
      } else {
        // Se l'utente non è autenticato, segnala che alcune funzionalità sono limitate
        response = "Mi dispiace, devi accedere per eseguire questo comando.";
      }
      
      return { response, command: parsedCommand };
    } catch (error: any) {
      console.error('Errore nell\'elaborazione del comando:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [session]);

  /**
   * Esegue azioni reali nel sistema in base al comando analizzato
   */
  const executeSystemAction = useCallback(async (parsedCommand: ParsedCommand): Promise<void> => {
    try {
      switch (parsedCommand.type) {
        case 'OPEN_APP':
          // Apre l'applicazione specificata
          const appType = parsedCommand.params.appType as PanelType;
          if (!appType) {
            toast.error("Application type not specified");
            return;
          }
          
          // Posizioni e dimensioni di default per diverse app
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
            },
            calendar: {
              position: { x: 300, y: 300 },
              size: { width: 600, height: 400 }
            }
          };
          
          // Crea titoli appropriati per le app
          const appTitles: Record<PanelType, string> = {
            browser: 'Browser Web',
            editor: 'Editor',
            fileManager: 'File Manager',
            terminal: 'Terminale',
            notes: 'Note',
            dashboard: 'Dashboard',
            calendar: 'Calendario'
          };
          
          // Contenuto predefinito per le app
          const appContents: Partial<Record<PanelType, any>> = {
            browser: { url: 'https://www.google.com' },
            editor: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' },
            notes: { text: '' }
          };
          
          // Aggiungi il pannello allo workspace
          addPanel({
            type: appType,
            title: appTitles[appType] || `Nuova ${appType}`,
            position: appDefaults[appType].position,
            size: appDefaults[appType].size,
            content: appContents[appType] || {}
          });
          
          break;
          
        case 'CLOSE_APP':
          // Chiude l'applicazione specificata (per ID o tipo)
          const { appId, appType: closeAppType } = parsedCommand.params;
          
          if (appId) {
            // Cerca il pannello con l'ID specificato
            const panelToClose = panels.find(p => p.id === appId);
            if (panelToClose) {
              removePanel(panelToClose.id);
            } else {
              toast.error(`No panel found with ID: ${appId}`);
            }
          } else if (closeAppType) {
            // Cerca i pannelli del tipo specificato
            const panelsToClose = panels.filter(p => p.type === closeAppType);
            // Chiudi l'ultimo pannello di quel tipo (se ce ne sono)
            if (panelsToClose.length > 0) {
              removePanel(panelsToClose[panelsToClose.length - 1].id);
            } else {
              toast.error(`Nessun pannello di tipo ${closeAppType} trovato`);
            }
          } else {
            toast.error("Specificare ID pannello o tipo applicazione da chiudere");
          }
          
          break;
          
        case 'CREATE_FILE':
          // La creazione del file viene gestita dal servizio OpenAI
          // Ma possiamo aprire l'editor con il nuovo file
          if (parsedCommand.params.fileName && session?.user?.id) {
            // Implementazione semplificata: apri un editor con il contenuto
            const fileName = parsedCommand.params.fileName;
            const content = parsedCommand.params.content || '';
            
            // Ottieni il tipo di file dall'estensione
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
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
            
            // Crea un nuovo pannello editor con il file
            addPanel({
              type: 'editor',
              title: `Editor - ${fileName}`,
              position: { x: 150, y: 150 },
              size: { width: 800, height: 500 },
              content: { 
                fileName: fileName,
                language: languageMap[extension] || 'plaintext',
                value: content
              }
            });
          }
          break;
          
        // Altri casi possono essere aggiunti per gestire diverse azioni di sistema
          
        default:
          // Nessuna azione di sistema da eseguire
          break;
      }
    } catch (error) {
      console.error('Errore nell\'esecuzione dell\'azione di sistema:', error);
      toast.error('Si è verificato un errore durante l\'esecuzione del comando');
    }
  }, [addPanel, panels, removePanel, session]);

  return {
    processCommand,
    isProcessing,
    lastCommand,
    executeSystemAction
  };
}