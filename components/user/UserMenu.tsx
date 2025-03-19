// src/components/user/UserMenu.tsx
"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiUser, FiSettings, FiCreditCard, FiHelpCircle, FiLogOut } from 'react-icons/fi'
import { useEffect, useRef } from 'react'

interface UserMenuProps {
  user: any
  onClose: () => void
  onLogout: () => void
}

export default function UserMenu({ user, onClose, onLogout }: UserMenuProps) {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Chiudi il menu quando si clicca all'esterno
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])
  
  return (
    <motion.div
      ref={menuRef}
      className="absolute top-full right-0 mt-2 w-64 bg-surface-dark border border-white/10 rounded-lg shadow-xl z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Header con info utente */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser size={20} />
            )}
          </div>
          <div>
            <div className="font-medium">{user?.name || 'Utente'}</div>
            <div className="text-xs text-white/60">{user?.email || ''}</div>
          </div>
        </div>
        
        <div className="mt-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-surface text-white/80">
            Piano {user?.plan === 'PREMIUM' ? 'Premium' : user?.plan === 'TEAM' ? 'Team' : 'Free'}
          </span>
        </div>
      </div>
      
      {/* Menu items */}
      <div className="py-1">
        <MenuItem 
          icon={<FiUser size={16} />} 
          label="Il mio profilo"
          onClick={() => {
            onClose()
            router.push('/dashboard/profile')
          }}
        />
        
        <MenuItem 
          icon={<FiSettings size={16} />} 
          label="Impostazioni"
          onClick={() => {
            onClose()
            router.push('/dashboard/settings')
          }}
        />
        
        <MenuItem 
          icon={<FiCreditCard size={16} />} 
          label="Abbonamento"
          onClick={() => {
            onClose()
            router.push('/dashboard/subscription')
          }}
        />
        
        <MenuItem 
          icon={<FiHelpCircle size={16} />} 
          label="Guida"
          onClick={() => {
            onClose()
            router.push('/dashboard/help')
          }}
        />
      </div>
      
      {/* Logout */}
      <div className="py-1 border-t border-white/10">
        <MenuItem 
          icon={<FiLogOut size={16} />} 
          label="Esci"
          onClick={onLogout}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        />
      </div>
    </motion.div>
  )
}

// Componente singola voce di menu
interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  className?: string
}

function MenuItem({ icon, label, onClick, className = '' }: MenuItemProps) {
  return (
    <button
      className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 text-left ${className}`}
      onClick={onClick}
    >
      <span className="text-white/70">{icon}</span>
      <span>{label}</span>
    </button>
  )
}