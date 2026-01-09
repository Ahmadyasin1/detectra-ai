import { motion, useInView, useAnimation } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Brain, Zap, Target, Play } from 'lucide-react';
import Hero from '../components/Hero';

export default function Home() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  const features = [
    {
      icon: Eye,
      title: 'Object Detection',
      description: 'Advanced CNN-based models for real-time object recognition',
      color: 'from-blue-600 to-indigo-700',
      delay: 0,
    },
    {
      icon: Brain,
      title: 'AI Vision',
      description: 'Transformer-based multimodal fusion for contextual understanding',
      color: 'from-indigo-600 to-purple-700',
      delay: 0.1,
    },
    {
      icon: Zap,
      title: 'Real-Time Analysis',
      description: 'Lightning-fast processing with &lt;10ms response times',
      color: 'from-purple-600 to-pink-700',
      delay: 0.2,
    },
    {
      icon: Target,
      title: 'Precision Accuracy',
      description: '99.7% accuracy across all detection modules',
      color: 'from-pink-600 to-rose-700',
      delay: 0.3,
    },
  ];

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);


  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section ref={ref} className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-500/3 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Core <span className="text-gradient">Capabilities</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              Advanced AI-powered detection and analysis capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: feature.delay }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative p-4 sm:p-6 rounded-2xl glass-effect hover:border-blue-500/50 transition-all duration-200 text-center h-full">
                    <motion.div
                      className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-200 shadow-lg`}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
              Ready to <span className="text-gradient">Experience</span> Live Demo?
            </h2>
            
            <p className="text-slate-600 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Watch our AI model in action - detecting objects, people, and scenes in real-time with high accuracy. Sign in to access the interactive demo.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link to="/demo">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
                >
                  <Play className="w-5 h-5" />
                  <span>View Live Demo</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.div>
              </Link>
              
              <Link to="/fyp-project">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-transparent border-2 border-slate-300 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all w-full sm:w-auto text-center"
                >
                  Explore Project Details
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
