import React, { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const BARS = [28, 47, 36, 62, 43, 74, 52, 33, 67, 45, 82, 54, 37, 70, 48, 91, 58, 40, 76, 50, 64, 35, 84, 47, 69, 42, 96, 57, 38, 72, 49, 86, 60, 34, 78, 53, 66, 41, 89, 55];
export const formatVoiceTime = value => {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export function RecordingWaveform() {
  return <div aria-hidden="true" className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[2px] overflow-hidden px-1">
    {BARS.map((height, index) => <span key={index} className="voice-recording-bar w-[2px] shrink-0 rounded-full bg-rose-500" style={{ height: `${height}%`, animationDelay: `${(index % 9) * -70}ms` }} />)}
  </div>;
}

export default function VoiceNotePlayer({ src, outgoing = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration ? currentTime / duration : 0;
  const muted = outgoing ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400';
  const barsDone = outgoing ? 'bg-blue-100' : 'bg-primary';
  const barsRemaining = outgoing ? 'bg-blue-100/45' : 'bg-gray-300 dark:bg-slate-600';

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch { setPlaying(false); }
    } else audio.pause();
  };

  return <div className="flex w-[230px] max-w-full min-w-0 items-center gap-2.5" aria-label="Voice message">
    <audio
      ref={audioRef}
      src={src}
      preload="metadata"
      aria-hidden="true"
      className="hidden"
      onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setCurrentTime(0); }}
    />
    <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause voice message' : 'Play voice message'} className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${outgoing ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-blue-50 text-primary hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-900/60'}`}>
      {playing ? <Pause className="h-5 w-5" fill="currentColor" aria-hidden="true" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true" />}
    </button>
    <div className="min-w-0 flex-1">
      <div className="relative flex h-8 items-center justify-between gap-[2px] rounded focus-within:ring-2 focus-within:ring-blue-400">
        {BARS.map((height, index) => <span key={index} aria-hidden="true" className={`w-[2px] shrink-0 rounded-full ${index / BARS.length <= progress ? barsDone : barsRemaining}`} style={{ height: `${height}%` }} />)}
        <input
          type="range"
          min="0"
          max={Math.max(duration, 0.1)}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          disabled={!duration}
          aria-label="Seek voice message"
          onChange={event => {
            const next = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = next;
            setCurrentTime(next);
          }}
          className="voice-wave-range absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>
      <div className={`flex justify-between text-[10px] tabular-nums ${muted}`}><span>{formatVoiceTime(currentTime)}</span><span>{formatVoiceTime(duration)}</span></div>
    </div>
  </div>;
}
