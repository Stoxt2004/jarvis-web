// src/hooks/useUserPreferences.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Tipo per le preferenze utente
export interface UserPreferences {
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

// Preferenze predefinite
const defaultPreferences: UserPreferences = {
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
}

export function useUserPreferences() {
  const { data: session, status } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica le preferenze dal server
  useEffect(() => {
    const fetchPreferences = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        setIsLoading(true)
        setError(null)
        
        try {
          const response = await fetch('/api/user/preferences')
          
          if (!response.ok) {
            throw new Error('Errore nel caricamento delle preferenze')
          }
          
          const data = await response.json()
          setPreferences(data.preferences)
        } catch (err) {
          console.error('Errore nel caricamento delle preferenze:', err)
          setError('Impossibile caricare le preferenze utente')
        } finally {
          setIsLoading(false)
        }
      } else if (status === 'unauthenticated') {
        // Se l'utente non è autenticato, usa le preferenze predefinite
        setPreferences(defaultPreferences)
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [session, status])

  // Funzione per aggiornare le preferenze
  const updatePreferences = async (newPreferences: UserPreferences) => {
    if (status === 'authenticated' && session?.user?.id) {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: newPreferences }),
        })
        
        if (!response.ok) {
          throw new Error('Errore nell\'aggiornamento delle preferenze')
        }
        
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      } catch (err) {
        console.error('Errore nell\'aggiornamento delle preferenze:', err)
        setError('Impossibile aggiornare le preferenze utente')
        return false
      } finally {
        setIsLoading(false)
      }
    }
    
    // Se l'utente non è autenticato, aggiorna solo lo stato locale
    setPreferences(newPreferences)
    return true
  }

  // Applica le preferenze del tema
  useEffect(() => {
    if (!isLoading) {
      // Applica il tema
      const applyTheme = () => {
        const theme = preferences.theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : preferences.theme
        
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.classList.add(theme)
      }
      
      applyTheme()
      
      // Ascolta i cambiamenti di tema di sistema
      if (preferences.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => applyTheme()
        
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [preferences.theme, isLoading])

  return {
    preferences,
    setPreferences: updatePreferences,
    isLoading,
    error,
  }
}