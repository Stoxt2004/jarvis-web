// src/components/ai/MultiFileAIAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { FiCode, FiSearch, FiFile, FiCheckSquare, FiLoader, FiPlus, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/lib/store/workspaceStore';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { toast } from 'sonner';

/**
 * Componente che permette all'AI di analizzare più file contemporaneamente
 * Può essere aggiunto come overlay in AIAssistant.tsx
 */
export default function MultiFileAIAnalysis() {
  const { panels } = useWorkspaceStore();
  const { selectedPanelsForAI, addPanelToAISelection, removePanelFromAISelection, clearAISelection } = usePanelIntegrationStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // Lista dei pannelli editor aperti
  const editorPanels = panels.filter(p => p.type === 'editor' && !p.isMinimized);
  
  // Verifica se ci sono file selezionati
  const hasFilesSelected = selectedPanelsForAI.length > 0;
  
  // Ottieni informazioni sui file selezionati
  const getSelectedFilesInfo = () => {
    return selectedPanelsForAI.map(panelId => {
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
    }).filter(Boolean);
  };
  
  // Controlla se un pannello è selezionato
  const isPanelSelected = (panelId: string) => {
    return selectedPanelsForAI.includes(panelId);
  };
  
  // Gestisce il toggle della selezione del file
  const handleFileToggle = (panelId: string) => {
    if (isPanelSelected(panelId)) {
      removePanelFromAISelection(panelId);
    } else {
      addPanelToAISelection(panelId);
    }
  };
  
  // Avvia l'analisi
  const handleStartAnalysis = async () => {
    if (!hasFilesSelected) {
      toast.error('Seleziona almeno un file da analizzare');
      return;
    }
    
    if (!analysisPrompt.trim()) {
      toast.error('Inserisci una descrizione di cosa vuoi analizzare');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const selectedFiles = getSelectedFilesInfo();
      
      // Qui dovremmo fare una chiamata API all'endpoint di AI
      // Per ora simuliamo una risposta dopo un ritardo
      setTimeout(() => {
        const mockResponse = `## Analisi multi-file completata
        
Ho analizzato ${selectedFiles.length} file:
${selectedFiles.map(file => file ? `- ${file.fileName} (${file.language})` : '').join('\n')}

### Problemi principali rilevati
- Inconsistenza nelle convenzioni di denominazione tra i file
- Potenziali memory leak nel file ${selectedFiles[0]?.fileName}
- Mancano test unitari per le funzioni principali

### Raccomandazioni
1. Implementare un sistema di logging coerente
2. Migliorare la gestione degli errori nei callback
3. Rifattorizzare la logica duplicata nelle funzioni helper

### Metriche di Qualità
- Complessità ciclomatica: Media
- Debito tecnico: Moderato
- Sicurezza: Adeguata

Vuoi che ti aiuti a implementare una di queste raccomandazioni?`;

        setAnalysisResult(mockResponse);
        setIsAnalyzing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Errore durante l\'analisi:', error);
      toast.error('Si è verificato un errore durante l\'analisi');
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <FiCode className="mr-2" />
          Analisi Multi-file
        </h3>
        
        <p className="text-sm text-white/70 mb-4">
          Seleziona i file che vuoi analizzare contemporaneamente con l'AI
        </p>
        
        {/* Lista file disponibili */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
            <span>File aperti nell'editor</span>
            {hasFilesSelected && (
              <button 
                className="text-xs bg-white/10 hover:bg-white/20 p-1 rounded"
                onClick={clearAISelection}
              >
                Deseleziona tutti
              </button>
            )}
          </h4>
          
          {editorPanels.length === 0 ? (
            <div className="text-sm p-3 border border-white/10 rounded">
              Nessun file aperto. Apri un file nell'editor per analizzarlo.
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
        
        {/* Input per il prompt di analisi */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Cosa vuoi analizzare?
          </label>
          <textarea
            className="w-full p-2 bg-white/5 border border-white/10 rounded outline-none focus:border-primary resize-none"
            rows={3}
            placeholder="Es: Trova potenziali bug, analizza i pattern di design, suggerisci miglioramenti..."
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            disabled={isAnalyzing}
          />
        </div>
        
        {/* Pulsante di analisi */}
        <button
          className={`w-full py-2 rounded flex items-center justify-center ${
            hasFilesSelected && analysisPrompt.trim() && !isAnalyzing
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-white/10 cursor-not-allowed'
          }`}
          onClick={handleStartAnalysis}
          disabled={!hasFilesSelected || !analysisPrompt.trim() || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <FiLoader className="animate-spin mr-2" />
              Analisi in corso...
            </>
          ) : (
            <>
              <FiSearch className="mr-2" />
              Analizza {selectedPanelsForAI.length} file
            </>
          )}
        </button>
      </div>
      
      {/* Risultato dell'analisi */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div 
            className="flex-1 p-4 overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Risultato dell'analisi</h4>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}