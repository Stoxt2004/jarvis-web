// src/components/core/CommandBar.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiSearch, FiGrid, FiUser, FiSettings, FiCommand } from 'react-icons/fi'
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
    <AnimatePresence>
      {isCommandActive && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsCommandActive(false)}
        >
          <motion.div 
            className="w-full max-w-2xl rounded-xl overflow-hidden p-4"
            style={{ 
              background: `rgba(26, 26, 46, 0.95)`,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {/* Logo */}
              <motion.div 
                className="font-mono text-xl font-semibold tracking-wide"
                style={{ color: colors.primary }}
                whileHover={{ scale: 1.05 }}
              >
                JARVIS
              </motion.div>
              
              <div className="flex-1 relative">
                {/* Command Input */}
                <div className="relative flex items-center">
                  <FiCommand className="absolute left-3 text-lg" style={{ color: colors.primary }} />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full py-2.5 pl-10 pr-4 rounded-md bg-black/20 border border-white/10 focus:outline-none text-white"
                    style={{ 
                      borderColor: command ? colors.primary : 'rgba(255, 255, 255, 0.1)'
                    }}
                    placeholder={getAssistantGreeting()}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                    onBlur={() => {}}
                  />
                </div>
              </div>
              
              {/* Microfono per comandi vocali */}
              <motion.button
                className="p-2 rounded-md"
                style={{ 
                  background: preferences.aiAssistant?.voiceEnabled 
                    ? `${colors.primary}20` 
                    : 'rgba(255, 255, 255, 0.05)'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (preferences.aiAssistant?.voiceEnabled) {
                    toggleAssistant(true) // Attiva l'assistente in modalità vocale
                  }
                }}
                disabled={!preferences.aiAssistant?.voiceEnabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMic className="text-lg" style={{ 
                  color: preferences.aiAssistant?.voiceEnabled 
                    ? colors.primary 
                    : 'rgba(255, 255, 255, 0.4)'
                }} />
              </motion.button>
            </div>
            
            {/* Suggerimenti di comandi */}
            <div className="mt-4">
              <div className="text-sm mb-2" style={{ color: colors.textMuted }}>
                Comandi rapidi
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Apri browser',
                  'Apri editor di testo',
                  'Crea nuovo progetto',
                  'Apri file manager',
                  `Hey Jarvis`
                ].map((cmd, i) => (
                  <motion.div
                    key={i}
                    className="p-2 rounded-md cursor-pointer"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                    onClick={() => {
                      setCommand(cmd)
                      handleExecuteCommand()
                    }}
                    whileHover={{ 
                      backgroundColor: `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.2)`,
                      y: -2
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-white">{cmd}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Info utente */}
            {!session && (
              <div className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                Guest
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
