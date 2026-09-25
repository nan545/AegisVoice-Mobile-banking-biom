import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Mic,
  Waves,
  Fingerprint,
  Radio,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: () => void;
}

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Welcome to AegisVoice™ Biometric Shield
              </h2>
              <p className="text-[11px] text-slate-400">
                Next-generation voice authentication for mobile banking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/30 rounded-xl space-y-1.5">
            <span className="font-semibold text-emerald-300 block">
              How Voice Authentication Replaces Insecure SMS & Passwords
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              AegisVoice analyzes your unique vocal tract biology, neuromuscular vocal cord flutter, and speech formants to authorize high-value mobile wires in seconds.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="space-y-2.5">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] block">
              The 4 Multi-Factor Security Layers
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              {/* Layer 1 */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Waves className="w-3.5 h-3.5" />
                  <span>1. Real-Time Audio DSP</span>
                </div>
                <p className="text-slate-400">
                  Filters handling rumbles (85Hz), electrical hum (60Hz), and noisy cafes with dynamic spectral subtraction.
                </p>
              </div>

              {/* Layer 2 */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>2. Vocal Resonance (F0)</span>
                </div>
                <p className="text-slate-400">
                  Extracts 13-dimensional Mel-Frequency Cepstral Coefficients (MFCC) to match your enrolled throat resonance.
                </p>
              </div>

              {/* Layer 3 */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>3. Anti-Spoof ML Shield</span>
                </div>
                <p className="text-slate-400">
                  Detects mobile loudspeaker frequency cutoffs (&lt;4kHz) and robotic AI deepfakes lacking micro-jitter flutter.
                </p>
              </div>

              {/* Layer 4 */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>4. Dynamic Challenge & PIN</span>
                </div>
                <p className="text-slate-400">
                  Generates cryptographic one-time phrases to defeat recorded playback, with PIN step-up on $2,500+ transfers.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onStartSimulation();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Interactive Voice Wire Test</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors"
            >
              Explore Banking Suite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
