// src/components/core/panels/FileManagerPanel.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { FiFolder, FiFile, FiUpload, FiDownload, FiTrash2, FiPlus, 
         FiArrowLeft, FiSearch, FiGrid, FiList, FiMoreVertical, FiEdit2,
         FiCopy, FiClipboard, FiStar, FiPlay, FiChevronRight, FiExternalLink, 
         FiX,
         FiRefreshCw} from 'react-icons/fi'
import { Panel, useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore'
import { useDragDropStore } from '@/lib/store/dragDropStore'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useFiles, FileItem } from '@/hooks/useFiles'
import FileItemComponent from './FileItem' // Importiamo il componente FileItem
import { useFileSystemStore } from '@/lib/store/fileSystemStore';
interface FileManagerPanelProps {
  panel: Panel
}

export default function FileManagerPanel({ panel }: FileManagerPanelProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
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
  const [items, setItems] = useState<FileItem[]>([])
  const [clipboard, setClipboard] = useState<{
    items: FileItem[], 
    operation: 'copy' | 'cut'
  } | null>(null)
  
  // Riferimenti
  const fileManagerRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const { addPanel } = useWorkspaceStore()
  const { dataChanged, modifiedFileIds, resetDataChangedFlag, clearModifiedFileIds } = useFileSystemStore();
  // Hook personalizzato per gestire i file
  const { 
    isLoading, 
    error, 
    getFiles, 
    createFolder, 
    saveFile,
    updateFile,
    deleteFile,
    uploadFile,
    downloadFile,
    getFile
  } = useFiles()
  
  // Carica i file dalla cartella corrente
  const loadFiles = async () => {
    try {
      const files = await getFiles(currentFolderId || undefined);
      setItems(files);
    } catch (error) {
      console.error("Errore nel caricamento dei file:", error);
      toast.error("Si è verificato un errore durante il caricamento dei file");
    }
  };

  // Carica i file all'avvio o quando cambia la cartella
  useEffect(() => {
    loadFiles()
  }, [currentFolderId])
  
  useEffect(() => {
    if (dataChanged) {
      console.log('Rilevati cambiamenti nei file, ricarico i dati');
      loadFiles();
      resetDataChangedFlag();
      clearModifiedFileIds();
    }
  }, [dataChanged]);

  useEffect(() => {
    console.log("Lista degli ID dei file modificati:", modifiedFileIds);
    
    // Se il fileManager è montato e ci sono file modificati, ricarica
    if (modifiedFileIds.length > 0) {
      console.log("Ricarico i file modificati...");
      // Qui puoi scegliere di ricaricare solo i file modificati
      // oppure tutti i file della cartella corrente
      loadFiles();
      clearModifiedFileIds(); // Pulisci dopo il ricaricamento
    }
  }, [modifiedFileIds, loadFiles, clearModifiedFileIds]);
  
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
      if (item && item.type !== 'folder' && item.name.includes('.')) {
        const nameWithoutExt = item.name.slice(0, item.name.lastIndexOf('.'));
        renameInputRef.current.setSelectionRange(0, nameWithoutExt.length);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [isRenaming, renamingId, items]);
  
  // Gestione dei click sulle cartelle per navigazione
  const handleFolderClick = (folder: FileItem) => {
    setCurrentPath(folder.path);
    setCurrentFolderId(folder.id);
    setSelectedItems([]);
    setShowContextMenu(false);
  };
  
  // Funzione per tornare indietro nel percorso
  const handleGoBack = async () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    
    // Trova l'ID della cartella padre
    if (pathParts.length === 0) {
      // Torna alla root
      setCurrentPath('/');
      setCurrentFolderId(null);
    } else {
      // Cerca la cartella padre tra gli elementi
      const parentFolderName = pathParts[pathParts.length - 1];
      
      try {
        // Ottieni le cartelle nella directory corrente
        const parentFiles = await getFiles(undefined); // Ottieni i file nella root
        const parentFolder = parentFiles.find(f => f.name === parentFolderName && f.type === 'folder');
        
        if (parentFolder) {
          setCurrentPath(newPath);
          setCurrentFolderId(parentFolder.id);
        } else {
          // Fallback se non trova la cartella
          setCurrentPath('/');
          setCurrentFolderId(null);
        }
      } catch (error) {
        console.error("Errore nel recupero della cartella padre:", error);
        // Fallback
        setCurrentPath('/');
        setCurrentFolderId(null);
      }
    }
    
    setSelectedItems([]);
    setShowContextMenu(false);
  };
  
  // Ottiene l'icona appropriata per il tipo di file
