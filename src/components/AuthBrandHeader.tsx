import { motion } from 'framer-motion';
import { DetectraLogoMark, type LogoSize } from './DetectraLogo';

type AuthBrandHeaderProps = {
  size?: LogoSize;
  className?: string;
};

/** Centered logo for the sign-in / sign-up modal. */
export default function AuthBrandHeader({
  size = 'auth',
  className = '',
}: AuthBrandHeaderProps) {
  return (
    <motion.div
      className={`text-center relative ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <DetectraLogoMark
        size={size}
        className="relative mx-auto justify-center"
        imgClassName="drop-shadow-[0_2px_20px_rgba(34,211,238,0.3)]"
      />
    </motion.div>
  );
}
