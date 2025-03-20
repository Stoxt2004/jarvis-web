import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiArrowUp, FiBarChart2, FiCpu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanLimits } from '@/lib/stripe/config';
import { toast } from 'sonner';

// Main component
export default function UsageLimitsNotifier() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [usageData, setUsageData] = useState<{
    storage: number;
    aiRequests: number;
    workspaces: number;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  // Fetch usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      if (subscription.isPremium) return;
      
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
          
          // Check if user is reaching limits
          checkUsageLimits(data);
        }
      } catch (error) {
        console.error('Error retrieving usage data:', error);
      }
    };
    
    fetchUsageData();
    
    // Poll every 5 minutes to update data
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [subscription.isPremium]);
  
  // Check if user is reaching limits
  const checkUsageLimits = (data: { storage: number; aiRequests: number; workspaces: number; } | null) => {
    if (!data) return;
    
    const planLimits = getPlanLimits(subscription.plan);
    
    // Check if any resource has exceeded 80% threshold
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
  
  // Handle notification dismissal
  const handleDismiss = (resourceType: string) => {
    setDismissedAlerts({
      ...dismissedAlerts,
      [resourceType]: true
    });
    
    // If all notifications have been closed, hide the warning panel
    if (Object.keys(dismissedAlerts).length >= 2) {
      setShowWarning(false);
    }
  };
  
  // Reset dismissed notifications after some time
  useEffect(() => {
    if (Object.keys(dismissedAlerts).length > 0) {
      const timeout = setTimeout(() => {
        setDismissedAlerts({});
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearTimeout(timeout);
    }
  }, [dismissedAlerts]);
  
  // Show a toast when approaching the limit
  useEffect(() => {
    if (usageData && !subscription.isPremium) {
      const planLimits = getPlanLimits(subscription.plan);
      
      // Only check AI requests (to avoid being too intrusive)
      const aiRequestsPercentage = (usageData.aiRequests / planLimits.aiRequests) * 100;
      
      if (aiRequestsPercentage >= 90 && !dismissedAlerts['aiRequests']) {
        toast.warning(
          <div className="flex flex-col">
            <strong>You are about to reach the AI request limit</strong>
            <span className="text-sm">You have used 90% of your daily limit</span>
            <button 
              className="mt-2 text-xs bg-primary hover:bg-primary-dark py-1 px-2 rounded self-start"
              onClick={() => router.push('/dashboard/subscription')}
            >
              Upgrade to Premium
            </button>
          </div>,
          {
            duration: 10000,
          }
        );
      }
    }
  }, [usageData, subscription.isPremium, dismissedAlerts, router]);
  
  // If user has premium subscription or no data, show nothing
  if (subscription.isPremium || !usageData || !showWarning) {
    return null;
  }
  
  // Calculate usage percentages
  const planLimits = getPlanLimits(subscription.plan);
  const storagePercentage = Math.min(100, (usageData.storage / planLimits.storage) * 100);
  const aiRequestsPercentage = Math.min(100, (usageData.aiRequests / planLimits.aiRequests) * 100);
  const workspacesPercentage = planLimits.workspaces > 0 
    ? Math.min(100, (usageData.workspaces / planLimits.workspaces) * 100)
    : 0;
  
  // Determine which resources are reaching limits
  const isStorageNearLimit = storagePercentage >= 80 && !dismissedAlerts['storage'];
  const isAiRequestsNearLimit = aiRequestsPercentage >= 80 && !dismissedAlerts['aiRequests'];
  const isWorkspacesNearLimit = workspacesPercentage >= 80 && !dismissedAlerts['workspaces'];
  
  // If all alerts have been dismissed, show nothing
  if (!isStorageNearLimit && !isAiRequestsNearLimit && !isWorkspacesNearLimit) {
    return null;
  }
  
  // Compact version (floating icon)
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
  
  // Detailed version (warning panel)
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
              <span>Free Plan Limits</span>
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
                title="Storage Space"
                icon={<FiBarChart2 />}
                percentage={storagePercentage}
                usedValue={`${usageData.storage.toFixed(1)} GB`}
                totalValue={`${planLimits.storage} GB`}
                onDismiss={() => handleDismiss('storage')}
              />
            )}
            
            {isAiRequestsNearLimit && (
              <UsageLimitWarning
                title="Daily AI Requests"
                icon={<FiCpu />}
                percentage={aiRequestsPercentage}
                usedValue={usageData.aiRequests}
                totalValue={planLimits.aiRequests}
                onDismiss={() => handleDismiss('aiRequests')}
              />
            )}
            
            {isWorkspacesNearLimit && planLimits.workspaces > 0 && (
              <UsageLimitWarning
                title="Workspaces"
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
                <span>Upgrade to Premium</span>
              </button>
              <p className="text-xs text-center mt-2 text-white/60">
                Remove all limits and unlock advanced features
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Component to display a single limit warning
interface UsageLimitWarningProps {
  title: string;
  icon: React.ReactNode;
  percentage: number;
  usedValue: string | number;
  totalValue: string | number;
  onDismiss: () => void;
}

function UsageLimitWarning({ title, icon, percentage, usedValue, totalValue, onDismiss }: UsageLimitWarningProps) {
  // Determine color based on percentage
  const getColor = (percent: number) => {
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
        <span>{usedValue} used</span>
        <span>Limit: {totalValue}</span>
      </div>
    </div>
  );
}
