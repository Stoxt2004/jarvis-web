// src/app/dashboard/page.tsx - Aggiornato con integrazione abbonamento
"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { FiUser, FiLogOut, FiSettings, FiCreditCard } from 'react-icons/fi'
import CommandBar from '@/components/core/CommandBar'
import Workspace from '@/components/core/Workspace'
import AIAssistant from '@/components/ai/AIAssistant'
import { useAIStore } from '@/lib/store/aiStore'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { useSubscription } from '@/hooks/useSubscription'
import UsageStats from '@/components/subscription/UsageStats'
import UserMenu from '@/components/user/UserMenu'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const { isAssistantActive, toggleAssistant } = useAIStore()
  const { panels, activePanel } = useWorkspaceStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { subscription } = useSubscription()
  
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
            
            {/* Badge piano */}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
              subscription.isPremium 
                ? 'bg-primary/20 text-primary' 
                : 'bg-surface-dark text-white/70'
            }`}>
              {subscription.plan === 'TEAM' 
                ? 'Team' 
                : subscription.plan === 'PREMIUM' 
                  ? 'Premium' 
                  : 'Free'}
            </span>
          </button>
          
          {/* User menu dropdown */}
          {isUserMenuOpen && (
            <UserMenu 
              user={session?.user} 
              subscription={subscription}
              onClose={() => setIsUserMenuOpen(false)}
              onLogout={() => signOut({ callbackUrl: '/' })}
            />
          )}
        </div>
      </header>
      
      {/* Area di lavoro principale */}
      <div className="flex-1 relative flex">
        {/* Area principale */}
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
        
        {/* Barra laterale (opzionale, solo se non è in modalità mobile) */}
        <div className="hidden lg:block w-80 border-l border-white/10 p-4 overflow-y-auto">
          {/* Upgrade banner per utenti free */}
          {subscription.plan === 'FREE' && (
            <div className="glass-panel p-4 rounded-lg mb-4 bg-gradient-to-br from-primary/20 to-secondary/20">
              <h3 className="font-medium mb-2">Passa a Premium</h3>
              <p className="text-sm text-white/70 mb-3">
                Sblocca tutte le funzionalità avanzate e ottieni più spazio di archiviazione.
              </p>
              <Link 
                href="/dashboard/subscription"
                className="px-3 py-1.5 text-sm rounded-md bg-primary hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5"
              >
                <FiCreditCard size={14} />
                <span>Vedi piani</span>
              </Link>
            </div>
          )}
          
          {/* Statistiche utilizzo */}
          <UsageStats />
        </div>
      </div>
      
      {/* Footer con info e status */}
      <footer className="h-8 border-t border-white/10 bg-surface-dark flex items-center justify-between px-4 text-xs text-white/60">
        <div>Jarvis Web OS • v0.1.0</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Tutti i sistemi operativi</span>
          <Link 
            href="/dashboard/subscription" 
            className="ml-2 px-1.5 py-0.5 rounded bg-surface-light hover:bg-surface transition-colors"
          >
            {subscription.isPremium ? 'Premium' : 'Free'}
          </Link>
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