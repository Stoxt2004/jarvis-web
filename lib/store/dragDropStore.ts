// lib/store/dragDropStore.ts
import { create } from 'zustand';

interface DragDropState {
  // Stato del drag and drop
  draggedFile: {
    id: string;
    name: string;
    type: string;
    content?: string;
    sourcePanel: string;
  } | null;
  isDraggingOver: string | null;
  
  // Funzioni per il drag & drop
  startDrag: (fileId: string, fileName: string, fileType: string, content: string | undefined, panelId: string) => void;
  endDrag: () => void;
  setDraggingOver: (panelId: string | null) => void;
  
  // Stato per AI selection
  selectedPanelsForAI: string[];
  addPanelToAISelection: (panelId: string) => void;
  removePanelFromAISelection: (panelId: string) => void;
  clearAISelection: () => void;
}

export const useDragDropStore = create<DragDropState>((set) => ({
  // Stato iniziale del drag and drop
  draggedFile: null,
  isDraggingOver: null,
  
  // Stato iniziale della selezione AI
  selectedPanelsForAI: [],
  
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
  
  // Funzioni per la selezione AI
  addPanelToAISelection: (panelId) => set(state => {
    if (!state.selectedPanelsForAI.includes(panelId)) {
      return { selectedPanelsForAI: [...state.selectedPanelsForAI, panelId] };
    }
    return state;
  }),
  
  removePanelFromAISelection: (panelId) => set(state => ({
    selectedPanelsForAI: state.selectedPanelsForAI.filter(id => id !== panelId)
  })),
  
  clearAISelection: () => set({ selectedPanelsForAI: [] })
}));

// Tipi utili per l'esportazione
export type DraggedFile = NonNullable<DragDropState['draggedFile']>;