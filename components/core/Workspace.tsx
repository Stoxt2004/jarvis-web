// src/components/core/Workspace.tsx
"use client"

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiGrid, FiBriefcase, FiCode, FiFolder, FiTerminal, FiFileText, FiGlobe, FiCalendar } from 'react-icons/fi'
import Panel from './Panel'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'

type PanelType = 'editor' | 'fileManager' | 'terminal' | 'notes' | 'dashboard' | 'calendar';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function Workspace() {
  const { panels, addPanel } = useWorkspaceStore()
  // Aggiungi un ref per tracciare l'inizializzazione
  const isInitialized = useRef(false)
  const { subscription } = useSubscription();
  // Colori moderni 2025 (stessi della dashboard)
  const colors = {
    primary: "#A47864", // Mocha Mousse (Pantone 2025)
    secondary: "#A78BFA", // Digital Lavender
    accent: "#4CAF50", // Verdant Green
    navy: "#101585", // Navy Blue
    rose: "#D58D8D", // Muted Rose
    background: "#0F0F1A", // Dark background
    surface: "#1A1A2E", // Slightly lighter surface
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  }

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
    if (subscription.plan === 'FREE' && panels.length >= 3) {
      toast.error('Free plan limited to 3 panels. Upgrade to Premium for unlimited panels.');
      return;
    }
    const panelDefaults = {
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
      calendar: {  // Aggiungi questa configurazione
        title: 'Calendario',
        position: { x: 240, y: 240 },
        size: { width: 800, height: 600 },
      },
    }
    
    const defaults = panelDefaults[type as keyof typeof panelDefaults]
    addPanel({
      type,
      ...defaults,
    })
  }

  // Icone per i diversi tipi di app
  const appIcons = {
    editor: <FiCode />,
    fileManager: <FiFolder />,
    terminal: <FiTerminal />,
    notes: <FiFileText />,
    dashboard: <FiGrid />,
    calendar: <FiCalendar />,  // Aggiungi questa riga (importa anche FiCalendar)
  }
  

  return (
    <div className="relative h-full overflow-auto">
      {/* Pannelli esistenti */}
      <AnimatePresence>
        {panels.map((panel) => (
          <Panel key={panel.id} panel={panel} />
        ))}
      </AnimatePresence>

      {/* Dock per creare nuove app */}
      <div className="fixed bottom-6 w-full flex justify-center" style={{ zIndex: 200 }}>
      <motion.div 
    className="flex items-center gap-2 p-2 rounded-full"
    style={{ 
      background: `rgba(26, 26, 46, 0.8)`,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
    }}
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.7 }}
  >
        {(['dashboard', 'editor', 'fileManager', 'terminal', 'notes', 'calendar'] as PanelType[]).map((type) => (
          <motion.button
            key={type}
            className="p-3 rounded-full"
            style={{ 
              background: `rgba(255, 255, 255, 0.05)`,
            }}
            onClick={() => handleCreatePanel(type)}
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: `${colors.primary}20`,
              color: colors.primary
            }}
            whileTap={{ scale: 0.95 }}
            title={`Apri ${type}`}
          >
            {appIcons[type]}
          </motion.button>
        ))}
      </motion.div>
      </div>
    </div>
  )
}
