// src/components/ai/AIAssistant.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiMicOff, FiX, FiSend, FiMaximize2, FiMinimize2, FiPlay, FiCpu, FiLoader } from 'react-icons/fi'
import { useAIStore } from '@/lib/store/aiStore'
import { useWorkspaceStore, PanelType } from '@/lib/store/workspaceStore'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { parseUserCommand, executeCommand, answerQuestion } from '@/lib/services/openaiService'

export default function AIAssistant() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { data: session } = useSession()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isListening, setListening, toggleAssistant } = useAIStore()
  const { addPanel, panels, removePanel } = useWorkspaceStore()
  
  // Colori moderni 2025 (stessi della dashboard)
  const colors = {
    primary: "#A47864", // Mocha Mousse (Pantone 2025)
    secondary: "#A78BFA", // Digital Lavender
    accent: "#4CAF50", // Verdant Green
    navy: "#101585", // Navy Blue
    rose: "#D58D8D", // Muted Rose
    background: "#0F0F1A", // Dark background
    surface: "#1A1A2E", // Slightly lighter surface
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  }

  // Simula l'attivazione del riconoscimento vocale
  const toggleListening = () => {
    if (isListening) {
      setListening(false)
      toast.info('Riconoscimento vocale disattivato')
    } else {
      setListening(true)
      toast.success('In ascolto...')
      // Simuliamo il riconoscimento dopo 2 secondi
      setTimeout(() => {
        handleUserMessage('Cosa puoi fare per me?')
        setListening(false)
      }, 2000)
    }
  }

  // Aggiunge un messaggio dell'utente e genera una risposta dell'assistente
  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    
    // Aggiunge il messaggio dell'utente
    setMessages(prev => [...prev, { role: 'user', content: text }])
    
    try {
      // 1. Analizza il comando dell'utente
      const parsedCommand = await parseUserCommand(text)
      
      // 2. Esegui il comando (se valido) o rispondi alla domanda
      let response: string
      
      // Verifica se l'utente è autenticato per operazioni che richiedono userId
      if (session?.user?.id) {
        try {
          response = await executeCommand(parsedCommand, session.user.id)
          // 3. Esegui azioni reali nel sistema in base al tipo di comando
          await executeSystemAction(parsedCommand)
        } catch (commandError: any) {
          console.error('Errore nell\'esecuzione del comando:', commandError)
          // Se il comando fallisce, ripiega su una risposta generica
          response = `Mi dispiace, non sono riuscito a eseguire il comando. ${commandError.message || 'Si è verificato un errore'}. Posso aiutarti in altro modo?`
        }
      } else {
        // Se l'utente non è autenticato, non può eseguire comandi sul sistema
        response = await answerQuestion(text)
      }
      
      // Aggiunge la risposta dell'assistente
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error: any) {
      console.error('Errore nell\'elaborazione del comando:', error)
      // In caso di errore, mostra un messaggio di errore più user-friendly
      let errorMessage = 'Si è verificato un errore durante l\'elaborazione della richiesta.';
      
      // Se è un errore di rete, specifica meglio
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Si è verificato un errore di connessione. Verifica la tua connessione internet.';
      } else if (error.message) {
        errorMessage = `Errore: ${error.message}`;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Mi dispiace, ${errorMessage} Posso aiutarti in altro modo?`
      }])
    } finally {
      setIsProcessing(false)
    }
    
    // Resetta l'input
    setInput('')
  }

  // Esegue le azioni di sistema reali in base al comando analizzato
  const executeSystemAction = async (parsedCommand: any) => {
    switch (parsedCommand.type) {
      case 'OPEN_APP':
        // Apre l'applicazione specificata
        const appType = parsedCommand.params.appType as PanelType
        
        // Posizioni di default per diverse app
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
          }
        }
        
        // Crea titoli appropriati per le app
        const appTitles: Record<string, string> = {
          browser: 'Browser Web',
          editor: 'Editor',
          fileManager: 'File Manager',
          terminal: 'Terminale',
          notes: 'Note',
          dashboard: 'Dashboard'
        }
        
        // Contenuto predefinito per le app
        const appContents: Partial<Record<string, any>> = {
          browser: { url: 'https://www.google.com' },
          editor: { language: 'javascript', value: '// Inizia a scrivere il tuo codice qui\n\n' },
          notes: { text: '' }
        }
        
        // Aggiungi il pannello allo workspace
        try {
          addPanel({
            type: appType,
            title: appTitles[appType] || `Nuova ${appType}`,
            position: appDefaults[appType]?.position || { x: 100, y: 100 },
            size: appDefaults[appType]?.size || { width: 800, height: 500 },
            content: appContents[appType] || {}
          });
          
          toast.success(`Applicazione ${appTitles[appType]} aperta con successo`);
        } catch (error) {
          console.error("Errore nell'apertura dell'applicazione:", error);
          toast.error(`Impossibile aprire ${appTitles[appType]}`);
        }
        break;
        
      case 'CLOSE_APP':
        // Chiude l'applicazione specificata (per ID o tipo)
        const { appId, appType: closeAppType } = parsedCommand.params
        
        if (appId) {
          // Cerca il pannello con l'ID specificato
          const panelToClose = panels.find(p => p.id === appId)
          if (panelToClose) {
            removePanel(panelToClose.id)
          }
        } else if (closeAppType) {
          // Cerca i pannelli del tipo specificato
          const panelsToClose = panels.filter(p => p.type === closeAppType)
          // Chiudi l'ultimo pannello di quel tipo (se ce ne sono)
          if (panelsToClose.length > 0) {
            removePanel(panelsToClose[panelsToClose.length - 1].id)
          }
        }
        break;
        
      // Aggiungi altri casi per gestire diverse azioni di sistema
      default:
        // Nessuna azione di sistema da eseguire
        break;
    }
  }

  // Gestisce l'invio del messaggio tramite Enter (con shift+enter per nuova linea)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Gestisce l'invio del messaggio tramite pulsante
  const handleSubmit = () => {
    handleUserMessage(input)
  }

  // Auto-resize dell'area di testo
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  // Auto-scroll ai messaggi più recenti
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus sull'input quando l'assistente si apre
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // All'apertura dell'assistente, mostra un messaggio di benvenuto
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Ciao${session?.user?.name ? ` ${session.user.name.split(' ')[0]}` : ''}! Sono Jarvis, il tuo assistente AI. Posso aiutarti a gestire file, aprire applicazioni, rispondere a domande e molto altro. Come posso aiutarti oggi?`
      }])
    }
  }, [messages, session])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div 
        className="p-3 flex items-center justify-between border-b"
        style={{ 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          background: `rgba(15, 15, 26, 0.5)`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary}20` }}
            animate={isListening ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`,
                `0 0 10px rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.5)`,
                `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
          >
            <FiCpu className="text-lg" style={{ color: colors.primary }} />
          </motion.div>
          <div>
            <div className="font-semibold" style={{ color: colors.text }}>Jarvis</div>
            {isListening && (
              <div className="text-xs" style={{ color: colors.primary }}>In ascolto...</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <motion.button
            onClick={toggleListening}
            className="p-2 rounded-full hover:bg-white/10"
            title={isListening ? "Disattiva microfono" : "Attiva microfono"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isListening ? <FiMicOff className="text-red-500" /> : <FiMic style={{ color: colors.textMuted }} />}
          </motion.button>
          
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-white/10"
            title={isExpanded ? "Riduci" : "Espandi"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isExpanded ? <FiMinimize2 style={{ color: colors.textMuted }} /> : <FiMaximize2 style={{ color: colors.textMuted }} />}
          </motion.button>
          
          <motion.button
            onClick={() => toggleAssistant(false)}
            className="p-2 rounded-full hover:bg-white/10"
            title="Chiudi assistente"
            whileHover={{ scale: 1.1, color: colors.rose }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX style={{ color: colors.textMuted }} />
          </motion.button>
        </div>
      </motion.div>
      
      {/* Area messaggi */}
      <motion.div 
        className={`flex-1 overflow-y-auto p-4 ${isExpanded ? 'h-[calc(100vh-180px)]' : ''}`}
        style={{ background: `rgba(15, 15, 26, 0.3)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <motion.div 
              className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}20` }}
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`,
                  `0 0 20px rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0.3)`,
                  `0 0 0 rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, 0)`
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FiCpu className="text-2xl" style={{ color: colors.primary }} />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>Come posso aiutarti oggi?</h3>
            <p style={{ color: colors.textMuted }}>
              Puoi chiedermi di eseguire azioni nel sistema, cercare informazioni, aprire applicazioni o creare contenuti.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'ml-auto bg-primary/20' : 'bg-white/10'}`}
                style={{ 
                  backgroundColor: msg.role === 'user' ? `${colors.primary}20` : 'rgba(255, 255, 255, 0.1)',
                  borderLeft: msg.role === 'assistant' ? `2px solid ${colors.primary}` : 'none'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.content}
              </motion.div>
            ))}
            
            {/* Indicatore di digitazione */}
            {isProcessing && (
              <motion.div 
                className="p-3 rounded-lg bg-white/10 max-w-[85%]"
                style={{ borderLeft: `2px solid ${colors.primary}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span style={{ color: colors.textMuted }}>Jarvis sta pensando</span>
                  <span className="flex gap-1">
                    <motion.span 
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span 
                        className="w-1 h-1 rounded-full bg-primary"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </span>
                  </motion.div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </motion.div>
        
        {/* Input area */}
        <motion.div 
          className="p-3 border-t"
          style={{ 
            borderColor: 'rgba(255, 255, 255, 0.1)',
            background: `rgba(15, 15, 26, 0.5)`
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative">
            <textarea
              ref={inputRef}
              className="w-full p-3 pr-12 rounded-lg bg-black/20 border border-white/10 focus:outline-none focus:border-primary resize-none text-white"
              placeholder="Scrivi un messaggio..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isProcessing}
            />
            
            <motion.button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full"
              style={{ 
                background: input.trim() ? `${colors.primary}20` : 'transparent',
                color: input.trim() ? colors.primary : colors.textMuted,
                opacity: isProcessing ? 0.5 : 1
              }}
              onClick={handleSubmit}
              disabled={isProcessing || !input.trim()}
              whileHover={{ scale: input.trim() ? 1.1 : 1 }}
              whileTap={{ scale: input.trim() ? 0.9 : 1 }}
            >
              {isProcessing ? <FiLoader className="animate-spin" /> : <FiSend />}
            </motion.button>
          </div>
          
          <div className="mt-1 text-xs text-center" style={{ color: colors.textMuted }}>
            Premi Enter per inviare, Shift+Enter per andare a capo
          </div>
        </motion.div>
      </div>
    );
  }
  
