// src/components/subscription/UsageStats.tsx
"use client"

import { useState, useEffect } from 'react'
import { FiHardDrive, FiCpu, FiUsers } from 'react-icons/fi'
import { useSubscription } from '@/hooks/useSubscription'
import { getPlanLimits } from '@/lib/stripe/config'

interface UsageData {
  storage: {
    used: number; // in GB
    limit: number; // in GB
    percentage: number;
  };
  aiRequests: {
    used: number;
    limit: number;
    percentage: number;
  };
  workspaces: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export default function UsageStats() {
  const { subscription } = useSubscription()
  const [usageData, setUsageData] = useState<UsageData>({
    storage: { used: 0, limit: 5, percentage: 0 },
    aiRequests: { used: 0, limit: 50, percentage: 0 },
    workspaces: { used: 0, limit: 1, percentage: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Carica i dati di utilizzo
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!subscription.plan) return
      
      setIsLoading(true)
      
      try {
        // In una implementazione reale, questi dati verrebbero dal server
        const response = await fetch('/api/user/usage')
        
        if (!response.ok) {
          throw new Error('Errore nel recupero dei dati di utilizzo')
        }
        
        const data = await response.json()
        
        // Ottieni i limiti del piano
        const planLimits = getPlanLimits(subscription.plan)
        
        // Calcola le percentuali
        setUsageData({
          storage: {
            used: data.storage || 0.1, // GB usati
            limit: planLimits.storage,
            percentage: Math.min(100, ((data.storage || 0.1) / planLimits.storage) * 100),
          },
          aiRequests: {
            used: data.aiRequests || 5, // Richieste AI usate
            limit: planLimits.aiRequests,
            percentage: Math.min(100, ((data.aiRequests || 5) / planLimits.aiRequests) * 100),
          },
          workspaces: {
            used: data.workspaces || 1, // Workspace usati
            limit: planLimits.workspaces < 0 ? Infinity : planLimits.workspaces,
            percentage: planLimits.workspaces < 0 ? 50 : Math.min(100, ((data.workspaces || 1) / planLimits.workspaces) * 100),
          },
        })
      } catch (error) {
        console.error('Errore nel recupero dei dati di utilizzo:', error)
        
        // Dati di esempio
        const planLimits = getPlanLimits(subscription.plan)
        
        setUsageData({
          storage: {
            used: 0.5, // GB usati
            limit: planLimits.storage,
            percentage: Math.min(100, (0.5 / planLimits.storage) * 100),
          },
          aiRequests: {
            used: 15, // Richieste AI usate
            limit: planLimits.aiRequests,
            percentage: Math.min(100, (15 / planLimits.aiRequests) * 100),
          },
          workspaces: {
            used: 1, // Workspace usati
            limit: planLimits.workspaces < 0 ? Infinity : planLimits.workspaces,
            percentage: planLimits.workspaces < 0 ? 50 : Math.min(100, (1 / planLimits.workspaces) * 100),
          },
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUsageData()
  }, [subscription.plan])
  
  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Utilizzo delle risorse</h2>
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-white/10 rounded"></div>
              <div className="h-2 w-full bg-white/10 rounded"></div>
              <div className="flex justify-between">
                <div className="h-3 w-10 bg-white/10 rounded"></div>
                <div className="h-3 w-10 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="glass-panel p-6 rounded-lg">
      <h2 className="text-lg font-medium mb-4">Utilizzo delle risorse</h2>
      
      <div className="space-y-6">
        {/* Spazio di archiviazione */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiHardDrive className="text-primary" />
              <span>Spazio di archiviazione</span>
            </div>
            <span className="text-sm text-white/70">
              {usageData.storage.used.toFixed(1)} GB / {usageData.storage.limit < 0 ? 'Illimitato' : `${usageData.storage.limit} GB`}
            </span>
          </div>
          
          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${usageData.storage.percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Richieste AI */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiCpu className="text-primary" />
              <span>Richieste AI giornaliere</span>
            </div>
            <span className="text-sm text-white/70">
              {usageData.aiRequests.used} / {usageData.aiRequests.limit < 0 ? 'Illimitato' : usageData.aiRequests.limit}
            </span>
          </div>
          
          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${usageData.aiRequests.percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Workspace */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiUsers className="text-primary" />
              <span>Workspace</span>
            </div>
            <span className="text-sm text-white/70">
              {usageData.workspaces.used} / {usageData.workspaces.limit === Infinity ? 'Illimitati' : usageData.workspaces.limit}
            </span>
          </div>
          
          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${usageData.workspaces.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}