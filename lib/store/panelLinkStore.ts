// lib/store/panelLinksStore.ts
import { LinkType, PanelLink } from '@/hooks/usePanelLinks';
import { toast } from 'sonner';
import { create } from 'zustand';

interface PanelLinksState {
  links: PanelLink[];
  addLink: (sourceId: string, targetId: string, linkType: LinkType) => void;
  removeLink: (sourceId: string, targetId: string, linkType: LinkType) => void;
  toggleLink: (sourceId: string, targetId: string, linkType: LinkType) => void;
  hasLink: (sourceId: string, targetId: string, linkType: LinkType) => boolean;
  getLinkedPanels: (panelId: string) => string[];
  getPanelLinks: (panelId: string) => PanelLink[];
}

export const usePanelLinksStore = create<PanelLinksState>((set, get) => ({
  links: [],
  
  addLink: (sourceId, targetId, linkType) => {
    const { links } = get();
    const existingLinkIndex = links.findIndex(
      link => link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType
    );

    if (existingLinkIndex >= 0) {
      // Aggiorna lo stato del collegamento esistente
      const updatedLinks = [...links];
      updatedLinks[existingLinkIndex].active = true;
      set({ links: updatedLinks });
      toast.success(`Collegamento ${getLinkName(linkType)} attivato`);
    } else {
      // Crea un nuovo collegamento
      set({ links: [...links, { sourceId, targetId, linkType, active: true }] });
      toast.success(`Nuovo collegamento ${getLinkName(linkType)} creato`);
    }
  },
  
  removeLink: (sourceId, targetId, linkType) => {
    const { links } = get();
    const updatedLinks = links.filter(
      link => !(link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType)
    );
    set({ links: updatedLinks });
    toast.info(`Collegamento ${getLinkName(linkType)} rimosso`);
  },
  
  toggleLink: (sourceId, targetId, linkType) => {
    const { links, addLink, removeLink } = get();
    const existingLinkIndex = links.findIndex(
      link => link.sourceId === sourceId && link.targetId === targetId && link.linkType === linkType
    );

    if (existingLinkIndex >= 0) {
      const updatedLinks = [...links];
      updatedLinks[existingLinkIndex].active = !updatedLinks[existingLinkIndex].active;
      set({ links: updatedLinks });
      
      const action = updatedLinks[existingLinkIndex].active ? 'attivato' : 'disattivato';
      toast.success(`Collegamento ${getLinkName(linkType)} ${action}`);
      
      // Se il collegamento è stato disattivato, rimuovilo
      if (!updatedLinks[existingLinkIndex].active) {
        removeLink(sourceId, targetId, linkType);
      }
    } else {
      // Se non esiste, crealo attivo
      addLink(sourceId, targetId, linkType);
    }
    
    console.log('Stato dei collegamenti dopo toggle:', get().links);
  },
  
  hasLink: (sourceId, targetId, linkType) => {
    return get().links.some(
      link => link.sourceId === sourceId && 
              link.targetId === targetId && 
              link.linkType === linkType &&
              link.active
    );
  },
  
  getPanelLinks: (panelId) => {
    return get().links.filter(
      link => (link.sourceId === panelId || link.targetId === panelId) && link.active
    );
  },
  
  getLinkedPanels: (panelId) => {
    const { links } = get();
    const sourceLinks = links.filter(link => link.sourceId === panelId && link.active);
    const targetLinks = links.filter(link => link.targetId === panelId && link.active);
    
    // Estrai gli ID dei pannelli collegati
    const linkedPanelIds = [
      ...sourceLinks.map(link => link.targetId),
      ...targetLinks.map(link => link.sourceId)
    ];
    
    // Rimuovi duplicati
    return [...new Set(linkedPanelIds)];
  }
}));

// Funzione di utilità per ottenere il nome leggibile del tipo di collegamento
const getLinkName = (linkType: LinkType): string => {
  switch (linkType) {
    case 'content': return 'contenuto';
    
    default: return linkType;
  }
};