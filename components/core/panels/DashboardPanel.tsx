// src/components/core/panels/DashboardPanel.tsx
"use client"

import { useEffect, useState } from 'react'
import { FiClock, FiFile, FiCode, FiServer, FiCpu, FiWifi } from 'react-icons/fi'
import { Panel } from '@/lib/store/workspaceStore'

interface DashboardPanelProps {
  panel: Panel
}

export default function DashboardPanel({ panel }: DashboardPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Aggiorna l'ora ogni secondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Formatta l'ora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  
  // Formatta la data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  return (
    <div className="h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Benvenuto nel tuo Web OS
        </h1>
        <p className="text-white/60">
          Questa è la dashboard principale del tuo ambiente di lavoro
        </p>
      </div>
      
      {/* Orologio e data */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-mono mb-2">{formatTime(currentTime)}</div>
            <div className="text-white/70">{formatDate(currentTime)}</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-500 hover:bg-opacity-20 flex items-center justify-center">
            <FiClock size={32} className="text-blue-500" />
          </div>
        </div>
      </div>
      
      {/* Griglia di widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Widget Attività recenti */}
        <div className="glass-panel p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FiFile /> Attività recenti
          </h3>
          <div className="space-y-2">
            {['script.js', 'index.html', 'style.css'].map((file, i) => (
              <div key={i} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer flex items-center justify-between">
                <span>{file}</span>
                <span className="text-xs text-white/50">{i + 1}h fa</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Widget Progetti */}
        <div className="glass-panel p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FiCode /> Progetti
          </h3>
          <div className="space-y-2">
            {['Web OS', 'Landing Page', 'App Mobile'].map((project, i) => (
              <div key={i} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer flex items-center justify-between">
                <span>{project}</span>
                <span className="text-xs text-white/50">{['In corso', 'Completato', 'In pausa'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Widget stato del sistema */}
      <div className="glass-panel p-4 mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <FiServer /> Stato del sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface p-3">
            <div className="flex items-center gap-2 mb-2">
              <FiCpu className="text-blue-500" />
              <span>CPU</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <div className="text-right text-xs text-white/50 mt-1">35%</div>
          </div>
          
          <div className="rounded-lg bg-surface p-3">
            <div className="flex items-center gap-2 mb-2">
              <FiServer className="text-blue-500" />
              <span>Memoria</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="text-right text-xs text-white/50 mt-1">68%</div>
          </div>
          
          <div className="rounded-lg bg-surface p-3">
            <div className="flex items-center gap-2 mb-2">
              <FiWifi className="text-blue-500" />
              <span>Rete</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '92%' }}></div>
            </div>
            <div className="text-right text-xs text-white/50 mt-1">92% (Ottima)</div>
          </div>
        </div>
      </div>
      
      {/* Shortcuts */}
      <div className="glass-panel p-4">
        <h3 className="text-lg font-medium mb-4">Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Editor', icon: <FiCode size={24} /> },
            { name: 'Browser', icon: <FiWifi size={24} /> },
            { name: 'File', icon: <FiFile size={24} /> },
            { name: 'Terminal', icon: <FiServer size={24} /> }
          ].map((item, i) => (
            <div 
              key={i}
              className="aspect-square rounded-lg bg-surface flex flex-col items-center justify-center gap-2 hover:bg-surface-light cursor-pointer transition-colors"
            >
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-20 text-blue-500">
                {item.icon}
              </div>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}