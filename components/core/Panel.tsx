// components/core/Panel.tsx
"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { FiX, FiMinimize2, FiMaximize2, FiMinus, FiCpu, FiLink } from 'react-icons/fi'
import { Panel as PanelType, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { usePanelLinks } from '@/hooks/usePanelLinks'
import { useSubscription } from '@/hooks/useSubscription'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import PremiumPanelIntegrationBanner from '@/components/premium/PremiumPanelIntegrationBanner'
import PanelLinkMenu from '@/components/core/PanelLinkMenu'
import { usePanelIntegrationStore } from '@/lib/store/usePanelIntegrationStore'

// Importazione dinamica del wrapper per i pannelli che supportano il drop
const DroppableEditorPanel = dynamic(() => import('@/components/core/panels/DropZoneWrapper').then(mod => mod.DroppableEditorPanel))

interface CommonPanelProps {
  panel: PanelType;
}

// Componenti panel standard senza supporto per drag & drop
const StandardPanelComponents = {
  fileManager: dynamic(() => import('@/components/core/panels/FileManagerPanel')),
  terminal: dynamic(() => import('@/components/core/panels/TerminalPanel')),
  notes: dynamic(() => import('@/components/core/panels/NotesPanel')),
  dashboard: dynamic(() => import('@/components/core/panels/DashboardPanel')),
  calendar: dynamic(() => import('@/components/panels/CalendarPanel/CalendarPanel')),
}

// Tutti i componenti panel (alcuni potrebbero essere sostituiti con versioni enhanced)
const PanelComponents = {
  ...StandardPanelComponents,
  editor: DroppableEditorPanel // Sostituisci l'editor standard con la versione con supporto per drop
}

interface PanelProps {
  panel: PanelType
}

export default function Panel({ panel }: PanelProps) {
  const {
    activePanel,
    setActivePanel,
    removePanel,
    maximizePanel,
    minimizePanel,
    restorePanel,
    updatePanelPosition,
    updatePanelSize
  } = useWorkspaceStore();

  // Importa dallo store corretto
  
  const { 
    selectedPanelsForAI, 
    addPanelToAISelection, 
    removePanelFromAISelection 
  } = usePanelIntegrationStore();
  
  // Utilizziamo il nostro hook personalizzato per i collegamenti tra pannelli
  const { 
    hasLink, 
    toggleLink, 
    getPanelLinks, 
    getLinkedPanels, 
    syncPanels 
  } = usePanelLinks();

  const { subscription, hasAccess } = useSubscription();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const linkedPanelIds = getLinkedPanels(panel.id);
  // Riferimenti per il trascinamento/ridimensionamento
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const linkedPanelsMovedRef = useRef<Set<string>>(new Set());

  // Verifica se il pannello è selezionato per l'analisi AI
  const isSelectedForAI = selectedPanelsForAI.includes(panel.id);
  
  // Array di pannelli collegati (per evidenziare l'icona del collegamento)
  const linkedPanels = getLinkedPanels(panel.id);
  const hasAnyLinks = linkedPanels.length > 0;

  // Renderizza il componente del pannello in base al tipo
  const renderPanelContent = useCallback(() => {
    if (!panel.type || !(panel.type in PanelComponents)) {
      return <div>Tipo di pannello non supportato</div>;
    }
    const Component = PanelComponents[panel.type as keyof typeof PanelComponents];
    return <Component panel={panel} />;
  }, [panel.type, panel]);

  // Inizia il trascinamento
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setActivePanel(panel.id);
    setIsDragging(true);
    
    // Resetta l'array dei pannelli collegati già spostati
    linkedPanelsMovedRef.current.clear();
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: panel.position.x,
      panelY: panel.position.y
    };
  }, [panel.id, panel.position.x, panel.position.y, setActivePanel]);

  // Gestisce il movimento durante il trascinamento
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // Calcola la nuova posizione
    let newX = dragStartRef.current.panelX + deltaX;
    let newY = dragStartRef.current.panelY + deltaY;
    
    // Assicura che non vada oltre i limiti dello schermo
    newX = Math.max(0, newX);
    const panelHeight = panelRef.current.offsetHeight;
    const maxY = window.innerHeight - panelHeight;
    newY = Math.max(0, Math.min(newY, maxY));
    const panelWidth = panelRef.current.offsetWidth;
    const maxX = window.innerWidth - panelWidth;
    newX = Math.min(newX, maxX);
    
    // Usa left e top invece di transform
    panelRef.current.style.left = `${newX}px`;
    panelRef.current.style.top = `${newY}px`;
    // Rimuovi transform
    panelRef.current.style.transform = 'none';
    
    // Se l'utente ha un abbonamento premium, sposta anche i pannelli collegati
    if (subscription.isPremium) {
      // Trova i pannelli collegati con "position"
      const linkedPanelsWithPositionLink = useWorkspaceStore.getState().panels.filter(p => {
        // Verifica se c'è un collegamento di posizione attivo
        return hasLink(panel.id, p.id, 'position') && !linkedPanelsMovedRef.current.has(p.id);
      });
      
      // Aggiungi i pannelli attualmente spostati al set per evitare cicli infiniti
      linkedPanelsWithPositionLink.forEach(p => linkedPanelsMovedRef.current.add(p.id));
      
      // Aggiorna la posizione dei pannelli collegati
      linkedPanelsWithPositionLink.forEach(linkedPanel => {
        const element = document.querySelector(`[data-panel-id="${linkedPanel.id}"]`) as HTMLElement;
        if (element) {
          const newLinkedX = linkedPanel.position.x + deltaX;
          const newLinkedY = linkedPanel.position.y + deltaY;
          
          // Usa left e top invece di transform
          element.style.left = `${newLinkedX}px`;
          element.style.top = `${newLinkedY}px`;
          element.style.transform = 'none';
        }
      });
    }
  }, [isDragging, subscription.isPremium, hasLink]);

  // Termina il trascinamento
  const handleDragEnd = useCallback((e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // Calcola la posizione finale
    let finalX = dragStartRef.current.panelX + deltaX;
    let finalY = dragStartRef.current.panelY + deltaY;
    
    // Applica gli stessi limiti della funzione handleDrag
    finalX = Math.max(0, finalX);
    const panelHeight = panelRef.current.offsetHeight;
    const maxY = window.innerHeight - panelHeight;
    finalY = Math.max(0, Math.min(finalY, maxY));
    const panelWidth = panelRef.current.offsetWidth;
    const maxX = window.innerWidth - panelWidth;
    finalX = Math.min(finalX, maxX);
    
    // Aggiorna lo stato nel store
    updatePanelPosition(panel.id, { x: finalX, y: finalY });
    
    // Se l'utente ha un abbonamento premium, aggiorna anche i pannelli collegati
    if (subscription.isPremium) {
      // Trova i pannelli collegati con "position"
      const panelsToUpdate = [...linkedPanelsMovedRef.current];
      
      // Aggiorna la posizione dei pannelli collegati nello store
      panelsToUpdate.forEach(panelId => {
        const linkedPanel = useWorkspaceStore.getState().panels.find(p => p.id === panelId);
        if (linkedPanel) {
          const newLinkedX = linkedPanel.position.x + deltaX;
          const newLinkedY = linkedPanel.position.y + deltaY;
          updatePanelPosition(panelId, { x: newLinkedX, y: newLinkedY });
        }
      });
    }
    
    setIsDragging(false);
    linkedPanelsMovedRef.current.clear();
  }, [isDragging, panel.id, subscription.isPremium, updatePanelPosition]);

  // Inizia il ridimensionamento
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePanel(panel.id);
    setIsResizing(true);
    
    // Resetta l'array dei pannelli collegati già ridimensionati
    linkedPanelsMovedRef.current.clear();
    
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: panel.size.width,
      height: panel.size.height
    };
  }, [panel.id, panel.size.width, panel.size.height, setActivePanel]);

  // Gestisce il movimento durante il ridimensionamento
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    // Calcola le nuove dimensioni
    let newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
    let newHeight = Math.max(200, resizeStartRef.current.height + deltaY);
    
    // Limita le dimensioni per evitare che il pannello esca dallo schermo
    const maxWidth = window.innerWidth - panel.position.x;
    const maxHeight = window.innerHeight - panel.position.y;
    
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);
    
    // Aggiorna le dimensioni visivamente
    panelRef.current.style.width = `${newWidth}px`;
    panelRef.current.style.height = `${newHeight}px`;
    
    // Se l'utente ha un abbonamento premium, ridimensiona anche i pannelli collegati
    if (subscription.isPremium) {
      // Trova i pannelli collegati con "size"
      const linkedPanelsWithSizeLink = useWorkspaceStore.getState().panels.filter(p => {
        // Verifica se c'è un collegamento di dimensione attivo
        return hasLink(panel.id, p.id, 'size') && !linkedPanelsMovedRef.current.has(p.id);
      });
      
      // Aggiungi i pannelli attualmente ridimensionati al set per evitare cicli infiniti
      linkedPanelsWithSizeLink.forEach(p => linkedPanelsMovedRef.current.add(p.id));
      
      // Aggiorna la dimensione dei pannelli collegati
      linkedPanelsWithSizeLink.forEach(linkedPanel => {
        const element = document.querySelector(`[data-panel-id="${linkedPanel.id}"]`) as HTMLElement;
        if (element) {
          const newLinkedWidth = linkedPanel.size.width + deltaX;
          const newLinkedHeight = linkedPanel.size.height + deltaY;
          
          // Aggiorna le dimensioni visivamente
          element.style.width = `${Math.max(300, newLinkedWidth)}px`;
          element.style.height = `${Math.max(200, newLinkedHeight)}px`;
        }
      });
    }
  }, [isResizing, panel.position.x, panel.position.y, subscription.isPremium, hasLink]);

  // Termina il ridimensionamento
  const handleResizeEnd = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    // Calcola le dimensioni finali
    let finalWidth = Math.max(300, resizeStartRef.current.width + deltaX);
    let finalHeight = Math.max(200, resizeStartRef.current.height + deltaY);
    
    // Applica gli stessi limiti della funzione handleResize
    const maxWidth = window.innerWidth - panel.position.x;
    const maxHeight = window.innerHeight - panel.position.y;
    
    finalWidth = Math.min(finalWidth, maxWidth);
    finalHeight = Math.min(finalHeight, maxHeight);
    
    // Aggiorna lo stato nel store
    updatePanelSize(panel.id, { width: finalWidth, height: finalHeight });
    
    // Se l'utente ha un abbonamento premium, aggiorna anche i pannelli collegati
    if (subscription.isPremium) {
      // Trova i pannelli collegati con "size"
      const panelsToUpdate = [...linkedPanelsMovedRef.current];
      
      // Aggiorna la dimensione dei pannelli collegati nello store
      panelsToUpdate.forEach(panelId => {
        const linkedPanel = useWorkspaceStore.getState().panels.find(p => p.id === panelId);
        if (linkedPanel) {
          const newLinkedWidth = linkedPanel.size.width + deltaX;
          const newLinkedHeight = linkedPanel.size.height + deltaY;
          updatePanelSize(panelId, { 
            width: Math.max(300, newLinkedWidth), 
            height: Math.max(200, newLinkedHeight) 
          });
        }
      });
    }
    
    setIsResizing(false);
    linkedPanelsMovedRef.current.clear();
  }, [isResizing, panel.id, panel.position.x, panel.position.y, updatePanelSize, subscription.isPremium]);

  // Toggle selezione AI
  const toggleAISelection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Verifica se l'utente ha un abbonamento premium
    if (!hasAccess('multiFileAnalysis') && !isSelectedForAI) {
      setShowPremiumBanner(true);
      return;
    }
    
    if (isSelectedForAI) {
      removePanelFromAISelection(panel.id);
      toast.success('Pannello rimosso dall\'analisi multi-file');
    } else {
      // Verifica se l'utente ha raggiunto il limite di file free
      if (selectedPanelsForAI.length >= 2 && !subscription.isPremium) {
        setShowPremiumBanner(true);
        return;
      }
      
      addPanelToAISelection(panel.id);
      toast.success('Pannello aggiunto all\'analisi multi-file');
    }
  }, [
    hasAccess, 
    isSelectedForAI, 
    subscription.isPremium, 
    selectedPanelsForAI.length, 
    panel.id, 
    removePanelFromAISelection, 
    addPanelToAISelection
  ]);

  // Gestisce il toggle del menu per i collegamenti tra pannelli
  const handleLinkMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Verifica se l'utente ha un abbonamento premium
    if (!subscription.isPremium) {
      setShowPremiumBanner(true);
      return;
    }
    
    // L'utente ha un abbonamento premium, mostra il menu normalmente
    setShowLinkMenu(!showLinkMenu);
  }, [subscription.isPremium, showLinkMenu]);

  // Aggiungi e rimuovi gli event listener quando necessario
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  // Se il pannello è minimizzato, non renderizzare nulla
  if (panel.isMinimized) return null;

  if (panel.isMaximized) {
    return (
      <>
        <div 
          className="panel panel-maximized" 
          data-panel-id={panel.id}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 1000,
            background: '#1A1A2E',
            borderRadius: '0',
            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div 
            className="panel-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 15px',
              background: '#101020',
              color: '#fff',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span>{panel.title}</span>
            <div className="panel-controls" style={{ display: 'flex', gap: '10px' }}>
              {/* Pulsante per AI multi-file (solo per editor) */}
              {panel.type === 'editor' && (
                <button 
                  onClick={toggleAISelection}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: isSelectedForAI ? '#A47864' : '#A78BFA', 
                    cursor: 'pointer',
                    opacity: isSelectedForAI ? 1 : 0.7
                  }}
                  title={isSelectedForAI ? 'Rimuovi dall\'analisi AI' : 'Aggiungi all\'analisi AI'}
                >
                  <FiCpu />
                </button>
              )}

              {/* Pulsante per integrare pannelli */}
              <button 
                onClick={handleLinkMenuToggle}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: hasAnyLinks ? '#A47864' : '#A78BFA', 
                  cursor: 'pointer',
                  opacity: hasAnyLinks ? 1 : 0.7
                }}
                title="Collega con altri pannelli"
              >
                <FiLink />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); minimizePanel(panel.id); }}
                style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer' }}
              >
                <FiMinus />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); restorePanel(panel.id); }}
                style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer' }}
              >
                <FiMaximize2 />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); removePanel(panel.id); }}
                style={{ background: 'none', border: 'none', color: '#D58D8D', cursor: 'pointer' }}
              >
                <FiX />
              </button>
            </div>
          </div>
          <div 
            className="panel-content"
            style={{ 
              flex: 1, 
              overflow: 'auto',
              padding: '15px'
            }}
          >
            {renderPanelContent()}
          </div>
        </div>

        {/* Banner di funzionalità premium */}
        {showPremiumBanner && (
          <PremiumPanelIntegrationBanner onClose={() => setShowPremiumBanner(false)} />
        )}
        
        {/* Menu per collegamenti tra pannelli */}
        {showLinkMenu && (
          <PanelLinkMenu 
            panel={panel} 
            onClose={() => setShowLinkMenu(false)} 
            showPremiumBanner={() => setShowPremiumBanner(true)} 
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={panelRef}
        data-panel-id={panel.id}
        className={`panel ${activePanel === panel.id ? 'active' : ''} ${isSelectedForAI ? 'ai-selected' : ''}`}
        style={{
          position: 'absolute',
          left: panel.position.x,
          top: panel.position.y,
          width: panel.size.width,
          height: panel.size.height,
          background: '#1A1A2E',
          borderRadius: '8px',
          boxShadow: activePanel === panel.id 
            ? '0 0 20px rgba(167, 139, 250, 0.3)' 
            : hasAnyLinks
              ? '0 0 15px rgba(164, 120, 100, 0.3)'
              : '0 0 15px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease',
          zIndex: activePanel === panel.id ? 10 : 1,
          border: isSelectedForAI 
            ? '1px solid rgba(164, 120, 100, 0.8)' 
            : hasAnyLinks
              ? '1px solid rgba(164, 120, 100, 0.5)'
              : activePanel === panel.id 
                ? '1px solid rgba(167, 139, 250, 0.5)' 
                : '1px solid rgba(255,255,255,0.05)'
        }}
        onClick={() => setActivePanel(panel.id)}
      >
        <div 
          className="panel-header" 
          onMouseDown={handleDragStart}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 15px',
            background: '#101020',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            cursor: 'grab',
            userSelect: 'none'
          }}
        >
          <span>{panel.title}</span>
          <div className="panel-controls" style={{ display: 'flex', gap: '10px' }}>
            {/* Pulsante per AI multi-file (solo per editor) */}
            {panel.type === 'editor' && (
              <button 
                onClick={toggleAISelection}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: isSelectedForAI ? '#A47864' : '#A78BFA', 
                  cursor: 'pointer',
                  opacity: isSelectedForAI ? 1 : 0.7
                }}
                title={isSelectedForAI ? 'Rimuovi dall\'analisi AI' : 'Aggiungi all\'analisi AI'}
              >
                <FiCpu />
              </button>
            )}

            {/* Pulsante per integrare pannelli */}
            <button 
              onClick={handleLinkMenuToggle}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: hasAnyLinks ? '#A47864' : '#A78BFA', 
                cursor: 'pointer',
                opacity: hasAnyLinks ? 1 : 0.7
              }}
              title="Collega con altri pannelli"
            >
              <FiLink />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); minimizePanel(panel.id); }}
              style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer' }}
            >
              <FiMinimize2 />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); maximizePanel(panel.id); }}
              style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer' }}
            >
              <FiMaximize2 />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); removePanel(panel.id); }}
              style={{ background: 'none', border: 'none', color: '#D58D8D', cursor: 'pointer' }}
            >
              <FiX />
            </button>
          </div>
        </div>
        <div 
          className="panel-content"
          style={{ 
            flex: 1, 
            overflow: 'auto',
            padding: '15px'
          }}
        >
          {renderPanelContent()}
        </div>
        <div 
          className="panel-resize-handle" 
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '20px',
            height: '20px',
            cursor: 'nwse-resize',
            background: 'transparent'
          }}
        />
      </div>

      {/* Menu per collegamenti tra pannelli */}
      {showLinkMenu && (
        <PanelLinkMenu 
          panel={panel} 
          onClose={() => setShowLinkMenu(false)} 
          showPremiumBanner={() => setShowPremiumBanner(true)} 
        />
      )}

      {/* Banner di funzionalità premium */}
      {showPremiumBanner && (
        <PremiumPanelIntegrationBanner onClose={() => setShowPremiumBanner(false)} />
      )}
    </>
  );
}