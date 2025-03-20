// src/components/core/panels/EditorPanel.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { FiSave, FiPlay, FiCode, FiSettings, FiDownload, FiPlus, FiTrash2, FiUpload, 
         FiCopy, FiClipboard, FiCheck, FiGitBranch, FiSearch, FiGitMerge, 
         FiX} from 'react-icons/fi'
import { Panel, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { toast } from 'sonner'

interface EditorPanelProps {
  panel: Panel
}

interface FileTab {
  id: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
}

// Struttura per lo storico dei file (undo/redo)
interface FileHistory {
  past: string[];
  future: string[];
}

export default function EditorPanel({ panel }: EditorPanelProps) {
  const { updatePanelContent } = useWorkspaceStore()
  
  // Stato per gestire file multipli (tabs)
  const [fileTabs, setFileTabs] = useState<FileTab[]>(() => {
    const initialContent = panel.content?.value || '// Scrivi il tuo codice qui\n';
    const initialLanguage = panel.content?.language || 'javascript';
    const initialFileName = panel.content?.fileName || 'untitled.js';
    
    return [{
      id: 'file-' + Date.now(),
      name: initialFileName,
      language: initialLanguage,
      content: initialContent,
      isDirty: false
    }];
  });
  
  const [activeFileId, setActiveFileId] = useState<string>(fileTabs[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [darkTheme, setDarkTheme] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [history, setHistory] = useState<Record<string, FileHistory>>({});
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  
  // Riferimenti
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const activeFile = fileTabs.find(tab => tab.id === activeFileId) || fileTabs[0];
  
  // Inizializza la history al primo render
  useEffect(() => {
    const initialHistory: Record<string, FileHistory> = {};
    fileTabs.forEach(tab => {
      initialHistory[tab.id] = {
        past: [],
        future: []
      };
    });
    setHistory(initialHistory);
  }, []);
  
  // Auto-resize dell'area di testo
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [activeFile.content]);
  
  // Implementazione del salvataggio automatico
  useEffect(() => {
    if (autoSave && activeFile.isDirty) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [activeFile.content, autoSave, activeFile.isDirty]);
  
  // Funzione per ottenere l'estensione dal nome del file
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop() || '';
  };
  
  // Funzione per ottenere il linguaggio dall'estensione
  const getLanguageFromExtension = (extension: string): string => {
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'py': 'python',
      'rb': 'ruby',
      'php': 'php',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext',
      'sh': 'bash',
      'sql': 'sql',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'dart': 'dart',
    };
    
    return extensionMap[extension.toLowerCase()] || 'plaintext';
  };
  
  // Linguaggi supportati
  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
    { value: 'html', label: 'HTML', extension: 'html' },
    { value: 'css', label: 'CSS', extension: 'css' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'json', label: 'JSON', extension: 'json' },
    { value: 'markdown', label: 'Markdown', extension: 'md' },
    { value: 'sql', label: 'SQL', extension: 'sql' },
    { value: 'php', label: 'PHP', extension: 'php' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'go', label: 'Go', extension: 'go' },
    { value: 'rust', label: 'Rust', extension: 'rs' },
    { value: 'ruby', label: 'Ruby', extension: 'rb' },
    { value: 'csharp', label: 'C#', extension: 'cs' },
    { value: 'bash', label: 'Bash', extension: 'sh' },
  ];
  
  // Aggiorna il linguaggio e l'estensione del file quando cambia il linguaggio
  const handleLanguageChange = (newLanguage: string) => {
    // Trova l'estensione corrispondente al nuovo linguaggio
    const language = languages.find(lang => lang.value === newLanguage);
    const extension = language?.extension || 'txt';
    
    // Aggiorna il nome del file con la nuova estensione
    const currentName = activeFile.name;
    const baseName = currentName.includes('.') 
      ? currentName.substring(0, currentName.lastIndexOf('.')) 
      : currentName;
    const newName = `${baseName}.${extension}`;
    
    // Aggiorna il tab attivo
    setFileTabs(prev => 
      prev.map(tab => 
        tab.id === activeFileId 
          ? { ...tab, language: newLanguage, name: newName, isDirty: true } 
          : tab
      )
    );
  };
  
  // Gestisce il salvataggio del codice
  const handleSave = () => {
    // Aggiorna il contenuto del pannello
    updatePanelContent(panel.id, {
      ...panel.content,
      value: activeFile.content,
      fileName: activeFile.name,
      language: activeFile.language
    });
    
    // Aggiorna lo stato dirty del file
    setFileTabs(prev => 
      prev.map(tab => 
        tab.id === activeFileId 
          ? { ...tab, isDirty: false } 
          : tab
      )
    );
    
    // Mostra una notifica
    toast.success(`File ${activeFile.name} salvato!`);
    
    // Simula il salvataggio in un filesystem
    localStorage.setItem(`jarvis-editor-file-${activeFile.id}`, activeFile.content);
  };
  
  // Funzione per eseguire il codice in base al linguaggio
  const handleRun = () => {
    toast.info(`Esecuzione di ${activeFile.name} in corso...`);
    
    // Salva prima di eseguire
    if (activeFile.isDirty) {
      handleSave();
    }
    
    // Simula un ritardo di esecuzione
    setTimeout(() => {
      try {
        switch (activeFile.language) {
          case 'javascript':
            // Esegue il codice JavaScript in un contesto sicuro
            try {
              // Preparazione dell'ambiente
              const consoleOutput: string[] = [];
              const customConsole = {
                log: (...args: any[]) => {
                  consoleOutput.push(args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                  ).join(' '));
                },
                error: (...args: any[]) => {
                  consoleOutput.push(`Error: ${args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                  ).join(' ')}`);
                },
                warn: (...args: any[]) => {
                  consoleOutput.push(`Warning: ${args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                  ).join(' ')}`);
                }
              };
              
              // Esegue il codice in un contesto isolato
              const result = new Function('console', `
                try {
                  ${activeFile.content}
                  return { success: true, output: console };
                } catch (error) {
                  return { success: false, error: error.message };
                }
              `)(customConsole);
              
              if (result.success) {
                if (consoleOutput.length > 0) {
                  // Crea un nuovo tab con l'output della console
                  const outputTabId = 'output-' + Date.now();
                  const outputTab: FileTab = {
                    id: outputTabId,
                    name: 'console-output.txt',
                    language: 'plaintext',
                    content: `// Output dell'esecuzione di ${activeFile.name}\n// ${new Date().toLocaleString()}\n\n${consoleOutput.join('\n')}`,
                    isDirty: false
                  };
                  
                  setFileTabs(prev => [...prev, outputTab]);
                  setActiveFileId(outputTabId);
                  
                  // Inizializza la history per il nuovo tab
                  setHistory(prev => ({
                    ...prev,
                    [outputTabId]: { past: [], future: [] }
                  }));
                } else {
                  toast.success('Esecuzione completata senza output');
                }
              } else {
                toast.error(`Errore: ${result.error}`);
              }
            } catch (error: any) {
              toast.error(`Errore di sintassi: ${error.message}`);
            }
            break;
            
          case 'html':
            // Per HTML, apri una nuova finestra con il contenuto
            const blob = new Blob([activeFile.content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            URL.revokeObjectURL(url);
            toast.success('Anteprima HTML aperta in una nuova scheda');
            break;
            
          case 'css':
            // Per CSS, mostra un'anteprima con un HTML di base
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>${activeFile.content}</style>
              </head>
              <body>
                <div class="container">
                  <h1>Anteprima CSS</h1>
                  <p>Questo è un esempio di testo con il tuo CSS applicato.</p>
                  <button>Pulsante di esempio</button>
                  <div class="box">Box di esempio</div>
                </div>
              </body>
              </html>
            `;
            const cssBlob = new Blob([htmlContent], { type: 'text/html' });
            const cssUrl = URL.createObjectURL(cssBlob);
            window.open(cssUrl, '_blank');
            URL.revokeObjectURL(cssUrl);
            toast.success('Anteprima CSS aperta in una nuova scheda');
            break;
            
          case 'python':
            toast.info('Simulazione esecuzione Python...');
            // Simuliamo l'output di Python
            setTimeout(() => {
              // Crea un nuovo tab con l'output simulato
              const pythonOutputId = 'python-output-' + Date.now();
              const pythonOutput = simulatePythonExecution(activeFile.content);
              
              const outputTab: FileTab = {
                id: pythonOutputId,
                name: 'python-output.txt',
                language: 'plaintext',
                content: pythonOutput,
                isDirty: false
              };
              
              setFileTabs(prev => [...prev, outputTab]);
              setActiveFileId(pythonOutputId);
              
              // Inizializza la history per il nuovo tab
              setHistory(prev => ({
                ...prev,
                [pythonOutputId]: { past: [], future: [] }
              }));
              
              toast.success('Esecuzione Python completata');
            }, 1500);
            break;
            
          default:
            toast.info(`Esecuzione di ${activeFile.language} non supportata in questa demo`);
            break;
        }
      } catch (error: any) {
        toast.error(`Errore durante l'esecuzione: ${error.message}`);
      }
    }, 1000);
  };
  
  // Funzione per simulare l'esecuzione di Python
  const simulatePythonExecution = (code: string): string => {
    let output = `# Output simulato dell'esecuzione Python\n# ${new Date().toLocaleString()}\n\n`;
    
    // Estrai i print statements dal codice
    const printRegex = /print\s*\((.*?)\)/g;
    let match;
    let hasPrints = false;
    
    while ((match = printRegex.exec(code)) !== null) {
      hasPrints = true;
      let content = match[1].trim();
      // Rimuovi le virgolette se presenti
      if ((content.startsWith('"') && content.endsWith('"')) || 
          (content.startsWith("'") && content.endsWith("'"))) {
        content = content.substring(1, content.length - 1);
      }
      output += `${content}\n`;
    }
    
    // Se non ci sono print, aggiungi un messaggio
    if (!hasPrints) {
      output += "# L'esecuzione non ha prodotto output (nessun print statement trovato)\n";
      
      // Aggiungi alcuni suggerimenti
      if (code.includes('def ')) {
        output += "# Hai definito una funzione ma non l'hai chiamata\n";
      }
      
      if (code.includes('class ')) {
        output += "# Hai definito una classe ma non hai creato istanze\n";
      }
    }
    
    return output;
  };
  
  // Simula il download del file
  const handleDownload = () => {
    try {
      const blob = new Blob([activeFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`File ${activeFile.name} scaricato`);
    } catch (error) {
      toast.error('Si è verificato un errore durante il download');
    }
  };
  
  // Crea un nuovo file
  const handleNewFile = () => {
    // Genera un nome file predefinito basato sul tipo
    const fileCount = fileTabs.length + 1;
    const newFileName = `file${fileCount}.js`;
    
    const newTab: FileTab = {
      id: 'file-' + Date.now(),
      name: newFileName,
      language: 'javascript',
      content: '// Nuovo file JavaScript\n\n',
      isDirty: false
    };
    
    setFileTabs(prev => [...prev, newTab]);
    setActiveFileId(newTab.id);
    
    // Inizializza la history per il nuovo tab
    setHistory(prev => ({
      ...prev,
      [newTab.id]: { past: [], future: [] }
    }));
  };
  
  // Chiude un file
  const handleCloseFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Se è l'ultimo file, non permettere la chiusura
    if (fileTabs.length <= 1) {
      toast.info('Non puoi chiudere l\'ultimo file');
      return;
    }
    
    // Chiedi conferma se il file è dirty
    const fileToClose = fileTabs.find(tab => tab.id === id);
    if (fileToClose?.isDirty) {
      if (!confirm(`Il file ${fileToClose.name} ha modifiche non salvate. Vuoi chiuderlo comunque?`)) {
        return;
      }
    }
    
    // Rimuovi il file
    const newTabs = fileTabs.filter(tab => tab.id !== id);
    setFileTabs(newTabs);
    
    // Se il file attivo viene chiuso, attiva l'ultimo file
    if (id === activeFileId) {
      setActiveFileId(newTabs[newTabs.length - 1].id);
    }
    
    // Rimuovi la history per questo file
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[id];
      return newHistory;
    });
  };
  
  // Gestisce le modifiche al contenuto del file
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Salva lo stato corrente nella history prima di aggiornare
    if (history[activeFileId]) {
      setHistory(prev => ({
        ...prev,
        [activeFileId]: {
          past: [...prev[activeFileId].past, activeFile.content],
          future: []
        }
      }));
    }
    
    // Aggiorna il contenuto del file
    setFileTabs(prev => 
      prev.map(tab => 
        tab.id === activeFileId 
          ? { ...tab, content: newContent, isDirty: true } 
          : tab
      )
    );
  };
  
  // Funzioni per undo/redo
  const handleUndo = () => {
    const fileHistory = history[activeFileId];
    if (fileHistory && fileHistory.past.length > 0) {
      const newPast = [...fileHistory.past];
      const previous = newPast.pop();
      
      setHistory(prev => ({
        ...prev,
        [activeFileId]: {
          past: newPast,
          future: [activeFile.content, ...fileHistory.future]
        }
      }));
      
      setFileTabs(prev => 
        prev.map(tab => 
          tab.id === activeFileId 
            ? { ...tab, content: previous || '', isDirty: true } 
            : tab
        )
      );
    }
  };
  
  const handleRedo = () => {
    const fileHistory = history[activeFileId];
    if (fileHistory && fileHistory.future.length > 0) {
      const [next, ...newFuture] = fileHistory.future;
      
      setHistory(prev => ({
        ...prev,
        [activeFileId]: {
          past: [...fileHistory.past, activeFile.content],
          future: newFuture
        }
      }));
      
      setFileTabs(prev => 
        prev.map(tab => 
          tab.id === activeFileId 
            ? { ...tab, content: next, isDirty: true } 
            : tab
        )
      );
    }
  };
  
  // Gestisce la ricerca nel testo
  const handleSearch = () => {
    if (!searchText) return;
    
    if (editorRef.current) {
      const content = activeFile.content;
      const selectionStart = editorRef.current.selectionStart;
      
      // Cerca dalla posizione corrente
      const nextIndex = content.indexOf(searchText, selectionStart);
      
      if (nextIndex >= 0) {
        // Imposta la selezione sul testo trovato
        editorRef.current.focus();
        editorRef.current.setSelectionRange(nextIndex, nextIndex + searchText.length);
        
        // Assicurati che sia visibile (scroll)
        const lineHeight = 20; // altezza approssimativa di una riga
        const linesBeforeMatch = content.substring(0, nextIndex).split('\n').length;
        editorRef.current.scrollTop = lineHeight * (linesBeforeMatch - 2);
      } else {
        // Se non trova nulla da questa posizione, ricomincia dall'inizio
        const fromStart = content.indexOf(searchText);
        
        if (fromStart >= 0) {
          editorRef.current.focus();
          editorRef.current.setSelectionRange(fromStart, fromStart + searchText.length);
          
          const lineHeight = 20;
          const linesBeforeMatch = content.substring(0, fromStart).split('\n').length;
          editorRef.current.scrollTop = lineHeight * (linesBeforeMatch - 2);
          
          toast.info('Ricerca ripartita dall\'inizio');
        } else {
          toast.info(`Nessuna corrispondenza trovata per "${searchText}"`);
        }
      }
    }
  };
  
  // Sostituisce il testo trovato
  const handleReplace = () => {
    if (!searchText || !replaceText) return;
    
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const selectedText = activeFile.content.substring(start, end);
      
      // Verifica se il testo selezionato corrisponde al testo di ricerca
      if (selectedText === searchText) {
        // Sostituisci la selezione
        const newContent = 
          activeFile.content.substring(0, start) + 
          replaceText + 
          activeFile.content.substring(end);
        
        // Aggiorna il contenuto del file
        setFileTabs(prev => 
          prev.map(tab => 
            tab.id === activeFileId 
              ? { ...tab, content: newContent, isDirty: true } 
              : tab
          )
        );
        
        // Aggiorna la posizione del cursore
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(start + replaceText.length, start + replaceText.length);
          }
        }, 0);
        
        // Prosegui con la ricerca
        setTimeout(handleSearch, 10);
      } else {
        // Se non c'è una selezione corrispondente, esegui una ricerca
        handleSearch();
      }
    }
  };
  
  // Sostituisce tutte le occorrenze
  const handleReplaceAll = () => {
    if (!searchText || !replaceText) return;
    
    const newContent = activeFile.content.replace(new RegExp(searchText, 'g'), replaceText);
    const count = (activeFile.content.match(new RegExp(searchText, 'g')) || []).length;
    
    if (count > 0) {
      // Aggiorna il contenuto del file
      setFileTabs(prev => 
        prev.map(tab => 
          tab.id === activeFileId 
            ? { ...tab, content: newContent, isDirty: true } 
            : tab
        )
      );
      
      toast.success(`Sostituite ${count} occorrenze`);
    } else {
      toast.info(`Nessuna corrispondenza trovata per "${searchText}"`);
    }
  };
  
  // Copia negli appunti
  const handleCopy = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      
      if (start !== end) {
        const selectedText = activeFile.content.substring(start, end);
        navigator.clipboard.writeText(selectedText)
          .then(() => toast.success('Testo copiato negli appunti'))
          .catch(() => toast.error('Impossibile copiare il testo'));
      } else {
        // Se non c'è selezione, copia l'intero contenuto
        navigator.clipboard.writeText(activeFile.content)
          .then(() => toast.success('Intero file copiato negli appunti'))
          .catch(() => toast.error('Impossibile copiare il testo'));
      }
    }
  };
  
  // Funzione per formattare il codice (solo JavaScript/JSON per semplicità)
  const handleFormat = () => {
    try {
      let formattedContent = activeFile.content;
      
      if (activeFile.language === 'json') {
        // Formatta JSON
        const jsonObj = JSON.parse(activeFile.content);
        formattedContent = JSON.stringify(jsonObj, null, tabSize);
      } else if (['javascript', 'typescript'].includes(activeFile.language)) {
        // Simuliamo la formattazione indentando ogni riga dopo { e }
        formattedContent = formatJavaScript(activeFile.content, tabSize);
      } else {
        toast.info(`La formattazione per ${activeFile.language} non è supportata in questa demo`);
        return;
      }
      
      // Aggiorna il contenuto
      setFileTabs(prev => 
        prev.map(tab => 
          tab.id === activeFileId 
            ? { ...tab, content: formattedContent, isDirty: true } 
            : tab
        )
      );
      
      toast.success('Codice formattato');
    } catch (error: any) {
      toast.error(`Errore durante la formattazione: ${error.message}`);
    }
  };
  
  // Funzione semplice per formattare codice JavaScript
  const formatJavaScript = (code: string, spaces: number): string => {
    const lines = code.split('\n');
    let formattedLines: string[] = [];
    let indentLevel = 0;
    
    for (let line of lines) {
      // Rimuovi spazi all'inizio e alla fine
      const trimmedLine = line.trim();
      
      // Se la riga contiene solo una parentesi chiusa, riduci l'indentazione prima
      if (/^[\}\]\)]+$/.test(trimmedLine)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Aggiungi la riga con l'indentazione corretta
      if (trimmedLine.length > 0) {
        formattedLines.push(' '.repeat(indentLevel * spaces) + trimmedLine);
      } else {
        formattedLines.push('');
      }
      
      // Aumenta l'indentazione dopo apertura di blocco
      if (trimmedLine.includes('{') || trimmedLine.includes('[')) {
        indentLevel++;
      }
      
      // Riduci l'indentazione dopo chiusura di blocco (ma non se già fatto)
      if (trimmedLine.includes('}') || trimmedLine.includes(']')) {
        if (!/^[\}\]\)]+$/.test(trimmedLine)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
      }
    }
    
    return formattedLines.join('\n');
  };
  
  // Gestisce il caricamento di un file
  const handleFileUpload = () => {
    // Crea un input file nascosto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.js,.ts,.html,.css,.py,.json,.txt,.md';
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            // Determina il linguaggio dall'estensione
            const extension = getFileExtension(file.name);
            const language = getLanguageFromExtension(extension);
            
            // Crea un nuovo tab con il contenuto del file
            const newFileId = 'file-' + Date.now();
            const newFile: FileTab = {
              id: newFileId,
              name: file.name,
              language,
              content: event.target.result,
              isDirty: false
            };
            
            setFileTabs(prev => [...prev, newFile]);
            setActiveFileId(newFile.id);
            
            // Inizializza la history per il nuovo tab
            setHistory(prev => ({
              ...prev,
              [newFileId]: { past: [], future: [] }
            }));
            
            toast.success(`File ${file.name} caricato`);
          }
        };
        
        reader.readAsText(file);
      }
    };
    
    // Simula il click per aprire il selettore di file
    fileInput.click();
  };
  
  // Indenta l'editor quando si preme Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Gestione del tasto Tab per indentare il codice
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const element = e.target as HTMLTextAreaElement;
      const start = element.selectionStart;
      const end = element.selectionEnd;
      
      // Ottieni il contenuto attuale
      const value = element.value;
      
      // Aggiungi l'indentazione
      const newContent = 
        value.substring(0, start) + 
        ' '.repeat(tabSize) + 
        value.substring(end);
      
      // Aggiorna il contenuto del file
      setFileTabs(prev => 
        prev.map(tab => 
          tab.id === activeFileId 
            ? { ...tab, content: newContent, isDirty: true } 
            : tab
        )
      );
      
      // Aggiorna la posizione del cursore
      setTimeout(() => {
        element.selectionStart = element.selectionEnd = start + tabSize;
      }, 0);
    }
    
    // Scorciatoie da tastiera
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'f':
          e.preventDefault();
          setShowSearch(true);
          break;
        case 'h':
          e.preventDefault();
          setShowSearch(true);
          setShowReplace(true);
          break;
        case 'z':
          e.preventDefault();
          handleUndo();
          break;
        case 'y':
          e.preventDefault();
          handleRedo();
          break;
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Barra degli strumenti */}
      <div className="px-4 py-2 border-b border-white/10 bg-surface-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleNewFile}
            title="Nuovo file"
          >
            <FiPlus size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleFileUpload}
            title="Carica file"
          >
            <FiUpload size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleSave}
            title="Salva (Ctrl+S)"
          >
            <FiSave size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleDownload}
            title="Scarica"
          >
            <FiDownload size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleCopy}
            title="Copia negli appunti"
          >
            <FiCopy size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setShowSearch(!showSearch)}
            title="Cerca (Ctrl+F)"
          >
            <FiSearch size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Selezione linguaggio */}
          <select
            className="bg-surface py-1 px-2 rounded border border-white/10 outline-none focus:border-primary text-sm"
            value={activeFile.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            title="Seleziona linguaggio"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleRun}
            title="Esegui codice"
          >
            <FiPlay size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleFormat}
            title="Formatta codice"
          >
            <FiCode size={16} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setShowSettings(!showSettings)}
            title="Impostazioni"
          >
            <FiSettings size={16} />
          </button>
        </div>
      </div>
      
      {/* Barra delle schede */}
      <div className="flex items-center border-b border-white/10 bg-surface-dark overflow-x-auto">
        {fileTabs.map(tab => (
          <div 
            key={tab.id}
            className={`flex items-center min-w-0 max-w-48 h-9 px-3 border-r border-white/10 cursor-pointer ${
              tab.id === activeFileId ? 'bg-surface' : 'bg-surface-dark hover:bg-surface/50'
            }`}
            onClick={() => setActiveFileId(tab.id)}
          >
            <div className="truncate text-sm mr-2">
              {tab.name}
              {tab.isDirty && <span className="text-primary ml-1">•</span>}
            </div>
            <button
              className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white/80"
              onClick={(e) => handleCloseFile(tab.id, e)}
              title="Chiudi scheda"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Barra di ricerca */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-white/10 bg-surface flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cerca..."
              className="w-48 bg-surface-dark rounded py-1 px-2 text-sm border border-white/10 focus:border-primary outline-none"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary"
              onClick={handleSearch}
            >
              <FiSearch size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-white/10 text-white/70"
              onClick={() => setShowReplace(!showReplace)}
              title="Mostra/nascondi opzioni di sostituzione"
            >
              {showReplace ? <FiCheck size={14} /> : <FiClipboard size={14} />}
            </button>
          </div>
          
          {showReplace && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Sostituisci con..."
                className="w-48 bg-surface-dark rounded py-1 px-2 text-sm border border-white/10 focus:border-primary outline-none"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
              <button
                className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary"
                onClick={handleReplace}
                title="Sostituisci"
              >
                <FiClipboard size={14} />
              </button>
              <button
                className="p-1 rounded bg-primary/20 hover:bg-primary/30 text-primary"
                onClick={handleReplaceAll}
                title="Sostituisci tutto"
              >
                <FiGitMerge size={14} />
              </button>
            </div>
          )}
          
          <button
            className="ml-auto p-1 rounded hover:bg-white/10 text-white/70"
            onClick={() => setShowSearch(false)}
            title="Chiudi"
          >
            <FiX size={14} />
          </button>
        </div>
      )}
      
      {/* Pannello impostazioni */}
      {showSettings && (
        <div className="absolute right-4 top-14 w-64 bg-surface-dark border border-white/10 rounded-lg shadow-xl z-10 p-4">
          <h3 className="font-medium mb-3 flex items-center justify-between">
            Impostazioni Editor
            <button
              className="p-1 rounded hover:bg-white/10 text-white/70"
              onClick={() => setShowSettings(false)}
            >
              <FiX size={14} />
            </button>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Dimensione testo</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm">{fontSize}px</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-1">Dimensione tab</label>
              <select
                className="w-full bg-surface rounded py-1 px-2 text-sm border border-white/10 focus:border-primary outline-none"
                value={tabSize}
                onChange={(e) => setTabSize(parseInt(e.target.value))}
              >
                <option value="2">2 spazi</option>
                <option value="4">4 spazi</option>
                <option value="8">8 spazi</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Tema scuro</label>
              <button
                className={`w-12 h-6 rounded-full relative ${darkTheme ? 'bg-primary' : 'bg-white/20'}`}
                onClick={() => setDarkTheme(!darkTheme)}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${darkTheme ? 'left-7' : 'left-1'}`}
              >
              </div>
            </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Salvataggio automatico</label>
              <button
                className={`w-12 h-6 rounded-full relative ${autoSave ? 'bg-primary' : 'bg-white/20'}`}
                onClick={() => setAutoSave(!autoSave)}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoSave ? 'left-7' : 'left-1'}`}
                >
                </div>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Numeri di riga</label>
              <button
                className={`w-12 h-6 rounded-full relative ${showLineNumbers ? 'bg-primary' : 'bg-white/20'}`}
                onClick={() => setShowLineNumbers(!showLineNumbers)}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showLineNumbers ? 'left-7' : 'left-1'}`}
                >
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Editor */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Numeri di riga */}
        {showLineNumbers && (
          <div className="w-12 p-4 bg-surface-dark text-white/30 font-mono text-right select-none overflow-y-hidden">
            {activeFile.content.split('\n').map((_, i) => (
              <div 
                key={i} 
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
        
        {/* Area di testo per l'editor */}
        <textarea
          ref={editorRef}
          className="w-full h-full p-4 bg-surface-dark outline-none text-white font-mono resize-none"
          value={activeFile.content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: '1.5',
            backgroundColor: darkTheme ? '#1a1a2e' : '#2a2a3a'
          }}
        />
      </div>
      
      {/* Status bar */}
      <div className="px-4 py-1 border-t border-white/10 bg-surface-dark flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-4">
          <div>{activeFile.language.toUpperCase()}</div>
          <div>Riga: {activeFile.content.substring(0, editorRef.current?.selectionStart || 0).split('\n').length}</div>
          <div>Colonna: {
            editorRef.current?.selectionStart !== undefined 
              ? (activeFile.content.substring(0, editorRef.current.selectionStart).split('\n').pop() || '').length 
              : 0
          }</div>
          <div>{activeFile.content.split('\n').length} righe</div>
        </div>
        <div>
          {activeFile.isDirty ? 'Non salvato' : 'Salvato'}
        </div>
      </div>
    </div>
  )
}