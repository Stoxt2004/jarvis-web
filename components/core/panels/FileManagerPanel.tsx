// src/components/core/panels/FileManagerPanel.tsx
"use client"

import { useState, useEffect } from 'react'
import { FiFolder, FiFile, FiUpload, FiDownload, FiTrash2, FiPlus, 
         FiArrowLeft, FiSearch, FiGrid, FiList, FiMoreVertical } from 'react-icons/fi'
import { Panel } from '@/lib/store/workspaceStore'
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
  color?: string
}

export default function FileManagerPanel({ panel }: FileManagerPanelProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Dati demo per simulare un file system
  const [items, setItems] = useState<FileItem[]>([
    { 
      id: '1', 
      name: 'Documenti', 
      type: 'folder', 
      modified: new Date(2024, 2, 15), 
      path: '/Documenti',
      color: '#4299e1'
    },
    { 
      id: '2', 
      name: 'Progetti', 
      type: 'folder', 
      modified: new Date(2024, 3, 1), 
      path: '/Progetti',
      color: '#f6ad55'
    },
    { 
      id: '3', 
      name: 'Media', 
      type: 'folder', 
      modified: new Date(2024, 3, 10), 
      path: '/Media',
      color: '#f56565'
    },
    { 
      id: '4', 
      name: 'Report Trimestrale.pdf', 
      type: 'file', 
      size: 1240000, 
      modified: new Date(2024, 3, 5), 
      path: '/Report Trimestrale.pdf',
      extension: 'pdf'
    },
    { 
      id: '5', 
      name: 'Note riunione.txt', 
      type: 'file', 
      size: 2500, 
      modified: new Date(2024, 3, 12), 
      path: '/Note riunione.txt',
      extension: 'txt'
    },
    { 
      id: '6', 
      name: 'Presentazione.pptx', 
      type: 'file', 
      size: 4500000, 
      modified: new Date(2024, 3, 8), 
      path: '/Presentazione.pptx',
      extension: 'pptx'
    },
    { 
      id: '7', 
      name: 'Budget.xlsx', 
      type: 'file', 
      size: 3200000, 
      modified: new Date(2024, 3, 14), 
      path: '/Budget.xlsx',
      extension: 'xlsx'
    },
    { 
      id: '8', 
      name: 'Logo.png', 
      type: 'file', 
      size: 890000, 
      modified: new Date(2024, 3, 2), 
      path: '/Logo.png',
      extension: 'png'
    }
  ])
  
  // Gestione dei click sulle cartelle per navigazione
  const handleFolderClick = (folder: FileItem) => {
    setCurrentPath(folder.path)
    setSelectedItems([])
  }
  
  // Funzione per tornare indietro nel percorso
  const handleGoBack = () => {
    if (currentPath === '/') return
    
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`
    setCurrentPath(newPath)
    setSelectedItems([])
  }
  
  // Gestione della selezione dei file
  const handleItemSelect = (item: FileItem, event: React.MouseEvent) => {
    if (item.type === 'folder') {
      handleFolderClick(item)
      return
    }
    
    // Gestione multiselection con Ctrl/Command
    if (event.ctrlKey || event.metaKey) {
      setSelectedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id) 
          : [...prev, item.id]
      )
    } else {
      setSelectedItems([item.id])
    }
  }
  
  // Funzione per formattare la dimensione del file
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return ''
    
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
  
  // Funzione per formattare la data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Filtro e ordinamento degli elementi in base al percorso corrente e alla ricerca
  const filteredItems = items
    .filter(item => {
      // Filtro per path corrente
      if (currentPath === '/') {
        return item.path.split('/').length === 2 && item.path.startsWith('/')
      } else {
        const parentPath = currentPath
        return item.path.startsWith(parentPath + '/') && 
               item.path.split('/').length === parentPath.split('/').length + 1
      }
    })
    .filter(item => {
      // Filtro per ricerca
      if (!searchQuery) return true
      return item.name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      // Ordina per cartelle prima dei file
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      
      // Poi ordina in base al criterio selezionato
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
      
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? a.modified.getTime() - b.modified.getTime()
          : b.modified.getTime() - a.modified.getTime()
      }
      
      if (sortBy === 'size') {
        const aSize = a.size || 0
        const bSize = b.size || 0
        return sortOrder === 'asc'
          ? aSize - bSize
          : bSize - aSize
      }
      
      return 0
    })
  
  // Ottiene il nome della cartella corrente
  const getCurrentFolderName = () => {
    if (currentPath === '/') return 'Home'
    const parts = currentPath.split('/')
    return parts[parts.length - 1]
  }
  
  // Simula la creazione di una nuova cartella
  const handleCreateFolder = () => {
    const newFolderName = prompt('Nome della nuova cartella:')
    if (!newFolderName) return
    
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      modified: new Date(),
      path: `${currentPath === '/' ? '' : currentPath}/${newFolderName}`,
      color: '#4299e1'
    }
    
    setItems(prev => [...prev, newFolder])
    toast.success(`Cartella "${newFolderName}" creata`)
  }
  
  // Simula l'upload di un file
  const handleUpload = () => {
    toast.info('Simulazione upload file...')
    
    // Simula il ritardo di un upload
    setTimeout(() => {
      const fileTypes = [
        { name: 'Document.docx', ext: 'docx', size: 250000 },
        { name: 'Image.jpg', ext: 'jpg', size: 3500000 },
        { name: 'Data.csv', ext: 'csv', size: 120000 }
      ]
      
      const randomFile = fileTypes[Math.floor(Math.random() * fileTypes.length)]
      
      const newFile: FileItem = {
        id: `file-${Date.now()}`,
        name: randomFile.name,
        type: 'file',
        size: randomFile.size,
        modified: new Date(),
        path: `${currentPath === '/' ? '' : currentPath}/${randomFile.name}`,
        extension: randomFile.ext
      }
      
      setItems(prev => [...prev, newFile])
      toast.success(`File "${randomFile.name}" caricato con successo`)
    }, 1500)
  }
  
  // Simula l'eliminazione di file o cartelle
  const handleDelete = () => {
    if (selectedItems.length === 0) {
      toast.error('Seleziona almeno un elemento da eliminare')
      return
    }
    
    const itemsToDelete = items.filter(item => selectedItems.includes(item.id))
    const itemNames = itemsToDelete.map(item => item.name).join(', ')
    
    const confirmed = confirm(`Sei sicuro di voler eliminare: ${itemNames}?`)
    if (!confirmed) return
    
    setItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
    setSelectedItems([])
    toast.success(`${selectedItems.length} elementi eliminati`)
  }
  
  // Ottiene l'icona appropriata per il tipo di file
  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return <FiFolder size={24} color={item.color} />
    }
    
    // Icone specifiche per estensione
    switch (item.extension) {
      case 'pdf':
        return <FiFile size={24} color="#f56565" />
      case 'txt':
        return <FiFile size={24} color="#a0aec0" />
      case 'docx':
        return <FiFile size={24} color="#4299e1" />
      case 'xlsx':
        return <FiFile size={24} color="#48bb78" />
      case 'pptx':
        return <FiFile size={24} color="#ed8936" />
      case 'jpg':
      case 'png':
      case 'gif':
        return <FiFile size={24} color="#667eea" />
      default:
        return <FiFile size={24} />
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-surface-dark">
      {/* Barra degli strumenti */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleGoBack}
            disabled={currentPath === '/'}
          >
            <FiArrowLeft size={18} />
          </button>
          
          <div className="text-lg font-medium ml-2">
            {getCurrentFolderName()}
          </div>
        </div>
        
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            className="w-full bg-surface rounded-lg px-3 py-1.5 pl-9 outline-none border border-white/10 focus:border-[#0ea5e9]"
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
          >
            <FiGrid size={18} className={viewMode === 'grid' ? 'text-blue-500' : ''} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={() => setViewMode('list')}
          >
            <FiList size={18} className={viewMode === 'list' ? 'text-blue-500' : ''} />
          </button>
        </div>
      </div>
      
      {/* Barra delle azioni */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <button 
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5"
          onClick={handleUpload}
        >
          <FiUpload size={16} />
          <span>Upload</span>
        </button>
        
        <button 
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5"
          onClick={handleCreateFolder}
        >
          <FiPlus size={16} />
          <span>Nuova cartella</span>
        </button>
        
        <button 
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
            selectedItems.length > 0 
              ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          onClick={handleDelete}
          disabled={selectedItems.length === 0}
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
        >
          <FiDownload size={16} />
          <span>Download</span>
        </button>
      </div>
      
      {/* Contenuto principale */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/50">
            <FiFolder size={48} className="mb-4 opacity-30" />
            <p>Questa cartella è vuota</p>
            <button 
              className="mt-4 px-4 py-2 rounded-md bg-blue-500 bg-opacity-20 hover:bg-blue-500 hover:bg-opacity-30 text-blue-500"
              onClick={handleCreateFolder}
            >
              Crea una nuova cartella
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg cursor-pointer flex flex-col items-center text-center ${
                  selectedItems.includes(item.id) 
                    ? 'bg-blue-500 bg-opacity-20 ring-1 ring-primary' 
                    : 'hover:bg-white/5'
                }`}
                onClick={(e) => handleItemSelect(item, e)}
              >
                <div className="w-16 h-16 flex items-center justify-center mb-2">
                  {getFileIcon(item)}
                </div>
                <div className="truncate w-full text-sm font-medium">{item.name}</div>
                <div className="text-xs text-white/50">
                  {item.type === 'folder' 
                    ? formatDate(item.modified)
                    : formatFileSize(item.size)
                  }
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-light">
                  <th className="text-left py-2 px-4 font-medium">Nome</th>
                  <th className="text-left py-2 px-4 font-medium">Modificato</th>
                  <th className="text-left py-2 px-4 font-medium">Dimensione</th>
                  <th className="text-left py-2 px-4 font-medium">Tipo</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id}
                    className={`border-t border-white/10 ${
                      selectedItems.includes(item.id) 
                        ? 'bg-blue-500 bg-opacity-20' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={(e) => handleItemSelect(item, e)}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getFileIcon(item)}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {formatDate(item.modified)}
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {item.type === 'folder' ? '-' : formatFileSize(item.size)}
                    </td>
                    <td className="py-2 px-4 text-white/70">
                      {item.type === 'folder' ? 'Cartella' : (item.extension?.toUpperCase() || 'File')}
                    </td>
                    <td className="py-2 px-4">
                      <button className="p-1 rounded hover:bg-white/10">
                        <FiMoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  )
}