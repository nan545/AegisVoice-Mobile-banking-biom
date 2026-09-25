import React, { useEffect, useRef, useState } from 'react';
import { audioDsp } from '../utils/audioDsp';
import { AcousticTelemetry } from '../types';
import { Activity, ShieldCheck, ShieldAlert, Waves, Mic, MicOff } from 'lucide-react';

interface AudioVisualizerProps {
  telemetry: AcousticTelemetry;
  isRecording?: boolean;
  compact?: boolean;
  activeAttack?: 'none' | 'replay' | 'tts' | 'noise';
  onToggleNoiseCancellation?: (enabled: boolean) => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  telemetry,
  isRecording = false,
  compact = false,
  activeAttack = 'none',
  onToggleNoiseCancellation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'waveform' | 'spectrum'>('waveform');

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Dark obsidian background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSteps = 4;
      for (let i = 1; i < gridSteps; i++) {
        const y = (height / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (viewMode === 'waveform') {
        const wave = audioDsp.getRawWaveform();

        // Draw Noise Threshold bounds
        const noiseLevel = Math.max(0.04, Math.min(0.3, Math.abs(telemetry.noiseFloorDb) / 200));
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2 - noiseLevel * height * 0.4);
        ctx.lineTo(width, height / 2 - noiseLevel * height * 0.4);
        ctx.moveTo(0, height / 2 + noiseLevel * height * 0.4);
        ctx.lineTo(width, height / 2 + noiseLevel * height * 0.4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw primary speech waveform
        ctx.lineWidth = 2;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);

        if (activeAttack === 'replay') {
          gradient.addColorStop(0, '#f97316');
          gradient.addColorStop(1, '#ef4444');
        } else if (activeAttack === 'tts') {
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(1, '#8b5cf6');
        } else if (telemetry.noiseCancelled) {
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#3b82f6');
        } else {
          gradient.addColorStop(0, '#94a3b8');
          gradient.addColorStop(1, '#64748b');
        }

        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / wave.length;
        let x = 0;

        for (let i = 0; i < wave.length; i++) {
          const v = wave[i];
          const y = (v * height) / 2 + height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = telemetry.speechDetected ? 8 : 0;
        ctx.shadowColor = telemetry.noiseCancelled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)';
      } else {
        // Frequency Spectrum Bars
        const spectrum = audioDsp.getFrequencySpectrum();
        const barWidth = (width / spectrum.length) * 2.2;
        let x = 0;

        for (let i = 0; i < spectrum.length / 2; i++) {
          const barHeight = (spectrum[i] / 255) * height * 0.85;

          // Color coded based on telephone / human speech formant zone (300Hz - 3400Hz)
          if (i >= 8 && i <= 45) {
            ctx.fillStyle = telemetry.noiseCancelled ? '#10b981' : '#0ea5e9';
          } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          }

          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewMode, telemetry, activeAttack]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Visualizer Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isRecording ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </>
            ) : telemetry.speechDetected ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
            )}
          </span>
          <span className="font-medium text-slate-200">
            {isRecording ? 'Acoustic Signal Live' : telemetry.speechDetected ? 'Voice Activity Detected' : 'Monitoring Audio'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono tabular-nums">
            {telemetry.speechDetected ? `${telemetry.pitchHz} Hz` : 'Quiet'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode switch */}
          <div className="flex items-center p-0.5 bg-slate-800 rounded-md">
            <button
              onClick={() => setViewMode('waveform')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                viewMode === 'waveform' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setViewMode('spectrum')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                viewMode === 'spectrum' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spectrum
            </button>
          </div>

          {/* Noise Cancellation Toggle */}
          {onToggleNoiseCancellation && (
            <button
              onClick={() => onToggleNoiseCancellation(!telemetry.noiseCancelled)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${
                telemetry.noiseCancelled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Real-Time Noise Suppression DSP Chain"
            >
              <Waves className="w-3 h-3" />
              <span>{telemetry.noiseCancelled ? 'DSP Active' : 'DSP Bypass'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={compact ? 480 : 640}
          height={compact ? 110 : 150}
          className="w-full block"
        />

        {/* Attack Overlay Indicator if active */}
        {activeAttack !== 'none' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-rose-950/80 border border-rose-500/40 rounded text-[11px] text-rose-300">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {activeAttack === 'replay' ? 'Replay Attack Simulated' : activeAttack === 'tts' ? 'TTS Deepfake Simulated' : 'High Noise Injected'}
            </span>
          </div>
        )}
      </div>

      {/* Telemetry Row */}
      <div className="grid grid-cols-4 gap-2 px-3.5 py-2 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div>
          <span className="text-slate-500 block text-[10px]">SNR (Signal/Noise)</span>
          <span className={`font-mono tabular-nums font-semibold ${telemetry.snr > 12 ? 'text-emerald-400' : 'text-amber-400'}`}>
            +{telemetry.snr} dB
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Noise Floor</span>
          <span className="font-mono tabular-nums text-slate-300 font-medium">
            {telemetry.noiseFloorDb} dB
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Vocal Jitter (Flutter)</span>
          <span className={`font-mono tabular-nums font-medium ${telemetry.microJitter < 0.01 ? 'text-rose-400' : 'text-slate-300'}`}>
            {telemetry.microJitter.toFixed(3)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Spectral Rolloff</span>
          <span className={`font-mono tabular-nums font-medium ${telemetry.spectralRolloff < 4200 ? 'text-amber-400' : 'text-slate-300'}`}>
            {(telemetry.spectralRolloff / 1000).toFixed(1)} kHz
          </span>
        </div>
      </div>
    </div>
  );
};
