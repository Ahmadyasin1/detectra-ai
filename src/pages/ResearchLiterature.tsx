import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { BookOpen, ExternalLink, Quote, Award, TrendingUp, Users, Calendar } from 'lucide-react';

export default function ResearchLiterature() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const researchPapers = [
    {
      id: 1,
      title: 'Learning Transferable Visual Models From Natural Language Supervision',
      authors: 'A. Radford et al.',
      venue: 'ICML',
      year: 2021,
      impact: 'High',
      relevance: 'Foundation for multimodal understanding',
      description: 'CLIP model that learns visual representations from natural language supervision, enabling zero-shot image classification.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'Flamingo: A Visual Language Model for Few-Shot Learning',
      authors: 'J.-B. Alayrac et al.',
      venue: 'DeepMind',
      year: 2022,
      impact: 'High',
      relevance: 'Multimodal few-shot learning',
      description: 'A visual language model that can learn from few examples, combining vision and language understanding.',
      color: 'from-cyan-500 to-green-500',
    },
    {
      id: 3,
      title: 'GPT-4 Technical Report',
      authors: 'OpenAI',
      venue: 'OpenAI',
      year: 2023,
      impact: 'Very High',
      relevance: 'Large language model capabilities',
      description: 'Technical report on GPT-4, showcasing advanced language understanding and multimodal capabilities.',
      color: 'from-green-500 to-yellow-500',
    },
    {
      id: 4,
      title: 'End-to-End Object Detection with Transformers',
      authors: 'N. Carion et al.',
      venue: 'ECCV',
      year: 2020,
      impact: 'High',
      relevance: 'Object detection architecture',
      description: 'DETR model that treats object detection as a direct set prediction problem using transformers.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 5,
      title: 'wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations',
      authors: 'A. Baevski et al.',
      venue: 'NeurIPS',
      year: 2020,
      impact: 'High',
      relevance: 'Speech representation learning',
      description: 'Self-supervised learning framework for speech recognition that learns speech representations from raw audio.',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 6,
      title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
      authors: 'A. Dosovitskiy et al.',
      venue: 'ICLR',
      year: 2021,
      impact: 'High',
      relevance: 'Vision transformer architecture',
      description: 'Vision Transformer (ViT) that applies transformers to image recognition tasks with excellent results.',
      color: 'from-red-500 to-pink-500',
    },
    {
      id: 7,
      title: 'Anticipative Video Transformer for Recognition and Forecasting',
      authors: 'R. Girdhar et al.',
      venue: 'CVPR',
      year: 2021,
      impact: 'Medium',
      relevance: 'Video understanding and prediction',
      description: 'Transformer-based model for video understanding that can anticipate future actions and events.',
      color: 'from-pink-500 to-purple-500',
    },
  ];

  const researchGaps = [
    'Limited integration of real-time multimodal fusion in web applications',
    'Lack of privacy-preserving, API-free video analysis platforms',
    'Insufficient contextual understanding across different modalities',
    'Limited scalability for deployment on standard hardware',
    'Inadequate timeline-based reporting for video analysis insights',
  ];

  const methodology = [
    {
      phase: 'Literature Review',
      description: 'Comprehensive analysis of state-of-the-art multimodal AI models and video analysis techniques',
      deliverables: ['Research Report', 'Technology Stack Selection', 'Architecture Design'],
    },
    {
      phase: 'Dataset Collection',
      description: 'Gathering and curating datasets for object detection, logo recognition, motion analysis, and audio processing',
      deliverables: ['Custom Logo Dataset', 'Video Dataset Collection', 'Audio Dataset Preparation'],
    },
    {
      phase: 'Model Development',
      description: 'Implementing and training individual modules for each modality with optimization for performance',
      deliverables: ['Trained Models', 'Performance Benchmarks', 'Integration Scripts'],
    },
    {
      phase: 'Fusion Engine',
      description: 'Developing transformer-based multimodal fusion engine for contextual alignment',
      deliverables: ['Fusion Architecture', 'Temporal Alignment Module', 'Contextual Understanding Engine'],
    },
    {
      phase: 'System Integration',
      description: 'Integrating all modules into a unified web application with interactive dashboard',
      deliverables: ['Web Application', 'Interactive Dashboard', 'Timeline Reports'],
    },
  ];

  const researchImpact = {
    academic: [
      'Contribution to multimodal AI research community',
      'Novel approach to privacy-preserving video analysis',
      'Open-source implementation for research reproducibility',
    ],
    industry: [
      'Practical solution for surveillance and security applications',
      'Scalable platform for sports analytics and media monitoring',
      'Cost-effective alternative to existing API-dependent solutions',
    ],
    societal: [
      'Enhanced privacy protection in video analysis',
      'Improved accessibility to advanced AI technologies',
      'Support for smart city initiatives and public safety',
    ],
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Research & <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Literature</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Comprehensive literature review and research foundation for Detectra AI
            </p>
          </motion.div>

          {/* Research Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">7</div>
              <div className="text-gray-300 text-sm">Research Papers</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">5</div>
              <div className="text-gray-300 text-sm">Top-Tier Venues</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">2020-2023</div>
              <div className="text-gray-300 text-sm">Publication Years</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">15+</div>
              <div className="text-gray-300 text-sm">Authors Cited</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Research Papers Section */}
      <section className="py-20 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Key <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Research Papers</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Foundational research papers that inform our multimodal video intelligence approach
            </p>
          </motion.div>

          <div className="space-y-8">
            {researchPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-16 h-16 bg-gradient-to-br ${paper.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                          <span className="text-white font-bold text-lg">{paper.id}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{paper.title}</h3>
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <span className="text-gray-400">{paper.authors}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{paper.venue}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{paper.year}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed mb-4">{paper.description}</p>
                          
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              paper.impact === 'Very High' 
                                ? 'text-red-400 bg-red-500/20 border border-red-500/30'
                                : paper.impact === 'High'
                                ? 'text-orange-400 bg-orange-500/20 border border-orange-500/30'
                                : 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                            }`}>
                              {paper.impact} Impact
                            </span>
                            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs">
                              {paper.relevance}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Gaps Section */}
      <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Research <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Gaps</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Key gaps in current research that Detectra AI addresses
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {researchGaps.map((gap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-6 bg-gray-800/50 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">{gap}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-20 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Research <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Methodology</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Systematic approach to developing Detectra AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {methodology.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-4">{phase.description}</p>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Deliverables:</h4>
                      <div className="space-y-1">
                        {phase.deliverables.map((deliverable, delIndex) => (
                          <div key={delIndex} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            <span className="text-gray-300 text-sm">{deliverable}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Impact Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Research <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Impact</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Expected contributions and impact of Detectra AI research
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(researchImpact).map(([category, impacts], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 h-full">
                    <h3 className="text-xl font-bold text-white mb-6 capitalize flex items-center gap-3">
                      <Quote className="w-6 h-6 text-cyan-400" />
                      {category} Impact
                    </h3>
                    
                    <ul className="space-y-3">
                      {impacts.map((impact, impactIndex) => (
                        <li key={impactIndex} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-300 text-sm leading-relaxed">{impact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
