// src/components/core/Workspace.tsx
"use client"

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiGrid } from 'react-icons/fi'
import Panel from './Panel'
import { useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore'

export default function Workspace() {
  const { panels, addPanel } = useWorkspaceStore()
  // Aggiungi un ref per tracciare l'inizializzazione
  const isInitialized = useRef(false)
  
  // Inizializza il workspace con un pannello di dashboard solo al primo render
  useEffect(() => {
    // Controlla sia se non ci sono pannelli sia se è la prima inizializzazione
    if (panels.length === 0 && !isInitialized.current) {
      addPanel({
        type: 'dashboard',
        title: 'Dashboard',
        position: { x: 100, y: 100 },
        size: { width: 800, height: 500 },
      })
      // Marca come inizializzato
      isInitialized.current = true
    }
  }, [panels.length, addPanel])
  
  // Crea un nuovo pannello
  const handleCreatePanel = (type: PanelType) => {
    const panelDefaults = {
      browser: {
        title: 'Browser',
        position: { x: 120, y: 120 },
        size: { width: 900, height: 600 },
        content: { url: 'https://www.google.com' },
      },
      editor: {
        title: 'Editor',
        position: { x: 140, y: 140 },
        size: { width: 800, height: 550 },
        content: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' },
      },
      fileManager: {
        title: 'File Manager',
        position: { x: 160, y: 160 },
        size: { width: 700, height: 500 },
      },
      terminal: {
        title: 'Terminal',
        position: { x: 180, y: 180 },
        size: { width: 600, height: 400 },
      },
      notes: {
        title: 'Note',
        position: { x: 200, y: 200 },
        size: { width: 500, height: 400 },
        content: { text: '' },
      },
      dashboard: {
        title: 'Dashboard',
        position: { x: 220, y: 220 },
        size: { width: 800, height: 500 },
      },
    }
    
    const defaults = panelDefaults[type]
    addPanel({
      type,
      ...defaults,
    })
  }
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-background to-background-light">
      {/* Sfondo futuristico con pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Pannelli */}
      {panels.map((panel) => (
        <Panel key={panel.id} panel={panel} />
      ))}
      
      {/* Menu contestuale per aggiungere nuovi pannelli */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-2">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-2 flex flex-col gap-2"
        >
          <button 
            className="p-2 rounded-lg hover:bg-primary/20 text-white/80 hover:text-primary transition-all"
            onClick={() => handleCreatePanel('browser')}
            title="Nuovo Browser"
          >
            <FiGrid size={20} />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-primary/20 text-white/80 hover:text-primary transition-all"
            onClick={() => handleCreatePanel('editor')}
            title="Nuovo Editor"
          >
            <FiGrid size={20} />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-primary/20 text-white/80 hover:text-primary transition-all"
            onClick={() => handleCreatePanel('fileManager')}
            title="File Manager"
          >
            <FiGrid size={20} />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-primary/20 text-white/80 hover:text-primary transition-all"
            onClick={() => handleCreatePanel('terminal')}
            title="Terminal"
          >
            <FiGrid size={20} />
          </button>
        </motion.div>
        
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3 rounded-full bg-primary hover:bg-primary-dark shadow-lg hover:shadow-primary/20 transition-all"
          onClick={() => {/* Menu toggle logic */}}
        >
          <FiPlus size={24} />
        </motion.button>
      </div>
    </div>
  )
}