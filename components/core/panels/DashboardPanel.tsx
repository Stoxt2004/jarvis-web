// src/components/core/panels/DashboardPanel.tsx
"use client"

import { useState, useEffect, JSX } from 'react'
import { motion } from 'framer-motion'
import { Panel, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { useSubscription } from '@/hooks/useSubscription'
import { getPlanLimits } from '@/lib/stripe/config'
import { useSession } from 'next-auth/react'
import { useAIStore } from '@/lib/store/aiStore'
import { FiCpu, FiHardDrive, FiUsers, FiActivity, FiPlusCircle, FiCode, FiFolder, FiTerminal, FiGlobe, FiFileText, FiAlertTriangle, FiCalendar } from 'react-icons/fi'
import { useAILimits } from '@/components/premium/UsageLimitsNotifier'
import UsageStats from '@/components/dashboard/UsageStats'
import { toast } from 'sonner'

interface DashboardPanelProps {
  panel: Panel
}

export default function DashboardPanel({ panel }: DashboardPanelProps) {
  const { data: session } = useSession()
  const { subscription } = useSubscription()
  const planLimits = getPlanLimits(subscription.plan)
  const { toggleAssistant } = useAIStore()
  const { panels, addPanel } = useWorkspaceStore()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Utilizziamo useAILimits per ottenere i dati aggiornati sulle richieste AI
  const { aiUsageStats, isAILimitExceeded } = useAILimits()

  // Funzione per verificare se l'utente può aprire un nuovo pannello
  const canOpenNewPanel = () => {
    // Gli utenti Premium e Team possono aprire pannelli illimitati
    if (subscription.plan !== 'FREE') return true;
    
    // Gli utenti Free sono limitati a 3 pannelli (esclusa la dashboard)
    const nonDashboardPanels = panels.filter(p => p.type !== 'dashboard').length;
    return nonDashboardPanels < 3;
  }

  // Funzione per ottenere i file recenti
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch('/api/files/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentActivity(data.slice(0, 5)) // Prendi solo i primi 5 elementi
        }
      } catch (error) {
        console.error('Errore nel recupero delle attività recenti:', error)
        // Dati di esempio in caso di errore
        setRecentActivity([
          { id: '1', name: 'Documento1.txt', updatedAt: new Date(Date.now() - 10 * 60000).toISOString(), type: 'txt' },
          { id: '2', name: 'Progetto Web', updatedAt: new Date(Date.now() - 60 * 60000).toISOString(), type: 'folder' },
          { id: '3', name: 'script.js', updatedAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(), type: 'js' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  // Formatta il tempo relativo (es. "10 minuti fa")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60)
      return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`
    } else {
      const days = Math.floor(diffMins / (24 * 60))
      return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`
    }
  }

  // Ottiene l'icona in base al tipo di file
  const getFileIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      folder: <FiFolder className="text-amber-400" />,
      js: <FiCode className="text-yellow-400" />,
      jsx: <FiCode className="text-blue-400" />,
      ts: <FiCode className="text-blue-500" />,
      tsx: <FiCode className="text-blue-500" />,
      html: <FiCode className="text-orange-500" />,
      css: <FiCode className="text-blue-400" />,
      json: <FiCode className="text-green-400" />,
      txt: <FiFileText className="text-white/70" />,
      md: <FiFileText className="text-white/70" />
    }
    
    return iconMap[type] || <FiFileText className="text-white/70" />
  }

  // Funzione per aprire l'assistente AI
  const handleOpenAssistant = () => {
    // Se l'utente ha raggiunto il limite, mostriamo un avviso
    if (isAILimitExceeded) {
      toast.error(
        <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-400" />
          <strong>AI Limit Reached</strong>
        </div>
        <p className="text-sm mt-1">
          You have used all your {aiUsageStats.limit} daily AI requests.
        </p>
      </div>
      );
      return;
    }
    
    toggleAssistant(true)
  }

  // Apre un'applicazione nel workspace con verifica del limite
  const handleOpenApp = (appType: 'browser' | 'editor' | 'fileManager' | 'terminal' | 'notes') => {
    // Verifica il limite di pannelli per utenti Free
    if (!canOpenNewPanel()) {
      toast.error(
        <div className="flex flex-col">
  <div className="flex items-center gap-2">
    <FiAlertTriangle className="text-amber-400" />
    <strong>Panel limit reached</strong>
  </div>
  <p className="text-sm mt-1">
    Free plan limited to 3 panels. Upgrade to Premium for unlimited panels.
  </p>
</div>
      );
      return;
    }
    
    // Configurazioni predefinite per diverse app
    const appConfigs = {
      browser: {
        title: 'Browser Web',
        position: { x: 100, y: 100 },
        size: { width: 900, height: 600 },
        content: { url: 'https://www.google.com' }
      },
      editor: {
        title: 'Editor di Codice',
        position: { x: 150, y: 150 },
        size: { width: 800, height: 500 },
        content: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' }
      },
      fileManager: {
        title: 'File Manager',
        position: { x: 200, y: 100 },
        size: { width: 700, height: 500 },
        content: {}
      },
      terminal: {
        title: 'Terminale',
        position: { x: 200, y: 200 },
        size: { width: 600, height: 400 },
        content: {}
      },
      notes: {
        title: 'Note',
        position: { x: 250, y: 250 },
        size: { width: 500, height: 400 },
        content: { text: '' }
      }
    }
    
    // Aggiungi il pannello
    const config = appConfigs[appType]
    addPanel({
      type: appType,
      title: config.title,
      position: config.position,
      size: config.size,
      content: config.content
    })
  }

  // Apre un file recente con verifica del limite
  const handleOpenRecentFile = (file: any) => {
    // Verifica il limite di pannelli per utenti Free
    if (!canOpenNewPanel()) {
      toast.error(
        <div className="flex flex-col">
  <div className="flex items-center gap-2">
    <FiAlertTriangle className="text-amber-400" />
    <strong>Panel limit reached</strong>
  </div>
  <p className="text-sm mt-1">
    Free plan limited to 3 panels. Upgrade to Premium for unlimited panels.
  </p>
</div>
      );
      return;
    }
    
    if (file.type === 'folder') {
      // Apri File Manager con la cartella selezionata
      addPanel({
        type: 'fileManager',
        title: `File Manager - ${file.name}`,
        position: { x: 200, y: 100 },
        size: { width: 700, height: 500 },
        content: { currentFolder: file.id }
      })
    } else {
      // Determina il linguaggio in base all'estensione del file
      const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        txt: 'plaintext'
      }
      
      // Apri l'editor con il file selezionato
      addPanel({
        type: 'editor',
        title: `Editor - ${file.name}`,
        position: { x: 150, y: 150 },
        size: { width: 800, height: 500 },
        content: {
          fileId: file.id,
          fileName: file.name,
          language: languageMap[file.type] || 'plaintext'
        }
      })
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-6">
        {/* Intestazione Dashboard */}
        <motion.div 
          className="glass-panel p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Welcome, {session?.user?.name || 'Utente'}</h2>
              <p className="text-white/70">
                Plan: <span className="text-primary font-medium">{subscription.plan}</span> • Workspace active
                {subscription.plan === 'FREE' && (
                  <span className="text-amber-400 ml-2">
                    ({panels.filter(p => p.type !== 'dashboard').length}/3 panels)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 ${isAILimitExceeded ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} rounded-md flex items-center gap-2 text-sm`}
                onClick={handleOpenAssistant}
                disabled={isAILimitExceeded}
              >
                <FiCpu />
                <span>AI Assistant</span>
              </button>
              
              <button 
                className={`px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md flex items-center gap-2 text-sm ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleOpenApp('fileManager')}
                disabled={!canOpenNewPanel()}
              >
                <FiPlusCircle />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Statistiche di utilizzo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel rounded-lg overflow-hidden"
        >
          <UsageStats />
        </motion.div>
        
        {/* Accessi rapidi */}
        <motion.div 
          className="glass-panel p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-lg font-medium mb-4">Panels</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            
            
            <button 
              className={`p-4 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleOpenApp('editor')}
              disabled={!canOpenNewPanel()}
            >
              <FiCode className="text-2xl text-green-400" />
              <span className="text-sm">Editor</span>
            </button>
            
            <button 
              className={`p-4 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleOpenApp('fileManager')}
              disabled={!canOpenNewPanel()}
            >
              <FiFolder className="text-2xl text-amber-400" />
              <span className="text-sm">File</span>
            </button>
            
            <button 
              className={`p-4 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleOpenApp('terminal')}
              disabled={!canOpenNewPanel()}
            >
              <FiTerminal className="text-2xl text-purple-400" />
              <span className="text-sm">Terminal</span>
            </button>
            
            <button 
              className={`p-4 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleOpenApp('notes')}
              disabled={!canOpenNewPanel()}
            >
              <FiFileText className="text-2xl text-yellow-400" />
              <span className="text-sm">Notes</span>
            </button>
            <button 
              className={`p-4 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${!canOpenNewPanel() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleOpenApp('notes')}
              disabled={!canOpenNewPanel()}
            >
              <FiCalendar className="text-2xl text-red-400" />
              <span className="text-sm">Calendar</span>
            </button>
          </div>
          
          {/* Avviso per utenti Free che hanno raggiunto il limite */}
          {subscription.plan === 'FREE' && !canOpenNewPanel() && (
            <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                <p className="font-medium">Panel limit reached</p>
<p className="text-white/70">
  The Free plan is limited to 3 active panels. Close an existing panel or 
  <a href="/dashboard/subscription" className="text-primary ml-1 hover:underline">upgrade to Premium</a> for unlimited panels.
</p>

                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Widget attività recenti */}
        <motion.div 
          className="glass-panel p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10"></div>
                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                  </div>
                  <div className="h-4 w-20 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-1">
              {recentActivity.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between py-3 px-2 border-b border-white/10 hover:bg-white/5 rounded-md transition-colors ${!canOpenNewPanel() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  onClick={() => handleOpenRecentFile(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      {getFileIcon(item.type)}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs text-white/50">{formatRelativeTime(item.updatedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-white/50">
              Nessuna attività recente trovata
            </div>
          )}
        </motion.div>
        
        
      </div>
    </div>
  )
}