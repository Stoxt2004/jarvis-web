// src/components/core/Panel.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiMinimize2, FiMaximize2, FiMinus } from 'react-icons/fi'
import { Panel as PanelType, useWorkspaceStore } from '@/lib/store/workspaceStore'

// Lazy load dei componenti dei pannelli specifici
import dynamic from 'next/dynamic'

// Definisci un'interfaccia comune per tutti i componenti panel
interface CommonPanelProps {
  panel: PanelType;
}

const PanelComponents = {
  browser: dynamic(() => import('@/components/core/panels/BrowserPanel')),
  editor: dynamic(() => import('@/components/core/panels/EditorPanel')),
  fileManager: dynamic(() => import('@/components/core/panels/FileManagerPanel')),
  terminal: dynamic(() => import('@/components/core/panels/TerminalPanel')),
  notes: dynamic(() => import('@/components/core/panels/NotesPanel')),
  dashboard: dynamic(() => import('@/components/core/panels/DashboardPanel')),
}

interface PanelProps {
  panel: PanelType
}

export default function Panel({ panel }: PanelProps) {
  const { 
    activePanel, 
    setActivePanel, 
    removePanel, 
    maximizePanel, 
    minimizePanel, 
    restorePanel,
    updatePanelPosition, 
    updatePanelSize 
  } = useWorkspaceStore()
  
  // Se il pannello è minimizzato, non renderizzare nulla
  if (panel.isMinimized) {
    return null
  }
  
  // Renderizza il contenuto del pannello in base al tipo
  const renderPanelContent = () => {
    if (!panel.type || !PanelComponents[panel.type]) {
      return <div className="flex items-center justify-center h-full">Tipo di pannello non supportato</div>
    }
    
    const Component = PanelComponents[panel.type]
    return <Component panel={panel} />
  }
  
  // Se il pannello è massimizzato, renderizzalo in fullscreen
  if (panel.isMaximized) {
    return (
      <div
        className="fixed inset-0 flex flex-col glass-panel"
        style={{ zIndex: panel.zIndex }}
        onClick={() => setActivePanel(panel.id)}
      >
        {/* Barra del titolo */}
        <div className="h-10 px-4 flex items-center justify-between bg-surface-light">
          <div className="text-white/80 truncate">{panel.title}</div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 rounded hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                minimizePanel(panel.id)
              }}
            >
              <FiMinus size={14} />
            </button>
            
            <button 
              className="p-1 rounded hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                restorePanel(panel.id)
              }}
            >
              <FiMinimize2 size={14} />
            </button>
            
            <button 
              className="p-1 rounded hover:bg-red-500/20 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                removePanel(panel.id)
              }}
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
        
        {/* Contenuto */}
        <div className="flex-1 overflow-hidden">
          {renderPanelContent()}
        </div>
      </div>
    )
  }
  
  // Gestisce il trascinamento (senza usare librerie esterne)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Attiva il pannello
    setActivePanel(panel.id)
    
    // Posizione iniziale del mouse
    const startMousePos = { x: e.clientX, y: e.clientY }
    // Posizione iniziale del pannello
    const startPanelPos = { x: panel.position.x, y: panel.position.y }
    
    // Funzione per gestire il movimento del mouse
    function handleMouseMove(moveEvent: MouseEvent) {
      moveEvent.preventDefault()
      
      // Calcola quanto si è spostato il mouse
      const deltaX = moveEvent.clientX - startMousePos.x
      const deltaY = moveEvent.clientY - startMousePos.y
      
      // Calcola la nuova posizione del pannello
      let newX = startPanelPos.x + deltaX
      let newY = startPanelPos.y + deltaY
      
      // Limita la posizione per evitare che esca dallo schermo
      newX = Math.max(0, Math.min(newX, window.innerWidth - 100))
      newY = Math.max(0, Math.min(newY, window.innerHeight - 50))
      
      // Aggiorna la posizione
      updatePanelPosition(panel.id, { x: newX, y: newY })
    }
    
    // Funzione per terminare il trascinamento
    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    // Aggiungi gli event listener
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  // Gestisce il ridimensionamento
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Attiva il pannello
    setActivePanel(panel.id)
    
    // Posizione iniziale del mouse
    const startMousePos = { x: e.clientX, y: e.clientY }
    // Dimensione iniziale del pannello
    const startPanelSize = { width: panel.size.width, height: panel.size.height }
    
    // Funzione per gestire il movimento del mouse durante il ridimensionamento
    function handleResizeMouseMove(moveEvent: MouseEvent) {
      moveEvent.preventDefault()
      
      // Calcola quanto si è spostato il mouse
      const deltaX = moveEvent.clientX - startMousePos.x
      const deltaY = moveEvent.clientY - startMousePos.y
      
      // Calcola le nuove dimensioni
      const newWidth = Math.max(300, startPanelSize.width + deltaX)
      const newHeight = Math.max(200, startPanelSize.height + deltaY)
      
      // Aggiorna le dimensioni
      updatePanelSize(panel.id, { width: newWidth, height: newHeight })
    }
    
    // Funzione per terminare il ridimensionamento
    function handleResizeMouseUp() {
      document.removeEventListener('mousemove', handleResizeMouseMove)
      document.removeEventListener('mouseup', handleResizeMouseUp)
    }
    
    // Aggiungi gli event listener
    document.addEventListener('mousemove', handleResizeMouseMove)
    document.addEventListener('mouseup', handleResizeMouseUp)
  }
  
  // Renderizza il pannello normale (trascinabile)
  return (
    <div
      className={`absolute glass-panel overflow-hidden flex flex-col ${
        activePanel === panel.id ? 'ring-1 ring-primary/50' : ''
      }`}
      style={{ 
        top: panel.position.y, 
        left: panel.position.x, 
        width: panel.size.width, 
        height: panel.size.height,
        zIndex: panel.zIndex 
      }}
      onClick={() => setActivePanel(panel.id)}
    >
      {/* Barra del titolo */}
      <div 
        className="h-10 px-4 flex items-center justify-between bg-surface-light cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <div className="text-white/80 truncate">{panel.title}</div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              minimizePanel(panel.id)
            }}
          >
            <FiMinus size={14} />
          </button>
          
          <button 
            className="p-1 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              maximizePanel(panel.id)
            }}
          >
            <FiMaximize2 size={14} />
          </button>
          
          <button 
            className="p-1 rounded hover:bg-red-500/20 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation()
              removePanel(panel.id)
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
      
      {/* Contenuto */}
      <div className="flex-1 overflow-hidden">
        {renderPanelContent()}
      </div>
      
      {/* Maniglia di ridimensionamento */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/30"></div>
      </div>
    </div>
  )
}