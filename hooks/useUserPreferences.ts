// src/hooks/useUserPreferences.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Tipo per le preferenze utente
export interface UserPreferences {
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

  // Assicura che il tema scuro sia sempre applicato
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return {
    preferences,
    setPreferences: updatePreferences,
    isLoading,
    error,
  }
}
