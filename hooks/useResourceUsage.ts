// src/hooks/useResourceUsage.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getPlanLimits } from '@/lib/stripe/config';

export interface ResourceUsage {
  storage: {
    used: number;      // In GB
    limit: number;     // In GB
    percentage: number; // 0-100
    isExceeded: boolean;
  };
  aiRequests: {
    used: number;
    limit: number;
    percentage: number; // 0-100
    isExceeded: boolean;
    resetTime?: Date;  // Added as optional property
  };
  workspaces: {
    used: number;
    limit: number;
    percentage: number; // 0-100
    isExceeded: boolean;
  };
  panels: {
    used: number;
    limit: number;
    percentage: number; // 0-100
    isExceeded: boolean;
  };
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResourceUsage(currentPanelCount: number = 0): ResourceUsage {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calculateResetTime = () => {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(23, 59, 59, 999); // Fine della giornata corrente
    return resetTime;
  };
  const [usage, setUsage] = useState({
    storage: { used: 0, limit: 5, percentage: 0, isExceeded: false },
    aiRequests: { 
      used: 0, 
      limit: 50, 
      percentage: 0, 
      isExceeded: false,
      resetTime: calculateResetTime() // Include this when initializing
    },
    workspaces: { used: 0, limit: 1, percentage: 0, isExceeded: false },
    panels: { used: currentPanelCount, limit: 3, percentage: 0, isExceeded: false }
  });

  // Calcola l'orario di reset per le richieste AI (fine giornata)
  

  // Funzione per recuperare i dati di utilizzo
  const fetchUsageData = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Richiesta all'API per ottenere i dati di utilizzo
      const response = await fetch('/api/user/usage');
      
      if (!response.ok) {
        throw new Error(`Errore nel caricamento dei dati di utilizzo: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verifica se sono disponibili i limiti del piano dal server
      let planLimits = {
        storage: data.storageLimit || 5, // GB
        aiRequests: data.aiRequestsLimit || 50,
        workspaces: data.workspacesLimit || 1,
      };
      
      // Ottieni i limiti del piano (fallback se non disponibili dal server)
      if (!data.storageLimit && session.user.plan) {
        const limits = getPlanLimits(session.user.plan);
        planLimits = {
          storage: limits.storage,
          aiRequests: limits.aiRequests,
          workspaces: limits.workspaces,
        };
      }
      
      // Imposta un limite di pannelli in base al piano
      const panelLimit = session.user.plan === 'FREE' ? 3 : -1; // -1 significa illimitato
      
      // Calcola le percentuali e lo stato di superamento dei limiti
      const storagePercentage = planLimits.storage > 0 
        ? Math.min(100, (data.storage || 0) / planLimits.storage * 100) 
        : 0;
        
      const aiRequestsPercentage = planLimits.aiRequests > 0 
        ? Math.min(100, (data.aiRequests || 0) / planLimits.aiRequests * 100) 
        : 0;
        
      const workspacesPercentage = planLimits.workspaces > 0 
        ? Math.min(100, (data.workspaces || 0) / planLimits.workspaces * 100) 
        : 0;
        
      const panelsPercentage = panelLimit > 0 
        ? Math.min(100, currentPanelCount / panelLimit * 100) 
        : 0;
      
      // Aggiorna lo stato con i dati di utilizzo
      setUsage({
        storage: {
          used: data.storage || 0,
          limit: planLimits.storage,
          percentage: storagePercentage,
          isExceeded: data.storage >= planLimits.storage && planLimits.storage !== -1
        },
        aiRequests: {
          used: data.aiRequests || 0,
          limit: planLimits.aiRequests,
          percentage: aiRequestsPercentage,
          isExceeded: data.aiRequests >= planLimits.aiRequests && planLimits.aiRequests !== -1,
          resetTime: calculateResetTime()
        },
        workspaces: {
          used: data.workspaces || 0,
          limit: planLimits.workspaces,
          percentage: workspacesPercentage,
          isExceeded: data.workspaces >= planLimits.workspaces && planLimits.workspaces !== -1
        },
        panels: {
          used: currentPanelCount,
          limit: panelLimit,
          percentage: panelsPercentage,
          isExceeded: currentPanelCount >= panelLimit && panelLimit !== -1
        }
      });
    } catch (error) {
      console.error("Errore nel caricamento dei dati di utilizzo:", error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      
      // In caso di errore, non aggiornare lo stato dell'utilizzo
    } finally {
      setIsLoading(false);
    }
  }, [session, status, currentPanelCount]);
  
  // Carica i dati all'inizializzazione
  useEffect(() => {
    fetchUsageData();
    
    // Imposta un intervallo per aggiornare i dati ogni 5 minuti
    const intervalId = setInterval(() => {
      fetchUsageData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchUsageData]);
  
  // Aggiorna i dati dei pannelli quando cambia il conteggio
  useEffect(() => {
    setUsage(prev => {
      const panelLimit = session?.user?.plan === 'FREE' ? 3 : -1;
      const panelsPercentage = panelLimit > 0 
        ? Math.min(100, currentPanelCount / panelLimit * 100) 
        : 0;
      
      return {
        ...prev,
        panels: {
          used: currentPanelCount,
          limit: panelLimit,
          percentage: panelsPercentage,
          isExceeded: currentPanelCount >= panelLimit && panelLimit !== -1
        }
      };
    });
  }, [currentPanelCount, session?.user?.plan]);
  
  // Funzione per aggiornare manualmente i dati
  const refreshUsage = useCallback(async () => {
    await fetchUsageData();
  }, [fetchUsageData]);
  
  return {
    ...usage,
    isLoading,
    error,
    refresh: refreshUsage
  };
}