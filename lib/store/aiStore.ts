// src/lib/store/aiStore.ts
import { create } from 'zustand'

interface AIState {
  isAssistantActive: boolean
  isListening: boolean
  lastCommand: string | null
  toggleAssistant: (active: boolean) => void
  setListening: (listening: boolean) => void
  setLastCommand: (command: string) => void
}

export const useAIStore = create<AIState>((set) => ({
  isAssistantActive: false,
  isListening: false,
  lastCommand: null,
  
  toggleAssistant: (active) => set({ isAssistantActive: active }),
  setListening: (listening) => set({ isListening: listening }),
  setLastCommand: (command) => set({ lastCommand: command }),
}))