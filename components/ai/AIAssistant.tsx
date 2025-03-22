// src/components/ai/AIAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMic, FiMicOff, FiX, FiLoader, FiCode, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useAIStore } from '@/lib/store/aiStore';
import { toast } from 'sonner';
import MultiFileAIAnalysis from './MultiFileAIAnalysis';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { useSubscription } from '@/hooks/useSubscription';

export default function AIAssistant() {
  const { toggleAssistant } = useAIStore();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: 'Ciao! Sono Jarvis, il tuo assistente AI. Come posso aiutarti oggi?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showMultiFileAnalysis, setShowMultiFileAnalysis] = useState(false);
  const { selectedPanelsForAI } = usePanelIntegrationStore();
  const { subscription, hasAccess } = useSubscription();
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  
  // Colori per mantenere coerenza con il resto dell'app
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    accent: "#4CAF50",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  };
  
  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Inizializza speech recognition
  useEffect(() => {
    // Focus sull'input all'apertura
    inputRef.current?.focus();
    
    // Qui andrebbe l'inizializzazione del riconoscimento vocale
    // che per semplicità non implementiamo completamente
  }, []);
  
  // Gestione invio messaggio
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Controlla se l'utente sta cercando di usare l'analisi multi-file senza il piano premium
    if (input.toLowerCase().includes('analizz') && input.toLowerCase().includes('file') && !subscription.isPremium) {
      setShowPremiumBanner(true);
      return;
    }
    
    // Aggiungi il messaggio dell'utente
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);
    
    // Avvia l'animazione di typing
    setTimeout(() => {
      // Simulazione risposta AI (in un'app reale, qui ci sarebbe una chiamata API)
      const assistantResponses: Record<string, string> = {
        'ciao': 'Ciao! Come posso aiutarti oggi?',
        'chi sei': 'Sono Jarvis, un assistente AI integrato nella piattaforma Jarvis Web OS. Posso aiutarti con la programmazione, rispondere a domande e molto altro.',
        'aiuto': 'Posso aiutarti in molti modi! Posso generare codice, aiutarti con il debugging, fornire informazioni, organizzare i tuoi file e molto altro. Prova a chiedermi qualcosa di specifico.',
        'default': 'Ho ricevuto il tuo messaggio. Posso aiutarti con qualcos\'altro?'
      };
      
      // Trova la risposta più appropriata
      let response = '';
      for (const [key, value] of Object.entries(assistantResponses)) {
        if (userMessage.toLowerCase().includes(key)) {
          response = value;
          break;
        }
      }
      
      if (!response) {
        response = assistantResponses.default;
      }
      
      // Se il messaggio include riferimenti a file o analisi, suggerisci di usare l'analisi multi-file
      if (userMessage.toLowerCase().includes('file') || 
          userMessage.toLowerCase().includes('analizz') || 
          userMessage.toLowerCase().includes('codice')) {
        response += '\n\nSe vuoi analizzare il tuo codice, posso esaminare più file contemporaneamente. Prova l\'analisi multi-file cliccando sul pulsante qui sotto.';
      }
      
      // Aggiungi la risposta dell'assistente
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Toggle del riconoscimento vocale
  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording logic
      setIsRecording(false);
      toast.info('Registrazione vocale terminata');
    } else {
      // Check microphone permission and start recording
      if (!hasAccess('voiceCommands')) {
        setShowPremiumBanner(true);
        return;
      }
      
      setIsRecording(true);
      toast.info('Registrazione vocale avviata. Parla ora...');
      
      // Simulazione riconoscimento vocale (dopo 3 secondi)
      setTimeout(() => {
        setIsRecording(false);
        setInput('Mostrami lo stato del progetto');
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
  
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.surface }}>
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
            <p className="text-xs" style={{ color: colors.textMuted }}>Assistente personale</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            onClick={() => setShowMultiFileAnalysis(!showMultiFileAnalysis)}
            title="Analisi multi-file"
          >
            <FiCode size={18} className={showMultiFileAnalysis ? 'text-primary' : 'text-white/70'} />
          </button>
          
          <button 
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/70"
            onClick={() => toggleAssistant(false)}
            title="Chiudi assistente"
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
                    <h4 className="font-medium mb-1">Sblocca Analisi Multi-file e AI Avanzata</h4>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      L'analisi di più file contemporanei e i comandi vocali avanzati sono disponibili esclusivamente per gli abbonati Premium.
                    </p>
                    <div className="mt-3 flex items-center space-x-3">
                      <button
                        className="px-3 py-1.5 rounded text-sm bg-primary hover:bg-primary/90"
                        onClick={() => {
                          window.location.href = '/dashboard/subscription';
                        }}
                      >
                        Passa a Premium
                      </button>
                      <button
                        className="px-3 py-1.5 rounded text-sm bg-white/10 hover:bg-white/20"
                        onClick={() => setShowPremiumBanner(false)}
                      >
                        Non ora
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
          
          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <textarea
                ref={inputRef}
                className="w-full p-3 pr-24 bg-white/5 rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Scrivi un messaggio..."
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                style={{ maxHeight: '150px', overflowY: 'auto' }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                <button
                  className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
                  onClick={handleVoiceToggle}
                >
                  {isRecording ? <FiMicOff /> : <FiMic />}
                </button>
                
                <button
                  className={`p-2 rounded-full ${input.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                >
                  <FiSend />
                </button>
              </div>
            </div>
            
            {/* Suggestion chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {['Genera un componente React', 'Analizza il mio codice', 'Come posso migliorare le performance?'].map((suggestion, i) => (
                <button
                  key={i}
                  className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-colors truncate max-w-[180px]"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}