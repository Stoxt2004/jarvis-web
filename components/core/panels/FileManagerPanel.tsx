// src/components/core/panels/FileManagerPanel.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { FiFolder, FiFile, FiUpload, FiDownload, FiTrash2, FiPlus, 
         FiArrowLeft, FiSearch, FiGrid, FiList, FiMoreVertical, FiEdit2,
         FiCopy, FiClipboard, FiStar, FiPlay, FiChevronRight, FiExternalLink, 
         FiX} from 'react-icons/fi'
import { Panel, useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface FileManagerPanelProps {
  panel: Panel
}

// Definizione delle strutture dati
interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  modified: Date
  path: string
  extension?: string
  content?: string
  color?: string
  starred?: boolean
  tags?: string[]
}

export default function FileManagerPanel({ panel }: FileManagerPanelProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [showTagsMenu, setShowTagsMenu] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Importante', 'Personale', 'Lavoro', 'Progetto', 'Da rivedere'
  ])
  const [newTag, setNewTag] = useState('')
  const [clipboard, setClipboard] = useState<{
    items: FileItem[], 
    operation: 'copy' | 'cut'
  } | null>(null)
  
  // Riferimenti
  const fileManagerRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const { addPanel } = useWorkspaceStore()
  
  // Dati demo per simulare un file system
  const [items, setItems] = useState<FileItem[]>(() => {
    // Prova a caricare i dati dal localStorage
    const savedItems = localStorage.getItem('jarvis-file-manager-items');
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        // Converti le date da stringhe a oggetti Date
        return parsed.map((item: any) => ({
          ...item,
          modified: new Date(item.modified)
        }));
      } catch (e) {
        console.error('Errore nel caricamento dei file:', e);
      }
    }
    
    // Dati predefiniti se non è possibile caricare dal localStorage
    return [
      { 
        id: '1', 
        name: 'Documenti', 
        type: 'folder', 
        modified: new Date(2024, 2, 15), 
        path: '/Documenti',
        color: '#4299e1',
        starred: false,
        tags: ['Importante']
      },
      { 
        id: '2', 
        name: 'Progetti', 
        type: 'folder', 
        modified: new Date(2024, 3, 1), 
        path: '/Progetti',
        color: '#f6ad55',
        starred: true,
        tags: ['Lavoro']
      },
      { 
        id: '3', 
        name: 'Media', 
        type: 'folder', 
        modified: new Date(2024, 3, 10), 
        path: '/Media',
        color: '#f56565',
        starred: false,
        tags: []
      },
      { 
        id: '4', 
        name: 'Report Trimestrale.pdf', 
        type: 'file', 
        size: 1240000, 
        modified: new Date(2024, 3, 5), 
        path: '/Report Trimestrale.pdf',
        extension: 'pdf',
        starred: false,
        tags: ['Lavoro', 'Importante']
      },
      { 
        id: '5', 
        name: 'Note riunione.txt', 
        type: 'file', 
        size: 2500, 
        modified: new Date(2024, 3, 12), 
        path: '/Note riunione.txt',
        extension: 'txt',
        content: 'Punti principali discussi in riunione:\n1. Revisione del progetto\n2. Timeline per il rilascio\n3. Budget per il marketing\n\nAzioni da intraprendere:\n- Completare la documentazione tecnica entro venerdì\n- Preparare la presentazione per i clienti\n- Organizzare un follow-up la prossima settimana',
        starred: true,
        tags: ['Da rivedere']
      },
      { 
        id: '6', 
        name: 'Presentazione.pptx', 
        type: 'file', 
        size: 4500000, 
        modified: new Date(2024, 3, 8), 
        path: '/Presentazione.pptx',
        extension: 'pptx',
        starred: false,
        tags: ['Progetto']
      },
      { 
        id: '7', 
        name: 'Budget.xlsx', 
        type: 'file', 
        size: 3200000, 
        modified: new Date(2024, 3, 14), 
        path: '/Budget.xlsx',
        extension: 'xlsx',
        starred: false,
        tags: ['Lavoro', 'Importante']
      },
      { 
        id: '8', 
        name: 'Logo.png', 
        type: 'file', 
        size: 890000, 
        modified: new Date(2024, 3, 2), 
        path: '/Logo.png',
        extension: 'png',
        starred: false,
        tags: []
      },
      { 
        id: '9', 
        name: 'script.js', 
        type: 'file', 
        size: 1800, 
        modified: new Date(2024, 3, 15), 
        path: '/script.js',
        extension: 'js',
        content: '// Un semplice script JavaScript\nfunction calculateTotal(items) {\n  return items.reduce((total, item) => total + item.price, 0);\n}\n\nconst cart = [\n  { name: "Prodotto 1", price: 29.99 },\n  { name: "Prodotto 2", price: 9.99 },\n  { name: "Prodotto 3", price: 49.99 }\n];\n\nconst total = calculateTotal(cart);\nconsole.log(`Totale: ${total}€`);',
        starred: false,
        tags: ['Progetto']
      },
      { 
        id: '10', 
        name: 'pagina.html', 
        type: 'file', 
        size: 4300, 
        modified: new Date(2024, 3, 18), 
        path: '/pagina.html',
        extension: 'html',
        content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Pagina di esempio</title>\n  <style>\n    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }\n    h1 { color: #333; }\n    .container { max-width: 800px; margin: 0 auto; }\n    .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>La mia pagina HTML</h1>\n    <div class="card">\n      <h2>Sezione 1</h2>\n      <p>Questo è un esempio di pagina HTML che puoi modificare e visualizzare.</p>\n    </div>\n    <div class="card">\n      <h2>Sezione 2</h2>\n      <p>Aggiungere contenuti interattivi e stili CSS per renderla più interessante.</p>\n    </div>\n  </div>\n</body>\n</html>',
        starred: false,
        tags: []
      },
      { 
        id: '11', 
        name: 'stile.css', 
        type: 'file', 
        size: 2100, 
        modified: new Date(2024, 3, 18), 
        path: '/stile.css',
        extension: 'css',
        content: '/* Foglio di stile principale */\nbody {\n  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  background-color: #f9f9f9;\n  margin: 0;\n  padding: 0;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 1rem;\n}\n\n.header {\n  background-color: #2c3e50;\n  color: white;\n  padding: 1rem 0;\n  text-align: center;\n}\n\n.btn {\n  display: inline-block;\n  background: #3498db;\n  color: white;\n  padding: 0.5rem 1rem;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background 0.3s ease;\n}\n\n.btn:hover {\n  background: #2980b9;\n}',
        starred: false,
        tags: []
      },
      { 
        id: '12', 
        name: 'esercizio.py', 
        type: 'file', 
        size: 1600, 
        modified: new Date(2024, 3, 16), 
        path: '/esercizio.py',
        extension: 'py',
        content: '# Un semplice script Python\n\ndef fibonacci(n):\n    """Genera i primi n numeri della sequenza di Fibonacci."""\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence[:n]\n\ndef main():\n    n = 10\n    result = fibonacci(n)\n    print(f"I primi {n} numeri della sequenza di Fibonacci sono:")\n    print(result)\n    \n    # Calcoliamo la somma\n    total = sum(result)\n    print(f"La somma dei primi {n} numeri è: {total}")\n\nif __name__ == "__main__":\n    main()',
        starred: true,
        tags: ['Personale']
      },
      // Aggiungiamo contenuti nelle cartelle
      { 
        id: '13', 
        name: 'Documento interno.txt', 
        type: 'file', 
        size: 1240, 
        modified: new Date(2024, 3, 20), 
        path: '/Documenti/Documento interno.txt',
        extension: 'txt',
        content: 'Questo è un documento interno riservato.\n\nLinee guida per il progetto XYZ:\n1. Rispettare le scadenze\n2. Mantenere la qualità del codice\n3. Documentare tutte le API\n4. Eseguire test completi prima del rilascio',
        starred: false,
        tags: []
      },
      { 
        id: '14', 
        name: 'Contratto.pdf', 
        type: 'file', 
        size: 2400000, 
        modified: new Date(2024, 3, 18), 
        path: '/Documenti/Contratto.pdf',
        extension: 'pdf',
        starred: false,
        tags: ['Importante', 'Lavoro']
      },
      { 
        id: '15', 
        name: 'Web OS', 
        type: 'folder', 
        modified: new Date(2024, 3, 15), 
        path: '/Progetti/Web OS',
        color: '#38b2ac',
        starred: true,
        tags: ['Progetto']
      },
      { 
        id: '16', 
        name: 'App Mobile', 
        type: 'folder', 
        modified: new Date(2024, 3, 10), 
        path: '/Progetti/App Mobile',
        color: '#ed8936',
        starred: false,
        tags: []
      },
      { 
        id: '17', 
        name: 'main.js', 
        type: 'file', 
        size: 3200, 
        modified: new Date(2024, 3, 22), 
        path: '/Progetti/Web OS/main.js',
        extension: 'js',
        content: '// Main application script\nimport { createPanel } from "./panels.js";\nimport { setupWorkspace } from "./workspace.js";\n\n// Initialize the application\nfunction initApp() {\n  console.log("Initializing Web OS application...");\n  \n  // Set up the main workspace\n  const workspace = setupWorkspace({\n    theme: "dark",\n    layout: "flexible"\n  });\n  \n  // Create default panels\n  createPanel("dashboard", { position: { x: 100, y: 100 } });\n  createPanel("browser", { position: { x: 500, y: 150 } });\n  createPanel("terminal", { position: { x: 200, y: 400 } });\n  \n  console.log("Application initialized successfully");\n  \n  return workspace;\n}\n\n// Run the application\ndocument.addEventListener("DOMContentLoaded", () => {\n  const app = initApp();\n  window.webOS = app; // Expose to global scope for debugging\n});',
        starred: false,
        tags: []
      },
      { 
        id: '18', 
        name: 'Foto vacanze', 
        type: 'folder', 
        modified: new Date(2024, 3, 5), 
        path: '/Media/Foto vacanze',
        color: '#9f7aea',
        starred: false,
        tags: ['Personale']
      },
      { 
        id: '19', 
        name: 'Musica', 
        type: 'folder', 
        modified: new Date(2024, 3, 8), 
        path: '/Media/Musica',
        color: '#667eea',
        starred: false,
        tags: []
      }
    ];
  });
  
  // Salva i dati nel localStorage quando cambiano
  useEffect(() => {
    // Prepara i dati per il salvataggio (converti Date in stringhe)
    const itemsToSave = items.map(item => ({
      ...item,
      modified: item.modified.toISOString()
    }));
    
    localStorage.setItem('jarvis-file-manager-items', JSON.stringify(itemsToSave));
  }, [items]);
  
  // Gestisci il click fuori dal menu contestuale per chiuderlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileManagerRef.current && !fileManagerRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Focus sull'input di ridenominazione quando è attivo
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      
      // Seleziona il nome senza l'estensione
      const item = items.find(item => item.id === renamingId);
      if (item && item.type === 'file' && item.extension) {
        const nameWithoutExt = item.name.slice(0, -(item.extension.length + 1));
        renameInputRef.current.setSelectionRange(0, nameWithoutExt.length);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [isRenaming, renamingId, items]);
  
  // Gestione dei click sulle cartelle per navigazione
  const handleFolderClick = (folder: FileItem) => {
    setCurrentPath(folder.path);
    setSelectedItems([]);
    setShowContextMenu(false);
  };
  
  // Funzione per tornare indietro nel percorso
  const handleGoBack = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    setCurrentPath(newPath);
    setSelectedItems([]);
    setShowContextMenu(false);
  };
  
  // Gestione della selezione dei file
  const handleItemSelect = (item: FileItem, event: React.MouseEvent) => {
    // Chiudi il menu contestuale
    setShowContextMenu(false);
    
    if (isRenaming) {
      setIsRenaming(false);
      setRenamingId(null);
      return;
    }
    
    if (item.type === 'folder') {
      handleFolderClick(item);
      return;
    }
    
    // Gestione multiselection con Ctrl/Command
    if (event.ctrlKey || event.metaKey) {
      setSelectedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id) 
          : [...prev, item.id]
      );
    } else {
      setSelectedItems([item.id]);
    }
  };
  
  // Gestione doppio click
  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      handleFolderClick(item);
      return;
    }
    
    // Apri i file in base al tipo
    openFile(item);
  };
  
  // Funzione per aprire file in base al tipo
  const openFile = (file: FileItem) => {
    // In base all'estensione, apri il file nel pannello appropriato
    switch (file.extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
      case 'json':
      case 'txt':
      case 'md':
        // Apri il file nell'editor
        addPanel({
          type: 'editor',
          title: `Editor - ${file.name}`,
          position: { x: 300, y: 100 },
          size: { width: 700, height: 500 },
          content: { 
            fileName: file.name,
            language: getLanguageFromExtension(file.extension),
            value: file.content || `// Contenuto di ${file.name}\n`
          }
        });
        break;
        
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        // Mostra un messaggio (in una vera implementazione si aprirebbe un visualizzatore)
        toast.info(`Visualizzazione di ${file.name} (funzionalità simulata)`);
        break;
        
      case 'pdf':
        // Simula l'apertura di un PDF
        toast.info(`Apertura di ${file.name} nel visualizzatore PDF (funzionalità simulata)`);
        break;
        
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        // Simula l'apertura dei documenti Office
        toast.info(`Apertura di ${file.name} (funzionalità simulata)`);
        break;
        
      default:
        toast.info(`Tipo di file non supportato: ${file.extension}`);
    }
  };
  
  // Ottieni il linguaggio dall'estensione
  const getLanguageFromExtension = (extension: string): string => {
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'py': 'python',
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext',
    };
    
    return extensionMap[extension.toLowerCase()] || 'plaintext';
  };
  
  // Mostra il menu contestuale al click destro
  const handleContextMenu = (event: React.MouseEvent, itemId?: string) => {
    event.preventDefault();
    
    // Se c'è già un rename in corso, terminalo
    if (isRenaming) {
      setIsRenaming(false);
      setRenamingId(null);
    }
    
    // Imposta la posizione del menu
    setContextMenuPos({ x: event.clientX, y: event.clientY });
    
    // Se è stato fornito un item, selezionalo
    if (itemId) {
      // Se non è già selezionato, selezionalo
      if (!selectedItems.includes(itemId)) {
        setSelectedItems([itemId]);
      }
      
      setContextMenuItem(itemId);
    } else {
      setContextMenuItem(null);
    }
    
    setShowContextMenu(true);
  };
  
  // Funzione per formattare la dimensione del file
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  // Funzione per formattare la data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filtro e ordinamento degli elementi in base al percorso corrente e alla ricerca
  const filteredItems = items
    .filter(item => {
      // Filtro per path corrente
      if (currentPath === '/') {
        return item.path.split('/').length === 2 && item.path.startsWith('/');
      } else {
        const parentPath = currentPath;
        return item.path.startsWith(parentPath + '/') && 
               item.path.split('/').length === parentPath.split('/').length + 1;
      }
    })
    .filter(item => {
      // Filtro per ricerca
      if (!searchQuery) return true;
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Ordina per cartelle prima dei file
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      // Poi ordina in base al criterio selezionato
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? a.modified.getTime() - b.modified.getTime()
          : b.modified.getTime() - a.modified.getTime();
      }
      
      if (sortBy === 'size') {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        return sortOrder === 'asc'
          ? aSize - bSize
          : bSize - aSize;
      }
      
      return 0;
    });
  
  // Ottiene il nome della cartella corrente
  const getCurrentFolderName = () => {
    if (currentPath === '/') return 'Home';
    const parts = currentPath.split('/');
    return parts[parts.length - 1];
  };
  
  // Simula la creazione di una nuova cartella
  const handleCreateFolder = () => {
    const newFolderName = prompt('Nome della nuova cartella:');
    if (!newFolderName) return;
    
    // Controlla se esiste già una cartella con lo stesso nome
    const folderExists = items.some(item => 
      item.path === `${currentPath === '/' ? '' : currentPath}/${newFolderName}` && 
      item.type === 'folder'
    );
    
    if (folderExists) {
      toast.error(`La cartella "${newFolderName}" esiste già`);
      return;
    }
    
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      modified: new Date(),
      path: `${currentPath === '/' ? '' : currentPath}/${newFolderName}`,
      color: getRandomColor(),
      starred: false,
      tags: []
    };
    
    setItems(prev => [...prev, newFolder]);
    toast.success(`Cartella "${newFolderName}" creata`);
    setShowContextMenu(false);
  };
  
  // Funzione per generare un colore casuale per le cartelle
  const getRandomColor = () => {
    const colors = [
      '#4299e1', // blue
      '#f6ad55', // orange
      '#f56565', // red
      '#38b2ac', // teal
      '#9f7aea', // purple
      '#667eea', // indigo
      '#48bb78', // green
      '#ed64a6'  // pink
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Crea un nuovo file con contenuto vuoto
  const handleCreateFile = () => {
    const newFileName = prompt('Nome del nuovo file:');
    if (!newFileName) return;
    
    // Aggiungi estensione se non specificata
    let finalFileName = newFileName;
    if (!finalFileName.includes('.')) {
      finalFileName += '.txt';
    }
    
    // Controlla se esiste già un file con lo stesso nome
    const fileExists = items.some(item => 
      item.path === `${currentPath === '/' ? '' : currentPath}/${finalFileName}` && 
      item.type === 'file'
    );
    
    if (fileExists) {
      toast.error(`Il file "${finalFileName}" esiste già`);
      return;
    }
    
    // Ottieni l'estensione
    const extension = finalFileName.split('.').pop() || 'txt';
    
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: finalFileName,
      type: 'file',
      size: 0,
      modified: new Date(),
      path: `${currentPath === '/' ? '' : currentPath}/${finalFileName}`,
      extension: extension,
      content: '',
      starred: false,
      tags: []
    };
    
    setItems(prev => [...prev, newFile]);
    toast.success(`File "${finalFileName}" creato`);
    
    // Apri immediatamente il file nell'editor
    setTimeout(() => {
      openFile(newFile);
    }, 500);
    
    setShowContextMenu(false);
  };
  
  // Simula l'upload di un file
  const handleUpload = () => {
    // Crea un input di tipo file nascosto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    document.body.appendChild(fileInput);
    
    // Gestisce la selezione del file
    fileInput.onchange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        toast.info(`Upload di ${input.files.length} file in corso...`);
        
        // Processa ogni file
        Array.from(input.files).forEach((file, index) => {
          // Simula un ritardo di upload
          setTimeout(() => {
            // Ottieni l'estensione del file
            const extension = file.name.split('.').pop() || '';
            
            // Simula la lettura del file (in una vera implementazione, leggeremmo il contenuto)
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              
              // Crea un nuovo file
              const newFile: FileItem = {
                id: `file-${Date.now()}-${index}`,
                name: file.name,
                type: 'file',
                size: file.size,
                modified: new Date(),
                path: `${currentPath === '/' ? '' : currentPath}/${file.name}`,
                extension: extension,
                content: content || undefined,
                starred: false,
                tags: []
              };
              
              setItems(prev => [...prev, newFile]);
              toast.success(`File "${file.name}" caricato`);
            };
            
            // Per file di testo, leggi il contenuto
            if (['txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'md', 'py'].includes(extension.toLowerCase())) {
              reader.readAsText(file);
            } else {
              // Simula che abbiamo letto il file
              reader.onload({ target: { result: undefined } } as any);
            }
          }, 800 + index * 400); // Ritardo variabile per ogni file
        });
      }
      
      // Rimuovi l'input quando hai finito
      document.body.removeChild(fileInput);
    };
    
    // Simula il click per aprire il selettore di file
    fileInput.click();
    setShowContextMenu(false);
  };
  
  // Simula il download di file
  const handleDownload = () => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da scaricare');
      return;
    }
    
    // Per ogni item selezionato
    selectedItems.forEach(id => {
      const item = items.find(item => item.id === id);
      if (!item) return;
      
      if (item.type === 'folder') {
        toast.info(`Download della cartella "${item.name}" (funzionalità simulata)`);
        return;
      }
      
      // Se è un file con contenuto
      if (item.content) {
        const blob = new Blob([item.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`File "${item.name}" scaricato`);
      } else {
        toast.info(`Download di "${item.name}" (funzionalità simulata)`);
      }
    });
    
    setShowContextMenu(false);
  };
  
  // Simula l'eliminazione di file o cartelle
  const handleDelete = () => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da eliminare');
      return;
    }
    
    const itemsToDelete = items.filter(item => selectedItems.includes(item.id));
    const itemNames = itemsToDelete.map(item => item.name).join(', ');
    
    const confirmed = confirm(`Sei sicuro di voler eliminare: ${itemNames}?`);
    if (!confirmed) return;
    
    // Raccogli tutti i percorsi delle cartelle selezionate
    const folderPaths = itemsToDelete
      .filter(item => item.type === 'folder')
      .map(folder => folder.path);
    
    // Elimina tutti gli elementi che corrispondono ai percorsi delle cartelle
    // e agli ID degli elementi selezionati
    setItems(prev => prev.filter(item => {
      // Controlla se l'elemento è nella selezione
      const isDirectlySelected = !selectedItems.includes(item.id);
      
      // Controlla se l'elemento è contenuto in una cartella selezionata
      const isInSelectedFolder = !folderPaths.some(folderPath => 
        item.path.startsWith(folderPath + '/'));
      
      return isDirectlySelected && isInSelectedFolder;
    }));
    
    setSelectedItems([]);
    toast.success(`${selectedItems.length} elementi eliminati`);
    setShowContextMenu(false);
  };
  
  // Gestisce la rinominazione
  const handleRename = (id?: string) => {
    const itemId = id || (selectedItems.length === 1 ? selectedItems[0] : null);
    if (!itemId) {
      toast.error('Seleziona un elemento da rinominare');
      return;
    }
    
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    setRenamingId(itemId);
    setNewName(item.name);
    setIsRenaming(true);
    setShowContextMenu(false);
  };
  
  // Completa la rinominazione
  const handleRenameComplete = () => {
    if (!renamingId || !newName.trim()) {
      setIsRenaming(false);
      setRenamingId(null);
      return;
    }
    
    const item = items.find(item => item.id === renamingId);
    if (!item) return;
    
    // Per i file, mantieni l'estensione originale se non è stata cambiata
    let finalName = newName;
    if (item.type === 'file' && item.extension) {
      // Se il nuovo nome non contiene un punto, aggiungi l'estensione originale
      if (!finalName.includes('.')) {
        finalName += `.${item.extension}`;
      }
    }
    
    // Controlla se esiste già un elemento con lo stesso nome nella stessa directory
    const parentPath = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
    const newPath = `${parentPath === '/' ? '' : parentPath}/${finalName}`;
    
    const duplicateExists = items.some(i => 
      i.id !== item.id && 
      i.path === newPath
    );
    
    if (duplicateExists) {
      toast.error(`Esiste già un elemento con il nome "${finalName}"`);
      setIsRenaming(false);
      setRenamingId(null);
      return;
    }
    
    // Aggiorna il nome e il percorso dell'elemento
    setItems(prev => prev.map(i => {
      if (i.id === renamingId) {
        // Ottieni la nuova estensione se è cambiata
        const newExtension = i.type === 'file' ? finalName.split('.').pop() || i.extension : undefined;
        
        return {
          ...i,
          name: finalName,
          path: newPath,
          extension: newExtension
        };
      }
      
      // Aggiorna anche i percorsi degli elementi contenuti in una cartella rinominata
      if (i.type === 'folder' && item.type === 'folder' && i.path.startsWith(item.path + '/')) {
        const remainingPath = i.path.substring(item.path.length);
        return {
          ...i,
          path: newPath + remainingPath
        };
      }
      
      // Aggiorna i percorsi dei file contenuti in una cartella rinominata
      if (i.type === 'file' && item.type === 'folder' && i.path.startsWith(item.path + '/')) {
        const remainingPath = i.path.substring(item.path.length);
        return {
          ...i,
          path: newPath + remainingPath
        };
      }
      
      return i;
    }));
    
    toast.success(`Elemento rinominato in "${finalName}"`);
    setIsRenaming(false);
    setRenamingId(null);
  };
  
  // Gestisce tag e preferiti
  const toggleFavorite = (id?: string) => {
    const itemId = id || (selectedItems.length === 1 ? selectedItems[0] : null);
    if (!itemId) {
      toast.error('Seleziona un elemento da aggiungere/rimuovere dai preferiti');
      return;
    }
    
    setItems(prev => prev.map(item => 
      item.id === itemId
        ? { ...item, starred: !item.starred }
        : item
    ));
    
    const item = items.find(item => item.id === itemId);
    if (item) {
      toast.success(item.starred 
        ? `"${item.name}" rimosso dai preferiti` 
        : `"${item.name}" aggiunto ai preferiti`
      );
    }
    
    setShowContextMenu(false);
  };
  
  // Gestisce i tag
  const handleTagsMenu = (id?: string) => {
    const itemId = id || (selectedItems.length === 1 ? selectedItems[0] : null);
    if (!itemId) {
      toast.error('Seleziona un elemento per gestire i tag');
      return;
    }
    
    setContextMenuItem(itemId);
    setShowTagsMenu(true);
    setShowContextMenu(false);
  };
  
  // Aggiunge un tag
  const addTag = (tag: string) => {
    if (!contextMenuItem) return;
    
    setItems(prev => prev.map(item => {
      if (item.id === contextMenuItem) {
        const tags = item.tags || [];
        // Aggiungi il tag solo se non è già presente
        if (!tags.includes(tag)) {
          return { ...item, tags: [...tags, tag] };
        }
      }
      return item;
    }));
    
    const item = items.find(item => item.id === contextMenuItem);
    if (item) {
      toast.success(`Tag "${tag}" aggiunto a "${item.name}"`);
    }
  };
  
  // Rimuove un tag
  const removeTag = (tag: string) => {
    if (!contextMenuItem) return;
    
    setItems(prev => prev.map(item => {
      if (item.id === contextMenuItem) {
        const tags = item.tags || [];
        return { ...item, tags: tags.filter(t => t !== tag) };
      }
      return item;
    }));
    
    const item = items.find(item => item.id === contextMenuItem);
    if (item) {
      toast.success(`Tag "${tag}" rimosso da "${item.name}"`);
    }
  };
  
  // Aggiunge un nuovo tag
  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    
    // Aggiungi il tag alla lista dei tag disponibili se non esiste già
    if (!availableTags.includes(newTag)) {
      setAvailableTags(prev => [...prev, newTag]);
    }
    
    // Aggiungi il tag all'elemento
    addTag(newTag);
    setNewTag('');
  };
  
  // Gestisce copia/taglia/incolla
  const handleCopy = (cut: boolean = false) => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da copiare');
      return;
    }
    
    const itemsToCopy = items.filter(item => selectedItems.includes(item.id));
    setClipboard({ items: itemsToCopy, operation: cut ? 'cut' : 'copy' });
    
    toast.success(`${selectedItems.length} elementi ${cut ? 'tagliati' : 'copiati'} negli appunti`);
    setShowContextMenu(false);
    
    // Se è un'operazione di taglio, non eliminiamo subito gli elementi
    // Li elimineremo solo quando verranno incollati
  };
  
  // Incolla gli elementi dagli appunti
  const handlePaste = () => {
    if (!clipboard || clipboard.items.length === 0) {
      toast.error('Nessun elemento negli appunti');
      return;
    }
    
    // Crea nuove copie degli elementi con nuovi ID
    const newItems: FileItem[] = [];
    
    // Per ogni elemento negli appunti
    clipboard.items.forEach(item => {
      // Determina il nuovo percorso
      const baseName = item.name;
      let newName = baseName;
      let newPath = `${currentPath === '/' ? '' : currentPath}/${newName}`;
      let counter = 1;
      
      // Controlla se esiste già un elemento con lo stesso nome
      while (items.some(i => i.path === newPath)) {
        // Aggiungi un suffisso per evitare duplicati
        if (item.type === 'file' && item.extension) {
          const nameParts = baseName.split('.');
          const ext = nameParts.pop();
          newName = `${nameParts.join('.')} (${counter}).${ext}`;
        } else {
          newName = `${baseName} (${counter})`;
        }
        newPath = `${currentPath === '/' ? '' : currentPath}/${newName}`;
        counter++;
      }
      
      // Crea il nuovo elemento
      const newItem: FileItem = {
        ...item,
        id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newName,
        path: newPath,
        modified: new Date()
      };
      
      newItems.push(newItem);
      
      // Se è una cartella, devi anche copiare tutti gli elementi al suo interno
      if (item.type === 'folder') {
        // Trova tutti gli elementi nella cartella originale
        const childItems = items.filter(i => i.path.startsWith(item.path + '/'));
        
        // Per ogni elemento figlio, crea una copia con il nuovo percorso
        childItems.forEach(childItem => {
          const relativePath = childItem.path.substring(item.path.length);
          const newChildPath = newPath + relativePath;
          
          newItems.push({
            ...childItem,
            id: `${childItem.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            path: newChildPath,
            modified: new Date()
          });
        });
      }
    });
    
    // Aggiungi i nuovi elementi
    setItems(prev => [...prev, ...newItems]);
    
    // Se era un'operazione di taglio, rimuovi gli elementi originali
    if (clipboard.operation === 'cut') {
      // Ottieni gli ID di tutti gli elementi da rimuovere
      const idsToRemove = clipboard.items.map(item => item.id);
      
      // Rimuovi gli elementi e i loro figli (nel caso di cartelle)
      setItems(prev => prev.filter(item => {
        // Controlla se l'elemento è nella selezione
        const isNotInClipboard = !idsToRemove.includes(item.id);
        
        // Controlla se l'elemento è contenuto in una cartella nel clipboard
        const isNotInClipboardFolder = !clipboard.items
          .filter(i => i.type === 'folder')
          .some(folder => item.path.startsWith(folder.path + '/'));
        
        return isNotInClipboard && isNotInClipboardFolder;
      }));
      
      // Pulisci gli appunti
      setClipboard(null);
    }
    
    toast.success(`${newItems.length} elementi incollati in "${getCurrentFolderName()}"`);
    setShowContextMenu(false);
  };
  
  // Ottiene l'icona appropriata per il tipo di file
  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return <FiFolder size={24} color={item.color} />;
    }
    
    // Icone specifiche per estensione
    switch (item.extension) {
      case 'pdf':
        return <FiFile size={24} color="#f56565" />;
      case 'txt':
        return <FiFile size={24} color="#a0aec0" />;
      case 'doc':
      case 'docx':
        return <FiFile size={24} color="#4299e1" />;
      case 'xls':
      case 'xlsx':
        return <FiFile size={24} color="#48bb78" />;
      case 'ppt':
      case 'pptx':
        return <FiFile size={24} color="#ed8936" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FiFile size={24} color="#667eea" />;
      case 'js':
      case 'jsx':
        return <FiFile size={24} color="#ecc94b" />;
      case 'html':
        return <FiFile size={24} color="#e53e3e" />;
      case 'css':
        return <FiFile size={24} color="#3182ce" />;
      case 'json':
        return <FiFile size={24} color="#d69e2e" />;
      case 'py':
        return <FiFile size={24} color="#4299e1" />;
      default:
        return <FiFile size={24} />;
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-surface-dark" ref={fileManagerRef}>
      {/* Barra degli strumenti */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleGoBack}
            disabled={currentPath === '/'}
            title="Indietro"
          >
            <FiArrowLeft size={18} />
          </button>
          
          <div className="text-lg font-medium ml-2 flex items-center">
            {currentPath.split('/').filter(Boolean).map((folder, index, array) => (
              <div key={index} className="flex items-center">
                {index > 0 && <FiChevronRight className="mx-1 text-white/40" />}
                <button 
                  className="hover:text-primary transition-colors"
                  onClick={() => {
                    // Costruisce il percorso fino a questa cartella
                    const path = '/' + array.slice(0, index + 1).join('/');
                    setCurrentPath(path);
                  }}
                >
                  {folder}
                </button>
              </div>
            ))}
            {currentPath === '/' && 'Home'}
          </div>
        </div>
        
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            className="w-full bg-surface rounded-lg px-3 py-1.5 pl-9 outline-none border border-white/10 focus:border-primary"
            placeholder="Cerca file e cartelle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setViewMode('grid')}
            title="Vista a griglia"
          >
            <FiGrid size={18} className={viewMode === 'grid' ? 'text-primary' : ''} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setViewMode('list')}
            title="Vista a lista"
          >
            <FiList size={18} className={viewMode === 'list' ? 'text-primary' : ''} />
          </button>
        </div>
      </div>
      
      {/* Barra delle azioni */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <button 
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5"
          onClick={handleUpload}
          title="Carica file"
        >
          <FiUpload size={16} />
          <span>Upload</span>
        </button>
        
        <button 
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5"
          onClick={handleCreateFolder}
          title="Crea nuova cartella"
        >
          <FiPlus size={16} />
          <span>Nuova cartella</span>
        </button>
        
        <button 
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5"
          onClick={handleCreateFile}
          title="Crea nuovo file"
        >
          <FiFile size={16} />
          <span>Nuovo file</span>
        </button>
        
        <button 
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
            selectedItems.length > 0 
              ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          onClick={handleDelete}
          disabled={selectedItems.length === 0}
          title="Elimina"
        >
          <FiTrash2 size={16} />
          <span>Elimina</span>
        </button>
        
        <button 
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
            selectedItems.length === 1 && items.find(i => i.id === selectedItems[0])?.type === 'file'
              ? 'hover:bg-white/10 text-white/70 hover:text-white' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          disabled={!(selectedItems.length === 1 && items.find(i => i.id === selectedItems[0])?.type === 'file')}
          onClick={handleDownload}
          title="Scarica"
        >
          <FiDownload size={16} />
          <span>Download</span>
        </button>
      </div>
      
      {/* Contenuto principale */}
      <div 
        className="flex-1 p-4 overflow-y-auto"
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/50">
            <FiFolder size={48} className="mb-4 opacity-30" />
            <p>Questa cartella è vuota</p>
            <div className="mt-4 flex gap-2">
              <button 
                className="px-4 py-2 rounded-md bg-primary bg-opacity-20 hover:bg-primary hover:bg-opacity-30 text-primary"
                onClick={handleCreateFolder}
              >
                Crea una cartella
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white/80"
                onClick={handleCreateFile}
              >
                Crea un file
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg cursor-pointer flex flex-col items-center text-center relative ${
                  selectedItems.includes(item.id) 
                    ? 'bg-primary bg-opacity-20 ring-1 ring-primary' 
                    : 'hover:bg-white/5'
                }`}
                onClick={(e) => handleItemSelect(item, e)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
              >
                {item.starred && (
                  <div className="absolute top-1 right-1 text-yellow-500">
                    <FiStar size={14} fill="currentColor" />
                  </div>
                )}
                <div className="w-16 h-16 flex items-center justify-center mb-2">
                  {getFileIcon(item)}
                </div>
                
                {isRenaming && renamingId === item.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    className="w-full bg-surface rounded py-1 px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRenameComplete}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameComplete();
                      } else if (e.key === 'Escape') {
                        setIsRenaming(false);
                        setRenamingId(null);
                      }
                    }}
                  />
                ) : (
                  <div className="truncate w-full text-sm font-medium">{item.name}</div>
                )}
                
                <div className="text-xs text-white/50">
                  {item.type === 'folder' 
                    ? formatDate(item.modified)
                    : formatFileSize(item.size)
                  }
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {item.tags.slice(0, 2).map(tag => (
                      <span 
                        key={tag} 
                        className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-white/80"
                        title={tag}
                      >{tag.length > 6 ? tag.substring(0, 6) + '...' : tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-light">
                  <th className="text-left py-2 px-4 font-medium cursor-pointer" onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}>
                    Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-2 px-4 font-medium cursor-pointer" onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}>
                    Modificato {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-2 px-4 font-medium cursor-pointer" onClick={() => {
                    if (sortBy === 'size') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('size');
                      setSortOrder('desc');
                    }
                  }}>
                    Dimensione {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-2 px-4 font-medium">Tag</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id}
                    className={`border-t border-white/10 ${
                      selectedItems.includes(item.id) 
                        ? 'bg-primary bg-opacity-20' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={(e) => handleItemSelect(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <div className="mr-3 relative">
                          {getFileIcon(item)}
                          {item.starred && (
                            <div className="absolute -top-1 -right-1 text-yellow-500">
                              <FiStar size={12} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        {isRenaming && renamingId === item.id ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            className="bg-surface rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRenameComplete}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameComplete();
                              } else if (e.key === 'Escape') {
                                setIsRenaming(false);
                                setRenamingId(null);
                              }
                            }}
                          />
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {formatDate(item.modified)}
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {item.type === 'folder' ? '-' : formatFileSize(item.size)}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 ? (
                          item.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-white/80"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/40 text-xs">Nessun tag</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <button 
                        className="p-1 rounded hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, item.id);
                        }}
                      >
                        <FiMoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Menu contestuale */}
        {showContextMenu && (
          <div 
            className="fixed bg-surface-dark border border-white/10 rounded-lg shadow-lg z-50 w-48"
            style={{ 
              top: contextMenuPos.y, 
              left: contextMenuPos.x,
              maxHeight: '80vh',
              overflow: 'auto' 
            }}
          >
            {contextMenuItem ? (
              /* Menu per un elemento specifico */
              <div className="py-1">
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    const item = items.find(item => item.id === contextMenuItem);
                    if (item) {
                      if (item.type === 'folder') {
                        handleFolderClick(item);
                      } else {
                        openFile(item);
                      }
                    }
                    setShowContextMenu(false);
                  }}
                >
                  <FiPlay size={14} />
                  <span>{items.find(item => item.id === contextMenuItem)?.type === 'folder' ? 'Apri cartella' : 'Apri file'}</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => handleRename(contextMenuItem)}
                >
                  <FiEdit2 size={14} />
                  <span>Rinomina</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => handleCopy()}
                >
                  <FiCopy size={14} />
                  <span>Copia</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => handleCopy(true)}
                >
                  <FiClipboard size={14} />
                  <span>Taglia</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => toggleFavorite(contextMenuItem)}
                >
                  <FiStar size={14} fill={items.find(item => item.id === contextMenuItem)?.starred ? "currentColor" : "none"} />
                  <span>{items.find(item => item.id === contextMenuItem)?.starred ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => handleTagsMenu(contextMenuItem)}
                >
                  <FiSearch size={14} />
                  <span>Gestisci tag</span>
                </button>
                
                {items.find(item => item.id === contextMenuItem)?.type === 'file' && (
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                    onClick={() => handleDownload()}
                  >
                    <FiDownload size={14} />
                    <span>Download</span>
                  </button>
                )}
                
                <div className="border-t border-white/10 my-1"></div>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2"
                  onClick={() => handleDelete()}
                >
                  <FiTrash2 size={14} />
                  <span>Elimina</span>
                </button>
              </div>
            ) : (
              /* Menu generale */
              <div className="py-1">
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={handleCreateFolder}
                >
                  <FiFolder size={14} />
                  <span>Nuova cartella</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={handleCreateFile}
                >
                  <FiFile size={14} />
                  <span>Nuovo file</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={handleUpload}
                >
                  <FiUpload size={14} />
                  <span>Upload</span>
                </button>
                
                {clipboard && clipboard.items.length > 0 && (
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                    onClick={handlePaste}
                  >
                    <FiClipboard size={14} />
                    <span>Incolla {clipboard.items.length} {clipboard.items.length === 1 ? 'elemento' : 'elementi'}</span>
                  </button>
                )}
                
                <div className="border-t border-white/10 my-1"></div>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    setSortBy('name');
                    setSortOrder('asc');
                    setShowContextMenu(false);
                  }}
                >
                  <FiSearch size={14} />
                  <span>Ordina per nome</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder('desc');
                    setShowContextMenu(false);
                  }}
                >
                  <FiSearch size={14} />
                  <span>Ordina per data</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => {
                    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                    setShowContextMenu(false);
                  }}
                >
                  <FiGrid size={14} />
                  <span>Cambia vista</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Menu gestione tag */}
        {showTagsMenu && contextMenuItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-white/10 rounded-lg shadow-lg w-96 p-4">
              <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
                <span>Gestione tag</span>
                <button
                  className="p-1 rounded hover:bg-white/10"
                  onClick={() => setShowTagsMenu(false)}
                >
                  <FiX size={16} />
                </button>
              </h3>
              
              <div className="mb-4">
                <div className="text-sm text-white/70 mb-2">Tag correnti:</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {items.find(item => item.id === contextMenuItem)?.tags?.map(tag => (
                    <div 
                      key={tag}
                      className="px-2 py-1 rounded-full bg-primary/10 text-white/80 flex items-center gap-1.5"
                    >
                      <span>{tag}</span>
                      <button 
                        className="p-0.5 rounded-full hover:bg-white/10"
                        onClick={() => removeTag(tag)}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  )) || (
                    <div className="text-white/40">Nessun tag</div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-white/70 mb-2">Tag disponibili:</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button 
                      key={tag}
                      className={`px-2 py-1 rounded-full ${
                        items.find(item => item.id === contextMenuItem)?.tags?.includes(tag)
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                      onClick={() => addTag(tag)}
                      disabled={items.find(item => item.id === contextMenuItem)?.tags?.includes(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 bg-surface rounded py-1.5 px-3 outline-none border border-white/10 focus:border-primary"
                  placeholder="Nuovo tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewTag();
                    }
                  }}
                />
                <button 
                  className="px-3 py-1.5 rounded bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddNewTag}
                  disabled={!newTag.trim()}
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-sm text-white/50">
        <div>
          {filteredItems.length} elementi
        </div>
        <div>
          {selectedItems.length > 0 && `${selectedItems.length} selezionati`}
        </div>
      </div>
    </div>
  );
}