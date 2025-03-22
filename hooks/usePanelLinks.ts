// lib/hooks/usePanelLinks.ts
import { useState, useEffect } from 'react';
import { useWorkspaceStore, Panel } from '@/lib/store/workspaceStore';
import { toast } from 'sonner';

// Definizione dei tipi di collegamenti possibili tra pannelli
export type LinkType = 'content' | 'position' | 'size';

// Interfaccia per un collegamento tra pannelli
export interface PanelLink {
  sourceId: string;
  targetId: string;
  linkType: LinkType;
  active: boolean;
}

// Store locale per i collegamenti tra pannelli
export const usePanelLinks = () => {
  // Array dei collegamenti attivi tra pannelli
  const [links, setLinks] = useState<PanelLink[]>([]);
  const { panels, updatePanelContent, updatePanelPosition, updatePanelSize } = useWorkspaceStore();

  // Aggiunge un nuovo collegamento
  const addLink = (sourceId: string, targetId: string, linkType: LinkType) => {
    // Verifica se il collegamento esiste già
    const existingLinkIndex = links.findIndex(
      link => link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType
    );

    if (existingLinkIndex >= 0) {
      // Aggiorna lo stato del collegamento esistente
      const updatedLinks = [...links];
      updatedLinks[existingLinkIndex].active = true;
      setLinks(updatedLinks);
      toast.success(`Collegamento ${getLinkName(linkType)} attivato`);
    } else {
      // Crea un nuovo collegamento
      setLinks([...links, { sourceId, targetId, linkType, active: true }]);
      toast.success(`Nuovo collegamento ${getLinkName(linkType)} creato`);
    }
  };

  // Rimuove un collegamento
  const removeLink = (sourceId: string, targetId: string, linkType: LinkType) => {
    const updatedLinks = links.filter(
      link => !(link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType)
    );
    setLinks(updatedLinks);
    toast.info(`Collegamento ${getLinkName(linkType)} rimosso`);
  };

  // Attiva/disattiva un collegamento
  const toggleLink = (sourceId: string, targetId: string, linkType: LinkType) => {
    const existingLinkIndex = links.findIndex(
      link => link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType
    );

    if (existingLinkIndex >= 0) {
      const updatedLinks = [...links];
      updatedLinks[existingLinkIndex].active = !updatedLinks[existingLinkIndex].active;
      setLinks(updatedLinks);
      
      const action = updatedLinks[existingLinkIndex].active ? 'attivato' : 'disattivato';
      toast.success(`Collegamento ${getLinkName(linkType)} ${action}`);
    } else {
      // Se non esiste, crealo attivo
      addLink(sourceId, targetId, linkType);
    }
  };

  // Verifica se esiste un collegamento
  const hasLink = (sourceId: string, targetId: string, linkType: LinkType): boolean => {
    return links.some(
      link => link.sourceId === sourceId && 
              link.targetId === targetId && 
              link.linkType === linkType &&
              link.active
    );
  };

  // Ottiene tutti i collegamenti per un pannello
  const getPanelLinks = (panelId: string): PanelLink[] => {
    return links.filter(
      link => (link.sourceId === panelId || link.targetId === panelId) && link.active
    );
  };

  // Ottiene tutti i pannelli collegati a un pannello specifico
  const getLinkedPanels = (panelId: string): string[] => {
    const sourceLinks = links.filter(link => link.sourceId === panelId && link.active);
    const targetLinks = links.filter(link => link.targetId === panelId && link.active);
    
    // Estrai gli ID dei pannelli collegati
    const linkedPanelIds = [
      ...sourceLinks.map(link => link.targetId),
      ...targetLinks.map(link => link.sourceId)
    ];
    
    // Rimuovi duplicati
    return [...new Set(linkedPanelIds)];
  };

  // Ottiene il nome leggibile del tipo di collegamento
  const getLinkName = (linkType: LinkType): string => {
    switch (linkType) {
      case 'content': return 'contenuto';
      case 'position': return 'posizione';
      case 'size': return 'dimensione';
      default: return linkType;
    }
  };

  // Effettua una sincronizzazione tra pannelli
  const syncPanels = (sourceId: string, targetId: string, linkType: LinkType): void => {
    const sourcePanel = panels.find(p => p.id === sourceId);
    const targetPanel = panels.find(p => p.id === targetId);
    
    if (!sourcePanel || !targetPanel) {
      toast.error('Pannello non trovato');
      return;
    }
    
    switch (linkType) {
      case 'content':
        // Sincronizza il contenuto (se i pannelli sono dello stesso tipo)
        if (sourcePanel.type === targetPanel.type) {
          updatePanelContent(targetId, sourcePanel.content);
          toast.success('Contenuto sincronizzato');
        } else {
          toast.error('I pannelli devono essere dello stesso tipo per sincronizzare il contenuto');
        }
        break;
        
      case 'position':
        // Sincronizza la posizione
        updatePanelPosition(targetId, { ...sourcePanel.position });
        toast.success('Posizione sincronizzata');
        break;
        
      case 'size':
        // Sincronizza la dimensione
        updatePanelSize(targetId, { ...sourcePanel.size });
        toast.success('Dimensione sincronizzata');
        break;
    }
  };

  // Sincronizza automaticamente i pannelli collegati quando necessario
  useEffect(() => {
    // In una vera implementazione, qui potresti aggiungere la logica per sincronizzare
    // automaticamente i pannelli quando cambia il contenuto, la posizione o la dimensione
    // di un pannello source. Per ora, lasciamo solo la sincronizzazione manuale.
  }, [panels]);

  return {
    links,
    addLink,
    removeLink,
    toggleLink,
    hasLink,
    getPanelLinks,
    getLinkedPanels,
    syncPanels
  };
};