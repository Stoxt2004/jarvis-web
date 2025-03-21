// In components/premium/PremiumFeatureWrapper.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { FiLock } from 'react-icons/fi';

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
}

export default function PremiumFeatureWrapper({ children, featureName, fallback }: PremiumFeatureProps) {
  const router = useRouter();
  const { subscription, hasAccess } = useSubscription();
  
  if (hasAccess(featureName)) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      {fallback || <div className="min-h-[100px] flex items-center justify-center">
        <div className="bg-surface-dark/80 p-4 rounded-lg text-center max-w-md">
          <FiLock className="mx-auto mb-2 text-primary text-xl" />
          <h3 className="font-semibold mb-1">Funzionalità Premium</h3>
          <p className="text-sm text-white/70 mb-3">
            Questa funzionalità è disponibile solo nei piani Premium e Team.
          </p>
          <button 
            className="px-3 py-1 bg-primary rounded-md text-white text-sm"
            onClick={() => router.push('/dashboard/subscription')}
          >
            Aggiorna ora
          </button>
        </div>
      </div>}
    </div>
  );
}