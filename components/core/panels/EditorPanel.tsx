// src/components/core/panels/EditorPanel.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { FiSave, FiPlay, FiCode, FiSettings, FiDownload, FiPlus, FiTrash2, FiUpload,
  FiCopy, FiClipboard, FiCheck, FiGitBranch, FiSearch, FiGitMerge, FiX, FiMessageSquare } from 'react-icons/fi'
import { Panel, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { toast } from 'sonner'
import CodeAssistant from '../../ai/CodeAssistant'
import { executeCommand } from '@/lib/services/openaiService';

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
  const [fileTabs, setFileTabs] = useState(() => {
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
  
  const [activeFileId, setActiveFileId] = useState(fileTabs[0].id);
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
  const [showCodeAssistant, setShowCodeAssistant] = useState(false)  
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
  
  const handleRun = () => {
    try {
      // Per JavaScript/TypeScript, puoi usare eval in ambiente di sviluppo
      // In produzione, sarebbe meglio usare un approccio più sicuro
      if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
        // Esegui in un contesto isolato
        const result = new Function(activeFile.content)();
        toast.success('Codice eseguito con successo');
      } else {
        toast.info(`Esecuzione del codice ${activeFile.language} non supportata nell'editor`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Errore nell'esecuzione: ${errorMessage}`);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([activeFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`File ${activeFile.name} scaricato`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Errore nel download: ${errorMessage}`);
    }
  };

  const handleNewFile = () => {
    const fileName = prompt('Nome del nuovo file:');
    if (!fileName) return;
    
    // Determina l'estensione e il linguaggio
    const extension = fileName.split('.').pop() || 'js';
    let language = 'javascript';
    
    // Mappa le estensioni comuni ai linguaggi
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp'
    };
    
    if (extensionMap[extension]) {
      language = extensionMap[extension];
    }
    
    // Crea il nuovo file
    const newFile: FileTab = {
      id: 'file-' + Date.now(),
      name: fileName,
      language,
      content: '',
      isDirty: false
    };
    
    // Aggiungi il file e imposta come attivo
    setFileTabs(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    
    // Inizializza la history per il nuovo file
    setHistory(prev => ({
      ...prev,
      [newFile.id]: { past: [], future: [] }
    }));
    
    toast.success(`Nuovo file ${fileName} creato`);
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.ts,.html,.css,.json,.md,.py,.java,.c,.cpp,.txt';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        // Determina il linguaggio dall'estensione
        const extension = file.name.split('.').pop() || 'txt';
        let language = 'text';
        
        // Mappa le estensioni comuni ai linguaggi
        const extensionMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'html': 'html',
          'css': 'css',
          'json': 'json',
          'md': 'markdown',
          'py': 'python',
          'java': 'java',
          'c': 'c',
          'cpp': 'cpp'
        };
        
        if (extensionMap[extension]) {
          language = extensionMap[extension];
        }
        
        // Crea il nuovo file
        const newFile: FileTab = {
          id: 'file-' + Date.now(),
          name: file.name,
          language,
          content,
          isDirty: false
        };
        
        // Aggiungi il file e imposta come attivo
        setFileTabs(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        
        // Inizializza la history per il nuovo file
        setHistory(prev => ({
          ...prev,
          [newFile.id]: { past: [], future: [] }
        }));
        
        toast.success(`File ${file.name} caricato`);
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleFormat = () => {
    try {
      // In un'implementazione reale, utilizzeresti una libreria come prettier
      // Per ora, facciamo una semplice indentazione
      const formattedCode = activeFile.content
        .split('\n')
        .map((line: string) => line.trim())
        .join('\n');
      
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
            ? { ...tab, content: formattedCode, isDirty: true }
            : tab
        )
      );
      
      toast.success('Codice formattato');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Errore nella formattazione: ${errorMessage}`);
    }
  };

  const handleCloseFile = (fileId: string, e?: React.MouseEvent) => {
    // Previeni la propagazione dell'evento se fornito
    if (e) {
      e.stopPropagation();
    }
    
    // Controlla se il file è l'unico rimasto
    if (fileTabs.length === 1) {
      toast.info('Non puoi chiudere l\'unico file aperto');
      return;
    }
    
    // Controlla se il file ha modifiche non salvate
    const fileToClose = fileTabs.find(tab => tab.id === fileId);
    if (fileToClose?.isDirty) {
      if (!confirm(`Il file "${fileToClose.name}" ha modifiche non salvate. Vuoi chiuderlo comunque?`)) {
        return;
      }
    }
    
    // Rimuovi il file dalle schede
    const newFileTabs = fileTabs.filter(tab => tab.id !== fileId);
    setFileTabs(newFileTabs);
    
    // Se il file chiuso era quello attivo, imposta un altro file come attivo
    if (fileId === activeFileId) {
      setActiveFileId(newFileTabs[0].id);
    }
    
    // Rimuovi la history del file
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[fileId];
      return newHistory;
    });
    
    toast.success(`File chiuso`);
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      toast.info('Inserisci un testo da cercare');
      return;
    }
    
    const content = activeFile.content;
    const searchRegex = new RegExp(searchText, 'gi');
    const matches = content.match(searchRegex);
    
    if (!matches) {
      toast.info(`Nessuna corrispondenza trovata per "${searchText}"`);
      return;
    }
    
    // Qui potresti implementare la selezione del testo trovato
    // o lo scroll alla posizione corretta
    toast.success(`Trovate ${matches.length} corrispondenze per "${searchText}"`);
    
    // Esempio: seleziona la prima occorrenza
    const firstIndex = content.toLowerCase().indexOf(searchText.toLowerCase());
    if (firstIndex >= 0 && editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(firstIndex, firstIndex + searchText.length);
    }
  };

  const handleReplace = () => {
    if (!searchText.trim()) {
      toast.info('Inserisci un testo da cercare');
      return;
    }
    
    const content = activeFile.content;
    const firstIndex = content.toLowerCase().indexOf(searchText.toLowerCase());
    
    if (firstIndex < 0) {
      toast.info(`Nessuna corrispondenza trovata per "${searchText}"`);
      return;
    }
    
    // Sostituisci la prima occorrenza
    const newContent = 
      content.substring(0, firstIndex) + 
      replaceText + 
      content.substring(firstIndex + searchText.length);
    
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
    
    toast.success(`Sostituita la prima occorrenza di "${searchText}" con "${replaceText}"`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Gestisci i tasti di scelta rapida qui
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
    // Aggiungi altre scorciatoie da tastiera secondo necessità
  };

  const handleReplaceAll = () => {
    if (!searchText.trim()) {
      toast.info('Inserisci un testo da cercare');
      return;
    }
    
    const content = activeFile.content;
    const searchRegex = new RegExp(searchText, 'gi');
    const newContent = content.replace(searchRegex, replaceText);
    
    if (newContent === content) {
      toast.info(`Nessuna corrispondenza trovata per "${searchText}"`);
      return;
    }
    
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
    
    // Conta quante sostituzioni sono state fatte
    const matches = content.match(searchRegex);
    const count = matches ? matches.length : 0;
    
    toast.success(`Sostituite ${count} occorrenze di "${searchText}" con "${replaceText}"`);
  };

  // Funzione per gestire il cambiamento del contenuto dell'editor
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFileTabs(prev =>
      prev.map(tab =>
        tab.id === activeFileId
          ? { ...tab, content: newContent, isDirty: true }
          : tab
      )
    );
  };

  // Funzione per salvare il contenuto dell'editor
  const handleSave = () => {
    const activeFile = fileTabs.find(tab => tab.id === activeFileId);
    if (activeFile) {
      updatePanelContent(panel.id, activeFile.content);
      setFileTabs(prev =>
        prev.map(tab =>
          tab.id === activeFileId
            ? { ...tab, isDirty: false }
            : tab
        )
      );
      toast.success('File salvato con successo');
    }
  };

  // Funzioni esistenti...
  const loadAndSetActiveFileId = async (id: string) => {
    const content = await loadFileContent(id);
    if (content) {
      setFileTabs(prev =>
        prev.map(tab =>
          tab.id === id
            ? { ...tab, content }
            : tab
        )
      );
    }
    // Aggiorna l'ID del file attivo
    setActiveFileId(id);
  };
  // Funzione per applicare il codice generato dall'AI
  const handleCodeGenerated = async (newCode: string) => {
    try {
      const response = await executeCommand({
        type: 'CREATE_FILE',
        params: {
          fileName: activeFile.name,
          content: newCode,
          type: activeFile.language,
          path: '/'
        },
        originalText: `Aggiorna il file ${activeFile.name} con il nuovo codice`
      }, 'user-id'); // Sostituisci con l'ID utente reale
      
      setFileTabs(prev =>
        prev.map(tab =>
          tab.id === activeFileId
            ? { ...tab, content: newCode, isDirty: true }
            : tab
        )
      );
      
      toast.success(response);
    } catch (error: any) {
      toast.error(`Errore nell'aggiornamento del file: ${error.message}`);
    }
  };

  const loadFileContent = async (fileId: string) => {
    try {
      const response = await executeCommand({
        type: 'READ_FILE',
        params: { fileId },
        originalText: `Leggi il contenuto del file con ID ${fileId}`
      }, 'user-id'); // Sostituisci con l'ID utente reale
      
      // Assumiamo che la risposta contenga il contenuto del file
      return response;
    } catch (error: any) {
      toast.error(`Errore nel caricamento del file: ${error.message}`);
      return null;
    }
  };

  
  
  // Funzione per generare un nuovo progetto con l'AI
  const handleLanguageChange = (newLanguage: string) => {
    setFileTabs(prev =>
      prev.map(tab =>
        tab.id === activeFileId
          ? { ...tab, language: newLanguage }
          : tab
      )
    );
  };

  const handleGenerateProject = () => {
    const projectType = prompt('Che tipo di progetto vuoi creare? (es. "To-do app con React", "Blog con Next.js", ecc.)');
    if (!projectType) return;
    
    toast.info(`Generazione di un progetto "${projectType}" in corso...`);
    
    // Qui simuliamo la generazione di file multipli
    setTimeout(() => {
      // Crea index.html
      const htmlFile: FileTab = {
        id: 'file-' + Date.now(),
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectType}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>`,
        isDirty: false
      };
      
      // Crea styles.css
      const cssFile: FileTab = {
        id: 'file-' + Date.now() + 1,
        name: 'styles.css',
        language: 'css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

#app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}`,
        isDirty: false
      };
      
      // Crea app.js
      const jsFile: FileTab = {
        id: 'file-' + Date.now() + 2,
        name: 'app.js',
        language: 'javascript',
        content: `// ${projectType} - Generated by AI Assistant
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  app.innerHTML = \`
    <h1>${projectType}</h1>
    <p>This is a starter template for your project.</p>
    <button id="actionButton">Click me</button>
  \`;
  
  document.getElementById('actionButton').addEventListener('click', () => {
    alert('Button clicked! Add your functionality here.');
  });
});`,
        isDirty: false
      };
      
      // Aggiungi i file al progetto
      setFileTabs([htmlFile, cssFile, jsFile]);
      setActiveFileId(htmlFile.id);
      
      // Inizializza la history per i nuovi file
      setHistory(prev => ({
        [htmlFile.id]: { past: [], future: [] },
        [cssFile.id]: { past: [], future: [] },
        [jsFile.id]: { past: [], future: [] }
      }));
      
      toast.success('Progetto generato con successo!');
    }, 2000);
  };
  
  // Continua da EditorPanel.tsx

  return (
    <div className={`flex flex-col h-full ${darkTheme ? 'dark bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Barra degli strumenti */}
      <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <button 
          onClick={handleSave}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Salva (Ctrl+S)"
        >
          <FiSave />
        </button>
        <button 
          onClick={handleRun}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Esegui (Ctrl+Enter)"
        >
          <FiPlay />
        </button>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Cerca (Ctrl+F)"
        >
          <FiSearch />
        </button>
        <button 
          onClick={handleDownload}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Scarica"
        >
          <FiDownload />
        </button>
        <button 
          onClick={handleNewFile}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Nuovo file"
        >
          <FiPlus />
        </button>
        <button 
          onClick={handleFileUpload}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Carica file"
        >
          <FiUpload />
        </button>
        <button 
          onClick={handleFormat}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Formatta codice"
        >
          <FiCode />
        </button>
        <button 
          onClick={() => setShowCodeAssistant(!showCodeAssistant)}
          className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            showCodeAssistant ? 'bg-blue-100 dark:bg-blue-800' : ''
          }`}
          title="Assistente Codice"
        >
          <FiMessageSquare />
        </button>
        
        <div className="flex-1"></div>
        
        <select 
          value={activeFile.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          title="Seleziona linguaggio"
          className="p-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded mr-2"
        >
          {[
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'csharp', label: 'C#' },
            { value: 'cpp', label: 'C++' },
            { value: 'ruby', label: 'Ruby' },
            { value: 'go', label: 'Go' },
            { value: 'php', label: 'PHP' },
            { value: 'swift', label: 'Swift' }
          ].map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" 
          title="Impostazioni"
        >
          <FiSettings />
        </button>
      </div>
      
      {/* Barra delle schede */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {fileTabs.map(tab => (
          <div 
            key={tab.id}
            className={`flex items-center px-3 py-2 cursor-pointer border-r border-gray-200 dark:border-gray-700 ${
              tab.id === activeFileId 
                ? 'bg-white dark:bg-gray-900 font-medium' 
                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveFileId(tab.id)}
          >
            <span className="truncate max-w-xs">
              {tab.name}
              {tab.isDirty && ' •'}
            </span>
            <button 
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
        <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <input
            type="text"
            placeholder="Cerca nel file..."
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded mr-2 flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
            onClick={handleSearch}
          >
            Trova
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
            onClick={() => setShowReplace(!showReplace)}
            title="Mostra/nascondi opzioni di sostituzione"
          >
            {showReplace ? 'Nascondi sostituzione' : 'Sostituisci'}
          </button>
          {showReplace && (
            <>
              <input
                type="text"
                placeholder="Sostituisci con..."
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded mr-2 flex-1"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
              <button 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
                onClick={handleReplace}
              >
                Sostituisci
              </button>
              <button 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
                onClick={handleReplaceAll}
              >
                Sostituisci tutto
              </button>
            </>
          )}
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setShowSearch(false)}
            title="Chiudi"
          >
            <FiX />
          </button>
        </div>
      )}
      
      {/* Pannello impostazioni */}
      {showSettings && (
        <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-4 z-10 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Impostazioni Editor</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowSettings(false)}
            >
              <FiX />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label>Dimensione testo</label>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="10" 
                  max="24" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="ml-2 w-10 text-right">{fontSize}px</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label>Dimensione tab</label>
              <select 
                value={tabSize} 
                onChange={(e) => setTabSize(parseInt(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
              >
                <option value="2">2 spazi</option>
                <option value="4">4 spazi</option>
                <option value="8">8 spazi</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label>Tema scuro</label>
              <input 
                type="checkbox" 
                checked={darkTheme} 
                onChange={() => setDarkTheme(!darkTheme)}
                className="h-5 w-5"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label>Salvataggio automatico</label>
              <input 
                type="checkbox" 
                checked={autoSave} 
                onChange={() => setAutoSave(!autoSave)}
                className="h-5 w-5"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label>Numeri di riga</label>
              <input 
                type="checkbox" 
                checked={showLineNumbers} 
                onChange={() => setShowLineNumbers(!showLineNumbers)}
                className="h-5 w-5"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Area principale con editor e assistente AI */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex relative">
          {/* Numeri di riga */}
          {showLineNumbers && (
            <div className="text-right pr-2 pt-2 pb-2 bg-gray-50 dark:bg-gray-800 text-gray-500 select-none overflow-y-auto">
              {activeFile.content.split('\n').map((_: string, i: number) => (
                <div key={i} className="leading-6" style={{ fontSize: `${fontSize}px` }}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          
          {/* Area di testo per l'editor */}
    <textarea
      ref={editorRef}
      className="flex-1 p-2 resize-none outline-none font-mono bg-white dark:bg-gray-900 text-black dark:text-white"
      style={{ 
        fontSize: `${fontSize}px`, 
        lineHeight: '1.5',
        tabSize: tabSize
      }}
      value={activeFile.content}
      onChange={handleContentChange}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
          
          {/* Assistente Codice */}
            {showCodeAssistant && (
              <CodeAssistant 
                onCodeGenerated={handleCodeGenerated}
                currentCode={activeFile.content}
                language={activeFile.language}
                fileName={activeFile.name}
              />
            )}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{activeFile.language.toUpperCase()}</span>
          <span>
            Riga: {activeFile.content.substring(0, editorRef.current?.selectionStart || 0).split('\n').length}
          </span>
          <span>
            Colonna: {
              editorRef.current?.selectionStart !== undefined
                ? (activeFile.content.substring(0, editorRef.current.selectionStart).split('\n').pop() || '').length
                : 0
            }
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{activeFile.content.split('\n').length} righe</span>
          <span>{activeFile.isDirty ? 'Non salvato' : 'Salvato'}</span>
        </div>
      </div>
    </div>
  );
}

