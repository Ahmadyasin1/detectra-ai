import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, Clock, CheckCircle, Play, Pause, BarChart3, BookOpen, Code, TestTube, Zap } from 'lucide-react';

export default function Timeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const projectPhases = [
    {
      phase: 'Literature Review & Dataset Collection',
      startDate: 'Sept 2025',
      endDate: 'Oct 2025',
      duration: '2 Months',
      status: 'In Progress',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      deliverables: ['Dataset Collection', 'Review Report', 'Technology Stack Analysis'],
      progress: 30,
    },
    {
      phase: 'Object Detection & Logo Recognition',
      startDate: 'Oct 2025',
      endDate: 'Dec 2025',
      duration: '3 Months',
      status: 'Planned',
      icon: Code,
      color: 'from-cyan-500 to-green-500',
      deliverables: ['Trained Models', 'Test Logs', 'Integration Scripts'],
      progress: 0,
    },
    {
      phase: 'Motion/Action Recognition',
      startDate: 'Oct 2025',
      endDate: 'Dec 2025',
      duration: '3 Months',
      status: 'Planned',
      icon: Zap,
      color: 'from-green-500 to-yellow-500',
      deliverables: ['Model Development', 'Integration Script', 'Performance Metrics'],
      progress: 0,
    },
    {
      phase: 'Audio Analysis (Speech/Environmental)',
      startDate: 'Nov 2025',
      endDate: 'Jan 2026',
      duration: '2 Months',
      status: 'Planned',
      icon: BarChart3,
      color: 'from-yellow-500 to-orange-500',
      deliverables: ['Transcription System', 'Sound Classification', 'Audio Processing Pipeline'],
      progress: 0,
    },
    {
      phase: 'Multimodal Fusion Engine',
      startDate: 'Dec 2025',
      endDate: 'Jan 2026',
      duration: '1 Month',
      status: 'Planned',
      icon: CheckCircle,
      color: 'from-orange-500 to-red-500',
      deliverables: ['Transformer Fusion Prototype', 'Integration Framework', 'Performance Benchmarks'],
      progress: 0,
    },
    {
      phase: 'Dashboard Development',
      startDate: 'Jan 2026',
      endDate: 'Feb 2026',
      duration: '2 Weeks',
      status: 'Planned',
      icon: BarChart3,
      color: 'from-red-500 to-pink-500',
      deliverables: ['Web UI', 'Timeline Visualization', 'Interactive Reports'],
      progress: 0,
    },
    {
      phase: 'Testing, Integration & Finalization',
      startDate: 'Feb 2026',
      endDate: 'Feb 2026',
      duration: '1 Week',
      status: 'Planned',
      icon: TestTube,
      color: 'from-pink-500 to-purple-500',
      deliverables: ['Final System Report', 'Demo Video', 'Documentation'],
      progress: 0,
    },
  ];

  const milestones = [
    { date: 'Sept 2025', milestone: 'Project Kickoff', status: 'completed' },
    { date: 'Oct 2025', milestone: 'Dataset Collection Complete', status: 'in-progress' },
    { date: 'Dec 2025', milestone: 'Core Modules Development', status: 'planned' },
    { date: 'Jan 2026', milestone: 'Fusion Engine Integration', status: 'planned' },
    { date: 'Feb 2026', milestone: 'Final Testing & Demo', status: 'planned' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Play className="w-4 h-4" />;
      case 'Planned':
        return <Pause className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Planned':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      case 'Completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
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
              Project <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Timeline</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Comprehensive project roadmap and development phases
            </p>
          </motion.div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">12</div>
              <div className="text-gray-300 text-sm">Months Duration</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">7</div>
              <div className="text-gray-300 text-sm">Major Phases</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">30%</div>
              <div className="text-gray-300 text-sm">Progress</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">25+</div>
              <div className="text-gray-300 text-sm">Deliverables</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gantt Chart Section */}
      <section className="py-20 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Gantt <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Chart</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Visual representation of project timeline and dependencies
            </p>
          </motion.div>

          {/* Embedded Gantt Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-xl" />
            
            <div className="relative rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20 overflow-hidden">
              <iframe
                src="/gantt-chart.html"
                className="w-full h-[600px] border-0"
                title="Project Gantt Chart"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Phases Section */}
      <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Project <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Phases</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Detailed breakdown of development phases and deliverables
            </p>
          </motion.div>

          <div className="space-y-8">
            {projectPhases.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${phase.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                          <phase.icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">{phase.phase}</h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">{phase.startDate} - {phase.endDate}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{phase.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(phase.status)}`}>
                        {getStatusIcon(phase.status)}
                        <span className="text-sm font-semibold">{phase.status}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 text-sm">Progress</span>
                        <span className="text-cyan-400 text-sm font-semibold">{phase.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${phase.color} transition-all duration-1000`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <h4 className="text-white font-semibold mb-3">Key Deliverables:</h4>
                      <div className="flex flex-wrap gap-2">
                        {phase.deliverables.map((deliverable, delIndex) => (
                          <span
                            key={delIndex}
                            className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs"
                          >
                            {deliverable}
                          </span>
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

      {/* Milestones Section */}
      <section className="py-20 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Key <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Milestones</span>
            </h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto">
              Important project milestones and checkpoints
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-600" />

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.date}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative flex items-center gap-6"
                  >
                    {/* Timeline Dot */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 ${
                      milestone.status === 'completed' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : milestone.status === 'in-progress'
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      {milestone.status === 'completed' ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : milestone.status === 'in-progress' ? (
                        <Play className="w-8 h-8 text-white" />
                      ) : (
                        <Clock className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Milestone Content */}
                    <div className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{milestone.milestone}</h3>
                          <p className="text-gray-300">{milestone.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          milestone.status === 'completed' 
                            ? 'text-green-400 bg-green-500/20 border border-green-500/30'
                            : milestone.status === 'in-progress'
                            ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                            : 'text-gray-400 bg-gray-500/20 border border-gray-500/30'
                        }`}>
                          {milestone.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
