// src/lib/store/workspaceStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipi di pannello disponibili
export type PanelType = 'browser' | 'editor' | 'fileManager' | 'terminal' | 'notes' | 'dashboard'

export interface Panel {
  id: string
  type: PanelType
  title: string
  content?: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
}

// Nuovo tipo per l'input addPanel, senza le proprietà generate automaticamente
type PanelInput = Omit<Panel, 'id' | 'zIndex' | 'isMaximized' | 'isMinimized'>

interface WorkspaceState {
  panels: Panel[]
  activePanel: string | null
  
  // Azioni
  addPanel: (panel: PanelInput) => string
  removePanel: (id: string) => void
  maximizePanel: (id: string) => void
  minimizePanel: (id: string) => void
  restorePanel: (id: string) => void
  setActivePanel: (id: string) => void
  updatePanelPosition: (id: string, position: { x: number; y: number }) => void
  updatePanelSize: (id: string, size: { width: number; height: number }) => void
  updatePanelContent: (id: string, content: any) => void
  
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      panels: [],
      activePanel: null,
      
      addPanel: (panel) => {
        const id = `panel-${Date.now()}`
        // Ottieni il massimo zIndex corrente
        const currentPanels = get().panels;
        const maxZIndex = currentPanels.length ? Math.max(...currentPanels.map(p => p.zIndex)) : 0;
        
        const newPanel: Panel = {
          ...panel,
          id,
          zIndex: maxZIndex + 1, // Assicura che sia sempre sopra
          isMaximized: false,
          isMinimized: false,
        }
        
        set((state) => ({
          panels: [...state.panels, newPanel],
          activePanel: id,
        }))
        
        return id
      },
      
      removePanel: (id) => {
        set((state) => ({
          panels: state.panels.filter((panel) => panel.id !== id),
          activePanel: state.activePanel === id 
            ? (state.panels.length > 1 
                ? state.panels.find(p => p.id !== id)?.id ?? null 
                : null) 
            : state.activePanel
        }))
      },
      
      maximizePanel: (id) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, isMaximized: true, isMinimized: false } 
              : panel
          ),
          activePanel: id,
        }))
      },
      
      minimizePanel: (id) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, isMinimized: true, isMaximized: false } 
              : panel
          ),
          activePanel: state.activePanel === id 
            ? (state.panels.find(p => p.id !== id && !p.isMinimized)?.id ?? null) 
            : state.activePanel
        }))
      },
      
      restorePanel: (id) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, isMaximized: false, isMinimized: false } 
              : panel
          ),
          activePanel: id,
        }))
      },
      
      setActivePanel: (id: string) => {
        // Aggiorna lo zIndex per portare il pannello in primo piano
        set((state) => {
          // Trova il massimo zIndex corrente
          const maxZIndex = Math.max(...state.panels.map(p => p.zIndex))
          
          return {
            panels: state.panels.map((panel) => 
              panel.id === id 
                ? { ...panel, zIndex: maxZIndex + 1 } 
                : panel
            ),
            activePanel: id,
          }
        })
      },
      
      updatePanelPosition: (id, position) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, position } 
              : panel
          ),
        }))
      },
      
      updatePanelSize: (id, size) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, size } 
              : panel
          ),
        }))
      },
      
      updatePanelContent: (id, content) => {
        set((state) => ({
          panels: state.panels.map((panel) => 
            panel.id === id 
              ? { ...panel, content } 
              : panel
          ),
        }))
      },
    }),
    {
      name: 'jarvis-workspace',
    }
  )
)