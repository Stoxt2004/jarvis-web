// components/core/panels/integration/PanelIntegrationManager.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiCpu, FiCode, FiRefreshCw, FiCheck, FiLock } from 'react-icons/fi';
import { useWorkspaceStore } from '@/lib/store/workspaceStore';
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore';
import { usePanelLinks } from '@/hooks/usePanelLinks';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

import PremiumPanelIntegrationBanner from '@/components/premium/PremiumPanelIntegrationBanner';

/**
 * Manager per l'integrazione tra pannelli che può essere inserito nel componente principale
 * o nella barra laterale dell'interfaccia
 */
export default function PanelIntegrationManager() {
  const { panels } = useWorkspaceStore();
  const { selectedPanelsForAI } = usePanelIntegrationStore();
  // Utilizziamo usePanelLinks per ottenere getLinkedPanels
  const { getLinkedPanels, syncPanels } = usePanelLinks();
  const { subscription, hasAccess } = useSubscription();
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [activeIntegrations, setActiveIntegrations] = useState<Array<{source: string, target: string}>>([]);
  
  // Ottieni le integrazioni attive all'inizio
  useEffect(() => {
    const integrations: Array<{source: string, target: string}> = [];
    
    // Itera su tutti i pannelli
    panels.forEach(panel => {
      const links = getLinkedPanels(panel.id);
      links.forEach(targetId => {
        integrations.push({
          source: panel.id,
          target: targetId
        });
      });
    });
    
    setActiveIntegrations(integrations);
  }, [panels, getLinkedPanels]);
  
  // Gestisce l'attivazione di un'integrazione
  const handleActivateIntegration = (sourceId: string, targetId: string) => {
    // Controlla se l'utente ha accesso alla funzionalità premium
    if (!hasAccess('advancedIntegration')) {
      setShowPremiumBanner(true);
      return;
    }
    
    // Simula l'attivazione dell'integrazione
    toast.success(`Integrazione attivata tra ${getPanelName(sourceId)} e ${getPanelName(targetId)}`);
    
    // Qui andrà la logica reale di attivazione
  };
  
  // Ottiene il nome del pannello
  const getPanelName = (panelId: string): string => {
    const panel = panels.find(p => p.id === panelId);
    return panel ? panel.title : 'Pannello sconosciuto';
  };
  
  // Gestisce la sincronizzazione tra pannelli
  const handleSyncAction = (source: string, target: string, field: 'content' | 'position' | 'size') => {
    // Controlla se l'utente ha accesso alla funzionalità premium
    if (!hasAccess('advancedIntegration')) {
      setShowPremiumBanner(true);
      return;
    }
    
    // Esegui la sincronizzazione
    syncPanels(source, target, field);
    
    // Feedback all'utente
    const fieldNames = {
      'content': 'contenuto',
      'position': 'posizione',
      'size': 'dimensione'
    };
    
    toast.success(`Sincronizzazione ${fieldNames[field]} completata`);
  };
  
  // Se non ci sono integrazioni attive, non mostriamo nulla
  if (activeIntegrations.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="fixed bottom-6 left-6 z-40">
        <motion.div
          className="bg-surface-dark rounded-lg shadow-lg border border-white/10 w-64"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiLink className="text-primary" />
              <span className="font-medium">Pannelli integrati</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              {activeIntegrations.length}
            </span>
          </div>
          
          <div className="p-3 max-h-64 overflow-y-auto">
            {activeIntegrations.map((integration, index) => {
              const sourcePanel = panels.find(p => p.id === integration.source);
              const targetPanel = panels.find(p => p.id === integration.target);
              
              if (!sourcePanel || !targetPanel) return null;
              
              return (
                <div 
                  key={`${integration.source}-${integration.target}`}
                  className="mb-3 last:mb-0 p-2 rounded bg-white/5 hover:bg-white/10"
                >
                  <div className="text-sm font-medium mb-1 flex items-center justify-between">
                    <span>{sourcePanel.title}</span>
                    <FiLink size={12} className="text-primary" />
                    <span>{targetPanel.title}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <button 
                      className="px-2 py-0.5 text-xs rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                      onClick={() => handleSyncAction(integration.source, integration.target, 'content')}
                    >
                      <FiCode size={10} />
                      <span>Sync Contenuto</span>
                    </button>
                    
                    <button 
                      className="px-2 py-0.5 text-xs rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
                      onClick={() => handleSyncAction(integration.source, integration.target, 'position')}
                    >
                      <FiRefreshCw size={10} />
                      <span>Sync Posizione</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-white/10">
            <button 
              className="w-full py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-sm flex items-center justify-center gap-1"
              onClick={() => setShowPremiumBanner(true)}
            >
              <FiCpu size={14} />
              <span>AI Multi-pannello</span>
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Banner premium */}
      <AnimatePresence>
        {showPremiumBanner && (
          <PremiumPanelIntegrationBanner onClose={() => setShowPremiumBanner(false)} />
        )}
      </AnimatePresence>
    </>
  );
}