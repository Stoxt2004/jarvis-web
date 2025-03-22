// src/lib/store/workspaceStore.ts
// Aggiornamento dello store di workspace per supportare l'integrazione tra pannelli

import { create } from 'zustand';
import { nanoid } from 'nanoid';

// Tipi di pannello disponibili nell'applicazione
export type PanelType = 'browser' | 'editor' | 'fileManager' | 'terminal' | 'notes' | 'dashboard' | 'calendar';

// Interfaccia del pannello
export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  content?: any; // Contenuto specifico in base al tipo di pannello
}

// Interfaccia dello stato del workspace
interface WorkspaceState {
  panels: Panel[];
  activePanel: string | null;
  nextZIndex: number;
  
  // Azioni per gestire i pannelli
  addPanel: (panelOptions: Omit<Panel, 'id' | 'zIndex' | 'isMaximized' | 'isMinimized'>) => void;
  removePanel: (id: string) => void;
  updatePanelContent: (id: string, content: any) => void;
  updatePanelPosition: (id: string, position: { x: number; y: number }) => void;
  updatePanelSize: (id: string, size: { width: number; height: number }) => void;
  setActivePanel: (id: string | null) => void;
  maximizePanel: (id: string) => void;
  minimizePanel: (id: string) => void;
  restorePanel: (id: string) => void;
  syncPanels: (sourceId: string, targetId: string, field: 'content' | 'position' | 'size') => void; // Nuova funzione
}

// Creazione dello store
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  panels: [],
  activePanel: null,
  nextZIndex: 1,
  
  // Aggiungi un nuovo pannello
  addPanel: (panelOptions) => 
    set((state) => {
      const newPanel: Panel = {
        id: nanoid(),
        zIndex: state.nextZIndex,
        isMaximized: false,
        isMinimized: false,
        ...panelOptions
      };
      
      return {
        panels: [...state.panels, newPanel],
        activePanel: newPanel.id,
        nextZIndex: state.nextZIndex + 1
      };
    }),
  
  // Rimuovi un pannello esistente
  removePanel: (id) =>
    set((state) => ({
      panels: state.panels.filter(panel => panel.id !== id),
      activePanel: state.activePanel === id ? null : state.activePanel
    })),
  
  // Aggiorna il contenuto del pannello
  updatePanelContent: (id, content) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, content: { ...panel.content, ...content } }
          : panel
      )
    })),
  
  // Aggiorna la posizione del pannello
  updatePanelPosition: (id, position) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, position }
          : panel
      )
    })),
  
  // Aggiorna la dimensione del pannello
  updatePanelSize: (id, size) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, size }
          : panel
      )
    })),
  
  // Imposta il pannello attivo
  setActivePanel: (id) =>
    set((state) => {
      // Se il pannello è già attivo, non c'è bisogno di cambiare nulla
      if (state.activePanel === id) return state;
      
      // Altrimenti, aggiorna l'indice z del pannello selezionato
      return {
        panels: state.panels.map(panel =>
          panel.id === id
            ? { ...panel, zIndex: state.nextZIndex }
            : panel
        ),
        activePanel: id,
        nextZIndex: state.nextZIndex + 1
      };
    }),
  
  // Massimizza un pannello
  maximizePanel: (id) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, isMaximized: true, zIndex: state.nextZIndex }
          : panel
      ),
      activePanel: id,
      nextZIndex: state.nextZIndex + 1
    })),
  
  // Minimizza un pannello
  minimizePanel: (id) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, isMinimized: true }
          : panel
      ),
      activePanel: state.activePanel === id ? null : state.activePanel
    })),
  
  // Ripristina un pannello minimizzato o massimizzato
  restorePanel: (id) =>
    set((state) => ({
      panels: state.panels.map(panel =>
        panel.id === id
          ? { ...panel, isMaximized: false, isMinimized: false, zIndex: state.nextZIndex }
          : panel
      ),
      activePanel: id,
      nextZIndex: state.nextZIndex + 1
    })),
    
  // Sincronizza pannelli (nuova funzionalità per l'integrazione)
  syncPanels: (sourceId, targetId, field) =>
    set((state) => {
      // Trova i pannelli sorgente e destinazione
      const sourcePanel = state.panels.find(panel => panel.id === sourceId);
      const targetPanel = state.panels.find(panel => panel.id === targetId);
      
      if (!sourcePanel || !targetPanel) return state;
      
      // Applica la sincronizzazione in base al campo
      switch (field) {
        case 'content':
          // Per il contenuto, dobbiamo gestire diversi tipi di pannelli
          // Per esempio, da editor a editor, da file manager a editor, ecc.
          if (sourcePanel.type === 'editor' && targetPanel.type === 'editor') {
            return {
              panels: state.panels.map(panel => 
                panel.id === targetId
                  ? { ...panel, content: { ...panel.content, value: sourcePanel.content?.value } }
                  : panel
              )
            };
          }
          break;
          
        case 'position':
          return {
            panels: state.panels.map(panel => 
              panel.id === targetId
                ? { ...panel, position: { ...sourcePanel.position } }
                : panel
            )
          };
          
        case 'size':
          return {
            panels: state.panels.map(panel => 
              panel.id === targetId
                ? { ...panel, size: { ...sourcePanel.size } }
                : panel
            )
          };
      }
      
      return state;
    }),
}));