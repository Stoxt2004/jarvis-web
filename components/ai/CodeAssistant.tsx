// src/components/ai/CodeAssistant.tsx
import { useState, useRef, useEffect } from 'react'
import { FiSend, FiCpu, FiX, FiCode, FiClipboard, FiCheck } from 'react-icons/fi'
import { toast } from 'sonner'
import codeAssistantService, { CodeRequest } from '@/lib/services/codeAssistantService';


// Modello predefinito di OpenAI
const DEFAULT_MODEL = 'gpt-4'

interface CodeAssistantProps {
  onCodeGenerated: (code: string) => void;
  currentCode: string;
  language: string;
  fileName?: string;
}

export default function CodeAssistant({ 
  onCodeGenerated, 
  currentCode, 
  language, 
  fileName = 'untitled.js' 
}: CodeAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Auto-scroll ai messaggi più recenti
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])
  
  // Auto-resize dell'area di testo
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.style.height = 'auto'
      promptInputRef.current.style.height = `${promptInputRef.current.scrollHeight}px`
    }
  }, [prompt])

  // Messaggio di benvenuto all'apertura
  useEffect(() => {
    if (conversation.length === 0) {
      setConversation([{
        role: 'assistant',
        content: `Ciao! Sono il tuo assistente di codifica. Posso aiutarti a generare, modificare o debuggare codice ${language}. Come posso aiutarti oggi?`
      }])
    }
  }, [language])

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setConversation(prev => [...prev, { role: 'user', content: prompt }]);
    setIsProcessing(true);
    
    try {
      const request: CodeRequest = {
        type: 'GENERATE', // Puoi modificare questo in base al contesto
        language,
        currentCode,
        prompt,
        fileName
      };
      
      const response = await codeAssistantService.processCodeRequest(request);
      
      const aiResponse = `
        ${response.explanation}
  
        \`\`\`${language}
        ${response.code}
        \`\`\`
        
        ${response.suggestions ? 'Suggerimenti:\n' + response.suggestions.join('\n') : ''}
      `;
      
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      toast.error(`Errore: ${error.message || 'Si è verificato un errore'}`);
    } finally {
      setIsProcessing(false);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const applyCodeToEditor = (message: string) => {
    const codeRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
    const codeMatch = message.match(codeRegex);
    
    if (codeMatch && codeMatch[1]) {
      onCodeGenerated(codeMatch[1].trim());
      toast.success('Codice applicato all\'editor');
    } else {
      toast.error('Nessun codice trovato nel messaggio');
    }
  };

  const copyToClipboard = (message: string) => {
    const codeRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
    const codeMatch = message.match(codeRegex);
    
    if (codeMatch && codeMatch[1]) {
      navigator.clipboard.writeText(codeMatch[1].trim());
      setCopiedToClipboard(true);
      toast.success('Codice copiato negli appunti');
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } else {
      toast.error('Nessun codice trovato nel messaggio');
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 w-80">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Assistente Codice (OpenAI)</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-500">API: .env</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {conversation.map((message, index) => (
          <div key={index} className={`p-3 rounded-lg max-w-[95%] ${
            message.role === 'user' 
              ? 'bg-blue-100 dark:bg-blue-900 ml-auto' 
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <div className="text-xs font-bold mb-1">
              {message.role === 'user' ? 'Tu' : 'Assistente'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {message.role === 'assistant' && message.content.includes('```') && (
              <div className="flex mt-2 space-x-2">
                <button 
                  onClick={() => applyCodeToEditor(message.content)}
                  className="flex items-center space-x-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  <FiCode size={12} />
                  <span>Applica</span>
                </button>
                <button 
                  onClick={() => copyToClipboard(message.content)}
                  className="flex items-center space-x-1 text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                >
                  {copiedToClipboard ? <FiCheck size={12} /> : <FiClipboard size={12} />}
                  <span>{copiedToClipboard ? 'Copiato' : 'Copia'}</span>
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">L'AI sta generando una risposta...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <textarea
            ref={promptInputRef}
            placeholder="Chiedi all'assistente di codice..."
            className="flex-1 p-2 border rounded resize-none max-h-32"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isProcessing}
          />
          <button 
            className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
            onClick={handleSubmit}
            disabled={isProcessing || !prompt.trim()}
          >
            <FiSend />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Premi Enter per inviare, Shift+Enter per andare a capo
        </div>
      </div>
    </div>
  )
}
