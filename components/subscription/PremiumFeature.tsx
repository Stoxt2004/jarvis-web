// src/components/subscription/PremiumFeature.tsx
"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FiLock, FiUnlock, FiCreditCard } from 'react-icons/fi'
import { useSubscription } from '@/hooks/useSubscription'

interface PremiumFeatureProps {
  children: ReactNode
  feature: string
  fallback?: ReactNode
  showMessage?: boolean
  messagePosition?: 'top' | 'bottom' | 'overlay'
}

export default function PremiumFeature({ 
  children, 
  feature, 
  fallback, 
  showMessage = true, 
  messagePosition = 'overlay' 
}: PremiumFeatureProps) {
  const router = useRouter()
  const { subscription, hasAccess } = useSubscription()
  
  const isFeatureAvailable = hasAccess(feature)
  
  // Se la feature è disponibile, mostra semplicemente il contenuto
  if (isFeatureAvailable) {
    return <>{children}</>
  }
  
  // Se c'è un fallback e non vogliamo mostrare il messaggio, mostra il fallback
  if (fallback && !showMessage) {
    return <>{fallback}</>
  }
  
  // Altrimenti mostra un messaggio che indica che la feature è premium
  
  // Contenuto del messaggio
  const messageContent = (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-3">
        <FiLock size={20} />
      </div>
      <h3 className="text-lg font-medium mb-2">Funzionalità Premium</h3>
      <p className="text-white/70 mb-4">
        Questa funzionalità è disponibile solo per gli utenti con abbonamento Premium o Team.
      </p>
      <button
        className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto"
        onClick={() => router.push('/dashboard/subscription')}
      >
        <FiCreditCard size={16} />
        <span>Passa a Premium</span>
      </button>
    </div>
  )
  
  // Se vogliamo una sovrapposizione
  if (messagePosition === 'overlay') {
    return (
      <div className="relative group">
        <div className="opacity-30 pointer-events-none">
          {fallback || children}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm flex items-center justify-center p-6 z-10"
        >
          {messageContent}
        </motion.div>
      </div>
    )
  }
  
  // Se vogliamo il messaggio sopra il contenuto
  if (messagePosition === 'top') {
    return (
      <div className="space-y-4">
        <div className="glass-panel p-6 rounded-lg">
          {messageContent}
        </div>
        
        <div className="opacity-30 pointer-events-none">
          {fallback || children}
        </div>
      </div>
    )
  }
  
  // Se vogliamo il messaggio sotto il contenuto
  return (
    <div className="space-y-4">
      <div className="opacity-30 pointer-events-none">
        {fallback || children}
      </div>
      
      <div className="glass-panel p-6 rounded-lg">
        {messageContent}
      </div>
    </div>
  )
}