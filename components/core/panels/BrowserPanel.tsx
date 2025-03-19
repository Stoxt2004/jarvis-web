// src/components/core/panels/BrowserPanel.tsx
"use client"

import { useState, useRef } from 'react'
import { FiRefreshCw, FiArrowLeft, FiArrowRight, FiX, FiPlus } from 'react-icons/fi'
import { Panel, useWorkspaceStore } from '@/lib/store/workspaceStore'

interface BrowserPanelProps {
  panel: Panel
}

export default function BrowserPanel({ panel }: BrowserPanelProps) {
  const { updatePanelContent } = useWorkspaceStore()
  const [url, setUrl] = useState(panel.content?.url || 'https://www.google.com')
  const [isLoading, setIsLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Aggiorna l'URL
  const handleUrlChange = (newUrl: string) => {
    // Assicura che l'URL abbia il protocollo
    let processedUrl = newUrl
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl
    }
    
    setUrl(processedUrl)
    updatePanelContent(panel.id, { ...panel.content, url: processedUrl })
  }
  
  // Gestisce la navigazione
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simula un ritardo di caricamento
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }
  
  // Gestisce il refresh
  const handleRefresh = () => {
    setIsLoading(true)
    
    // Ricarica l'iframe
    if (iframeRef.current) {
      iframeRef.current.src = url
    }
    
    // Simula un ritardo di caricamento
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Barra di navigazione */}
      <div className="px-2 py-2 border-b border-white/10 bg-surface flex items-center space-x-2">
        {/* Pulsanti navigazione */}
        <button className="p-1 rounded hover:bg-white/10 text-white/70">
          <FiArrowLeft size={16} />
        </button>
        <button className="p-1 rounded hover:bg-white/10 text-white/70">
          <FiArrowRight size={16} />
        </button>
        <button 
          className={`p-1 rounded hover:bg-white/10 text-white/70 ${isLoading ? 'animate-spin' : ''}`}
          onClick={handleRefresh}
        >
          <FiRefreshCw size={16} />
        </button>
        
        {/* Barra degli indirizzi */}
        <form className="flex-1" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              className="w-full px-3 py-1 rounded bg-surface-dark text-white/90 outline-none border border-white/10 focus:border-[#0ea5e9]"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => handleUrlChange(url)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlChange(url)}
            />
            {url && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                onClick={() => setUrl('')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </form>
        
        {/* Pulsante nuova scheda */}
        <button className="p-1 rounded hover:bg-white/10 text-white/70">
          <FiPlus size={16} />
        </button>
      </div>
      
      {/* Contenuto del browser */}
      <div className="flex-1 relative">
        {/* Indicatore di caricamento */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-10">
            <div className="w-8 h-8 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Utilizziamo un iframe per simulare il browser */}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          title="Browser"
        />
      </div>
    </div>
  )
}