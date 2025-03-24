// src/app/dashboard/profile/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiUser, FiMail, FiEdit2, FiSave, FiCamera, FiArrowLeft } from 'react-icons/fi'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

export default function ProfilePage() {
  const { data: session, update: updateSession, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    image: '',
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

  // Sincronizza i dati del profilo con la sessione
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
      })
    }
  }, [session])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Chiama l'API per aggiornare il profilo
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento del profilo')
      }
      
      // Aggiorna la sessione con i nuovi dati
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: profileData.name,
        },
      })
      
      toast.success('Profile successfully updated')
      setIsEditing(false)
    } catch (error) {
      toast.error('An error occurred while updating the profile')
      console.error(error)
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
        {/* Header con navigazione */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
            </Link>
            <h1 className="text-2xl font-bold">Your profile</h1>
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: colors.primary }}
              >
                <FiEdit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: colors.accent }}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                <span>Salva</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Profilo header con gradiente */}
        <div className="rounded-xl p-6 mb-8 shadow-lg" 
          style={{ 
            background: `linear-gradient(to right, ${colors.navy}, ${colors.primary})` 
          }}>
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/20 relative">
                {profileData.image ? (
                  <Image 
                    src={profileData.image} 
                    alt={profileData.name || 'Profilo utente'} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiUser className="w-16 h-16 md:w-20 md:h-20 text-white/70" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
                  <FiCamera className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold">
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="bg-white/10 text-white border-0 rounded px-2 py-1 w-full md:w-auto"
                    placeholder="Il tuo nome"
                  />
                ) : (
                  profileData.name || 'Utente'
                )}
              </h2>
              
              <div className="flex items-center justify-center md:justify-start mt-2 space-x-1" style={{ color: colors.textMuted }}>
                <FiMail className="w-4 h-4" />
                <span>{profileData.email}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenuto principale */}
        <div className="rounded-xl p-6" style={{ background: colors.surface }}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textMuted }}>Full name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                />
              ) : (
                <div className="p-2 rounded-md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  {profileData.name}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textMuted }}>Email</label>
              <div className="p-2 rounded-md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                {profileData.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
