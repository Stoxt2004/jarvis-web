// src/components/core/panels/DashboardPanel.tsx
"use client"

import { motion } from 'framer-motion'
import { Panel } from '@/lib/store/workspaceStore'

interface DashboardPanelProps {
  panel: Panel
}

export default function DashboardPanel({ panel }: DashboardPanelProps) {
  return (
    <div className="h-full p-4 overflow-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Widget di benvenuto */}
        <motion.div 
          className="col-span-2 md:col-span-3 glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-2">Benvenuto in Jarvis Web OS</h2>
          <p className="text-white/70">
            Questo è il tuo dashboard personalizzato. Da qui puoi accedere a tutte le funzionalità del sistema.
          </p>
        </motion.div>
        
        {/* Widget statistiche */}
        <motion.div 
          className="glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium mb-2">Utilizzo CPU</h3>
          <div className="w-full bg-white/10 rounded-full h-2 mb-1">
            <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>45%</span>
            <span>2.4 GHz</span>
          </div>
        </motion.div>
        
        {/* Widget memoria */}
        <motion.div 
          className="glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-sm font-medium mb-2">Memoria</h3>
          <div className="w-full bg-white/10 rounded-full h-2 mb-1">
            <div className="bg-secondary h-2 rounded-full" style={{ width: '68%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>68%</span>
            <span>3.4 GB / 5 GB</span>
          </div>
        </motion.div>
        
        {/* Widget storage */}
        <motion.div 
          className="glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-sm font-medium mb-2">Storage</h3>
          <div className="w-full bg-white/10 rounded-full h-2 mb-1">
            <div className="bg-accent h-2 rounded-full" style={{ width: '32%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>32%</span>
            <span>1.6 GB / 5 GB</span>
          </div>
        </motion.div>
        
        {/* Widget attività recenti */}
        <motion.div 
          className="col-span-2 glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className="text-sm font-medium mb-3">Attività Recenti</h3>
          <div className="space-y-2">
            {[
              { name: 'Documento1.txt', time: '10 minuti fa', type: 'file' },
              { name: 'Progetto Web', time: '1 ora fa', type: 'folder' },
              { name: 'script.js', time: '3 ore fa', type: 'file' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/10">
                <div className="flex items-center">
                  <span className="text-primary mr-2">
                    {item.type === 'file' ? '📄' : '📁'}
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="text-xs text-white/50">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Widget AI Assistant */}
        <motion.div 
          className="glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className="text-sm font-medium mb-2">AI Assistant</h3>
          <p className="text-white/70 text-sm mb-3">
            Chiedi qualsiasi cosa o richiedi assistenza.
          </p>
          <button className="w-full px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded-md text-sm transition-colors">
            Attiva Assistente
          </button>
        </motion.div>
        
        {/* Widget meteo */}
        <motion.div 
          className="col-span-2 md:col-span-3 glass-panel p-4 hover-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Meteo</h3>
              <p className="text-2xl font-semibold mt-1">21°C</p>
              <p className="text-white/70 text-sm">Parzialmente nuvoloso</p>
            </div>
            <div className="text-4xl">⛅</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
