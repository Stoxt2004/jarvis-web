// lib/store/panelIntegrationStore.ts
import { create } from 'zustand';
import { Panel } from '@/lib/store/workspaceStore';

interface PanelIntegrationState {
  // Pannelli selezionati per l'analisi AI
  selectedPanelsForAI: string[];
  
  // Funzioni per la selezione di pannelli per l'analisi AI
  addPanelToAISelection: (panelId: string) => void;
  removePanelFromAISelection: (panelId: string) => void;
  clearAISelection: () => void;
  
  // File in processo di drag
  draggedFile: {
    id: string;
    name: string;
    type: string;
    content?: string;
    sourcePanel: string;
  } | null;
  
  // Funzioni per il drag & drop
  startDrag: (fileId: string, fileName: string, fileType: string, content: string | undefined, panelId: string) => void;
  endDrag: () => void;
  
  // Stato di una potenziale operazione di drop
  isDraggingOver: string | null;
  setDraggingOver: (panelId: string | null) => void;
}

export const usePanelIntegrationStore = create<PanelIntegrationState>((set, get) => ({
  // Stato iniziale
  selectedPanelsForAI: [],
  draggedFile: null,
  isDraggingOver: null,
  
  // Funzioni per la selezione di pannelli per l'analisi AI
  addPanelToAISelection: (panelId) => {
    set(state => {
      if (!state.selectedPanelsForAI.includes(panelId)) {
        return { selectedPanelsForAI: [...state.selectedPanelsForAI, panelId] };
      }
      return state;
    });
  },
  
  removePanelFromAISelection: (panelId) => {
    set(state => ({
      selectedPanelsForAI: state.selectedPanelsForAI.filter(id => id !== panelId)
    }));
  },
  
  clearAISelection: () => set({ selectedPanelsForAI: [] }),
  
  // Funzioni per il drag & drop
  startDrag: (fileId, fileName, fileType, content, panelId) => set({
    draggedFile: {
      id: fileId,
      name: fileName,
      type: fileType,
      content,
      sourcePanel: panelId
    }
  }),
  
  endDrag: () => set({ draggedFile: null, isDraggingOver: null }),
  
  setDraggingOver: (panelId) => set({ isDraggingOver: panelId }),
}));

// Tipi utili per l'esportazione
export type DraggedFile = NonNullable<PanelIntegrationState['draggedFile']>;