// src/app/dashboard/profile/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiUser, FiMail, FiEdit2, FiSave, FiCamera, FiArrowLeft } from 'react-icons/fi'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, update: updateSession, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    image: '',
  })
  
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
      
      toast.success('Profilo aggiornato con successo')
      setIsEditing(false)
    } catch (error) {
      toast.error('Si è verificato un errore durante l\'aggiornamento del profilo')
      console.error(error)
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
        <div className="mb-6 flex items-center">
          <Link
            href="/dashboard"
            className="mr-4 p-2 rounded-full hover:bg-white/10"
          >
            <FiArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Il mio profilo</h1>
        </div>
        
        <div className="glass-panel p-6 rounded-lg">
          {/* Avatar e cover photo */}
          <div className="relative mb-12">
            {/* Cover photo */}
            <div className="h-32 rounded-t-lg bg-gradient-to-r from-primary/30 to-secondary/30 absolute top-0 left-0 right-0 -m-6"></div>
            
            {/* Avatar */}
            <div className="absolute left-6 top-12 w-24 h-24 rounded-full bg-surface-dark border-4 border-surface-dark overflow-hidden">
              {profileData.image ? (
                <img 
                  src={profileData.image} 
                  alt={profileData.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                  <FiUser size={32} />
                </div>
              )}
              
              <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <FiCamera size={20} />
              </button>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Nome
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    className={`w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary border border-white/10 ${
                      !isEditing ? 'opacity-70' : ''
                    }`}
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    className="w-full bg-surface-dark rounded-md py-2 pl-10 pr-4 outline-none border border-white/10 opacity-70"
                    value={profileData.email}
                    disabled={true}
                  />
                </div>
                <p className="mt-1 text-xs text-white/50">L'email non può essere modificata.</p>
              </div>
              
              <div className="pt-4 flex items-center justify-end space-x-4">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setIsEditing(false)
                        // Ripristina i dati originali
                        if (session?.user) {
                          setProfileData({
                            name: session.user.name || '',
                            email: session.user.email || '',
                            image: session.user.image || '',
                          })
                        }
                      }}
                      disabled={isLoading}
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiSave size={16} />
                      )}
                      Salva modifiche
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit2 size={16} />
                    Modifica profilo
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {/* Account Info */}
        <div className="mt-6 glass-panel p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Informazioni account</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/70">Piano</span>
              <span className="font-medium">
                {session?.user?.plan === 'PREMIUM' ? 'Premium' : session?.user?.plan === 'TEAM' ? 'Team' : 'Free'}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/70">Ruolo</span>
              <span className="font-medium">
                {session?.user?.role === 'ADMIN' ? 'Amministratore' : 'Utente'}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/70">Iscritto il</span>
              <span className="font-medium">
                {/* Data iscrizione formattata */}
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <Link 
              href="/dashboard/subscription" 
              className="text-primary hover:underline text-sm"
            >
              Gestisci il tuo abbonamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}