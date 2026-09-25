import React, { useState, useEffect } from 'react';
import { audioDsp } from '../utils/audioDsp';
import { AudioVisualizer } from './AudioVisualizer';
import { EnrolledVoiceprint, AcousticTelemetry } from '../types';
import {
  Mic,
  CheckCircle2,
  ShieldCheck,
  Waves,
  RefreshCw,
  Sliders,
  Gauge,
  Info,
  Save,
  AlertTriangle,
  Lock,
  ChevronRight,
  Volume2,
  Sparkles,
  X,
} from 'lucide-react';

interface VoiceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoiceprint: EnrolledVoiceprint;
  telemetry: AcousticTelemetry;
  onEnrollmentComplete: (newProfile: EnrolledVoiceprint) => void;
}

const ENROLLMENT_PHRASES = [
  'My voice is an authenticated biometric signature for secure mobile banking.',
  'Aegis protocol sovereign security delta nine authorize.',
  'Biometric vocal tract verification confirmed for vault transfers.',
];

export const VoiceEnrollmentModal: React.FC<VoiceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  currentVoiceprint,
  telemetry,
  onEnrollmentComplete,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'calibration' | 'sensitivity'>('calibration');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState<{ pitch: number; jitter: number; mfcc: number[] }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Strictness / Sensitivity slider (50% to 95%, default 75%)
  const [sensitivity, setSensitivity] = useState<number>(currentVoiceprint.sensitivity ?? 75);
  const [savedSensitivityNotice, setSavedSensitivityNotice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync sensitivity if currentVoiceprint changes
  useEffect(() => {
    if (currentVoiceprint.sensitivity) {
      setSensitivity(currentVoiceprint.sensitivity);
    }
  }, [currentVoiceprint.sensitivity]);

  if (!isOpen) return null;

  const currentPhrase = ENROLLMENT_PHRASES[currentStepIndex];

  const handlePronounceCurrentPhrase = () => {
    if ('speechSynthesis' in window && currentPhrase) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      const ut = new SpeechSynthesisUtterance(currentPhrase);
      ut.rate = 0.95;
      ut.onend = () => setIsPlayingAudio(false);
      ut.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(ut);
    }
  };

  // Biometric Error Rate Calculations (FAR vs FRR)
  const calculateFar = (val: number): number => {
    // Exponential decay: at 50% ~ 4.8%, at 75% ~ 0.45%, at 95% ~ 0.01%
    const far = Math.max(0.01, 4.8 * Math.exp(-0.065 * (val - 50)));
    return Number(far.toFixed(2));
  };

  const calculateFrr = (val: number): number => {
    // Exponential growth: at 50% ~ 0.3%, at 75% ~ 1.85%, at 95% ~ 12.5%
    const frr = Math.min(15.0, 0.28 * Math.exp(0.082 * (val - 50)));
    return Number(frr.toFixed(2));
  };

  const currentFar = calculateFar(sensitivity);
  const currentFrr = calculateFrr(sensitivity);

  const getSensitivityTier = (val: number) => {
    if (val < 68) {
      return {
        label: 'Permissive / Low Rejection',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-500/30',
        desc: 'Prioritizes convenience and low friction. Ideal for noisy environments, hoarseness, or quick travel access.',
      };
    }
    if (val < 82) {
      return {
        label: 'Balanced Enterprise Standard (EER)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/40 border-emerald-500/30',
        desc: 'Optimal Equal Error Rate (EER) equilibrium for retail & mobile banking. Balanced protection with low friction.',
      };
    }
    if (val < 90) {
      return {
        label: 'High Security Clearance',
        color: 'text-sky-400',
        bg: 'bg-sky-950/40 border-sky-500/30',
        desc: 'Strict vocal match required (≥85%). High barrier against acoustic impostors and synthetic speech variations.',
      };
    }
    return {
      label: 'Zero-Tolerance Sovereign Vault',
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-950/40 border-fuchsia-500/30',
      desc: 'Institutional-grade strictness (≥90%). Near-zero false acceptance rate; requires pristine pronunciation.',
    };
  };

  const currentTier = getSensitivityTier(sensitivity);

  const handleStartSample = async () => {
    try {
      await audioDsp.initialize();
      await audioDsp.startRecording();
      setIsRecording(true);

      // Record for 3.5 seconds
      setTimeout(async () => {
        setIsRecording(false);
        setIsProcessing(true);
        await audioDsp.stopRecording();

        const curTelem = audioDsp.getTelemetry();
        const mfcc = audioDsp.extractVoiceprintFeatures();

        const sample = {
          pitch: curTelem.pitchHz > 60 ? curTelem.pitchHz : 165,
          jitter: curTelem.microJitter,
          mfcc,
        };

        const updated = [...recordedSamples, sample];
        setRecordedSamples(updated);
        setIsProcessing(false);

        if (currentStepIndex < ENROLLMENT_PHRASES.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          // Finalize voiceprint profile
          const meanPitch = updated.reduce((acc, s) => acc + s.pitch, 0) / updated.length;
          const meanJitter = updated.reduce((acc, s) => acc + s.jitter, 0) / updated.length;

          // Average MFCC coefficients
          const avgMfcc = new Array(13).fill(0);
          for (let i = 0; i < 13; i++) {
            let sum = 0;
            for (const s of updated) {
              sum += s.mfcc[i] || 0;
            }
            avgMfcc[i] = Math.round((sum / updated.length) * 100) / 100;
          }

          const newProfile: EnrolledVoiceprint = {
            ...currentVoiceprint,
            sensitivity,
            pitchMean: Math.round(meanPitch),
            pitchVariance: 18.5,
            microJitterBaseline: Math.round(meanJitter * 10000) / 10000,
            spectralRolloffBaseline: 6400,
            sampleCount: updated.length,
            mfccSignature: avgMfcc,
            noiseFloorBaselineDb: curTelem.noiseFloorDb,
            enrolledAt: new Date().toISOString(),
            isCalibrated: true,
          };

          setIsCompleted(true);
          onEnrollmentComplete(newProfile);
        }
      }, 3500);
    } catch (e) {
      console.error('Enrollment recording failed:', e);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleSimulateSample = async () => {
    try {
      setIsRecording(true);
      await audioDsp.initialize(true);
      await audioDsp.startRecording();

      if ('speechSynthesis' in window && currentPhrase) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(currentPhrase);
        ut.rate = 1.0;
        window.speechSynthesis.speak(ut);
      }

      setTimeout(async () => {
        setIsRecording(false);
        setIsProcessing(true);
        await audioDsp.stopRecording();

        const curTelem = audioDsp.getTelemetry();
        const mfcc = audioDsp.extractVoiceprintFeatures();

        const sample = {
          pitch: 162 + (currentStepIndex * 4 - 4),
          jitter: 0.036,
          mfcc,
        };

        const updated = [...recordedSamples, sample];
        setRecordedSamples(updated);
        setIsProcessing(false);

        if (currentStepIndex < ENROLLMENT_PHRASES.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          const meanPitch = updated.reduce((acc, s) => acc + s.pitch, 0) / updated.length;
          const meanJitter = updated.reduce((acc, s) => acc + s.jitter, 0) / updated.length;

          const avgMfcc = new Array(13).fill(0);
          for (let i = 0; i < 13; i++) {
            let sum = 0;
            for (const s of updated) {
              sum += s.mfcc[i] || 0;
            }
            avgMfcc[i] = Math.round((sum / updated.length) * 100) / 100;
          }

          const newProfile: EnrolledVoiceprint = {
            ...currentVoiceprint,
            sensitivity,
            pitchMean: Math.round(meanPitch),
            pitchVariance: 18.5,
            microJitterBaseline: Math.round(meanJitter * 10000) / 10000,
            spectralRolloffBaseline: 6400,
            sampleCount: updated.length,
            mfccSignature: avgMfcc,
            noiseFloorBaselineDb: curTelem.noiseFloorDb,
            enrolledAt: new Date().toISOString(),
            isCalibrated: true,
          };

          setIsCompleted(true);
          onEnrollmentComplete(newProfile);
        }
      }, 2600);
    } catch (e) {
      console.error('Simulated enrollment sample failed:', e);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleSaveSensitivityOnly = () => {
    const updatedProfile: EnrolledVoiceprint = {
      ...currentVoiceprint,
      sensitivity,
    };
    onEnrollmentComplete(updatedProfile);
    setSavedSensitivityNotice(true);
    setTimeout(() => setSavedSensitivityNotice(false), 2500);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setRecordedSamples([]);
    setIsCompleted(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="enrollment-modal-title" className="text-sm font-semibold text-slate-100">
                Voiceprint Biometric Calibration Studio
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Vocal Tract Enrollment</span>
                <span aria-hidden="true">·</span>
                <span>Algorithm Strictness: {sensitivity}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calibration studio"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveModalTab('calibration')}
            className={`pb-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeModalTab === 'calibration'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Calibration {!isCompleted ? `(${Math.min(currentStepIndex + 1, 3)}/3)` : '(Verified)'}</span>
          </button>

          <button
            onClick={() => setActiveModalTab('sensitivity')}
            className={`pb-2.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeModalTab === 'sensitivity'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Matching Sensitivity & Strictness ({sensitivity}%)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeModalTab === 'calibration' ? (
            /* Calibration Tab */
            !isCompleted ? (
              <>
                {/* Progress Steps */}
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="flex-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          idx < currentStepIndex
                            ? 'bg-emerald-500'
                            : idx === currentStepIndex
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-slate-800'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Phrase {idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Phrase Prompter */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold block">
                      Calibration Phrase #{currentStepIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={handlePronounceCurrentPhrase}
                      aria-label="Listen to pronunciation of calibration phrase"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none"
                    >
                      <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                      <span>{isPlayingAudio ? 'Playing...' : 'Listen'}</span>
                    </button>
                  </div>
                  <p className="text-base font-medium text-slate-100 leading-relaxed font-mono">
                    "{currentPhrase}"
                  </p>
                  <span className="text-[11px] text-slate-500 block">
                    Speak at a natural conversational volume. Real-time noise cancellation is filtering background ambient sound.
                  </span>
                </div>

                {/* Live Audio Visualizer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Acoustic Waveform & Spectral Calibration</span>
                    <span className="text-emerald-400 text-[11px]">Real-time DSP Active</span>
                  </div>
                  <AudioVisualizer
                    telemetry={telemetry}
                    isRecording={isRecording}
                    compact={true}
                    onToggleNoiseCancellation={(en) => audioDsp.setNoiseCancellation(en)}
                  />
                </div>

                {/* Sensitivity Quick Indicator Banner */}
                <div
                  onClick={() => setActiveModalTab('sensitivity')}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-slate-200 font-medium block">
                        Matching Strictness: {sensitivity}% ({currentTier.label.split(' ')[0]})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        FAR: {currentFar}% · FRR: {currentFrr}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                    <span>Adjust Slider</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Recording CTA */}
                <div className="space-y-2">
                  {!isRecording ? (
                    <>
                      <button
                        onClick={handleStartSample}
                        disabled={isProcessing}
                        className="w-full py-3.5 px-4 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Record Phrase #{currentStepIndex + 1} with Mic</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateSample}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-3 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none"
                        title="Simulate vocal enrollment without speaking aloud or if microphone is disabled"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Auto-Speak Sample #{currentStepIndex + 1} (No Mic Needed)</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl font-medium text-sm bg-rose-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 animate-pulse"
                    >
                      <Mic className="w-4 h-4 animate-bounce" />
                      <span>Listening & Extracting Acoustic Formants (3.5s)...</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Calibration Complete Summary */
              <div className="space-y-4 py-1">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-200">
                      Voiceprint Biometric Profile Established
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      Acoustic vocal tract features, fundamental pitch frequencies, and micro-jitter baselines have been calibrated.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Calibrated Biometric Parameters
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Fundamental Pitch (F0)</span>
                      <span className="font-mono text-slate-200 font-semibold text-sm">
                        {currentVoiceprint.pitchMean} Hz
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Micro-Jitter Baseline</span>
                      <span className="font-mono text-emerald-400 font-semibold text-sm">
                        {currentVoiceprint.microJitterBaseline.toFixed(4)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Noise Floor Baseline</span>
                      <span className="font-mono text-slate-200 font-semibold text-sm">
                        {currentVoiceprint.noiseFloorBaselineDb} dB
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Algorithm Strictness</span>
                      <span className="font-mono text-emerald-400 font-semibold text-sm">
                        {sensitivity}% (FAR: {currentFar}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sensitivity Quick Tuning in Complete State */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Adjust Algorithm Strictness: {sensitivity}%</span>
                    </span>
                    <button
                      onClick={() => setActiveModalTab('sensitivity')}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      View Trade-off Curve
                    </button>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={1}
                    value={sensitivity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSensitivity(val);
                      onEnrollmentComplete({ ...currentVoiceprint, sensitivity: val });
                    }}
                    className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50% Permissive</span>
                    <span className="text-slate-300">75% Balanced</span>
                    <span>95% Ultra Strict</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recalibrate Audio</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Save & Finish
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Sensitivity & Strictness Tab */
            <div className="space-y-4">
              {/* Sensitivity Overview */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Voiceprint Matching Strictness
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                    {sensitivity}%
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Controls the minimum acoustic similarity score required to authenticate. Adjusting this slider directly balances between impostor vulnerability and user convenience.
                </p>

                {/* The Interactive Slider */}
                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={1}
                    value={sensitivity}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 h-2.5 rounded-lg cursor-pointer transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50% (Permissive)</span>
                    <span className="text-slate-300 font-medium">75% (EER Nominal)</span>
                    <span>95% (Vault Strict)</span>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: 'Convenience', val: 62 },
                    { label: 'Balanced', val: 75 },
                    { label: 'High Sec', val: 85 },
                    { label: 'Max Vault', val: 92 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setSensitivity(preset.val)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                        Math.abs(sensitivity - preset.val) <= 2
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label} ({preset.val}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Tier Badge */}
              <div className={`p-3.5 rounded-xl border text-xs ${currentTier.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${currentTier.color} flex items-center gap-1.5`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mode: {currentTier.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Threshold ≥ {sensitivity}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 opacity-90 leading-relaxed">
                  {currentTier.desc}
                </p>
              </div>

              {/* FAR vs FRR Trade-off Meters */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Biometric Error Rate Trade-Off (FAR vs FRR)
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* False Acceptance Rate (FAR) */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 font-medium block">
                        False Acceptance (FAR)
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          currentFar < 0.2 ? 'text-emerald-400' : currentFar < 1.0 ? 'text-sky-400' : 'text-amber-400'
                        }`}
                      >
                        {currentFar}%
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          currentFar < 0.2 ? 'bg-emerald-500' : currentFar < 1.0 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (currentFar / 5) * 100)}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Risk of an acoustic impostor or mimic incorrectly passing authentication.
                    </span>
                  </div>

                  {/* False Rejection Rate (FRR) */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400 font-medium block">
                        False Rejection (FRR)
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          currentFrr < 1.5 ? 'text-emerald-400' : currentFrr < 4.0 ? 'text-sky-400' : 'text-amber-400'
                        }`}
                      >
                        {currentFrr}%
                      </span>
                    </div>

                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          currentFrr < 1.5 ? 'bg-emerald-500' : currentFrr < 4.0 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (currentFrr / 15) * 100)}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Likelihood you are prompted to retry due to vocal fatigue or background noise.
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative Equal Error Rate (EER) Callout */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-300">Biometric Engineering Tip:</strong> The Equal Error Rate (EER) baseline occurs near 75%. Increasing strictness reduces impostor risk (lower FAR) at the expense of requiring more pristine articulation (higher FRR).
                </p>
              </div>

              {/* Save Notice */}
              {savedSensitivityNotice && (
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Strictness setting ({sensitivity}%) updated and applied to verification pipeline!</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSaveSensitivityOnly}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Strictness ({sensitivity}%)</span>
                </button>

                <button
                  onClick={() => setActiveModalTab('calibration')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Back to Audio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
