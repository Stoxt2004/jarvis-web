import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiArrowUp, FiBarChart2, FiCpu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanLimits } from '@/lib/stripe/config';
import { toast } from 'sonner';

// Componente principale
export default function UsageLimitsNotifier() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [usageData, setUsageData] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState({});
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  // Fetch dei dati di utilizzo
  useEffect(() => {
    const fetchUsageData = async () => {
      if (subscription.isPremium) return;
      
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
          
          // Controlla se l'utente sta raggiungendo i limiti
          checkUsageLimits(data);
        }
      } catch (error) {
        console.error('Errore nel recupero dei dati di utilizzo:', error);
      }
    };
    
    fetchUsageData();
    
    // Poll ogni 5 minuti per aggiornare i dati
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [subscription.isPremium]);
  
  // Controlla se l'utente sta raggiungendo i limiti
  const checkUsageLimits = (data) => {
    if (!data) return;
    
    const planLimits = getPlanLimits(subscription.plan);
    
    // Verifica se qualsiasi risorsa ha superato la soglia dell'80%
    const storagePercentage = (data.storage / planLimits.storage) * 100;
    const aiRequestsPercentage = (data.aiRequests / planLimits.aiRequests) * 100;
    const workspacesPercentage = planLimits.workspaces > 0 
      ? (data.workspaces / planLimits.workspaces) * 100 
      : 0;
    
    const isNearLimit = 
      storagePercentage >= 80 || 
      aiRequestsPercentage >= 80 || 
      (planLimits.workspaces > 0 && workspacesPercentage >= 80);
    
    if (isNearLimit && !showWarning) {
      setShowWarning(true);
    }
  };
  
  // Gestisce la chiusura delle notifiche
  const handleDismiss = (resourceType) => {
    setDismissedAlerts({
      ...dismissedAlerts,
      [resourceType]: true
    });
    
    // Se tutte le notifiche sono state chiuse, nascondi il pannello di avviso
    if (Object.keys(dismissedAlerts).length >= 2) {
      setShowWarning(false);
    }
  };
  
  // Reimposta le notifiche chiuse dopo un po' di tempo
  useEffect(() => {
    if (Object.keys(dismissedAlerts).length > 0) {
      const timeout = setTimeout(() => {
        setDismissedAlerts({});
      }, 24 * 60 * 60 * 1000); // 24 ore
      
      return () => clearTimeout(timeout);
    }
  }, [dismissedAlerts]);
  
  // Mostra un toast all'avvicinarsi del limite
  useEffect(() => {
    if (usageData && !subscription.isPremium) {
      const planLimits = getPlanLimits(subscription.plan);
      
      // Controlla solo le richieste AI (per non essere troppo invadenti)
      const aiRequestsPercentage = (usageData.aiRequests / planLimits.aiRequests) * 100;
      
      if (aiRequestsPercentage >= 90 && !dismissedAlerts['aiRequests']) {
        toast.warning(
          <div className="flex flex-col">
            <strong>Stai per raggiungere il limite di richieste AI</strong>
            <span className="text-sm">Hai utilizzato il 90% del limite giornaliero</span>
            <button 
              className="mt-2 text-xs bg-primary hover:bg-primary-dark py-1 px-2 rounded self-start"
              onClick={() => router.push('/dashboard/subscription')}
            >
              Passa a Premium
            </button>
          </div>,
          {
            duration: 10000,
          }
        );
      }
    }
  }, [usageData, subscription.isPremium]);
  
  // Se l'utente ha un abbonamento premium o non ci sono dati, non mostrare nulla
  if (subscription.isPremium || !usageData || !showWarning) {
    return null;
  }
  
  // Calcola le percentuali di utilizzo
  const planLimits = getPlanLimits(subscription.plan);
  const storagePercentage = Math.min(100, (usageData.storage / planLimits.storage) * 100);
  const aiRequestsPercentage = Math.min(100, (usageData.aiRequests / planLimits.aiRequests) * 100);
  const workspacesPercentage = planLimits.workspaces > 0 
    ? Math.min(100, (usageData.workspaces / planLimits.workspaces) * 100)
    : 0;
  
  // Determina quali risorse stanno raggiungendo i limiti
  const isStorageNearLimit = storagePercentage >= 80 && !dismissedAlerts['storage'];
  const isAiRequestsNearLimit = aiRequestsPercentage >= 80 && !dismissedAlerts['aiRequests'];
  const isWorkspacesNearLimit = workspacesPercentage >= 80 && !dismissedAlerts['workspaces'];
  
  // Se tutti gli avvisi sono stati chiusi, non mostrare nulla
  if (!isStorageNearLimit && !isAiRequestsNearLimit && !isWorkspacesNearLimit) {
    return null;
  }
  
  // Versione compatta (icona flottante)
  if (!showDetailedView) {
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button
          className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:bg-amber-600 relative"
          onClick={() => setShowDetailedView(true)}
        >
          <FiAlertCircle size={24} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {[isStorageNearLimit, isAiRequestsNearLimit, isWorkspacesNearLimit].filter(Boolean).length}
          </span>
        </button>
      </motion.div>
    );
  }
  
  // Versione dettagliata (pannello di avviso)
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-50 w-80"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="bg-surface-dark border border-amber-500/50 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 px-4 py-3 flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <FiAlertCircle />
              <span>Limiti piano Free</span>
            </h3>
            <button 
              className="p-1 rounded hover:bg-white/10"
              onClick={() => setShowDetailedView(false)}
            >
              <FiX size={18} />
            </button>
          </div>
          
          <div className="p-4">
            {isStorageNearLimit && (
              <UsageLimitWarning
                title="Spazio di archiviazione"
                icon={<FiBarChart2 />}
                percentage={storagePercentage}
                usedValue={`${usageData.storage.toFixed(1)} GB`}
                totalValue={`${planLimits.storage} GB`}
                onDismiss={() => handleDismiss('storage')}
              />
            )}
            
            {isAiRequestsNearLimit && (
              <UsageLimitWarning
                title="Richieste AI giornaliere"
                icon={<FiCpu />}
                percentage={aiRequestsPercentage}
                usedValue={usageData.aiRequests}
                totalValue={planLimits.aiRequests}
                onDismiss={() => handleDismiss('aiRequests')}
              />
            )}
            
            {isWorkspacesNearLimit && planLimits.workspaces > 0 && (
              <UsageLimitWarning
                title="Workspace"
                icon={<FiBarChart2 />}
                percentage={workspacesPercentage}
                usedValue={usageData.workspaces}
                totalValue={planLimits.workspaces}
                onDismiss={() => handleDismiss('workspaces')}
              />
            )}
            
            <div className="mt-4">
              <button 
                className="w-full py-2 px-4 bg-primary hover:bg-primary-dark rounded-md flex items-center justify-center gap-2"
                onClick={() => router.push('/dashboard/subscription')}
              >
                <FiArrowUp size={16} />
                <span>Passa a Premium</span>
              </button>
              <p className="text-xs text-center mt-2 text-white/60">
                Rimuovi tutti i limiti e sblocca funzionalità avanzate
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Componente per mostrare un singolo avviso di limite
function UsageLimitWarning({ title, icon, percentage, usedValue, totalValue, onDismiss }) {
  // Determina il colore in base alla percentuale
  const getColor = (percent) => {
    if (percent >= 95) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
  };
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
        <button 
          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80"
          onClick={onDismiss}
        >
          <FiX size={14} />
        </button>
      </div>
      
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
        <div 
          className={`h-full rounded-full ${getColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-white/60">
        <span>{usedValue} utilizzati</span>
        <span>Limite: {totalValue}</span>
      </div>
    </div>
  );
}