// components/premium/UsageLimitsNotifier.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { FiAlertCircle, FiArrowUp, FiBarChart2, FiCpu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanLimits } from '@/lib/stripe/config';
import { toast } from 'sonner';
import { aiEvents, AI_EVENTS } from '@/lib/events/aiEvents';

// Interface for AI limits context
interface AILimitsContextType {
  isAILimitExceeded: boolean;
  aiUsageStats: {
    current: number;
    limit: number;
    percentage: number;
  };
}

// We create a context to share the AI limitation state
export const AILimitsContext = createContext<AILimitsContextType>({
  isAILimitExceeded: false,
  aiUsageStats: { current: 0, limit: 0, percentage: 0 }
});

// Custom hook to easily access the context
export const useAILimits = () => useContext(AILimitsContext);

// Interface for usage data
interface UsageData {
  storage: number;
  aiRequests: number;
  workspaces: number;
}

// Main component
const UsageLimitsNotifier: React.FC = () => {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
  
  // State for AI limits context
  const [isAILimitExceeded, setIsAILimitExceeded] = useState<boolean>(false);
  const [aiUsageStats, setAIUsageStats] = useState<AILimitsContextType['aiUsageStats']>({ 
    current: 0, 
    limit: 0, 
    percentage: 0 
  });
  
  // Get the current plan limits
  const planLimits = getPlanLimits(subscription.plan);
  
  // Function to retrieve usage data
  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/user/usage');
      if (!response.ok) {
        throw new Error(`Error in request: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Usage data received:', data);
      console.log('Current plan:', subscription.plan);
      console.log('Plan limits:', planLimits);
      
      // Set usage data
      setUsageData({
        storage: data.storage || 0.1,
        aiRequests: data.aiRequests || 0,
        workspaces: data.workspaces || 0,
      });
      
      // Calculate percentage and update statistics
      const aiRequestsPercentage = Math.min(100, (data.aiRequests / planLimits.aiRequests) * 100);
      setAIUsageStats({
        current: data.aiRequests,
        limit: planLimits.aiRequests,
        percentage: aiRequestsPercentage
      });
      
      // Reset limit flag if requests are significantly below the limit
      if (data.aiRequests < planLimits.aiRequests * 0.9) {
        setIsAILimitExceeded(false);
        sessionStorage.removeItem('ai_limit_exceeded');
        console.log('Manual reset of AI limit, requests well below the maximum limit');
      } 
      // Activate flag if requests exceed the limit
      else if (data.aiRequests >= planLimits.aiRequests) {
        setIsAILimitExceeded(true);
        sessionStorage.setItem('ai_limit_exceeded', 'true');
        console.log(`AI requests limit exceeded: ${data.aiRequests}/${planLimits.aiRequests}`);
        
        // Show a toast to inform the user
        toast.error(
          <div className="flex flex-col">
            <strong>Daily AI request limit reached</strong>
            <span className="text-sm">You have used all your {planLimits.aiRequests} AI requests for today.</span>
          </div>,
          { duration: 6000 }
        );
      }
        
      // Check overall limits
      checkUsageLimits({
        storage: data.storage || 0.1,
        aiRequests: data.aiRequests || 0,
        workspaces: data.workspaces || 0
      });
    } catch (error) {
      console.error('Error retrieving usage data:', error);
      // Use sample values only in case of error
      setUsageData({
        storage: 0.5,
        aiRequests: 15,
        workspaces: 1
      });
    }
  };
  
  // Initial fetch usage data and setup events
  useEffect(() => {
    // Load data initially
    fetchUsageData();
    
    // Configure event listeners for AI events
    const handleRequestSent = () => {
      console.log('Event received: AI request sent, updating statistics...');
      fetchUsageData(); // Update data after each request sent
    };
    
    const handleLimitReached = () => {
      console.log('Event received: AI limit reached, updating state...');
      setIsAILimitExceeded(true);
      sessionStorage.setItem('ai_limit_exceeded', 'true');
      fetchUsageData(); // Update data anyway
    };
    
    // Register event listeners
    aiEvents.on(AI_EVENTS.REQUEST_SENT, handleRequestSent);
    aiEvents.on(AI_EVENTS.LIMIT_REACHED, handleLimitReached);
    
    // Poll every 2 minutes to update data (backup, independent of events)
    const interval = setInterval(fetchUsageData, 2 * 60 * 1000);
    
    // Cleanup: remove event listeners and interval
    return () => {
      aiEvents.off(AI_EVENTS.REQUEST_SENT, handleRequestSent);
      aiEvents.off(AI_EVENTS.LIMIT_REACHED, handleLimitReached);
      clearInterval(interval);
    };
  }, [subscription.isPremium, subscription.plan, planLimits.aiRequests]);
  
  // Check if user is reaching limits
  const checkUsageLimits = (data: UsageData | null): void => {
    if (!data) return;
    
    // Correct use of plan limits
    const currentPlanLimits = getPlanLimits(subscription.plan);
    
    // Check if any resource has exceeded 80% threshold
    const storagePercentage = (data.storage / currentPlanLimits.storage) * 100;
    const aiRequestsPercentage = (data.aiRequests / currentPlanLimits.aiRequests) * 100;
    const workspacesPercentage = currentPlanLimits.workspaces > 0 
      ? (data.workspaces / currentPlanLimits.workspaces) * 100 
      : 0;
    
    const isNearLimit = 
      storagePercentage >= 80 || 
      aiRequestsPercentage >= 80 || 
      (currentPlanLimits.workspaces > 0 && workspacesPercentage >= 80);
    
    if (isNearLimit && !showWarning) {
      setShowWarning(true);
    }
  };
  
  // Handle notification dismissal
  const handleDismiss = (resourceType: string): void => {
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
  
  // Reset AI limit at midnight
  useEffect(() => {
    // Check if it's a new day
    const checkNewDay = () => {
      const lastCheckDate = localStorage.getItem('last_ai_limit_check_date');
      const today = new Date().toDateString();
      
      if (lastCheckDate !== today) {
        // It's a new day, reset limits
        setIsAILimitExceeded(false);
        sessionStorage.removeItem('ai_limit_exceeded');
        localStorage.setItem('last_ai_limit_check_date', today);
        console.log('New day, AI limits reset');
      }
    };
    
    // Initial check
    checkNewDay();
    
    // Set a timer to check again at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const midnightTimer = setTimeout(checkNewDay, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, []);
  
  // If user has premium subscription or no data, show nothing visible
  // But still provide the context value!
  if ((subscription.isPremium || !usageData) && !isAILimitExceeded) {
    return (
      <AILimitsContext.Provider value={{ isAILimitExceeded, aiUsageStats }}>
        {/* No UI, but provide context */}
      </AILimitsContext.Provider>
    );
  }
  
  // Determine which resources are reaching limits
  const storagePercentage = usageData ? Math.min(100, (usageData.storage / planLimits.storage) * 100) : 0;
  const aiRequestsPercentage = usageData ? Math.min(100, (usageData.aiRequests / planLimits.aiRequests) * 100) : 0;
  const workspacesPercentage = usageData && planLimits.workspaces > 0 
    ? Math.min(100, (usageData.workspaces / planLimits.workspaces) * 100)
    : 0;
  
  // Determine which resources are reaching limits
  const isStorageNearLimit = storagePercentage >= 80 && !dismissedAlerts['storage'];
  const isAiRequestsNearLimit = aiRequestsPercentage >= 80 && !dismissedAlerts['aiRequests'];
  const isWorkspacesNearLimit = workspacesPercentage >= 80 && !dismissedAlerts['workspaces'];
  
  // If all alerts have been dismissed, show nothing
  if (!isStorageNearLimit && !isAiRequestsNearLimit && !isWorkspacesNearLimit && !isAILimitExceeded) {
    return (
      <AILimitsContext.Provider value={{ isAILimitExceeded, aiUsageStats }}>
        {/* No UI, but provide context */}
      </AILimitsContext.Provider>
    );
  }
  
  // Full component with UI
  return (
    <AILimitsContext.Provider value={{ isAILimitExceeded, aiUsageStats }}>
      <AnimatePresence>
        {/* Compact version (floating icon) */}
        {!showDetailedView && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <button
              className={`w-12 h-12 rounded-full ${isAILimitExceeded ? 'bg-red-500' : 'bg-amber-500'} text-white flex items-center justify-center shadow-lg hover:bg-amber-600 relative`}
              onClick={() => setShowDetailedView(true)}
            >
              <FiAlertCircle size={24} />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {[isStorageNearLimit, isAiRequestsNearLimit, isWorkspacesNearLimit, isAILimitExceeded].filter(Boolean).length}
              </span>
            </button>
          </motion.div>
        )}
        
        {/* Detailed version (warning panel) */}
        {showDetailedView && (
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
                  <span>{isAILimitExceeded ? 'Limit reached' : `${subscription.plan} plan limits`}</span>
                </h3>
                <button 
                  className="p-1 rounded hover:bg-white/10"
                  onClick={() => setShowDetailedView(false)}
                >
                  <FiX size={18} />
                </button>
              </div>
              
              <div className="p-4">
                {isAILimitExceeded && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      <FiAlertCircle />
                      <span>Daily AI limit reached</span>
                    </h4>
                    <p className="text-sm text-white/80 mb-2">
                      You have reached the limit of {planLimits.aiRequests} AI requests for today. 
                      AI features are temporarily disabled until tomorrow, or until you upgrade to a higher plan.
                    </p>
                  </div>
                )}
                
                {isStorageNearLimit && (
                  <UsageLimitWarning
                    title="Storage Space"
                    icon={<FiBarChart2 />}
                    percentage={storagePercentage}
                    usedValue={usageData ? `${usageData.storage.toFixed(1)} GB` : '0 GB'}
                    totalValue={`${planLimits.storage} GB`}
                    onDismiss={() => handleDismiss('storage')}
                  />
                )}
                
                {(isAiRequestsNearLimit || isAILimitExceeded) && (
                  <UsageLimitWarning
                    title="Daily AI Requests"
                    icon={<FiCpu />}
                    percentage={aiRequestsPercentage}
                    usedValue={usageData ? usageData.aiRequests : 0}
                    totalValue={planLimits.aiRequests}
                    onDismiss={() => handleDismiss('aiRequests')}
                  />
                )}
                
                {isWorkspacesNearLimit && planLimits.workspaces > 0 && (
                  <UsageLimitWarning
                    title="Workspaces"
                    icon={<FiBarChart2 />}
                    percentage={workspacesPercentage}
                    usedValue={usageData ? usageData.workspaces : 0}
                    totalValue={planLimits.workspaces}
                    onDismiss={() => handleDismiss('workspaces')}
                  />
                )}
                
                {/* Show upgrade plan only if not already premium or team */}
                {subscription.plan !== 'TEAM' && (
                  <div className="mt-4">
                    <button 
                      className="w-full py-2 px-4 bg-primary hover:bg-primary/90 rounded-md flex items-center justify-center gap-2"
                      onClick={() => router.push('/dashboard/subscription')}
                    >
                      <FiArrowUp size={16} />
                      <span>{subscription.plan === 'PREMIUM' ? 'Upgrade to Team' : 'Upgrade to Premium'}</span>
                    </button>
                    <p className="text-xs text-center mt-2 text-white/60">
                      {subscription.plan === 'PREMIUM' 
                        ? 'Get even more AI requests and advanced features' 
                        : 'Remove all limits and unlock advanced features'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AILimitsContext.Provider>
  );
}

// Interface for UsageLimitWarning component props
interface UsageLimitWarningProps {
  title: string;
  icon: React.ReactNode;
  percentage: number;
  usedValue: string | number;
  totalValue: string | number;
  onDismiss: () => void;
}

// Component to display a single limit warning
const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({ 
  title, 
  icon, 
  percentage, 
  usedValue, 
  totalValue, 
  onDismiss 
}) => {
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
};

export default UsageLimitsNotifier;