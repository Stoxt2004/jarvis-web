// src/components/premium/PremiumPanelIntegrationBanner.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiLock, FiArrowRight, FiZap, FiCheckCircle, FiCode, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface PremiumPanelIntegrationBannerProps {
  onClose: () => void;
}

export default function PremiumPanelIntegrationBanner({ onClose }: PremiumPanelIntegrationBannerProps) {
  const router = useRouter();
  const [showFeatures, setShowFeatures] = useState(false);
  
  // Colori coerenti con il resto dell'app
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    accent: "#4CAF50",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  };
  
  // Lista dei vantaggi principali delle integrazioni premium
  const premiumBenefits = [
    {
      icon: <FiZap />,
      title: "Drag & Drop avanzato",
      description: "Trascina file dal gestore all'editor senza limitazioni."
    },
    {
      icon: <FiCode />,
      title: "Analisi multi-file",
      description: "Analizza interi progetti con l'AI, non solo file singoli."
    },
    {
      icon: <FiLink />,
      title: "Sincronizzazione pannelli",
      description: "Collega editor, terminal e file manager per un workflow fluido."
    }
  ];
  
  return (
    <AnimatePresence mode="wait">
      {!showFeatures ? (
        <motion.div
          key="main-banner"
          className="fixed bottom-6 right-6 w-80 rounded-lg overflow-hidden shadow-xl z-50"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.primary}40`
          }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                  style={{ backgroundColor: `${colors.primary}30` }}
                >
                  <FiLink className="text-primary" />
                </div>
                <h3 className="font-medium">Integrazione pannelli</h3>
              </div>
              <button 
                className="text-white/50 hover:text-white"
                onClick={onClose}
              >
                <FiX />
              </button>
            </div>
            
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              L'integrazione avanzata tra pannelli permette di sincronizzare file, codice e terminal per un workflow più potente. 
            </p>
            
            <div className="rounded bg-primary/10 p-3 mb-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                <FiLock className="text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium">Funzionalità Premium</p>
                <p style={{ color: colors.textMuted }}>
                  Sblocca l'integrazione con l'abbonamento Premium
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <button
                className="flex-1 py-2 rounded-md flex items-center justify-center gap-1"
                style={{ backgroundColor: colors.primary }}
                onClick={() => router.push('/dashboard/subscription')}
              >
                <span>Sblocca ora</span>
                <FiArrowRight size={14} />
              </button>
              
              <button
                className="px-3 py-2 rounded-md"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                onClick={onClose}
              >
                Non ora
              </button>
            </div>
            
            <button
              className="w-full text-center text-xs mt-2 hover:underline"
              style={{ color: colors.primary }}
              onClick={() => setShowFeatures(true)}
            >
              Scopri tutti i vantaggi
            </button>
          </div>
          
          {/* Barra inferiore che mostra i benefici */}
          <div 
            className="px-4 py-3 text-xs border-t border-white/10 flex items-center justify-between"
            style={{ backgroundColor: colors.background }}
          >
            <span style={{ color: colors.textMuted }}>Anteprima disponibile per 3 giorni</span>
            <span className="text-primary">Prova gratis</span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="features-detail"
          className="fixed bottom-6 right-6 w-96 rounded-lg overflow-hidden shadow-xl z-50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.primary}40`
          }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-medium text-lg">Funzionalità Premium</h3>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Ecco cosa sblocchi con l'abbonamento Premium
                </p>
              </div>
              <button 
                className="text-white/50 hover:text-white"
                onClick={() => setShowFeatures(false)}
              >
                <FiX />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {premiumBenefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="flex gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${colors.primary}30` }}
                  >
                    <div className="text-primary">
                      {benefit.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{benefit.title}</h4>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-3 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <FiCheckCircle className="text-accent mr-2" />
                <span className="font-medium">Risparmia fino a 2 ore al giorno</span>
              </div>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Gli utenti Premium risparmiano in media 2 ore al giorno grazie all'integrazione tra pannelli e all'assistente AI avanzato.
              </p>
            </div>
            
            <button
              className="w-full py-2.5 rounded-md font-medium"
              style={{ backgroundColor: colors.primary }}
              onClick={() => router.push('/dashboard/subscription')}
            >
              Passa a Premium
            </button>
          </div>
          
          {/* Barra inferiore che mostra l'offerta */}
          <div 
            className="px-4 py-3 text-sm border-t border-white/10 flex items-center justify-center"
            style={{ backgroundColor: colors.background }}
          >
            <span className="text-white">Prova senza impegno per 14 giorni</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}