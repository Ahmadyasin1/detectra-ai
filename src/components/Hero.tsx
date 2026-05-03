import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HERO_VIDEOS = [
  'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/2ad58a3a_labeled%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvMmFkNThhM2FfbGFiZWxlZCAoMSkubXA0IiwiaWF0IjoxNzc3Nzk1NTYxLCJleHAiOjIwOTMxNTU1NjF9.oDpA57BCjwoDtsBvhA6gbQGBKhnCDXVo6c7_7e1lN6k',
  'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/53894342_labeled%20(1)%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvNTM4OTQzNDJfbGFiZWxlZCAoMSkgKDEpLm1wNCIsImlhdCI6MTc3Nzc5NTcxNiwiZXhwIjoyMDkzMTU1NzE2fQ.kA1uC6KXy2AQcbj9GNzAS8k3F3QT-ZkCgFwbn1RHN4c',
  'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/080e267f_labeled%20(1)%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvMDgwZTI2N2ZfbGFiZWxlZCAoMSkgKDEpLm1wNCIsImlhdCI6MTc3Nzc5NTk2NSwiZXhwIjoyMDkzMTU1OTY1fQ.pnBDCPCiWGytwi_WQfZuYoDPbgTKMrySyYxPkvXNfDg',
];

export default function Hero() {
  const { user } = useAuth();
  const [activeVideo, setActiveVideo] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [failedVideos, setFailedVideos] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getNextVideoIndex = (current: number, skipped: number[]) => {
    const seen = new Set<number>();
    let next = (current + 1) % HERO_VIDEOS.length;
    while (skipped.includes(next) && !seen.has(next)) {
      seen.add(next);
      next = (next + 1) % HERO_VIDEOS.length;
    }
    return next;
  };

  const advanceVideo = (skipped?: number[]) => {
    setActiveVideo((current) => getNextVideoIndex(current, skipped ?? failedVideos));
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      advanceVideo();
    }, 11000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setVideoReady(false);
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.load();
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Autoplay may be blocked in some browsers; muted play should still work.
      });
    }
  }, [activeVideo]);

  return (
    <section className="relative min-h-[90vh] bg-black text-white flex flex-col items-center justify-center overflow-hidden pt-32 pb-16 px-6">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto w-full z-10 text-center flex flex-col items-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-cyan-300 text-[11px] font-semibold tracking-widest uppercase shadow-2xl">
            Detectra AI V4.1
          </span>
        </motion.div>

        {/* Headlines */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
        >
          See everything.<br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-transparent bg-clip-text">
            Miss nothing.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl text-gray-400 text-lg md:text-xl font-medium mb-10 leading-relaxed"
        >
          Upload surveillance footage and instantly track threats, analyze audio anomalies, and gain complete intelligence through state-of-the-art multimodal AI.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          {user ? (
            <Link to="/analyze">
              <button className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm tracking-wide hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          ) : (
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))} className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm tracking-wide hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <Link to="/demo">
            <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide hover:bg-white/10 transition-all backdrop-blur-md">
              <Play className="w-4 h-4 fill-white shrink-0" />
              Watch Demo
            </button>
          </Link>
        </motion.div>

        {/* Cinematic Demo Video Container */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl aspect-video rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-white/0 shadow-[0_0_80px_rgba(0,0,0,0.8)] filter drop-shadow-[0_20px_50px_rgba(6,182,212,0.15)] group"
        >
          <div className="absolute inset-0 bg-black rounded-3xl overflow-hidden z-0">
            <video
              ref={videoRef}
              key={activeVideo}
              src={HERO_VIDEOS[activeVideo]}
              autoPlay
              muted
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              controls={false}
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23000'/%3E%3C/svg%3E"
              onCanPlay={() => {
                setVideoReady(true);
                setErrorCount(0);
              }}
              onLoadedData={() => setVideoReady(true)}
              onError={() => {
                console.warn('Hero video failed to load', HERO_VIDEOS[activeVideo]);
                setErrorCount((count) => count + 1);
                setFailedVideos((current) => {
                  const updated = current.includes(activeVideo) ? current : [...current, activeVideo];
                  setActiveVideo(getNextVideoIndex(activeVideo, updated));
                  return updated;
                });
              }}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-1000 bg-black"
            />

            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="rounded-3xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md text-sm text-white/80">
                  {errorCount > 0 ? 'Switching to the next feed…' : 'Loading live demo video…'}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.55),_transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/60 rounded-3xl px-5 py-3 text-center border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/85 mb-1">Live video showcase</p>
                <p className="text-sm sm:text-base text-white/90 font-semibold">Real-time risk detection demo, switching between recorded surveillance feeds.</p>
              </div>
            </div>

            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/70 to-transparent flex items-center px-4 gap-2 z-10 backdrop-blur-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              <div className="mx-auto text-[10px] font-mono text-cyan-300 font-semibold tracking-widest uppercase opacity-70">
                Detectra Engine Active
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/18 to-transparent opacity-70 z-10 pointer-events-none mix-blend-screen" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
