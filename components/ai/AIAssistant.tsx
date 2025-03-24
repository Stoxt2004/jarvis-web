// src/components/ai/AIAssistant.tsx
// Aggiornato per usare aiClientService invece di openaiService direttamente

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMic, FiMicOff, FiX, FiLoader, FiCode, FiAlertCircle, FiArrowUp } from 'react-icons/fi';
import { useAIStore } from '@/lib/store/aiStore';
import { toast } from 'sonner';
import MultiFileAIAnalysis from './MultiFileAIAnalysis';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useSession } from 'next-auth/react';
import { parseUserCommand, executeCommand, ParsedCommand, CommandType } from '@/lib/services/aiClientService';
import { AIIntegrationService } from '@/lib/services/aiIntegrationService';
import { useRouter } from 'next/navigation';
import { useAILimits } from '@/components/premium/UsageLimitsNotifier';
import { getPlanLimits } from '@/lib/stripe/config';
import { aiEvents, AI_EVENTS } from '@/lib/events/aiEvents';
import { PanelType, useWorkspaceStore } from '@/lib/store/workspaceStore';

// Interface for LimitExceededOverlay component props
interface LimitExceededOverlayProps {
  onUpgrade: () => void;
  planLimit: number;
}

// Overlay component for when the limit is reached
const LimitExceededOverlay: React.FC<LimitExceededOverlayProps> = ({ onUpgrade, planLimit }) => (
  <div className="absolute inset-0 z-50 bg-surface-dark/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
      <FiAlertCircle size={32} className="text-red-500" />
    </div>
    <h3 className="text-xl font-semibold mb-2">Daily limit reached</h3>
    <p className="text-white/70 mb-6 max-w-md">
      You have used all {planLimit} AI requests available for today with your current plan.
      Try again tomorrow or upgrade to Premium to get more daily requests.
    </p>
    <div className="space-y-3">
      <button
        className="w-full py-2.5 px-6 bg-primary hover:bg-primary/90 rounded-lg font-medium"
        onClick={onUpgrade}
      >
        Upgrade to {planLimit >= 500 ? 'Team' : 'Premium'}
      </button>
      <div className="text-sm text-white/50">
        The limit resets automatically at midnight
      </div>
    </div>
  </div>
);

// Function to check if the limit has been reached in sessionStorage
// This function is also called by window events to synchronize instances
const isLimitExceeded = (): boolean => {
  return sessionStorage.getItem('ai_limit_exceeded') === 'true';
};

