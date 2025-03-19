// src/components/ai/AIAssistant.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMic, FiMicOff, FiX, FiSend, FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import { useAIStore } from '@/lib/store/aiStore'
import { toast } from 'sonner'

interface AIAssistantProps {
  onClose: () => void
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { isListening, setListening } = useAIStore()
  
  // Simula l'attivazione del riconoscimento vocale (in produzione usare la Web Speech API)
  const toggleListening = () => {
    if (isListening) {
      setListening(false)
      toast.info('Riconoscimento vocale disattivato')
    } else {
      setListening(true)
      toast.success('In ascolto...')
      
      // Simula un riconoscimento vocale dopo 2 secondi
      setTimeout(() => {
        handleUserMessage('Mostrami i file recenti')
        setListening(false)
      }, 2000)
    }
  }
  
  // Aggiunge un messaggio dell'utente e simula una risposta dell'assistente
  const handleUserMessage = (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    
    // Aggiunge il messaggio dell'utente
    setMessages(prev => [...prev, { role: 'user', content: text }])
    
    // Simula una risposta dell'assistente dopo un breve ritardo
    setTimeout(() => {
      let response = "Non ho capito. Puoi ripetere?"
      
      // Semplice logica di risposta basata su parole chiave
      const lowerText = text.toLowerCase()
      
      if (lowerText.includes('ciao') || lowerText.includes('salve') || lowerText.includes('hey')) {
        response = "Ciao! Come posso aiutarti oggi?"
      } else if (lowerText.includes('file') || lowerText.includes('documenti') || lowerText.includes('recenti')) {
        response = "Ho trovato 3 file recenti:\n- Progetto.js (modificato 2 ore fa)\n- Note meeting.txt (modificato ieri)\n- Design.fig (modificato la settimana scorsa)"
      } else if (lowerText.includes('editor') || lowerText.includes('apri editor')) {
        response = "Sto aprendo l'editor di codice per te."
        // In un'implementazione reale, qui si potrebbe attivare l'apertura di un pannello di editor
      } else if (lowerText.includes('ora') || lowerText.includes('data') || lowerText.includes('giorno')) {
        const now = new Date()
        response = `Sono le ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} del ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}.`
      } else if (lowerText.includes('meteo') || lowerText.includes('tempo')) {
        response = "Mi dispiace, non ho accesso ai dati meteo in tempo reale in questa versione dimostrativa."
      } else if (lowerText.includes('grazie')) {
        response = "Prego! Sono qui per aiutarti."
      } else if (lowerText.includes('browser') || lowerText.includes('naviga')) {
        response = "Sto aprendo il browser per te. Hai un URL specifico che vorresti visitare?"
      }
      
      // Aggiunge la risposta dell'assistente
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsProcessing(false)
    }, 1000)
    
    // Resetta l'input
    setInput('')
  }
  
  // Gestisce l'invio del messaggio tramite Enter (con shift+enter per nuova linea)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  // Gestisce l'invio del messaggio tramite pulsante
  const handleSubmit = () => {
    handleUserMessage(input)
  }
  
  // Auto-dimensionamento dell'area di testo
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
  
  return (
    <motion.div 
      className={`glass-panel max-w-2xl mx-auto flex flex-col ${isExpanded ? 'w-full h-full' : 'w-2/3 h-3/4'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-dark">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold">J</span>
            </div>
            {isListening && (
              <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-[#0ea5e9] animate-pulse"></div>
            )}
          </div>
          <h2 className="text-lg font-semibold text-white">Jarvis</h2>
          {isListening && <span className="text-xs text-blue-500 animate-pulse">In ascolto...</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleListening}
            className={`p-2 rounded-full ${isListening ? 'bg-blue-500 text-white' : 'hover:bg-white/10'}`}
          >
            {isListening ? <FiMicOff size={16} /> : <FiMic size={16} />}
          </button>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-white/10"
          >
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Area messaggi */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/60">
            <div className="w-16 h-16 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-40 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-500">J</span>
              </div>
            </div>
            <p className="text-center mb-2">Come posso aiutarti oggi?</p>
            <p className="text-xs text-center max-w-md">
              Puoi chiedermi di eseguire azioni nel sistema, cercare informazioni, aprire applicazioni o creare contenuti.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-surface-light text-white/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Indicatore di digitazione */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-surface-light text-white/90 rounded-tl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-surface-dark">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              className="w-full rounded-lg bg-surface py-3 px-4 outline-none resize-none max-h-32 text-white"
              placeholder="Invia un messaggio a Jarvis..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          
          <button 
            className={`p-3 rounded-full ${
              input.trim() 
                ? 'bg-blue-500 hover:bg-blue-500-dark text-white' 
                : 'bg-surface-light text-white/50'
            }`}
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            <FiSend size={18} />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-white/40 text-center">
          <span>Premi <kbd className="px-1 py-0.5 rounded bg-surface-light">Enter</kbd> per inviare, <kbd className="px-1 py-0.5 rounded bg-surface-light">Shift+Enter</kbd> per andare a capo</span>
        </div>
      </div>
    </motion.div>
  );
}