// components/premium/PremiumBanner.tsx
// Update the text to reflect the new storage limits

import { motion } from 'framer-motion';
import { FiZap, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

export default function PremiumBanner() {
  // Use the same colors defined in the dashboard for consistency
  const colors = {
    primary: "#A47864", // Mocha Mousse (Pantone 2025)
    secondary: "#A78BFA", // Digital Lavender
    accent: "#4CAF50", // Verdant Green
  };

  return (
    <motion.div 
      className="p-3 mx-4 mb-4 rounded-lg"
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)`,
        border: `1px solid ${colors.primary}40`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full" style={{ background: `${colors.accent}30` }}>
            <FiZap className="text-xl" style={{ color: colors.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Upgrade to Premium</h3>
            <p className="text-xs text-white/70">Unlimited panels and 10GB storage</p>
          </div>
        </div>
        
        <Link href="/dashboard/subscription">
          <motion.button
            className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-white text-sm"
            style={{ background: colors.accent }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Upgrade</span>
            <FiArrowRight size={14} />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}