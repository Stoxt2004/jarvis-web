import { useEffect, useState, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { FiHardDrive, FiUsers, FiCpu, FiRefreshCw, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsageStats() {
  const { subscription } = useSubscription();
  const [usage, setUsage] = useState({
    storage: { used: 0, limit: 5, percentage: 0 },
    aiRequests: { used: 0, limit: 50, percentage: 0 },
    workspaces: { used: 0, limit: 1, percentage: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Utilizziamo useCallback per definire fetchUsage una sola volta
  const fetchUsage = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/user/usage');
      if (response.ok) {
        const data = await response.json();
        console.log('Dati di utilizzo ricevuti:', data);
        console.log('Piano attuale:', data.currentPlan);
        console.log('Limiti: Storage:', data.storageLimit, 'AI:', data.aiRequestsLimit, 'Workspaces:', data.workspacesLimit);
        
        // Qui è la correzione: assicuriamoci di mappare correttamente i dati dall'API
        setUsage({
          storage: { 
            used: data.storage || 0,
            limit: data.storageLimit || 5,
            percentage: data.storagePercentage || 0
          },
          aiRequests: { 
            used: data.aiRequests || 0,
            limit: data.aiRequestsLimit || 50,
            percentage: data.aiRequestsPercentage || 0
          },
          workspaces: { 
            used: data.workspaces || 0,
            limit: data.workspacesLimit || 1,
            percentage: data.workspacesPercentage || 0
          }
        });
        
        // Aggiorna il timestamp dell'ultimo aggiornamento
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati di utilizzo:', error);
    } finally {
      setIsLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  }, []);
  
  // Funzione per gestire l'aggiornamento manuale
  const handleManualRefresh = () => {
    fetchUsage(true);
  };
  
  // Funzione per formattare l'orario dell'ultimo aggiornamento
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Mai';
    
    return lastUpdated.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  useEffect(() => {
    // Carica i dati inizialmente
    fetchUsage();
    
    // Configura l'intervallo per aggiornare i dati ogni 30 secondi
    const intervalId = setInterval(() => {
      fetchUsage();
    }, 30000); // 30 secondi
    
    // Cleanup: rimuovi l'intervallo quando il componente viene smontato
    return () => clearInterval(intervalId);
  }, [fetchUsage]);
  
  if (isLoading) {
    return <div className="p-4 animate-pulse">Caricamento dati di utilizzo...</div>
  }
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Resource Usage</h2>
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/50 flex items-center gap-1">
            <FiClock className="text-white/30" />
            <span>Updated: {formatLastUpdated()}</span>
          </div>
          
          <button 
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Aggiorna dati"
          >
            <FiRefreshCw className={`text-sm ${isRefreshing ? 'animate-spin text-primary' : 'text-white/70'}`} />
          </button>
        </div>
      </div>
      
      <AnimatePresence mode="popLayout">
        <motion.div 
          className="space-y-3"
          key={lastUpdated?.getTime()}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <FiHardDrive />
                <span>Storage</span>
              </div>
              <span>
                {usage.storage.used < 0.01 
                  ? `${(usage.storage.used * 1024).toFixed(1)} MB` 
                  : `${usage.storage.used.toFixed(2)} GB`} / {typeof usage.storage.limit === 'number' ? `${usage.storage.limit} GB` : usage.storage.limit}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${usage.storage.percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${usage.storage.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <FiCpu />
                <span>AI Requests</span>
              </div>
              <span>{usage.aiRequests.used} / {usage.aiRequests.limit}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${usage.aiRequests.percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${usage.aiRequests.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <FiUsers />
                <span>Workspaces</span>
              </div>
              <span>{usage.workspaces.used} / {usage.workspaces.limit === -1 ? '∞' : usage.workspaces.limit}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${usage.workspaces.percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${usage.workspaces.percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}