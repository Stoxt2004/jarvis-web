// lib/store/fileSystemStore.ts
import { create } from 'zustand';

interface FileSystemState {
  // Flag per indicare quando i dati sono stati modificati
  dataChanged: boolean;
  // Lista di ID di file che sono stati modificati
  modifiedFileIds: string[];
  // Funzioni per modificare lo stato
  markDataAsChanged: () => void;
  resetDataChangedFlag: () => void;
  addModifiedFileId: (fileId: string) => void;
  clearModifiedFileIds: () => void;
}

export const useFileSystemStore = create<FileSystemState>((set) => ({
  dataChanged: false,
  modifiedFileIds: [],
  
  markDataAsChanged: () => set({ dataChanged: true }),
  resetDataChangedFlag: () => set({ dataChanged: false }),
  
  addModifiedFileId: (fileId) => set((state) => ({
    modifiedFileIds: [...new Set([...state.modifiedFileIds, fileId])]
  })),
  
  clearModifiedFileIds: () => set({ modifiedFileIds: [] }),
}));