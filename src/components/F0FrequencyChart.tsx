import React, { useEffect, useRef, useState } from 'react';
import { AcousticTelemetry, EnrolledVoiceprint } from '../types';
import { Activity, ShieldCheck, Waves, Info } from 'lucide-react';

interface F0FrequencyChartProps {
  telemetry: AcousticTelemetry;
  enrolledVoiceprint: EnrolledVoiceprint;
  compact?: boolean;
}

export const F0FrequencyChart: React.FC<F0FrequencyChartProps> = ({
  telemetry,
  enrolledVoiceprint,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baselineF0 = enrolledVoiceprint.pitchMean || 162;
  const tolerance = enrolledVoiceprint.pitchVariance || 15; // ±15Hz corridor

  // Rolling history of F0 values (36 points)
  const historyRef = useRef<number[]>([]);
  const [pitchDelta, setPitchDelta] = useState<number>(0);
  const [matchPercent, setMatchPercent] = useState<number>(98);

  // Initialize history with baseline
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = new Array(36).fill(baselineF0);
    }
  }, [baselineF0]);

  // Push new F0 reading when telemetry updates
  useEffect(() => {
    let currentPitch = telemetry.pitchHz;

    // If quiet or non-speech, gently decay towards baseline or maintain last steady voice pitch
    if (!telemetry.speechDetected || currentPitch < 60 || currentPitch > 400) {
      const last = historyRef.current[historyRef.current.length - 1] || baselineF0;
      currentPitch = last * 0.96 + baselineF0 * 0.04;
    }

    const history = historyRef.current;
    history.push(currentPitch);
    if (history.length > 36) {
      history.shift();
    }

    const delta = Math.round(currentPitch - baselineF0);
    setPitchDelta(delta);

    const diff = Math.abs(delta);
    const score = Math.max(40, Math.min(100, Math.round(100 - (diff / tolerance) * 12)));
    setMatchPercent(score);
  }, [telemetry.pitchHz, telemetry.speechDetected, baselineF0, tolerance]);

  // Smooth canvas rendering
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Min and max frequency bounds for the Y axis (e.g. 100Hz to 240Hz centered on baseline)
      const minFreq = Math.max(70, baselineF0 - 65);
      const maxFreq = minFreq + 130;

      const freqToY = (f: number) => {
        const clamped = Math.max(minFreq, Math.min(maxFreq, f));
        return height - ((clamped - minFreq) / (maxFreq - minFreq)) * (height - 18) - 9;
      };

      // Clear with dark obsidian background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Biometric Tolerance Corridor Band (±tolerance around baseline)
      const corridorTop = freqToY(baselineF0 + tolerance);
      const corridorBottom = freqToY(baselineF0 - tolerance);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(0, corridorTop, width, corridorBottom - corridorTop);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, corridorTop);
      ctx.lineTo(width, corridorTop);
      ctx.moveTo(0, corridorBottom);
      ctx.lineTo(width, corridorBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Enrolled Baseline Target Line (F0)
      const baselineY = freqToY(baselineF0);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(width, baselineY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Smooth Bezier Line for Real-Time F0
      const history = historyRef.current;
      if (history.length > 1) {
        const points = history.map((f, idx) => ({
          x: (idx / (history.length - 1)) * width,
          y: freqToY(f),
        }));

        // Draw Filled Gradient under curve
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, telemetry.speechDetected ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.1)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw Smooth Line Stroke
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

        ctx.strokeStyle = telemetry.speechDetected ? '#38bdf8' : 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Draw Current Pitch Pulse Head
        const lastPt = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x - 2, lastPt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = telemetry.speechDetected ? '#38bdf8' : '#94a3b8';
        ctx.fill();

        if (telemetry.speechDetected) {
          ctx.beginPath();
          ctx.arc(lastPt.x - 2, lastPt.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [baselineF0, tolerance, telemetry.speechDetected]);

  const currentDisplayPitch = telemetry.speechDetected ? telemetry.pitchHz : baselineF0;
  const isWithinCorridor = Math.abs(pitchDelta) <= tolerance;

  return (
    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2.5 backdrop-blur-md">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Activity className="w-3 h-3" />
          </div>
          <div>
            <span className="font-semibold text-slate-200 block text-[11px]">
              Fundamental Frequency ($F_0$) Stream
            </span>
            <span className="text-[10px] text-slate-500 block">
              Acoustic Resonance vs Enrolled Baseline
            </span>
          </div>
        </div>

        {/* Live Pitch Delta Badge */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span
            className={`px-2 py-0.5 rounded-md border font-semibold ${
              isWithinCorridor
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
            }`}
          >
            {telemetry.speechDetected ? `${currentDisplayPitch} Hz` : `${baselineF0} Hz (Calibrated)`}
          </span>
        </div>
      </div>

      {/* Smooth Canvas Graph Area */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={compact ? 360 : 420}
          height={compact ? 80 : 96}
          className="w-full block"
        />

        {/* Overlaid Axis Markers */}
        <div className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          <span>Enrolled Baseline: {baselineF0} Hz (±{tolerance}Hz)</span>
        </div>

        <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-500">
          {telemetry.speechDetected ? (
            <span className="text-sky-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block"></span>
              Live Tracking (Δ {pitchDelta >= 0 ? `+${pitchDelta}` : pitchDelta} Hz)
            </span>
          ) : (
            <span className="text-slate-600">Ambient Baseline</span>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Legend */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span>
            <span className="text-slate-400">Baseline Target</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-sky-400 inline-block"></span>
            <span className="text-slate-400">Current Vocal Pitch</span>
          </span>
        </div>

        <div className="font-mono text-slate-300">
          Resonance:{' '}
          <span className={matchPercent > 85 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {matchPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
