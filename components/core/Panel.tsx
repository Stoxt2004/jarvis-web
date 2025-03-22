// components/core/Panel.tsx
"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { FiX, FiMinimize2, FiMaximize2, FiMinus, FiCpu } from 'react-icons/fi'
import { Panel as PanelType, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { useDragDropStore } from '@/lib/store/dragDropStore'
import { useSubscription } from '@/hooks/useSubscription'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import PremiumPanelIntegrationBanner from '@/components/premium/PremiumPanelIntegrationBanner'

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
    updatePanelSize,
    panels
  } = useWorkspaceStore();

  // Importa dallo store per drag & drop
  const { 
    selectedPanelsForAI, 
    addPanelToAISelection, 
    removePanelFromAISelection 
  } = useDragDropStore();

  const { subscription, hasAccess } = useSubscription();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  
  // Riferimenti per il trascinamento/ridimensionamento
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Verifica se il pannello è selezionato per l'analisi AI
  const isSelectedForAI = selectedPanelsForAI.includes(panel.id);

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
    panelRef.current.style.transform = 'none';
    
  }, [isDragging]);

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
    
    setIsDragging(false);
  }, [isDragging, panel.id, updatePanelPosition]);

  // Inizia il ridimensionamento
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePanel(panel.id);
    setIsResizing(true);
    
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
    
  }, [isResizing, panel.position.x, panel.position.y]);

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
    
    setIsResizing(false);
  }, [isResizing, panel.id, panel.position.x, panel.position.y, updatePanelSize]);

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

  // Verifica dell'esistenza degli elementi DOM (per debug)
  useEffect(() => {
    // Verifica che gli elementi DOM abbiano gli attributi data-panel-id
    if (panels.length > 0) {
      panels.forEach(p => {
        const element = document.querySelector(`[data-panel-id="${p.id}"]`);
        console.log(`Elemento per pannello ${p.id}:`, !!element);
      });
    }
  }, [panels]);

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
            : '0 0 15px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease',
          zIndex: activePanel === panel.id ? 10 : 1,
          border: isSelectedForAI 
            ? '1px solid rgba(164, 120, 100, 0.8)' 
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

      {/* Banner di funzionalità premium */}
      {showPremiumBanner && (
        <PremiumPanelIntegrationBanner onClose={() => setShowPremiumBanner(false)} />
      )}
    </>
  );
}