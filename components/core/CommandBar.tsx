// src/components/core/CommandBar.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiMic, FiSearch, FiGrid, FiUser, FiSettings } from 'react-icons/fi'
import { useSession } from 'next-auth/react'
import { useAIStore } from '@/lib/store/aiStore'
import { useUserPreferences } from '@/hooks/useUserPreferences'

export default function CommandBar() {
  const { data: session } = useSession()
  const { preferences } = useUserPreferences()
  const [isCommandActive, setIsCommandActive] = useState(false)
  const [command, setCommand] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { toggleAssistant } = useAIStore()
  
  // Attiva la barra dei comandi con shortcut (Ctrl+K o Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandActive(true)
      }
      
      // Attiva assistente con "Hey Jarvis" shortcut (Alt+J)
      if (e.altKey && e.key === 'j') {
        e.preventDefault()
        toggleAssistant(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAssistant])
  
  // Focus sull'input quando attivato
  useEffect(() => {
    if (isCommandActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCommandActive])
  
  // Gestisce l'esecuzione del comando
  const handleExecuteCommand = () => {
    if (!command.trim()) return
    
    // Esegue comandi speciali
    if (command.toLowerCase().includes('jarvis')) {
      toggleAssistant(true)
    }
    
    // Reset
    setCommand('')
    setIsCommandActive(false)
  }
  
  // Personalità dell'assistente basata sulle preferenze utente
  const getAssistantGreeting = () => {
    const personality = preferences.aiAssistant?.personality || 'friendly'
    const userName = session?.user?.name?.split(' ')[0] || 'utente'
    
    switch (personality) {
      case 'professional':
        return `Come posso assisterla, ${userName}?`
      case 'friendly':
        return `Ciao ${userName}! Come posso aiutarti oggi?`
      case 'concise':
        return `Pronto, ${userName}.`
      default:
        return `Come posso aiutarti, ${userName}?`
    }
  }
  
  return (
    <div className="w-full h-full flex items-center">
      {/* Logo */}
      <div className="mr-6 font-mono text-lg text-primary font-semibold tracking-wide">
        JARVIS
      </div>
      
      {/* Command Input */}
      <div className="relative flex-1 max-w-2xl">
        <div 
          className={`h-10 px-4 rounded-lg border border-white/20 flex items-center gap-2 cursor-text hover:border-white/30 transition-all ${isCommandActive ? 'bg-surface border-primary' : 'bg-surface/60'}`}
          onClick={() => setIsCommandActive(true)}
        >
          <FiSearch className="text-white/50" />
          
          {isCommandActive ? (
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-white placeholder-white/50"
              placeholder={getAssistantGreeting()}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
              onBlur={() => setIsCommandActive(false)}
            />
          ) : (
            <span className="text-white/50 text-sm">
              Cerca o digita un comando... <span className="text-xs opacity-50 ml-1">Ctrl+K</span>
            </span>
          )}
          
          {/* Microfono per comandi vocali */}
          <button 
            className={`p-1 rounded hover:bg-white/10 text-white/70 hover:text-primary transition-colors ${!preferences.aiAssistant?.voiceEnabled ? 'opacity-50' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              if (preferences.aiAssistant?.voiceEnabled) {
                toggleAssistant(true) // Attiva l'assistente in modalità vocale
              }
            }}
            disabled={!preferences.aiAssistant?.voiceEnabled}
          >
            <FiMic />
          </button>
        </div>
        
        {/* Suggerimenti di comandi (visibili solo quando attivo) */}
        {isCommandActive && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-12 left-0 right-0 bg-surface rounded-lg border border-white/10 shadow-xl z-10 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-xs text-white/50 px-2 py-1">Comandi rapidi</div>
              {[
                'Apri browser', 
                'Apri editor di testo', 
                'Crea nuovo progetto', 
                'Apri file manager', 
                `Hey Jarvis`
              ].map((cmd, i) => (
                <div 
                  key={i}
                  className="px-3 py-2 rounded hover:bg-white/10 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setCommand(cmd)
                    handleExecuteCommand()
                  }}
                >
                  <span className="text-primary">&gt;</span>
                  <span>{cmd}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Info utente (mostrato solo se non modificato in Dashboard) */}
      {!session && (
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <FiGrid />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <FiSettings />
          </button>
          <button className="ml-2 flex items-center gap-2 px-3 py-1 rounded-lg bg-surface hover:bg-surface-light transition-colors">
            <FiUser />
            <span className="text-sm">Guest</span>
          </button>
        </div>
      )}
    </div>
  )
}