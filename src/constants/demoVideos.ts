/** Labeled sample clips shown on Home hero and Demo page (override via VITE_HERO_VIDEO_URLS). */

export type DemoClip = {
  id: string;
  title: string;
  scenario: string;
  description: string;
  highlights: string[];
  src: string;
};

export const DEFAULT_DEMO_CLIPS: DemoClip[] = [
  {
    id: 'street',
    title: 'Street surveillance',
    scenario: 'Tracking & detection',
    description:
      'Persistent person IDs, vehicle tracks, and scene context on a busy street — the kind of footage security teams review daily.',
    highlights: ['ByteTrack IDs', 'Multi-class detection', 'Event timeline'],
    src: 'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/2ad58a3a_labeled%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvMmFkNThhM2FfbGFiZWxlZCAoMSkubXA0IiwiaWF0IjoxNzc3Nzk1NTYxLCJleHAiOjIwOTMxNTU1NjF9.oDpA57BCjwoDtsBvhA6gbQGBKhnCDXVo6c7_7e1lN6k',
  },
  {
    id: 'public',
    title: 'Public space',
    scenario: 'Activity context',
    description:
      'Crowd density, movement patterns, and audio-visual fusion cues help analysts understand what happened without watching every frame.',
    highlights: ['Crowd analytics', 'Speech + vision', 'Risk scoring'],
    src: 'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/53894342_labeled%20(1)%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvNTM4OTQzNDJfbGFiZWVsZCAoMSkgKDEpLm1wNCIsImlhdCI6MTc3Nzc5NTcxNiwiZXhwIjoyMDkzMTU1NzE2fQ.kA1uC6KXy2AQcbj9GNzAS8k3F3QT-ZkCgFwbn1RHN4c',
  },
  {
    id: 'traffic',
    title: 'Traffic scene',
    scenario: 'Multi-object fusion',
    description:
      'Vehicles, pedestrians, and environmental audio classified together — ideal for intersections, lots, and perimeter cameras.',
    highlights: ['Vehicle classes', 'Anomaly fusion', 'Export-ready report'],
    src: 'https://txkwnceefmaotmqluajc.supabase.co/storage/v1/object/sign/videos/080e267f_labeled%20(1)%20(1).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85M2I5Nzc3Ny03Y2UzLTQ4ODItODI1My0wMTE5ODRkMDcwYjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvMDgwZTI2N2ZfbGFiZWxlZCAoMSkgKDEpLm1wNCIsImlhdCI6MTc3Nzc5NTk2NSwiZXhwIjoyMDkzMTU1OTY1fQ.pnBDCPCiWGytwi_WQfZuYoDPbgTKMrySyYxPkvXNfDg',
  },
];

export function getDemoClips(): DemoClip[] {
  const fromEnv = (import.meta.env.VITE_HERO_VIDEO_URLS as string | undefined)
    ?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (!fromEnv?.length) return DEFAULT_DEMO_CLIPS;

  return fromEnv.map((src, i) => {
    const base = DEFAULT_DEMO_CLIPS[i % DEFAULT_DEMO_CLIPS.length];
    return { ...base, src };
  });
}
