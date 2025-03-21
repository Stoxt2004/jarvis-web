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

export function hasAccessToFeature(userPlan: string, feature: string): boolean {
  if (!PREMIUM_FEATURES[feature]) return true; // Se non è una funzione premium, tutti hanno accesso
  
  return PREMIUM_FEATURES[feature].includes(userPlan);
}