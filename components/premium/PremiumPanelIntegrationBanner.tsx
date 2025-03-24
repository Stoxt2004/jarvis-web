// components/premium/PremiumPanelIntegrationBanner.tsx
// Aggiorna il banner che appare quando utenti Free provano a usare funzionalità premium

import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiZap, FiArrowRight, FiCpu } from 'react-icons/fi';
import Link from 'next/link';

interface PremiumPanelIntegrationBannerProps {
  onClose: () => void;
}

export default function PremiumPanelIntegrationBanner({ onClose }: PremiumPanelIntegrationBannerProps) {
  const colors = {
    primary: "#A47864",
    secondary: "#A78BFA",
    accent: "#4CAF50",
  };
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-surface-dark border border-white/10 rounded-xl w-full max-w-md p-6"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full" style={{ background: `${colors.primary}20` }}>
              <FiCpu className="text-xl" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-xl font-semibold">Funzionalità Premium</h3>
          </div>
          <button 
            className="p-1 hover:bg-white/10 rounded-full"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        
        <p className="mb-4">
          Questa funzionalità avanzata è disponibile esclusivamente per gli abbonati Premium e Team.
          Aggiorna il tuo piano per sbloccare:
        </p>
        
        <ul className="mb-6 space-y-2">
          <li className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-primary/20 text-primary">
              <FiZap size={14} />
            </div>
            <span>Analisi multi-file con AI</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-secondary/20 text-secondary">
              <FiZap size={14} />
            </div>
            <span>Integrazioni avanzate tra pannelli</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-accent/20 text-accent">
              <FiZap size={14} />
            </div>
            <span>10GB di storage (Piano Premium)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-accent/20 text-accent">
              <FiZap size={14} />
            </div>
            <span>25GB di storage (Piano Team)</span>
          </li>
        </ul>
        
        <div className="flex gap-3">
          <Link href="/dashboard/subscription" className="flex-1">
            <motion.button
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Passa a Premium</span>
              <FiArrowRight />
            </motion.button>
          </Link>
          
          <button 
            className="py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20"
            onClick={onClose}
          >
            Non ora
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}