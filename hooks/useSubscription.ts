// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlanType } from '@/lib/stripe/config';

export interface SubscriptionData {
  plan: PlanType;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INACTIVE';
  currentPeriodEnd?: Date;
  isActive: boolean;
  isPremium: boolean;
  isTeam: boolean;
}

export function useSubscription() {
    const { data: session, status: sessionStatus } = useSession();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
      plan: 'FREE',
      status: 'INACTIVE',
      isActive: false,
      isPremium: false,
      isTeam: false,
    });
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const fetchSubscription = async () => {
        if (sessionStatus === 'loading') return;
        
        if (sessionStatus === 'authenticated' && session?.user?.id) {
          setIsLoading(true);
          
          try {
            const response = await fetch('/api/user/subscription');
            
            if (response.ok) {
              const data = await response.json();
              
              // Utilizza i dati restituiti o i dati della sessione come fallback
              setSubscriptionData({
                plan: data.subscription?.plan || (session.user.plan as PlanType) || 'FREE',
                status: data.subscription?.status || 'INACTIVE',
                currentPeriodEnd: data.subscription?.stripeCurrentPeriodEnd ? new Date(data.subscription.stripeCurrentPeriodEnd) : undefined,
                isActive: data.subscription?.status === 'ACTIVE' || data.subscription?.status === 'TRIALING',
                isPremium: (data.subscription?.plan === 'PREMIUM' || data.subscription?.plan === 'TEAM') && 
                          (data.subscription?.status === 'ACTIVE' || data.subscription?.status === 'TRIALING'),
                isTeam: data.subscription?.plan === 'TEAM' && 
                       (data.subscription?.status === 'ACTIVE' || data.subscription?.status === 'TRIALING'),
              });
            } else {
              console.error('Errore nel recupero dell\'abbonamento');
              // Usa i dati della sessione come fallback
              setSubscriptionData({
                plan: (session.user.plan as PlanType) || 'FREE',
                status: 'INACTIVE',
                isActive: false,
                isPremium: false,
                isTeam: false,
              });
            }
          } catch (error) {
            console.error('Errore nel recupero dell\'abbonamento:', error);
            // Usa i dati della sessione come fallback
            setSubscriptionData({
              plan: (session.user.plan as PlanType) || 'FREE',
              status: 'INACTIVE',
              isActive: false,
              isPremium: false,
              isTeam: false,
            });
          } finally {
            setIsLoading(false);
          }
        } else if (sessionStatus === 'unauthenticated') {
          // ... codice esistente ...
        }
      };
  
      fetchSubscription();
    }, [session, sessionStatus]);

  // Funzione per verificare se una feature è disponibile
  const hasAccess = (feature: string): boolean => {
    // Se il piano è free, controlla quali feature sono disponibili per free
    if (subscriptionData.plan === 'FREE') {
      switch (feature) {
        case 'basicAI':
          return true;
        case 'basicEditor':
          return true;
        case 'basicStorage':
          return true;
        default:
          return false;
      }
    }
    
    // Se il piano è premium ma non attivo, trattalo come free
    if (subscriptionData.plan === 'PREMIUM' && !subscriptionData.isActive) {
      switch (feature) {
        case 'basicAI':
          return true;
        case 'basicEditor':
          return true;
        case 'basicStorage':
          return true;
        default:
          return false;
      }
    }
    
    // Se il piano è premium e attivo
    if (subscriptionData.plan === 'PREMIUM' && subscriptionData.isActive) {
      switch (feature) {
        case 'advancedAI':
          return true;
        case 'fullIDE':
          return true;
        case 'expandedStorage':
          return true;
        case 'unlimitedWorkspaces':
          return true;
        case 'customAPIs':
          return true;
        case 'prioritySupport':
          return true;
        case 'teamFeatures':
          return false;
        default:
          return true;
      }
    }
    
    // Se il piano è team e attivo
    if (subscriptionData.plan === 'TEAM' && subscriptionData.isActive) {
      // Tutte le feature sono disponibili
      return true;
    }
    
    return false;
  };

  return {
    subscription: subscriptionData,
    isLoading,
    hasAccess,
  };
}