const getFileIcon = (item: FileItem) => {
  if (item.type === 'folder') {
    return <FiFolder size={24} color="#4299e1" />;
  }
  
  // Icone specifiche per estensione
  const extension = item.name.split('.').pop()?.toLowerCase() || '';
  switch (extension) {
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
  const handleItemDoubleClick = async (item: FileItem) => {
  if (item.type === 'folder') {
    handleFolderClick(item);
    return;
  }
  
  // Se questo file è stato modificato, ricaricalo prima di aprirlo
  if (modifiedFileIds.includes(item.id)) {
    console.log('Ricarico il file modificato prima di aprirlo:', item.id);
    try {
      const updatedFile = await getFile(item.id);
      if (updatedFile) {
        // Aggiorna il file nella lista locale
        setItems(prev => prev.map(file => 
          file.id === item.id ? updatedFile : file
        ));
        
        // Apri il file aggiornato
        openFile(updatedFile);
        return;
      }
    } catch (error) {
      console.error('Errore nel ricaricare il file modificato:', error);
    }
  }
  
  // Comportamento normale per i file non modificati
  openFile(item);
};
  
  // Funzione per aprire file in base al tipo
  const openFile = async (file: FileItem) => {
    // In base all'estensione, apri il file nel pannello appropriato
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
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
        // Carica sempre il contenuto completo e aggiornato del file
        let fileContent = file.content;
        if (!fileContent || modifiedFileIds.includes(file.id)) {
          console.log('Ricarico il contenuto del file prima di aprirlo:', file.id);
          const fullFile = await getFile(file.id);
          if (fullFile && fullFile.content) {
            fileContent = fullFile.content;
            console.log('Contenuto aggiornato caricato:', fileContent);
          }
        }
        
        // Apri il file nell'editor
        addPanel({
          type: 'editor',
          title: `Editor - ${file.name}`,
          position: { x: 300, y: 100 },
          size: { width: 700, height: 500 },
          content: { 
            fileName: file.name,
            language: getLanguageFromExtension(extension),
            value: fileContent || `// Contenuto di ${file.name}\n`,
            fileId: file.id
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
        toast.info(`Tipo di file non supportato: ${extension}`);
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
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filtro e ordinamento degli elementi
  const filteredItems = items
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
        const aDate = new Date(a.updatedAt).getTime();
        const bDate = new Date(b.updatedAt).getTime();
        return sortOrder === 'asc'
          ? aDate - bDate
          : bDate - aDate;
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
  
  // Rest of the functions remain the same
  // ...
  
  // Crea una nuova cartella
  const handleCreateFolder = async () => {
    const newFolderName = prompt('Nome della nuova cartella:');
    if (!newFolderName) return;
    
    try {
      const result = await createFolder(newFolderName, currentFolderId || undefined);
      if (result) {
        loadFiles(); // Ricarica i file per mostrare la nuova cartella
      }
    } catch (error) {
      console.error('Errore nella creazione della cartella:', error);
      toast.error(`Errore nella creazione della cartella: ${error}`);
    }
  };
  
  // Crea un nuovo file con contenuto vuoto
  const handleCreateFile = async () => {
    const newFileName = prompt('Nome del nuovo file:');
    if (!newFileName) return;
    
    // Aggiungi estensione se non specificata
    let finalFileName = newFileName;
    if (!finalFileName.includes('.')) {
      finalFileName += '.txt';
    }
    
    try {
      // Determina il percorso completo del file
      let filePath = currentPath === '/' ? `/${finalFileName}` : `${currentPath}/${finalFileName}`;
      
      // Crea il nuovo file
      const newFile = {
        name: finalFileName,
        type: finalFileName.split('.').pop() || 'txt',
        size: 0,
        content: '',
        path: filePath,
        parentId: currentFolderId || undefined
      };
      
      const result = await saveFile(newFile);
      if (result) {
        loadFiles(); // Ricarica i file
        
        // Dopo aver caricato i file, apri l'editor per il nuovo file
        setTimeout(() => {
          const savedFile = items.find(item => item.name === finalFileName);
          if (savedFile) {
            openFile(savedFile);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Errore nella creazione del file:', error);
      toast.error(`Errore nella creazione del file: ${error}`);
    }
    
    setShowContextMenu(false);
  };
  
  // Upload di file
  const handleUpload = () => {
    // Crea un input di tipo file nascosto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.multiple = true;
    document.body.appendChild(fileInput);
    
    // Gestisce la selezione del file
    fileInput.onchange = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        toast.info(`Upload di ${input.files.length} file in corso...`);
        
        // Processa ogni file
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          
          try {
            // Carica il file
            await uploadFile(file, currentFolderId || undefined);
          } catch (error) {
            console.error(`Errore nell'upload di ${file.name}:`, error);
            toast.error(`Errore nell'upload di ${file.name}`);
          }
        }
        
        // Ricarica i file dopo l'upload
        loadFiles();
      }
      
      // Rimuovi l'input quando hai finito
      document.body.removeChild(fileInput);
    };
    
    // Simula il click per aprire il selettore di file
    fileInput.click();
    setShowContextMenu(false);
  };
  
  // Download di file
  const handleDownload = async () => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da scaricare');
      return;
    }
    
    // Per ogni item selezionato
    for (const id of selectedItems) {
      const item = items.find(item => item.id === id);
      if (!item) continue;
      
      if (item.type === 'folder') {
        toast.info(`Download della cartella "${item.name}" non supportato`);
        continue;
      }
      
      try {
        await downloadFile(item.id);
      } catch (error) {
        console.error(`Errore nel download di ${item.name}:`, error);
        toast.error(`Errore nel download di ${item.name}`);
      }
    }
    
    setShowContextMenu(false);
  };
  
  // Elimina file o cartelle
  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da eliminare');
      return;
    }
    
    const itemsToDelete = items.filter(item => selectedItems.includes(item.id));
    const itemNames = itemsToDelete.map(item => item.name).join(', ');
    
    const confirmed = confirm(`Sei sicuro di voler eliminare: ${itemNames}?`);
    if (!confirmed) return;
    
    // Elimina ogni elemento selezionato
    for (const id of selectedItems) {
      try {
        await deleteFile(id);
      } catch (error) {
        console.error(`Errore nell'eliminazione:`, error);
        toast.error(`Errore nell'eliminazione`);
      }
    }
    
    // Ricarica i file dopo l'eliminazione
    loadFiles();
    setSelectedItems([]);
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
  const handleRenameComplete = async () => {
    if (!renamingId || !newName.trim()) {
      setIsRenaming(false);
      setRenamingId(null);
      return;
    }
    
    const item = items.find(item => item.id === renamingId);
    if (!item) return;
    
    // Per i file, mantieni l'estensione originale se non è stata cambiata
    let finalName = newName;
    if (item.type !== 'folder' && !finalName.includes('.') && item.name.includes('.')) {
      const extension = item.name.split('.').pop();
      finalName += `.${extension}`;
    }
    
    try {
      // Aggiorna il nome del file
      await updateFile(renamingId, { newName: finalName });
      
      // Ricarica i file dopo la rinominazione
      loadFiles();
    } catch (error) {
      console.error('Errore durante la rinominazione:', error);
      toast.error(`Errore durante la rinominazione: ${error}`);
    }
    
    setIsRenaming(false);
    setRenamingId(null);
  };
  
  // Gestione tag (simulata)
  const toggleFavorite = async (id?: string) => {
    const itemId = id || (selectedItems.length === 1 ? selectedItems[0] : null);
    if (!itemId) {
      toast.error('Seleziona un elemento');
      return;
    }
    
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    // In un'implementazione reale, qui si aggiornerebbe il flag starred nel database
    toast.success(`${item.name} ${item.isPublic ? 'rimosso dai' : 'aggiunto ai'} preferiti`);
    
    // Aggiorna la visualizzazione locale
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, isPublic: !i.isPublic } : i
    ));
    
    setShowContextMenu(false);
  };
  
  // Gestione dei tag (simulata)
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
  
  // Aggiunge un tag (simulato)
  const addTag = (tag: string) => {
    toast.success(`Tag "${tag}" aggiunto`);
    setShowTagsMenu(false);
  };
  
  // Rimuove un tag (simulato)
  const removeTag = (tag: string) => {
    toast.success(`Tag "${tag}" rimosso`);
  };
  
  // Aggiunge un nuovo tag (simulato)
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
  
  // Gestisce copia/taglia
  const handleCopy = (cut: boolean = false) => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da copiare');
      return;
    }
    
    const itemsToCopy = items.filter(item => selectedItems.includes(item.id));
    setClipboard({ items: itemsToCopy, operation: cut ? 'cut' : 'copy' });
    
    toast.success(`${selectedItems.length} elementi ${cut ? 'tagliati' : 'copiati'} negli appunti`);
    setShowContextMenu(false);
  };
  
  // Incolla gli elementi dagli appunti (simulato)
  const handlePaste = async () => {
    if (!clipboard || clipboard.items.length === 0) {
      toast.error('Nessun elemento negli appunti');
      return;
    }
    
    toast.success(`Incollati ${clipboard.items.length} elementi`);
    
    // In un'implementazione reale, qui copieresti/sposteresti effettivamente i file
    // Per ora, ricarica semplicemente i file per simulare l'operazione
    await loadFiles();
    
    // Se era un'operazione di taglio, pulisci gli appunti
    if (clipboard.operation === 'cut') {
      setClipboard(null);
    }
    
    setShowContextMenu(false);
  };
  
  return (
    <div className="h-full flex flex-col bg-surface-dark" ref={fileManagerRef}>
      {/* Barra degli strumenti */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
        
<button 
  className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
  onClick={loadFiles}
  title="Aggiorna"
>
  <FiRefreshCw size={18} />
</button>
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
            selectedItems.length === 1 
              ? 'hover:bg-white/10 text-white/70 hover:text-white' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          disabled={selectedItems.length !== 1}
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
              <FileItemComponent
                key={item.id}
                file={item}
                isSelected={selectedItems.includes(item.id)}
                onSelect={(e) => handleItemSelect(item, e)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
                panelId={panel.id}
              />
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
                    draggable={item.type !== 'folder'}
                    onDragStart={(e) => {
                      // Inizia il drag solo per i file (non cartelle)
                      if (item.type === 'folder') {
                        e.preventDefault();
                        return;
                      }
                      
                      console.log('Drag start in list view:', item.name);
                      
                      // Imposta i dati del drag
                      try {
                        const data = JSON.stringify({
                          fileId: item.id,
                          fileName: item.name,
                          fileType: item.type,
                          panelId: panel.id
                        });
                        
                        e.dataTransfer.setData('application/json', data);
                        e.dataTransfer.setData('text/plain', item.name);
                        e.dataTransfer.effectAllowed = 'copy';
                      } catch (error) {
                        console.error("Errore nell'impostazione dei dati drag:", error);
                      }
                    }}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <div className="mr-3 relative">
                          {getFileIcon(item)}
                          {item.isPublic && (
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
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {item.type === 'folder' ? '-' : formatFileSize(item.size)}
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
                  <FiStar size={14} fill={items.find(item => item.id === contextMenuItem)?.isPublic ? "currentColor" : "none"} />
                  <span>{items.find(item => item.id === contextMenuItem)?.isPublic ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}</span>
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2"
                  onClick={() => handleTagsMenu(contextMenuItem)}
                >
                  <FiSearch size={14} />
                  <span>Gestisci tag</span>
                </button>
                
                {items.find(item => item.id === contextMenuItem)?.type !== 'folder' && (
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
                  {/* Simula tag esistenti */}
                  <div className="text-white/40">Nessun tag</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-white/70 mb-2">Tag disponibili:</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button 
                      key={tag}
                      className="px-2 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                      onClick={() => addTag(tag)}
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