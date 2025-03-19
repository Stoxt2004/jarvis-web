// src/app/dashboard/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import CommandBar from '@/components/core/CommandBar'
import Workspace from '@/components/core/Workspace'
import AIAssistant from '@/components/ai/AIAssistant'
import { useAIStore } from '@/lib/store/aiStore'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import UserMenu from '@/components/user/UserMenu'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const { isAssistantActive, toggleAssistant } = useAIStore()
  const { panels, activePanel } = useWorkspaceStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // Simulazione di caricamento iniziale
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (status === 'loading' || isLoading) {
    return <LoadingScreen />
  }
  
  return (
    <main className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* Header con CommandBar */}
      <header className="h-14 border-b border-white/10 flex items-center px-4">
        <CommandBar />
        
        {/* User profile */}
        <div className="ml-auto relative">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-light transition-colors"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser />
              )}
            </div>
            <span className="text-sm">{session?.user?.name || 'Utente'}</span>
          </button>
          
          {/* User menu dropdown */}
          {isUserMenuOpen && (
            <UserMenu 
              user={session?.user} 
              onClose={() => setIsUserMenuOpen(false)}
              onLogout={() => signOut({ callbackUrl: '/' })}
            />
          )}
        </div>
      </header>
      
      {/* Area di lavoro principale */}
      <div className="flex-1 relative">
        <Workspace />
        
        {/* AI Assistant overlay */}
        {isAssistantActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <AIAssistant onClose={() => toggleAssistant(false)} />
          </motion.div>
        )}
      </div>
      
      {/* Footer con info e status */}
      <footer className="h-8 border-t border-white/10 bg-surface-dark flex items-center justify-between px-4 text-xs text-white/60">
        <div>Jarvis Web OS • v0.1.0</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Tutti i sistemi operativi</span>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-light">
            {session?.user?.plan === 'PREMIUM' ? 'Premium' : session?.user?.plan === 'TEAM' ? 'Team' : 'Free'}
          </span>
        </div>
      </footer>
    </main>
  )
}

// Schermata di caricamento
function LoadingScreen() {
  return (
    <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-2 border-primary animate-pulse-slow"></div>
        <div className="w-24 h-24 rounded-full border-2 border-primary absolute inset-0 pulse-ring"></div>
        <div className="absolute inset-0 flex items-center justify-center text-primary font-mono">
          JARVIS
        </div>
      </div>
      <p className="mt-8 text-white/70 font-mono">Inizializzazione sistemi...</p>
    </div>
  )
}