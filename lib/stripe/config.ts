// src/lib/stripe/config.ts - Versione corretta con gestione case-insensitive 
import Stripe from 'stripe';

// Configura Stripe
export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || '', {
  // Nota: usiamo una versione supportata oppure omettiamo completamente il parametro
  // per utilizzare la versione di default della libreria
});

// Interfaccia corretta per i piani
interface PlanConfig {
  name: string;
  description: string;
  stripePriceId: string;
  monthlyPrice?: number;
  features: string[];
  limitations: {
    storage: number;
    workspaces: number;
    aiRequests: number;
    advancedFeatures: boolean;
    teamFeatures?: boolean;
  };
}

// Definizione dei piani di abbonamento
export const PLANS: Record<string, PlanConfig> = {
  FREE: {
    name: 'Free',
    description: 'Piano gratuito con funzionalità di base',
    stripePriceId: '', // Nessun prezzo per il piano gratuito
    features: [
      'Accesso all\'assistente AI con funzioni base',
      'Editor di codice di base',
      '1GB di spazio cloud',
      '1 workspace alla volta',
      'Supporto community'
    ],
    limitations: {
      storage: 1, // GB
      workspaces: 1,
      aiRequests: 50, // al giorno
      advancedFeatures: false,
    }
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Accesso completo per professionisti',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
    monthlyPrice: 9.99,
    features: [
      'Assistente AI avanzato',
      'IDE completo + terminale',
      '10GB di spazio cloud',
      'Workspace illimitati',
      'API personalizzate',
      'Supporto prioritario'
    ],
    limitations: {
      storage: 10, // GB
      workspaces: -1, // illimitati
      aiRequests: 500, // al giorno
      advancedFeatures: true,
    }
  },
  TEAM: {
    name: 'Team',
    description: 'Soluzione completa per team e aziende',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || '',
    monthlyPrice: 24.99,
    features: [
      'Tutte le funzionalità Premium',
      '25GB di spazio cloud',
      'Collaborazione in tempo reale',
      'Controlli admin avanzati',
      'Onboarding personalizzato',
      'Supporto 24/7'
    ],
    limitations: {
      storage: 25, // GB
      workspaces: -1, // illimitati
      aiRequests: 2000, // al giorno
      advancedFeatures: true,
      teamFeatures: true,
    }
  }
};

// Tipo per i piani
export type PlanType = keyof typeof PLANS;

// Helper per verificare se una feature è disponibile per un piano
export function isFeatureAvailable(plan: PlanType, feature: string): boolean {
  switch (feature) {
    case 'aiAdvanced':
      return plan !== 'FREE';
    case 'teamCollaboration':
      return plan === 'TEAM';
    case 'prioritySupport':
      return plan !== 'FREE';
    case 'api':
      return plan !== 'FREE';
    default:
      return true;
  }
}

// Ottieni i limiti per un piano - MODIFICATO per gestire case-insensitive
export function getPlanLimits(plan: string): PlanConfig["limitations"] {
  // Normalizza il piano a uppercase
  const normalizedPlan = plan.toUpperCase();
  
  // Verifica se il piano esiste
  if (PLANS[normalizedPlan]) {
    return PLANS[normalizedPlan].limitations;
  }
  
  // Se il piano non esiste, restituisci i limiti del piano FREE
  return PLANS.FREE.limitations;
}