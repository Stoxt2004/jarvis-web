// In components/dashboard/UsageStats.tsx
import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { FiHardDrive, FiUsers, FiCpu } from 'react-icons/fi';

export default function UsageStats() {
  const { subscription } = useSubscription();
  const [usage, setUsage] = useState({
    storage: { used: 0, limit: 5, percentage: 0 },
    aiRequests: { used: 0, limit: 50, percentage: 0 },
    workspaces: { used: 0, limit: 1, percentage: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage({
            storage: { 
              used: data.storage,
              limit: data.storageLimit,
              percentage: data.storagePercentage
            },
            aiRequests: { 
              used: data.aiRequests,
              limit: data.aiRequestsLimit,
              percentage: data.aiRequestsPercentage
            },
            workspaces: { 
              used: data.workspaces,
              limit: data.workspacesLimit,
              percentage: data.workspacesPercentage
            }
          });
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati di utilizzo:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsage();
  }, []);
  
  if (isLoading) {
    return <div className="p-4 animate-pulse">Caricamento dati di utilizzo...</div>
  }
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-2">Utilizzo risorse</h2>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <div className="flex items-center gap-2">
              <FiHardDrive />
              <span>Storage</span>
            </div>
            <span>{usage.storage.used.toFixed(1)} GB / {usage.storage.limit} GB</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${usage.storage.percentage}%` }}
            ></div>
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
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${usage.aiRequests.percentage}%` }}
            ></div>
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
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${usage.workspaces.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}