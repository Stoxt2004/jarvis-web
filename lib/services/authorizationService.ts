// In lib/services/authorizationService.ts (nuovo file)
import { useSubscription } from '@/hooks/useSubscription';

// Mappa delle caratteristiche premium e relativi piani richiesti
const PREMIUM_FEATURES = {
  'multiWorkspace': ['PREMIUM', 'TEAM'],
  'advancedAI': ['PREMIUM', 'TEAM'],
  'teamCollaboration': ['TEAM'],
  'customAPI': ['PREMIUM', 'TEAM'],
  'storage50GB': ['PREMIUM', 'TEAM'],
  'storage100GB': ['TEAM'],
  'unlimitedPanels': ['PREMIUM', 'TEAM']
};

type PremiumFeature = keyof typeof PREMIUM_FEATURES;

export function hasAccessToFeature(userPlan: string, feature: PremiumFeature): boolean {
  if (!PREMIUM_FEATURES[feature]) return true; // Se non è una funzione premium, tutti hanno accesso
  
  return PREMIUM_FEATURES[feature].includes(userPlan);
}