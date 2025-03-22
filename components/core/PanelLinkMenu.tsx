// components/core/PanelLinkMenu.tsx
import React, { useEffect, useState } from 'react';
import { FiLink, FiCode, FiMove, FiMaximize, FiCheckCircle } from 'react-icons/fi';
import { useWorkspaceStore, Panel } from '@/lib/store/workspaceStore';
import { usePanelLinks, LinkType } from '@/hooks/usePanelLinks';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface PanelLinkMenuProps {
  panel: Panel;
  onClose: () => void;
  showPremiumBanner: () => void;
}

export default function PanelLinkMenu({ panel, onClose, showPremiumBanner }: PanelLinkMenuProps) {
  const { panels } = useWorkspaceStore();
  const { hasLink, toggleLink, getLinkedPanels, syncPanels, links } = usePanelLinks();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<LinkType>('content');
  
  // Filtro i pannelli che possono essere collegati in base al tab attivo
  const getFilteredPanels = () => {
    let filteredPanels = panels.filter(p => p.id !== panel.id && !p.isMinimized);
    
    // Per i collegamenti di contenuto, mostra solo pannelli dello stesso tipo
    if (activeTab === 'content') {
      filteredPanels = filteredPanels.filter(p => p.type === panel.type);
    }
    
    return filteredPanels;
  };
  
  // Gestione del click sul pulsante di collegamento
  // Nella funzione PanelLinkMenu che chiama toggleLink
  // In PanelLinkMenu.tsx
  // In PanelLinkMenu.tsx
const handleLinkToggle = (targetPanel: Panel) => {
    // Controlla se l'utente ha un piano premium
    if (!subscription.isPremium) {
      showPremiumBanner();
      return;
    }
    
    console.log('Prima del toggle - Collegamenti esistenti:', links);
    console.log('Tentativo di collegare:', panel.id, targetPanel.id, activeTab);
    
    // Attiva/disattiva il collegamento
    toggleLink(panel.id, targetPanel.id, activeTab);
    
    // Verifica immediatamente lo stato del collegamento
    console.log('Dopo il toggle - Collegamenti esistenti:', links);
    console.log('Link attivo ora?', hasLink(panel.id, targetPanel.id, activeTab));
  };
  
  // Gestione della sincronizzazione manuale
  const handleSync = (targetPanel: Panel) => {
    // Controlla se l'utente ha un piano premium
    if (!subscription.isPremium) {
      showPremiumBanner();
      return;
    }
    
    // Log dettagliati sul contenuto prima della sincronizzazione
    console.log('Contenuto pannello sorgente:', panel.content);
    console.log('Contenuto pannello target prima della sincronizzazione:', targetPanel.content);
    
    // Esegui la sincronizzazione
    syncPanels(panel.id, targetPanel.id, 'content');
    
    // Verifica dopo la sincronizzazione
    // Recupera i pannelli aggiornati
    const updatedSourcePanel = useWorkspaceStore.getState().panels.find(p => p.id === panel.id);
    const updatedTargetPanel = useWorkspaceStore.getState().panels.find(p => p.id === targetPanel.id);
    
    console.log('Contenuto pannello target dopo la sincronizzazione:', updatedTargetPanel?.content);
    console.log('I contenuti sono identici?', 
      JSON.stringify(updatedSourcePanel?.content) === JSON.stringify(updatedTargetPanel?.content));
  };
  
  useEffect(() => {
    console.log("PanelLinkMenu montato con panel:", panel.id);
    console.log("Collegamenti attuali:", links);
    
    return () => {
      console.log("PanelLinkMenu smontato, collegamenti finali:", links);
    };
  }, [panel.id, links]);
  
  // Ottiene il titolo del tab
  const getTabTitle = (linkType: LinkType): string => {
    switch (linkType) {
      case 'content': return 'Contenuto';
      
      default: return linkType;
    }
  };
  
  // Ottiene l'icona del tab
  const getTabIcon = (linkType: LinkType) => {
    switch (linkType) {
      case 'content': return <FiCode size={14} />;
     
      default: return null;
    }
  };
  
  // Lista dei pannelli collegabili filtrati
  const filteredPanels = getFilteredPanels();
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: panel.position.y + 40,
        right: window.innerWidth - panel.position.x - panel.size.width + 10,
        width: '250px',
        background: '#101020',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        zIndex: 1000,
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Intestazione */}
      <div style={{ 
        padding: '10px 12px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiLink style={{ color: '#A78BFA' }} />
          <span style={{ fontSize: '14px', color: '#fff' }}>Collega pannelli</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.6)', 
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiLink style={{ color: '#A78BFA' }} />
          <span style={{ fontSize: '14px', color: '#fff' }}>Condivisione contenuti</span>
        </div>
        {/* ... */}
      </div>
      
      {/* Lista pannelli */}
      <div style={{ padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
        {filteredPanels.length > 0 ? (
          filteredPanels.map(targetPanel => {
            const isLinked = hasLink(panel.id, targetPanel.id, activeTab);
            
            return (
              <div 
                key={targetPanel.id}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: isLinked ? 'rgba(164, 120, 100, 0.1)' : 'transparent'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: isLinked ? '#A47864' : '#fff',
                  fontSize: '13px'
                }}>
                  {isLinked && <FiCheckCircle size={12} color="#A47864" />}
                  <span>{targetPanel.title}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {targetPanel.type}
                  </span>
                </div>
                
                <div>
                  <button
                    style={{ 
                      background: 'none',
                      border: 'none',
                      color: isLinked ? '#A47864' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      padding: '4px',
                      marginRight: '6px',
                      borderRadius: '4px'
                    }}
                    title={isLinked ? 'Scollega' : 'Collega'}
                    onClick={() => handleLinkToggle(targetPanel)}
                  >
                    <FiLink size={14} />
                  </button>
                  
                  {activeTab === 'content' && (
                    <button
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Sincronizza ora"
                      onClick={() => handleSync(targetPanel)}
                    >
                      <FiCode size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ 
            padding: '12px', 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {activeTab === 'content' 
              ? 'Nessun pannello compatibile trovato'
              : 'Nessun pannello disponibile'}
          </div>
        )}
      </div>
      
      {/* Footer con info */}
      <div style={{ 
        padding: '8px 12px', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        {activeTab === 'content' ? (
          <span>Collega pannelli per sincronizzare il contenuto</span>
        ) : activeTab === 'position' ? (
          <span>Collega pannelli per muoverli insieme</span>
        ) : (
          <span>Collega pannelli per ridimensionarli insieme</span>
        )}
      </div>
    </div>
  );
}