const AIAssistant: React.FC = () => {
  const router = useRouter();
  const { toggleAssistant } = useAIStore();
  const [input, setInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m Jarvis, your AI assistant. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showMultiFileAnalysis, setShowMultiFileAnalysis] = useState<boolean>(false);
  const { selectedPanelsForAI } = usePanelIntegrationStore();
  const { subscription, hasAccess } = useSubscription();
  const [showPremiumBanner, setShowPremiumBanner] = useState<boolean>(false);
  const { data: session } = useSession();
  
  // Verify the limit directly via context
  const { isAILimitExceeded: contextLimitExceeded, aiUsageStats } = useAILimits();
  
  // Local management of reached limit
  const [localAILimitExceeded, setLocalAILimitExceeded] = useState<boolean>(isLimitExceeded());
  
  // Local counter of AI requests made since the last page load
  const [localAIRequestCount, setLocalAIRequestCount] = useState<number>(0);
  
  // Get the current plan limits
  const planLimits = getPlanLimits(subscription.plan);

  // SYNC: Event handler for state synchronization
  useEffect(() => {
    // Create a custom event to synchronize all instances of AIAssistant
    const syncLimitStatus = () => {
      const currentLimitStatus = isLimitExceeded();
      setLocalAILimitExceeded(currentLimitStatus);
    };

    // Register for limit reached events
    const handleLimitReached = () => {
      setLocalAILimitExceeded(true);
    };

    // Add event listeners for custom and standard events
    aiEvents.on(AI_EVENTS.LIMIT_REACHED, handleLimitReached);
    window.addEventListener('storage', syncLimitStatus); // For tab synchronization
    window.addEventListener('ai_limit_status_change', syncLimitStatus);

    // Create an interval to periodically check the status
    const checkInterval = setInterval(syncLimitStatus, 2000);

    // Cleanup
    return () => {
      aiEvents.off(AI_EVENTS.LIMIT_REACHED, handleLimitReached);
      window.removeEventListener('storage', syncLimitStatus);
      window.removeEventListener('ai_limit_status_change', syncLimitStatus);
      clearInterval(checkInterval);
    };
  }, []);

  // SYNC: Update local state when contextLimitExceeded changes
  useEffect(() => {
    if (contextLimitExceeded) {
      setLocalAILimitExceeded(true);
      sessionStorage.setItem('ai_limit_exceeded', 'true');
    }
  }, [contextLimitExceeded]);
  
  // Function to check if we have reached the limit
  const checkAndUpdateLimits = (): boolean => {
    // First check if the limit has already been reached in sessionStorage
    if (isLimitExceeded()) {
      setLocalAILimitExceeded(true);
      return true;
    }
    
    // Calculate the total considering the requests counted by the API + local ones
    const totalRequests = aiUsageStats.current + localAIRequestCount;
    
    // If the total exceeds the limit, set the limit reached flag
    if (totalRequests >= planLimits.aiRequests) {
      console.log(`AI limit reached in real time: ${totalRequests}/${planLimits.aiRequests}`);
      setLocalAILimitExceeded(true);
      sessionStorage.setItem('ai_limit_exceeded', 'true');
      
      // Emit an event to notify of the state change
      aiEvents.emit(AI_EVENTS.LIMIT_REACHED);
      
      // Create a storage change event to synchronize all instances
      window.dispatchEvent(new Event('ai_limit_status_change'));
      
      // Show a toast to inform the user
      toast.error(
        <div className="flex flex-col">
          <strong>Daily AI request limit reached</strong>
          <span className="text-sm">You have used all your {planLimits.aiRequests} AI requests for today.</span>
        </div>,
        { duration: 6000 }
      );
      
      return true; // Limit reached
    }
    
    return false; // Limit not reached
  };
  
  // Check sessionStorage at startup
  useEffect(() => {
    // Synchronize at the beginning
    setLocalAILimitExceeded(isLimitExceeded());
  }, []);
  
  // Proactive verification of limits at startup and at each change of aiUsageStats
  useEffect(() => {
    // Check if the total count has already exceeded the limit
    const totalRequests = aiUsageStats.current + localAIRequestCount;
    if (totalRequests >= planLimits.aiRequests) {
      setLocalAILimitExceeded(true);
      sessionStorage.setItem('ai_limit_exceeded', 'true');
      
      // Emit a change event
      window.dispatchEvent(new Event('ai_limit_status_change'));
      
      console.log(`AI limit already exceeded: ${totalRequests}/${planLimits.aiRequests}`);
    }
  }, [aiUsageStats, localAIRequestCount, planLimits.aiRequests]);
  
  // Colors to maintain consistency with the rest of the app
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    accent: "#4CAF50",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)",
    rose: "#D58D8D", // For error messages and limits
  };
  
  // Automatic scroll to new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize speech recognition
  useEffect(() => {
    // Focus on input when opening
    inputRef.current?.focus();
  }, []);
  
  // Handle message sending - UPDATED to use aiClientService
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Get the current plan limits
    const planLimits = getPlanLimits(subscription.plan);
    
    // Verify the limit again immediately before proceeding
    if (isLimitExceeded() || localAILimitExceeded) {
      setLocalAILimitExceeded(true);
      toast.error('You have reached the daily limit of AI requests');
      return;
    }
    
    // Real-time verification before proceeding
    if (checkAndUpdateLimits()) {
      toast.error('You have reached the daily limit of AI requests');
      return;
    }
    
    // Check if the user is trying to use multi-file analysis without the premium plan
    if (input.toLowerCase().includes('analyz') && input.toLowerCase().includes('file') && !subscription.isPremium) {
      setShowPremiumBanner(true);
      return;
    }
    
    // Add the user's message
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);
    
    // Increment the local request counter - we'll only count this once for the entire conversation
    setLocalAIRequestCount(prev => prev + 1);
    
    try {
      // Verify once more after incrementing the local counter
      if (checkAndUpdateLimits()) {
        // If we have now exceeded the limit, show an error message
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, you have reached the limit of ${planLimits.aiRequests} AI requests for today. Try again tomorrow or consider upgrading your plan.` 
        }]);
        setIsTyping(false);
        return;
      }
      
      // Now use the new unified chat endpoint with command support
      const userId = session?.user?.id || 'guest-user';
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // If the limit has been reached
        if (response.status === 429 && errorData.isLimitExceeded) {
          setLocalAILimitExceeded(true);
          sessionStorage.setItem('ai_limit_exceeded', 'true');
          
          // Emit the event again in case the limit is reached
          aiEvents.emit(AI_EVENTS.LIMIT_REACHED);
          // Create a storage change event to synchronize all instances
          window.dispatchEvent(new Event('ai_limit_status_change'));
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: errorData.message || "You have reached the daily AI request limit."
          }]);
          setIsTyping(false);
          return;
        }
        
        throw new Error(errorData.error || 'Error in the API response');
      }
      
      const data = await response.json();
      
      // Execute system actions if necessary based on the command type
      if (data.command && data.command.type !== "ANSWER_QUESTION" && data.command.type !== "UNKNOWN") {
        try {
          // Handle specific action types that need UI updates
          switch (data.command.type) {
            case "OPEN_APP":
              // Open a new application panel in the workspace
              const appType = data.command.params.appType;
              if (appType) {
                console.log("Opening app:", appType);
                
                // Integration with workspace store to create a new panel
                const appDefaults: Record<string, { position: { x: number, y: number }, size: { width: number, height: number } }> = {
                  browser: {
                    position: { x: 100, y: 100 },
                    size: { width: 900, height: 600 }
                  },
                  editor: {
                    position: { x: 150, y: 150 },
                    size: { width: 800, height: 500 }
                  },
                  fileManager: {
                    position: { x: 200, y: 100 },
                    size: { width: 700, height: 500 }
                  },
                  terminal: {
                    position: { x: 200, y: 200 },
                    size: { width: 600, height: 400 }
                  },
                  notes: {
                    position: { x: 250, y: 250 },
                    size: { width: 500, height: 400 }
                  },
                  dashboard: {
                    position: { x: 100, y: 100 },
                    size: { width: 800, height: 500 }
                  },
                  calendar: {
                    position: { x: 300, y: 300 },
                    size: { width: 600, height: 400 }
                  }
                };
                
                const appTitles: Record<string, string> = {
                  browser: 'Browser Web',
                  editor: 'Editor',
                  fileManager: 'File Manager',
                  terminal: 'Terminale',
                  notes: 'Note',
                  dashboard: 'Dashboard',
                  calendar: 'Calendario'
                };
                
                const appContents: Record<string, any> = {
                  browser: { url: 'https://www.google.com' },
                  editor: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' },
                  notes: { text: '' }
                };
                
                // Add the panel to the workspace
                useWorkspaceStore.getState().addPanel({
                  type: appType as PanelType,
                  title: appTitles[appType] || `New ${appType}`,
                  position: appDefaults[appType]?.position || { x: 100, y: 100 },
                  size: appDefaults[appType]?.size || { width: 600, height: 400 },
                  content: appContents[appType] || {}
                });
              }
              break;
              
            case "CLOSE_APP":
              // Close an application panel
              const { appId, appType: closeAppType } = data.command.params;
              const { panels, removePanel } = useWorkspaceStore.getState();
              
              if (appId) {
                // Look for the panel with the specified ID
                const panelToClose = panels.find(p => p.id === appId);
                if (panelToClose) {
                  removePanel(panelToClose.id);
                }
              } else if (closeAppType) {
                // Look for panels of the specified type
                const panelsToClose = panels.filter(p => p.type === closeAppType);
                // Close the last panel of that type (if any)
                if (panelsToClose.length > 0) {
                  removePanel(panelsToClose[panelsToClose.length - 1].id);
                }
              }
              break;
              
            // Handle other system commands that require UI updates
            case "CREATE_FILE":
              // If the file was created successfully, we might want to open it
              if (data.command.params.openInEditor && data.command.params.fileName) {
                // This would require additional logic to get the file ID from the server
                // For now, just show a toast
                toast.success(`File ${data.command.params.fileName} created`);
              }
              break;
          }
        } catch (error) {
          console.error("Error executing system command:", error);
          // Continue anyway, the response has already been generated
        }
      }
  
      // Emit the request sent event to update statistics in real time
      aiEvents.emit(AI_EVENTS.REQUEST_SENT);
      
      // Add the assistant's response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error processing AI request:', error);
      // Fallback in case of error
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I\'m sorry, an error occurred while processing your request. Can you try again shortly?' 
      }]);
      toast.error('Error in communication with the AI assistant');
    } finally {
      setIsTyping(false);
    }
  };
  
  // Toggle voice recognition
  const handleVoiceToggle = () => {
    // Do not allow voice recording if the limit has been exceeded
    if (isLimitExceeded() || localAILimitExceeded) {
      setLocalAILimitExceeded(true);
      toast.error('You have reached the daily limit of AI requests');
      return;
    }
    
    // Real-time verification before proceeding
    if (checkAndUpdateLimits()) {
      toast.error('You have reached the daily limit of AI requests');
      return;
    }
    
    if (isRecording) {
      // Stop recording logic
      setIsRecording(false);
      toast.info('Voice recording ended');
    } else {
      // Check microphone permission and start recording
      if (!hasAccess('voiceCommands')) {
        setShowPremiumBanner(true);
        return;
      }
      
      setIsRecording(true);
      toast.info('Voice recording started. Speak now...');
      
      // Real implementation of voice recognition will go here
      // For now we maintain the simulation
      setTimeout(() => {
        setIsRecording(false);
        setInput('Show me the project status');
      }, 3000);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };
  
  // Handle keypresses in the textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Function to navigate to the subscription page
  const goToSubscription = () => {
    router.push('/dashboard/subscription');
  };
  
  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: colors.surface }}>
      {/* Overlay for exceeded limit */}
      {localAILimitExceeded && (
        <LimitExceededOverlay onUpgrade={goToSubscription} planLimit={planLimits.aiRequests} />
      )}
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center">
          <motion.div 
            className="w-8 h-8 rounded-full mr-3"
            style={{ backgroundColor: `${colors.primary}30` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <motion.div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors.primary }}
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', delay: 0.2 }}
              />
            </div>
          </motion.div>
          <div>
            <h3 className="font-medium">Jarvis AI</h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>Personal assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Show AI usage statistics */}
          <div className="text-xs text-white/50 px-2 py-1 bg-white/10 rounded-full">
            {aiUsageStats.current + localAIRequestCount}/{aiUsageStats.limit} requests
          </div>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            onClick={() => setShowMultiFileAnalysis(!showMultiFileAnalysis)}
            title="Multi-file analysis"
          >
            <FiCode size={18} className={showMultiFileAnalysis ? 'text-primary' : 'text-white/70'} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/70"
            onClick={() => toggleAssistant(false)}
            title="Close assistant"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>
      
      {showMultiFileAnalysis ? (
        <MultiFileAIAnalysis />
      ) : (
        <>
          {/* Messages Container */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary/20 text-white' 
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-white/10 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '400ms' }}></span>
                </div>
              </div>
            )}
            
            <div ref={endOfMessagesRef} />
          </div>
          
          {/* Premium Banner */}
          <AnimatePresence>
            {showPremiumBanner && (
              <motion.div
                className="p-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-t border-primary/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Unlock Multi-file Analysis and Advanced AI</h4>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      Analysis of multiple files simultaneously and advanced voice commands are exclusively available for Premium subscribers.
                    </p>
                    <div className="mt-3 flex items-center space-x-3">
                      <button
                        className="px-3 py-1.5 rounded text-sm bg-primary hover:bg-primary/90"
                        onClick={goToSubscription}
                      >
                        Upgrade to Premium
                      </button>
                      <button
                        className="px-3 py-1.5 rounded text-sm bg-white/10 hover:bg-white/20"
                        onClick={() => setShowPremiumBanner(false)}
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                  <button 
                    className="text-white/50 hover:text-white"
                    onClick={() => setShowPremiumBanner(false)}
                  >
                    <FiX />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Input Area - Disabled when the limit has been exceeded */}
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <textarea
                ref={inputRef}
                className={`w-full p-3 pr-24 bg-white/5 rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none ${localAILimitExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={localAILimitExceeded ? "AI request limit reached" : "Write a message..."}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                style={{ maxHeight: '150px', overflowY: 'auto' }}
                disabled={localAILimitExceeded}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                <button
                  className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'} ${localAILimitExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleVoiceToggle}
                  disabled={localAILimitExceeded}
                >
                  {isRecording ? <FiMicOff /> : <FiMic />}
                </button>
                
                <button
                  className={`p-2 rounded-full ${input.trim() && !localAILimitExceeded ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                  onClick={handleSendMessage}
                  disabled={!input.trim() || localAILimitExceeded}
                >
                  <FiSend />
                </button>
              </div>
            </div>
            
            {/* Suggestion chips - hidden when the limit has been exceeded */}
            {!localAILimitExceeded && (
              <div className="mt-3 flex flex-wrap gap-2">
                {['Generate a React component', 'Analyze my code', 'How can I improve performance?'].map((suggestion, i) => (
                  <button
                    key={i}
                    className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-colors truncate max-w-[180px]"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;