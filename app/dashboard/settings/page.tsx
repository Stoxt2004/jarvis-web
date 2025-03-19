// src/app/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiArrowLeft, FiSave, FiMonitor, FiMoon, FiSun, FiGlobe, FiClock, FiVolume2 } from 'react-icons/fi'
import { toast } from 'sonner'
import Link from 'next/link'

// Tipo per le preferenze utente
interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
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
    theme: 'dark',
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
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-full w-full p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Intestazione */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="mr-4 p-2 rounded-full hover:bg-white/10"
            >
              <FiArrowLeft />
            </Link>
            <h1 className="text-2xl font-bold">Impostazioni</h1>
          </div>
          
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiSave size={16} />
            )}
            Salva impostazioni
          </button>
        </div>
        
        {/* Sezione Interfaccia */}
        <div className="glass-panel p-6 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-4">Interfaccia</h2>
          
          <div className="space-y-6">
            {/* Tema */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tema
              </label>
              <div className="grid grid-cols-3 gap-3">
                <ThemeOption
                  icon={<FiSun />}
                  label="Chiaro"
                  selected={preferences.theme === 'light'}
                  onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                />
                <ThemeOption
                  icon={<FiMoon />}
                  label="Scuro"
                  selected={preferences.theme === 'dark'}
                  onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                />
                <ThemeOption
                  icon={<FiMonitor />}
                  label="Sistema"
                  selected={preferences.theme === 'system'}
                  onClick={() => setPreferences({ ...preferences, theme: 'system' })}
                />
              </div>
            </div>
            
            {/* Lingua */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Lingua
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <FiGlobe />
                </span>
                <select
                  className="w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
            
            {/* Fuso orario */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Fuso orario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                  <FiClock />
                </span>
                <select
                  className="w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary border border-white/10"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                >
                  <option value="Europe/Rome">Europe/Rome (UTC+1/+2)</option>
                  <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                  <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sezione Notifiche */}
        <div className="glass-panel p-6 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-4">Notifiche</h2>
          
          <div className="space-y-4">
            <ToggleOption
              label="Notifiche email"
              description="Ricevi aggiornamenti importanti via email"
              checked={preferences.notifications.email}
              onChange={(checked) => setPreferences({
                ...preferences,
                notifications: { ...preferences.notifications, email: checked }
              })}
            />
            
            <ToggleOption
              label="Notifiche browser"
              description="Mostra notifiche nel browser"
              checked={preferences.notifications.browser}
              onChange={(checked) => setPreferences({
                ...preferences,
                notifications: { ...preferences.notifications, browser: checked }
              })}
            />
            
            <ToggleOption
              label="Suoni di notifica"
              description="Riproduci suoni per le notifiche"
              checked={preferences.notifications.sound}
              onChange={(checked) => setPreferences({
                ...preferences,
                notifications: { ...preferences.notifications, sound: checked }
              })}
            />
          </div>
        </div>
        
        {/* Sezione Assistente AI */}
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Assistente AI</h2>
          
          <div className="space-y-4">
            <ToggleOption
              label="Comandi vocali"
              description="Abilitare l'input vocale per l'assistente"
              checked={preferences.aiAssistant.voiceEnabled}
              onChange={(checked) => setPreferences({
                ...preferences,
                aiAssistant: { ...preferences.aiAssistant, voiceEnabled: checked }
              })}
            />
            
            <ToggleOption
              label="Attivazione vocale"
              description="Attiva l'assistente con comando vocale 'Hey Jarvis'"
              checked={preferences.aiAssistant.voiceActivation}
              onChange={(checked) => setPreferences({
                ...preferences,
                aiAssistant: { ...preferences.aiAssistant, voiceActivation: checked }
              })}
            />
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Personalità dell'assistente
              </label>
              <div className="grid grid-cols-3 gap-3">
                <PersonalityOption
                  label="Professionale"
                  description="Risposte formali e dirette"
                  selected={preferences.aiAssistant.personality === 'professional'}
                  onClick={() => setPreferences({
                    ...preferences,
                    aiAssistant: { ...preferences.aiAssistant, personality: 'professional' }
                  })}
                />
                <PersonalityOption
                  label="Amichevole"
                  description="Tono conversazionale e cordiale"
                  selected={preferences.aiAssistant.personality === 'friendly'}
                  onClick={() => setPreferences({
                    ...preferences,
                    aiAssistant: { ...preferences.aiAssistant, personality: 'friendly' }
                  })}
                />
                <PersonalityOption
                  label="Conciso"
                  description="Risposte brevi ed essenziali"
                  selected={preferences.aiAssistant.personality === 'concise'}
                  onClick={() => setPreferences({
                    ...preferences,
                    aiAssistant: { ...preferences.aiAssistant, personality: 'concise' }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente per opzione tema
interface ThemeOptionProps {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}

function ThemeOption({ icon, label, selected, onClick }: ThemeOptionProps) {
  return (
    <button
      className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors ${
        selected
          ? 'bg-primary/20 border-primary'
          : 'border-white/10 hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className={`text-2xl ${selected ? 'text-primary' : 'text-white/70'}`}>
        {icon}
      </div>
      <span className={`text-sm ${selected ? 'text-primary' : 'text-white/70'}`}>
        {label}
      </span>
    </button>
  )
}

// Componente per opzione toggle
interface ToggleOptionProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-surface-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
}

function PersonalityOption({ label, description, selected, onClick }: PersonalityOptionProps) {
  return (
    <button
      className={`p-3 rounded-lg border text-left transition-colors ${
        selected
          ? 'bg-primary/20 border-primary'
          : 'border-white/10 hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <h3 className={`font-medium ${selected ? 'text-primary' : ''}`}>{label}</h3>
      <p className="text-xs text-white/60 mt-1">{description}</p>
    </button>
  )
}