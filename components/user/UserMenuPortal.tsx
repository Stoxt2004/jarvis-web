// src/components/user/UserMenuPortal.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiLogOut, FiSettings, FiCreditCard } from 'react-icons/fi'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface UserMenuPortalProps {
  user: any
}

export default function UserMenuPortal({ user }: UserMenuPortalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  }

  // Crea l'elemento portale al mount
  useEffect(() => {
    const el = document.createElement('div')
    el.style.position = 'fixed'
    el.style.zIndex = '9999'
    el.style.top = '0'
    el.style.left = '0'
    el.style.width = '100%'
    el.style.height = '100%'
    el.style.pointerEvents = 'none' // Importante: permette i click attraverso il portale
    document.body.appendChild(el)
    setPortalElement(el)
    
    return () => {
      document.body.removeChild(el)
    }
  }, [])

  // Posiziona il menu quando si apre
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current && portalElement) {
      const rect = buttonRef.current.getBoundingClientRect()
      menuRef.current.style.position = 'absolute'
      menuRef.current.style.top = `${rect.bottom}px`
      menuRef.current.style.right = `${window.innerWidth - rect.right}px`
      menuRef.current.style.pointerEvents = 'auto' // Abilita i click sul menu
    }
  }, [isOpen, portalElement])

  // Gestisce i click all'esterno
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen && 
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(e.target as Node) && 
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Funzioni per gestire la navigazione
  const handleNavigate = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <FiUser className="text-lg" style={{ color: colors.primary }} />
        </div>
        <span className="text-white/70">{user?.name || 'Utente'}</span>
      </motion.button>
      
      {portalElement && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              className="w-48 rounded-md shadow-lg"
              style={{ 
                background: `rgba(26, 26, 46, 0.95)`,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-1">
                <div 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleNavigate('/dashboard/profile')}
                >
                  <FiUser style={{ color: colors.primary }} />
                  <span>Profilo</span>
                </div>

                <div 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleNavigate('/dashboard/subscription')}
                >
                  <FiCreditCard style={{ color: colors.primary }} />
                  <span>Abbonamento</span>
                </div>
                
                <div 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 cursor-pointer"
                  onClick={() => handleNavigate('/dashboard/settings')}
                >
                  <FiSettings style={{ color: colors.primary }} />
                  <span>Impostazioni</span>
                </div>
                
                <div 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    setIsOpen(false)
                    signOut()
                  }}
                >
                  <FiLogOut style={{ color: colors.primary }} />
                  <span>Disconnetti</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        portalElement
      )}
    </>
  )
}
