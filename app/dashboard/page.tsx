// src/app/dashboard/page.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { FiUser, FiLogOut, FiSettings, FiCreditCard, FiCommand, FiZap, FiCpu } from 'react-icons/fi'
import CommandBar from '@/components/core/CommandBar'
import Workspace from '@/components/core/Workspace'
import AIAssistant from '@/components/ai/AIAssistant'
import { useAIStore } from '@/lib/store/aiStore'
import { useWorkspaceStore } from '@/lib/store/workspaceStore'
import { useSubscription } from '@/hooks/useSubscription'
import PremiumDashboard from '@/components/premium/PremiumDashboard'
import UsageLimitsNotifier from '@/components/premium/UsageLimitsNotifier'
import Link from 'next/link'
import router from 'next/router'
import UserMenuPortal from '@/components/user/UserMenuPortal'
import UsageStats from '@/components/dashboard/UsageStats';
import PremiumBanner from '@/components/premium/PremiumBanner'
export default function Dashboard() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const { isAssistantActive, toggleAssistant } = useAIStore()
  const { panels, activePanel } = useWorkspaceStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { subscription } = useSubscription()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Colori moderni 2025 (stessi di HomeClient)
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

  // Gestisci la posizione del mouse per l'effetto luce
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Simulazione di caricamento iniziale
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  if (status === 'loading' || isLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)` }}
      >
        {/* Pattern di sfondo con animazione */}
        <motion.div 
          className="absolute inset-0 bg-grid-pattern opacity-5 z-0"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary}22 1px, transparent 1px)`,
            backgroundSize: '30px 30px' 
          }}
          animate={{ 
            backgroundPosition: ['0px 0px', '30px 30px'],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Logo animato */}
        <motion.div 
          className="font-mono text-3xl font-semibold tracking-wide mb-8"
          style={{ color: colors.primary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          JARVIS WEB OS
        </motion.div>
        
        {/* Animazione di caricamento */}
        <motion.div
          className="relative w-24 h-24 mb-8"
        >
          <motion.div 
            className="absolute inset-0 rounded-full"
            style={{ 
              border: `3px solid ${colors.primary}20`,
              borderTop: `3px solid ${colors.primary}`
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full"
            style={{ 
              border: `3px solid ${colors.secondary}20`,
              borderBottom: `3px solid ${colors.secondary}`
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-4 rounded-full"
            style={{ 
              border: `3px solid ${colors.accent}20`,
              borderLeft: `3px solid ${colors.accent}`
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiCpu className="text-2xl" style={{ color: colors.primary }} />
          </motion.div>
        </motion.div>
        
        <motion.p 
          className="text-xl"
          style={{ color: colors.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Inizializzazione sistemi...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      {/* Effetto di luce che segue il mouse */}
      <motion.div 
        className="fixed w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          left: mousePosition.x - 250,
          top: mousePosition.y - 250
        }}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.1, 0.05]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />
      
      {/* Header */}
      <motion.header 
        className="border-b border-white/10 p-3 flex items-center justify-between"
        style={{ background: `rgba(15, 15, 26, 0.8)`, backdropFilter: 'blur(10px)' }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="font-mono text-xl font-semibold tracking-wide"
            style={{ color: colors.primary }}
          >
            JARVIS
          </motion.div>
        </motion.div>
        
        <div className="flex items-center gap-3">
  {/* Pulsante AI Assistant */}
  <motion.button
    className={`p-2 rounded-md transition-all ${isAssistantActive ? 'bg-primary/20' : 'bg-white/5 hover:bg-white/10'}`}
    onClick={() => toggleAssistant(!isAssistantActive)}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    style={{ 
      backgroundColor: isAssistantActive ? `${colors.primary}20` : 'rgba(255, 255, 255, 0.05)'
    }}
  >
    <FiZap 
      className={`text-lg`}
      style={{ color: isAssistantActive ? colors.primary : 'rgba(255, 255, 255, 0.7)' }} 
    />
  </motion.button>
  
  {/* Pulsante Command Bar */}
  <motion.button
    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-all"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <FiCommand className="text-lg text-white/70" />
  </motion.button>
  
  {/* Nuovo menu utente con portale */}
  <UserMenuPortal user={session?.user} />
</div>
      </motion.header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
  {/* Workspace */}
  <motion.div 
  className="flex-1 relative"
  style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
  {subscription?.status !== 'ACTIVE' && <PremiumBanner />}
  
  <motion.div 
    className="p-4 flex-1 relative"
    style={{ overflow: 'auto' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.6 }}
  >
    <Workspace />
    
    <div className="absolute top-4 right-4 w-64 glass-panel rounded-lg shadow-lg">
      <UsageStats />
    </div>
  </motion.div>
</motion.div>
  
  {/* AI Assistant */}
  <AnimatePresence>
  {isAssistantActive && (
    <motion.div 
      className="w-80 border-l border-white/10 flex flex-col overflow-hidden"
      style={{ 
        background: `rgba(15, 15, 26, 0.5)`,
        backdropFilter: 'blur(10px)',
        height: 'calc(100vh - 64px)', // mantenuta per compatibilità
      }}
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AIAssistant />
    </motion.div>
  )}
</AnimatePresence>
</div>
      
      {/* Command Bar (invisibile fino all'attivazione) */}
      <CommandBar />
      <UsageLimitsNotifier/>
    </div>
  )
}
