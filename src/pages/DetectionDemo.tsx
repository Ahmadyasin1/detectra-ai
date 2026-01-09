import { motion } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import DetectraVideoShowcase from '../components/DetectraVideoShowcase';

export default function DetectionDemo() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Detectra AI <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Live Demo</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-12">
              Experience our advanced video analysis and computer vision capabilities through interactive demonstrations
            </p>

            {/* Demo Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { title: 'Object Detection', description: 'Real-time object recognition', icon: '🎯' },
                { title: 'Person Tracking', description: 'Multi-person tracking', icon: '👥' },
                { title: 'Vehicle Analysis', description: 'Car and vehicle detection', icon: '🚗' },
                { title: 'Scene Understanding', description: 'Context-aware analysis', icon: '🏙️' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-xs">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Showcase */}
      <DetectraVideoShowcase />

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Explore</span> More?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Discover the full potential of our multimodal video intelligence platform
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/fyp-project">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  View Full Project
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-transparent border-2 border-cyan-500 text-cyan-400 rounded-xl font-semibold hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200"
                >
                  Get in Touch
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}