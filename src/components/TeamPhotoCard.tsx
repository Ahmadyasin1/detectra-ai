import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  className?: string;
}

export default function TeamPhotoCard({ className = '' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`max-w-5xl mx-auto ${className}`}
    >
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/25 bg-white/5 backdrop-blur-md shadow-2xl shadow-cyan-500/10">
        <img
          src="/3 nomony.png"
          alt="Detectra AI team group"
          className="w-full h-[260px] sm:h-[660px] object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Detectra AI Core Team
          </div>
          <p className="text-white text-sm sm:text-base font-medium">
            Abdul Rehman , Ahmad Yasin , Eman Sarfraz
          </p>
        </div>
      </div>
    </motion.div>
  );
}
