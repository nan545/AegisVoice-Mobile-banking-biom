import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Mic,
  Fingerprint,
  Send,
  Waves,
  Volume2,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  Smartphone,
  Sliders,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
  onStartTransfer: (amount: number, recipient: string) => void;
  onOpenSpoofLab: () => void;
  onToggleAudioSource: () => void;
  isSimulatedAudio: boolean;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onStartCalibration,
  onStartTransfer,
  onOpenSpoofLab,
  onToggleAudioSource,
  isSimulatedAudio,
}) => {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'biometrics' | 'mfa' | 'spoofs' | 'accessibility'>('quickstart');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="user-guide-title" className="text-sm font-semibold text-slate-100">
                AegisVoice System Guide & Quick Tour
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Production Security Engine</span>
                <span aria-hidden="true">·</span>
                <span>User Onboarding & Capabilities</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close user guide"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800/80 gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveSection('quickstart')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'quickstart'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick-Start Steps
          </button>
          <button
            onClick={() => setActiveSection('biometrics')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'biometrics'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Voiceprint Biometrics
          </button>
          <button
            onClick={() => setActiveSection('mfa')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'mfa'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Adaptive MFA Tiers
          </button>
          <button
            onClick={() => setActiveSection('spoofs')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'spoofs'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Spoof Defense Radar
          </button>
          <button
            onClick={() => setActiveSection('accessibility')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'accessibility'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Accessibility & Mic Modes
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          {activeSection === 'quickstart' && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Welcome to <strong className="text-white font-semibold">AegisVoice</strong>, a voice-based biometric authentication system with machine learning anti-spoof detection, real-time audio DSP noise cancellation, and multi-factor verification engineered for mobile banking.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Step 1 */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">STEP 01</span>
                      <Mic className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="text-slate-100 font-semibold text-xs mt-1">Calibrate & Adjust Strictness</h3>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Enroll your vocal tract baseline or use the Sensitivity Slider (50% to 95%) to balance false acceptance vs false rejection rates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onStartCalibration();
                    }}
                    className="w-full mt-2 py-2 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Calibration Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400 font-mono text-[11px] font-semibold">STEP 02</span>
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="text-slate-100 font-semibold text-xs mt-1">Execute a Voice-Verified Wire</h3>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Initiate a transfer. Speak the one-time cryptographic challenge phrase into your microphone (or click Auto-Speak).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onStartTransfer(1250, 'Sovereign Escrow Ltd');
                    }}
                    className="w-full mt-2 py-2 px-3 bg-sky-600/90 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Test $1,250 2-Factor Wire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-mono text-[11px] font-semibold">STEP 03</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="text-slate-100 font-semibold text-xs mt-1">Simulate Adversarial Attacks</h3>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Test Replay Attacks, Synthetic AI TTS Clones, and Subway Noise in the Spoof Attack Lab to see the biometric radar block fraud.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSpoofLab();
                    }}
                    className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Spoof Attack Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 4 */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-mono text-[11px] font-semibold">STEP 04</span>
                      <Waves className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="text-slate-100 font-semibold text-xs mt-1">Universal Device & Mic Ready</h3>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Works on any browser. No microphone? The built-in Synthetic Acoustic Simulator lets you test 100% of features seamlessly.
                    </p>
                  </div>
                  <button
                    onClick={onToggleAudioSource}
                    className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{isSimulatedAudio ? 'Switch to Hardware Mic' : 'Switch to Synthetic Mode'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'biometrics' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Vocal Tract Acoustic Feature Extraction</h3>
              <p>
                Unlike generic voice passwords, AegisVoice analyzes the physical physiology of the speaker&apos;s vocal tract through digital signal processing (DSP):
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="font-semibold text-slate-200">Fundamental Frequency (F0 Pitch)</div>
                  <div className="text-slate-400 mt-1">
                    Extracted via autocorrelation and parabolic interpolation. Visualized in real time on the account overview against the user&apos;s enrolled baseline (e.g. 162 Hz ±15 Hz).
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="font-semibold text-slate-200">Micro-Jitter & Pitch Period Perturbation</div>
                  <div className="text-slate-400 mt-1">
                    Measures cycle-to-cycle frequency variations natural to living human vocal cords. Synthetic speech models produce artificially flat pitch contours (jitter &lt; 0.012), instantly triggering anti-spoof rejection.
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="font-semibold text-slate-200">13-Dimensional MFCC Spectral Signature</div>
                  <div className="text-slate-400 mt-1">
                    Mel-Frequency Cepstral Coefficients model the resonance cavity of the pharynx, tongue, and lips, producing a mathematical biometric voiceprint that cannot be bypassed with simple pitch shifting.
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="font-semibold text-slate-200">Matching Sensitivity Slider (50% to 95%)</div>
                  <div className="text-slate-400 mt-1">
                    Empowers users to tune algorithm strictness. 65% for convenience / hoarse voices, 75% for balanced retail banking (EER), and 92% for institutional vault zero-tolerance security.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'mfa' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Adaptive Multi-Factor Verification Tiers</h3>
              <p>
                To provide both low user friction for daily payments and institutional-grade protection for high-value wires, AegisVoice automatically scales verification factors based on transaction risk:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                    <span>LOW RISK: Under $250</span>
                    <span className="font-mono text-[11px]">1-Factor Security</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1.5">
                    Fast voice verification with background noise cancellation. Compares acoustic MFCC features to enrolled profile.
                  </p>
                </div>

                <div className="p-3.5 bg-sky-950/30 border border-sky-500/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-sky-300">
                    <span>MEDIUM RISK: $250 to $2,500</span>
                    <span className="font-mono text-[11px]">2-Factor Security</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1.5">
                    Requires voice biometric matching + a dynamic cryptographic one-time challenge passphrase (e.g. &quot;Sapphire Horizon 742&quot;) to defeat pre-recorded replays.
                  </p>
                </div>

                <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                    <span>HIGH RISK: $2,500 and above</span>
                    <span className="font-mono text-[11px]">3-Factor Security + Liveness + PIN</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1.5">
                    Enforces voice biometric match + deep anti-spoof liveness inspection + cryptographic dynamic challenge validation + 6-digit hardware device PIN.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'spoofs' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Machine Learning Anti-Spoof Radar</h3>
              <p>
                Attackers commonly attempt voice cloning and replay attacks. AegisVoice deploys multi-spectral anomaly detection:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-rose-400 font-semibold text-xs block">Replay Detection</span>
                  <p className="text-slate-400 text-[11px]">
                    Detects speaker transducer roll-off (&lt;100 Hz attenuation), high-frequency loudspeaker compression (&gt;7 kHz cutoff), and indoor room impulse reverberation.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-rose-400 font-semibold text-xs block">Synthetic TTS Clones</span>
                  <p className="text-slate-400 text-[11px]">
                    Identifies robotic micro-jitter anomalies, unnatural harmonic symmetry, and lack of biological breath intervals.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-rose-400 font-semibold text-xs block">Noise Resilience</span>
                  <p className="text-slate-400 text-[11px]">
                    85Hz highpass filter + 60Hz hum notch + 1.85kHz formant peaking preserves vocal intelligibility even under heavy ambient cafe or transit noise.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'accessibility' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Accessibility & Device Compatibility</h3>
              <p>
                AegisVoice is built to be accessible to all users, including non-verbal users, hard-of-hearing individuals, and users on devices without working microphones:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Audio Preview for Challenges & Enrollment</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Click the speaker icon next to any challenge phrase or calibration step to hear it pronounced clearly via browser speech synthesis.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Auto-Speak / Simulation Mode (No Microphone Needed)</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Users in quiet spaces or without microphone hardware can click &quot;Auto-Speak / Simulate Voice&quot; to complete any verification or calibration without speaking out loud.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Full Mobile & Responsive Layout</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Toggle between Mobile Phone View and Enterprise Dual Station at any time. Touch targets comply with accessibility standards (≥44px on mobile).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Audio Mode:</span>
            <span className={isSimulatedAudio ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
              {isSimulatedAudio ? 'Synthetic Acoustic Simulation' : 'Live Hardware Microphone'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
          >
            Got it, Let&apos;s Start
          </button>
        </div>
      </div>
    </div>
  );
};
