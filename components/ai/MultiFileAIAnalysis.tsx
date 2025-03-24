// components/ai/MultiFileAIAnalysis.tsx
// Updates to make it compatible with useSubscription

import React, { useState, useEffect } from 'react';
import { FiCode, FiSearch, FiFile, FiCheckSquare, FiLoader, FiPlus, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/store/workspaceStore';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function MultiFileAIAnalysis() {
  const router = useRouter();
  const { panels } = useWorkspaceStore();
  const { selectedPanelsForAI, addPanelToAISelection, removePanelFromAISelection, clearAISelection } = usePanelIntegrationStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [limitStats, setLimitStats] = useState({ current: 0, limit: 0 });
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  
  // We use useSubscription to verify if the user has access
  const { subscription, hasAccess } = useSubscription();
  
  // Check if the user has access to advanced features (using hasAccess)
  // or check directly the plan and subscription status
  const hasAnalysisAccess = hasAccess('advancedAI') || 
                          (subscription.isPremium || subscription.isTeam);
  
  // List of open editor panels
  const editorPanels = panels.filter(p => p.type === 'editor' && !p.isMinimized);
  
  // Check if there are selected files
  const hasFilesSelected = selectedPanelsForAI.length > 0;
  
  // Check if it's necessary to show the premium banner at startup
  useEffect(() => {
    if (!hasAnalysisAccess) {
      setShowPremiumBanner(true);
    }
  }, [hasAnalysisAccess]);
  
  // Get information about selected files
  const getSelectedFilesInfo = () => {
    return selectedPanelsForAI
      .map(panelId => {
        const panel = panels.find(p => p.id === panelId);
        if (panel && panel.content) {
          return {
            fileName: panel.content.fileName || 'Untitled',
            language: panel.content.language || 'text',
            content: panel.content.value || '',
            id: panel.id
          };
        }
        return null;
      })
      .filter((file): file is { fileName: string; language: string; content: string; id: string } => 
        file !== null); // Use type guard to remove nulls
  };
  
  // Check if a panel is selected
  const isPanelSelected = (panelId: string) => {
    return selectedPanelsForAI.includes(panelId);
  };
  
  // Handle file selection toggle
  const handleFileToggle = (panelId: string) => {
    if (isPanelSelected(panelId)) {
      removePanelFromAISelection(panelId);
    } else {
      addPanelToAISelection(panelId);
    }
  };
  
  // Start analysis
  const handleStartAnalysis = async () => {
    // Check if the user has access to advanced features
    if (!hasAnalysisAccess) {
      toast.error('Feature available only for Premium and Team subscribers');
      setShowPremiumBanner(true);
      return;
    }
    
    if (!hasFilesSelected) {
      toast.error('Select at least one file to analyze');
      return;
    }
    
    if (!analysisPrompt.trim()) {
      toast.error('Enter a description of what you want to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsLimitExceeded(false);
    
    try {
      const selectedFiles = getSelectedFilesInfo();
      
      // Prepare data for OpenAI request
      const fileContents = selectedFiles.map(file => {
        return `File: ${file.fileName} (${file.language})\n\n${file.content}`;
      }).join('\n\n---\n\n');
      
      // Prepare prompt for OpenAI
      const prompt = `
# Multi-file Analysis

Here are the files to analyze:

${fileContents}

---

## User Request:
${analysisPrompt}

Analyze these files according to the user's request. Provide:
1. An overview of the main issues or insights
2. Specific recommendations for improvements
3. Code quality metrics where applicable
4. Suggestions on how to implement your recommendations
`;

      // Get user ID
      const userId = sessionStorage.getItem('userId') || 'guest-user';
      
      // Call API for analysis
      const response = await window.fetch('/api/ai/analyze-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          userId: userId
        }),
      });
      
      // Handle response
      const data = await response.json();
      
      // Check if there's a limit exceeded error
      if (response.status === 429 && data.isLimitExceeded) {
        setIsLimitExceeded(true);
        setLimitStats({
          current: data.currentCount || 0,
          limit: data.limit || 0
        });
        setAnalysisResult(
          `## AI Request Limit Reached\n\n` +
          `You have reached the limit of ${data.limit || 50} daily AI requests for your plan.\n\n` +
          `To continue using multi-file analysis, consider upgrading to a higher plan ` +
          `that offers more daily requests.`
        );
        
        toast.error('AI request limit reached');
        return;
      }
      
      // Check if there's an access error
      if (response.status === 403 && data.isPremiumFeature) {
        setShowPremiumBanner(true);
        toast.error('Feature available only for Premium and Team subscribers');
        return;
      }
      
      // If the response is not OK and it's not a limit or access error
      if (!response.ok) {
        throw new Error(data.error || `Error in request: ${response.status}`);
      }
      
      // Set analysis result
      setAnalysisResult(data.result);
      
      // Update usage statistics
      if (data.requestStats) {
        setLimitStats({
          current: data.requestStats.currentCount || 0,
          limit: data.requestStats.limit || 0
        });
      }
      
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error('An error occurred during the analysis');
      setAnalysisResult('An error occurred during the analysis. Try later.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Render usage statistics
  const renderUsageStats = () => {
    if (limitStats.limit === 0) return null;
    
    const percentage = Math.min(100, (limitStats.current / limitStats.limit) * 100);
    const isAlmostFull = percentage > 80;
    
    return (
      <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm">
        <div className="flex justify-between mb-1">
          <span>AI Requests Usage</span>
          <span className={isAlmostFull ? 'text-rose-400' : ''}>
            {limitStats.current} / {limitStats.limit}
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full">
          <div 
            className={`h-full rounded-full ${isAlmostFull ? 'bg-rose-500' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  // Colors for interface consistency
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    accent: "#4CAF50",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <FiCode className="mr-2" />
          Multi-file Analysis
        </h3>
        
        {/* Premium Banner */}
        {showPremiumBanner && !hasAnalysisAccess && (
          <div className="p-4 mb-4 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-lg">
            <h3 className="font-medium mb-2">Premium Feature</h3>
            <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
              Multi-file analysis is an advanced feature available exclusively 
              for Premium and Team subscribers.
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded text-sm"
                style={{ backgroundColor: colors.primary }}
                onClick={() => {
                  router.push('/dashboard/subscription');
                }}
              >
                Upgrade to Premium
              </button>
              <button
                className="px-3 py-1.5 rounded text-sm bg-white/10"
                onClick={() => setShowPremiumBanner(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Available file list */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
            <span>Files open in editor</span>
            {hasFilesSelected && (
              <button 
                className="text-xs bg-white/10 hover:bg-white/20 p-1 rounded"
                onClick={clearAISelection}
              >
                Deselect all
              </button>
            )}
          </h4>
          
          {editorPanels.length === 0 ? (
            <div className="text-sm p-3 border border-white/10 rounded">
              No files open. Open a file in the editor to analyze it.
            </div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto p-1">
              {editorPanels.map(panel => (
                <motion.div 
                  key={panel.id}
                  className={`flex items-center p-2 rounded cursor-pointer ${
                    isPanelSelected(panel.id) 
                      ? 'bg-primary/20 border border-primary/50' 
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleFileToggle(panel.id)}
                >
                  <div className="flex-1 flex items-center">
                    <FiFile className="mr-2" />
                    <span className="truncate">
                      {panel.content?.fileName || 'Untitled'}
                    </span>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center">
                    {isPanelSelected(panel.id) ? (
                      <FiCheckSquare className="text-primary" />
                    ) : (
                      <div className="w-4 h-4 border border-white/30 rounded"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Input for analysis prompt */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            What do you want to analyze?
          </label>
          <textarea
            className="w-full p-2 bg-white/5 border border-white/10 rounded outline-none focus:border-primary resize-none"
            rows={3}
            placeholder="E.g.: Find potential bugs, analyze design patterns, suggest improvements..."
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            disabled={isAnalyzing || !hasAnalysisAccess}
          />
        </div>
        
        {/* Analysis button */}
        <button
          className={`w-full py-2 rounded flex items-center justify-center ${
            hasAnalysisAccess && hasFilesSelected && analysisPrompt.trim() && !isAnalyzing
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-white/10 cursor-not-allowed'
          }`}
          onClick={handleStartAnalysis}
          disabled={!hasAnalysisAccess || !hasFilesSelected || !analysisPrompt.trim() || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <FiLoader className="animate-spin mr-2" />
              Analysis in progress...
            </>
          ) : (
            <>
              <FiSearch className="mr-2" />
              Analyze {selectedPanelsForAI.length} files
            </>
          )}
        </button>
        
        {/* Usage statistics */}
        {renderUsageStats()}
      </div>
      
      {/* Analysis result */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div 
            className="flex-1 p-4 overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Analysis Result</h4>
              <button 
                className="text-white/50 hover:text-white"
                onClick={() => setAnalysisResult(null)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-3 rounded bg-white/5 border border-white/10 whitespace-pre-wrap markdown">
              {analysisResult}
            </div>
            
            {/* Limit exceeded banner */}
            {isLimitExceeded && (
              <div className="mt-4 p-4 bg-gradient-to-r from-rose/20 to-secondary/20 border border-rose/30 rounded-lg">
                <h3 className="font-medium mb-2">AI Request Limit Reached</h3>
                <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                  You have reached the limit of {limitStats.limit} daily AI requests for your plan.
                  To get more requests, consider upgrading to a higher plan.
                </p>
                <button
                  className="px-3 py-1.5 rounded text-sm"
                  style={{ backgroundColor: colors.primary }}
                  onClick={() => {
                    router.push('/dashboard/subscription');
                  }}
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}