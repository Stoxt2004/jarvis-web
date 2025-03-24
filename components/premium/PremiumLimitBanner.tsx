// src/components/premium/PremiumLimitBanner.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiX, FiLock, FiArrowRight, FiCpu, FiDatabase, FiLayout } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface PremiumLimitBannerProps {
  limitType: 'AI_LIMIT_EXCEEDED' | 'STORAGE_LIMIT_EXCEEDED' | 'PANEL_LIMIT_EXCEEDED';
  onClose: () => void;
}

export default function PremiumLimitBanner({ limitType, onClose }: PremiumLimitBannerProps) {
  const router = useRouter();
  
  // Colori moderni 2025
  const colors = {
    primary: "#A47864", // Mocha Mousse (Pantone 2025)
    secondary: "#A78BFA", // Digital Lavender
    accent: "#4CAF50", // Verdant Green
    navy: "#101585", // Navy Blue
    rose: "#D58D8D", // Muted Rose
    background: "#0F0F1A", // Dark background
    surface: "#1A1A2E", // Slightly lighter surface
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.7)"
  };
  
  // Configurazione in base al tipo di limite superato
  const getBannerConfig = () => {
    switch (limitType) {
      case 'AI_LIMIT_EXCEEDED':
        return {
          title: "Limite di richieste AI raggiunto",
          description: "Hai raggiunto il limite giornaliero di richieste AI per il tuo piano.",
          icon: <FiCpu />,
          color: colors.rose,
          action: "Sblocca richieste AI illimitate"
        };
      case 'STORAGE_LIMIT_EXCEEDED':
        return {
          title: "Limite di storage raggiunto",
          description: "Hai raggiunto il limite di spazio di archiviazione per il tuo piano.",
          icon: <FiDatabase />,
          color: colors.rose,
          action: "Ottieni più spazio di storage"
        };
      case 'PANEL_LIMIT_EXCEEDED':
        return {
          title: "Limite di pannelli raggiunto",
          description: "Hai raggiunto il limite di pannelli contemporanei per il tuo piano.",
          icon: <FiLayout />,
          color: colors.rose,
          action: "Sblocca pannelli illimitati"
        };
      default:
        return {
          title: "Limite raggiunto",
          description: "Hai raggiunto un limite per il tuo piano.",
          icon: <FiAlertCircle />,
          color: colors.rose,
          action: "Passa a Premium"
        };
    }
  };
  
  const config = getBannerConfig();
  
  const handleUpgrade = () => {
    router.push('/dashboard/subscription');
    onClose();
  };
  
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 p-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-lg shadow-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.surface}, ${colors.navy})`,
            border: `1px solid ${config.color}40`,
          }}
        >
          {/* Barra colorata in alto */}
          <div className="h-1.5" style={{ background: config.color }}></div>
          
          <div className="p-6">
            <div className="flex items-start">
              {/* Icona */}
              <div 
                className="flex-shrink-0 mr-5 p-4 rounded-full"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <div className="text-2xl" style={{ color: config.color }}>
                  {config.icon}
                </div>
              </div>
              
              {/* Contenuto */}
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
                  
                  <button 
                    onClick={onClose} 
                    className="text-white/50 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <p className="mb-4" style={{ color: colors.textMuted }}>
                  {config.description} Con un piano premium potrai accedere a più risorse e funzionalità avanzate per la tua produttività.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    onClick={handleUpgrade}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-md font-medium flex items-center justify-center gap-2 transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      color: colors.text,
                      boxShadow: `0 4px 12px ${colors.primary}40`
                    }}
                  >
                    <FiLock size={16} />
                    <span>{config.action}</span>
                    <FiArrowRight size={16} />
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-md font-medium bg-white/10 hover:bg-white/20"
                  >
                    Non ora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}