import React, { useState } from 'react';
import { audioDsp } from '../utils/audioDsp';
import { spoofSimulator } from '../utils/spoofSimulation';
import { AudioVisualizer } from './AudioVisualizer';
import { AcousticTelemetry, EnrolledVoiceprint, VerificationResult } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  Square,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Waves,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface SpoofAttackLabProps {
  telemetry: AcousticTelemetry;
  enrolledVoiceprint: EnrolledVoiceprint;
  activeAttack: 'none' | 'replay' | 'tts' | 'noise';
  onSelectAttack: (attack: 'none' | 'replay' | 'tts' | 'noise') => void;
  onRunTestVerification: (attack: 'none' | 'replay' | 'tts' | 'noise') => void;
}

export const SpoofAttackLab: React.FC<SpoofAttackLabProps> = ({
  telemetry,
  enrolledVoiceprint,
  activeAttack,
  onSelectAttack,
  onRunTestVerification,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [noiseController, setNoiseController] = useState<{ stop: () => void } | null>(null);

  const handleSimulateAttackAudio = (attack: 'replay' | 'tts' | 'noise') => {
    if (isPlayingAudio) {
      if (noiseController) {
        noiseController.stop();
        setNoiseController(null);
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    if (attack === 'replay') {
      spoofSimulator.playReplayImpulse();
      setTimeout(() => setIsPlayingAudio(false), 1200);
    } else if (attack === 'tts') {
      spoofSimulator.playSyntheticTtsAttack('Authorize wire transfer seventy four thousand dollars from reserve vault.');
      setTimeout(() => setIsPlayingAudio(false), 3000);
    } else if (attack === 'noise') {
      const controller = spoofSimulator.playBackgroundNoise(8);
      setNoiseController(controller);
      setTimeout(() => {
        setIsPlayingAudio(false);
        setNoiseController(null);
      }, 8000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Spoof Defense & Adversarial Testing Lab
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Biometric Security Radar</span>
              <span>·</span>
              <span>Acoustic Liveness Benchmarking</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeAttack !== 'none' && (
            <button
              onClick={() => {
                if (noiseController) noiseController.stop();
                setIsPlayingAudio(false);
                onSelectAttack('none');
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Reset to Normal
            </button>
          )}
        </div>
      </div>

      {/* Attack Vectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vector 1: Replay Attack */}
        <div
          onClick={() => onSelectAttack(activeAttack === 'replay' ? 'none' : 'replay')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
            activeAttack === 'replay'
              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/20'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-semibold text-slate-200">Replay Attack</h3>
            </div>
            {activeAttack === 'replay' && (
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Active</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Stolen recording played via mobile loudspeaker with steep high-frequency attenuation (&lt;4kHz) and room reverberation.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Target Signature: Speaker Cutoff</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateAttackAudio('replay');
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              <Volume2 className="w-3 h-3 text-orange-400" />
              <span>Simulate Sound</span>
            </button>
          </div>
        </div>

        {/* Vector 2: Synthetic Voice / TTS Deepfake */}
        <div
          onClick={() => onSelectAttack(activeAttack === 'tts' ? 'none' : 'tts')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
            activeAttack === 'tts'
              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/20'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fuchsia-400" />
              <h3 className="text-xs font-semibold text-slate-200">Synthetic Voice Deepfake</h3>
            </div>
            {activeAttack === 'tts' && (
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Active</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            AI neural voice generator with flat monotone pitch contour (micro-jitter &lt;0.005) and phase smearing.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Target Signature: Micro-Jitter &lt;0.01</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateAttackAudio('tts');
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              <Volume2 className="w-3 h-3 text-fuchsia-400" />
              <span>Simulate Voice</span>
            </button>
          </div>
        </div>

        {/* Vector 3: High Background Noise */}
        <div
          onClick={() => onSelectAttack(activeAttack === 'noise' ? 'none' : 'noise')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
            activeAttack === 'noise'
              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 shadow-lg shadow-amber-950/20'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200">High Ambient Noise</h3>
            </div>
            {activeAttack === 'noise' && (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Active</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Simulates crowded subway station / cafe noise at -15 dB to test the real-time DSP spectral cancellation.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Target Signature: Low SNR (&lt;6dB)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateAttackAudio('noise');
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span>{isPlayingAudio ? 'Stop Noise' : 'Inject Noise'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Oscilloscope with Attack Telemetry */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Live Acoustic Radar Visualizer</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Noise Cancellation DSP:</span>
            <button
              onClick={() => audioDsp.setNoiseCancellation(!telemetry.noiseCancelled)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                telemetry.noiseCancelled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {telemetry.noiseCancelled ? 'ACTIVE (FILTERING)' : 'BYPASS (RAW MIC)'}
            </button>
          </div>
        </div>

        <AudioVisualizer
          telemetry={telemetry}
          activeAttack={activeAttack}
          compact={false}
          onToggleNoiseCancellation={(en) => audioDsp.setNoiseCancellation(en)}
        />
      </div>

      {/* Test Attack Action Bar */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">
            Execute Biometric Authentication Simulation
          </span>
          <p className="text-[11px] text-slate-400">
            {activeAttack === 'none'
              ? 'Currently evaluating legitimate enrolled user profile against live audio.'
              : `Evaluating system response to adversarial ${activeAttack.toUpperCase()} attack vector.`}
          </p>
        </div>

        <button
          onClick={() => onRunTestVerification(activeAttack)}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all shrink-0 ${
            activeAttack === 'none'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Test Verification Under {activeAttack.toUpperCase()} Condition</span>
        </button>
      </div>
    </div>
  );
};
