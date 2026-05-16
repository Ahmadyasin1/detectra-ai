import { motion } from 'framer-motion';
import { DetectraLogoMark } from './DetectraLogo';
import { DETECTRA_BRAND_NAME } from '../constants/branding';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mb-6"
        >
          <DetectraLogoMark size="xl" className="mx-auto" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-cyan-400/60 border-t-transparent rounded-full"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {DETECTRA_BRAND_NAME}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-cyan-400 text-sm"
        >
          Loading intelligent solutions...
        </motion.p>
      </div>
    </div>
  );
}
