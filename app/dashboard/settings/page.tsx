// src/app/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiArrowLeft, FiSave, FiGlobe, FiClock, FiVolume2 } from 'react-icons/fi'
import { toast } from 'sonner'
import Link from 'next/link'

// Tipo per le preferenze utente
interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    browser: boolean
    sound: boolean
  }
  aiAssistant: {
    voiceEnabled: boolean
    voiceActivation: boolean
    personality: 'professional' | 'friendly' | 'concise'
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'it',
    timezone: 'Europe/Rome',
    notifications: {
      email: true,
      browser: true,
      sound: true,
    },
    aiAssistant: {
      voiceEnabled: true,
      voiceActivation: true,
      personality: 'friendly',
    },
  })

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

  // Carica le preferenze dell'utente dal backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const data = await response.json()
            setPreferences(data.preferences || preferences)
          }
        } catch (error) {
          console.error('Errore nel caricamento delle preferenze:', error)
        }
      }
    }
    
    loadPreferences()
  }, [session])

  // Gestisce il salvataggio delle preferenze
  const handleSavePreferences = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })
      
      if (!response.ok) {
        throw new Error('Errore durante il salvataggio delle preferenze')
      }
      
      toast.success('Impostazioni salvate con successo')
    } catch (error) {
      console.error(error)
      toast.error('Si è verificato un errore durante il salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background, color: colors.text }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Intestazione */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
            </Link>
            <h1 className="text-2xl font-bold">Impostazioni</h1>
          </div>
          
          <button
            onClick={handleSavePreferences}
            disabled={isLoading}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: colors.accent }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            <span>Salva impostazioni</span>
          </button>
        </div>
        
        {/* Contenuto principale */}
        <div className="space-y-8">
          {/* Sezione Interfaccia */}
          <div className="rounded-xl p-6" style={{ background: colors.surface }}>
            <h2 className="text-xl font-semibold mb-4">Interfaccia</h2>
            
            {/* Lingua */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FiGlobe className="mr-2" />
                Lingua
              </label>
              <select 
                className="w-full p-2 rounded-md"
                value={preferences.language}
                onChange={(e) => 
                  setPreferences({ ...preferences, language: e.target.value })}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: colors.text
                }}
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            
            {/* Fuso orario */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FiClock className="mr-2" />
                Fuso orario
              </label>
              <select 
                className="w-full p-2 rounded-md"
                value={preferences.timezone}
                onChange={(e) => 
                  setPreferences({ ...preferences, timezone: e.target.value })}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: colors.text
                }}
              >
                <option value="Europe/Rome">Europe/Rome (UTC+1/+2)</option>
                <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>
          </div>
          
          {/* Sezione Notifiche */}
          <div className="rounded-xl p-6" style={{ background: colors.surface }}>
            <h2 className="text-xl font-semibold mb-4">Notifiche</h2>
            
            <div className="space-y-4">
              <ToggleOption 
                label="Notifiche email"
                description="Ricevi aggiornamenti importanti via email"
                checked={preferences.notifications.email}
                onChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, email: checked }
                  })}
                colors={colors}
              />
              
              <ToggleOption 
                label="Notifiche browser"
                description="Ricevi notifiche nel browser"
                checked={preferences.notifications.browser}
                onChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, browser: checked }
                  })}
                colors={colors}
              />
              
              <ToggleOption 
                label="Suoni di notifica"
                description="Riproduci suoni per le notifiche"
                checked={preferences.notifications.sound}
                onChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, sound: checked }
                  })}
                colors={colors}
              />
            </div>
          </div>
          
          {/* Sezione Assistente AI */}
          <div className="rounded-xl p-6" style={{ background: colors.surface }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiVolume2 className="mr-2" />
              Assistente AI
            </h2>
            
            <div className="space-y-4 mb-6">
              <ToggleOption 
                label="Assistente vocale"
                description="Abilita l'interazione vocale con l'assistente AI"
                checked={preferences.aiAssistant.voiceEnabled}
                onChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    aiAssistant: { ...preferences.aiAssistant, voiceEnabled: checked }
                  })}
                colors={colors}
              />
              
              <ToggleOption 
                label="Attivazione vocale"
                description="Attiva l'assistente con un comando vocale"
                checked={preferences.aiAssistant.voiceActivation}
                onChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    aiAssistant: { ...preferences.aiAssistant, voiceActivation: checked }
                  })}
                colors={colors}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Personalità dell'assistente</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PersonalityOption 
                  label="Professionale"
                  description="Risposte formali e precise"
                  selected={preferences.aiAssistant.personality === 'professional'}
                  onClick={() => 
                    setPreferences({
                      ...preferences,
                      aiAssistant: { ...preferences.aiAssistant, personality: 'professional' }
                    })}
                  colors={colors}
                />
                
                <PersonalityOption 
                  label="Amichevole"
                  description="Tono conversazionale e cordiale"
                  selected={preferences.aiAssistant.personality === 'friendly'}
                  onClick={() => 
                    setPreferences({
                      ...preferences,
                      aiAssistant: { ...preferences.aiAssistant, personality: 'friendly' }
                    })}
                  colors={colors}
                />
                
                <PersonalityOption 
                  label="Conciso"
                  description="Risposte brevi ed essenziali"
                  selected={preferences.aiAssistant.personality === 'concise'}
                  onClick={() => 
                    setPreferences({
                      ...preferences,
                      aiAssistant: { ...preferences.aiAssistant, personality: 'concise' }
                    })}
                  colors={colors}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente per opzione toggle
interface ToggleOptionProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  colors: any
}

function ToggleOption({ label, description, checked, onChange, colors }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm" style={{ color: colors.textMuted }}>{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
          style={{ 
            backgroundColor: checked ? colors.accent : 'rgba(255, 255, 255, 0.2)'
          }}
        ></div>
      </label>
    </div>
  )
}

// Componente per opzione personalità
interface PersonalityOptionProps {
  label: string
  description: string
  selected: boolean
  onClick: () => void
  colors: any
}

function PersonalityOption({ label, description, selected, onClick, colors }: PersonalityOptionProps) {
  return (
    <div 
      className="p-3 rounded-lg cursor-pointer transition-all"
      style={{ 
        backgroundColor: selected ? colors.primary : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${selected ? colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
      }}
      onClick={onClick}
    >
      <h3 className="font-medium">{label}</h3>
      <p className="text-sm" style={{ color: colors.textMuted }}>{description}</p>
    </div>
  )
}
