import React, { useState, useEffect, useRef } from 'react';
import { audioDsp } from '../utils/audioDsp';
import { AudioVisualizer } from './AudioVisualizer';
import {
  AcousticTelemetry,
  DynamicChallenge,
  EnrolledVoiceprint,
  BankTransaction,
  VerificationResult,
} from '../types';
import {
  Mic,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Waves,
  Fingerprint,
  ChevronRight,
  Info,
  Volume2,
  Sparkles,
} from 'lucide-react';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    amount: number;
    recipient: string;
    accountNumber: string;
    category: string;
  };
  enrolledVoiceprint: EnrolledVoiceprint;
  telemetry: AcousticTelemetry;
  activeAttack: 'none' | 'replay' | 'tts' | 'noise';
  onVerificationComplete: (result: VerificationResult) => void;
}

export const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({
  isOpen,
  onClose,
  transaction,
  enrolledVoiceprint,
  telemetry,
  activeAttack,
  onVerificationComplete,
}) => {
  const [step, setStep] = useState<'challenge' | 'recording' | 'verifying' | 'result'>('challenge');
  const [challenge, setChallenge] = useState<DynamicChallenge | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [userPin, setUserPin] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handlePronouncePhrase = () => {
    if ('speechSynthesis' in window && challenge?.phrase) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      const ut = new SpeechSynthesisUtterance(challenge.phrase);
      ut.rate = 0.95;
      ut.onend = () => setIsPlayingAudio(false);
      ut.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(ut);
    }
  };

  const isHighRisk = transaction.amount >= 2500;
  const isMediumRisk = transaction.amount >= 250 && transaction.amount < 2500;
  const expectedPin = enrolledVoiceprint.customPin || '849201';

  // Load new dynamic challenge when opened
  useEffect(() => {
    if (isOpen) {
      fetchNewChallenge();
      setStep('challenge');
      setVerificationResult(null);
      setErrorMessage(null);
      setLiveTranscript('');
      setUserPin(transaction.amount >= 2500 ? expectedPin : '');
    }
  }, [isOpen, transaction.amount, transaction.recipient, expectedPin]);

  const fetchNewChallenge = async () => {
    setIsLoadingChallenge(true);
    try {
      const res = await fetch('/api/security/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionAmount: transaction.amount.toLocaleString(),
          recipientName: transaction.recipient,
        }),
      });
      const data = await res.json();
      setChallenge(data);
    } catch (e) {
      console.error('Failed to fetch challenge:', e);
      // Fallback challenge
      setChallenge({
        challengeId: `CHAL-${Date.now().toString(36).toUpperCase()}`,
        phrase: `Sapphire Horizon 742 · Authorize $${transaction.amount} to ${transaction.recipient}`,
        nonce: 7421,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 60000,
        targetKeyPhonemes: ['Sapphire', 'Horizon', 'Authorize', 'Transfer'],
      });
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.onresult = (ev: any) => {
          let t = '';
          for (let i = 0; i < ev.results.length; i++) {
            t += ev.results[i][0].transcript + ' ';
          }
          setLiveTranscript(t.trim());
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {
        // speech recognition unavailable or blocked
      }
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    try {
      setErrorMessage(null);
      setLiveTranscript('');
      await audioDsp.initialize();
      await audioDsp.startRecording();
      startSpeechRecognition();
      setIsRecording(true);
      setStep('recording');
      setRecordTimer(0);

      // Auto countdown
      const interval = setInterval(() => {
        setRecordTimer((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            handleStopAndVerify();
            return 3;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Could not access microphone: ' + (err.message || 'Permission denied'));
    }
  };

  const handleSimulateSpeech = async () => {
    try {
      setErrorMessage(null);
      setLiveTranscript(challenge?.phrase || 'Sapphire Horizon 742 · Authorize Vault Transfer');
      await audioDsp.initialize(true); // initialize in clean acoustic mode
      await audioDsp.startRecording();
      setIsRecording(true);
      setStep('recording');
      setRecordTimer(0);

      // Play through speaker if speech synthesis is supported
      if ('speechSynthesis' in window && challenge?.phrase) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(challenge.phrase);
        ut.rate = 1.0;
        window.speechSynthesis.speak(ut);
      }

      const interval = setInterval(() => {
        setRecordTimer((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            handleStopAndVerify();
            return 3;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Simulation error: ' + (err.message || 'Audio engine error'));
    }
  };

  const handleStopAndVerify = async () => {
    setIsRecording(false);
    stopSpeechRecognition();
    setStep('verifying');

    try {
      const audioData = await audioDsp.stopRecording();
      const currentTelemetry = audioDsp.getTelemetry(activeAttack);

      const payload = {
        audioBase64: audioData.base64,
        mimeType: audioData.mimeType,
        challengePhrase: challenge?.phrase || '',
        userPin: userPin.trim(),
        expectedPin: expectedPin,
        enrolledVoiceprint,
        acousticTelemetry: {
          ...currentTelemetry,
          simulatedAttack: activeAttack,
        },
        transactionDetails: {
          ...transaction,
          id: `TX-${Date.now().toString(36).toUpperCase()}`,
        },
      };

      const res = await fetch('/api/security/verify-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Verification service returned status ${res.status}`);
      }

      const result: VerificationResult = await res.json();
      setVerificationResult(result);
      setStep('result');
      onVerificationComplete(result);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage('Verification failed: ' + (err.message || 'Network error'));
      setStep('challenge');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-auth-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="voice-auth-modal-title" className="text-sm font-semibold text-slate-100">
                AegisVoice™ Multi-Factor Verification
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Wire Authorization</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-400 font-medium">
                  ${transaction.amount.toLocaleString()} USD
                </span>
                <span aria-hidden="true">·</span>
                <span>{isHighRisk ? '3-Factor High Risk' : isMediumRisk ? '2-Factor Medium Risk' : 'Standard MFA'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close verification dialog"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Transaction Summary Card */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Beneficiary Recipient</span>
              <span className="font-semibold text-slate-200 text-sm">{transaction.recipient}</span>
              <span className="text-slate-400 font-mono text-[11px] block">{transaction.accountNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Settlement Amount</span>
              <span className="font-bold text-slate-100 text-base font-mono tabular-nums">
                ${transaction.amount.toLocaleString()}
              </span>
              <span className="text-emerald-400 text-[10px] block">Immediate Clearing</span>
            </div>
          </div>

          {/* Active Attack Warning Banner if testing in Spoof Lab */}
          {activeAttack !== 'none' && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block">
                  Simulated Attack Vector Active: {activeAttack.toUpperCase()}
                </span>
                <span className="text-amber-300/80 text-[11px]">
                  Testing spoof shield resilience. AegisVoice ML will inspect acoustic artifacts for this injection.
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1 & 2: Dynamic Security Challenge & Voice Recording */}
          {(step === 'challenge' || step === 'recording') && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic Liveness Challenge</span>
                  </div>
                  <button
                    onClick={fetchNewChallenge}
                    disabled={isLoadingChallenge || isRecording}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingChallenge ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-slate-400 text-xs">Speak this one-time challenge clearly:</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePronouncePhrase}
                        disabled={!challenge?.phrase}
                        aria-label="Listen to challenge phrase pronunciation"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none"
                      >
                        <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                        <span>{isPlayingAudio ? 'Playing...' : 'Listen'}</span>
                      </button>
                      {liveTranscript && (
                        <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                          ● Capturing voice...
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-100 font-semibold text-sm tracking-wide leading-relaxed font-mono">
                    {challenge?.phrase ? (
                      challenge.phrase.split(' ').map((word, wIdx) => {
                        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const isSpoken = liveTranscript.toLowerCase().includes(cleanWord) && cleanWord.length > 2;
                        return (
                          <span
                            key={wIdx}
                            className={`inline-block mr-1 transition-colors ${
                              isSpoken ? 'text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded' : ''
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })
                    ) : (
                      'Loading dynamic passphrase...'
                    )}
                  </p>
                  {liveTranscript && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                      <span className="text-emerald-400">Heard:</span>
                      <span className="text-slate-200">"{liveTranscript}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cryptographic Nonce: #{challenge?.nonce || '8491'}</span>
                  <span>Expires in: 60s</span>
                </div>
              </div>

              {/* High-Risk Transaction: Device Banking PIN Input */}
              {isHighRisk && (
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Factor 3: Mobile Banking Passcode</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setUserPin(expectedPin)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono hover:underline flex items-center gap-1"
                    >
                      <span>PIN: {expectedPin} (Autofill)</span>
                    </button>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="Enter 6-digit PIN"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center"
                  />
                </div>
              )}

              {/* Live Audio Visualizer with Real-time Noise Cancellation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-medium">Real-Time DSP & Noise Suppression Stream</span>
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <Waves className="w-3 h-3" />
                    <span>Spectral Gate Active</span>
                  </span>
                </div>
                <AudioVisualizer
                  telemetry={telemetry}
                  isRecording={isRecording}
                  compact={true}
                  activeAttack={activeAttack}
                  onToggleNoiseCancellation={(enabled) => audioDsp.setNoiseCancellation(enabled)}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isRecording ? (
                  <>
                    <button
                      onClick={handleStartRecording}
                      disabled={isHighRisk && userPin.length < 4}
                      className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                        isHighRisk && userPin.length < 4
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-[0.98]'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>Speak Challenge with Microphone</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateSpeech}
                      disabled={isHighRisk && userPin.length < 4}
                      className="w-full py-2.5 px-3 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                      title="Test authentication without speaking aloud or if microphone is disabled"
                    >
                      <span>1-Click Speak Challenge (Acoustic Simulator)</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStopAndVerify}
                    className="w-full py-3.5 px-4 rounded-xl font-medium text-sm bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 animate-pulse"
                  >
                    <Mic className="w-4 h-4 animate-bounce" />
                    <span>Listening... ({recordTimer}s) Click to Finish</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Verifying State */}
          {step === 'verifying' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center"></div>
                <Fingerprint className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-100">
                  Executing Machine Learning Multi-Factor Inspection
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Running spectral subtraction, Mel-frequency voiceprint matching, and acoustic anti-spoof liveness check...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Verification Result */}
          {step === 'result' && verificationResult && (() => {
            const getBannerInfo = () => {
              if (verificationResult.isApproved) {
                return {
                  title: 'Authentication Approved · Settlement Authorized',
                  subtitle: verificationResult.telemetry.aiSummary || 'Voice biometric signature, anti-spoof liveness, and dynamic challenge verified.',
                  style: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
                  icon: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />,
                };
              }
              if (verificationResult.decision === 'REJECTED_PIN') {
                return {
                  title: 'Authorization Incomplete · Passcode Required',
                  subtitle: verificationResult.telemetry.aiSummary || 'Vocal biometrics were validated successfully, but the secondary banking PIN passcode was missing or incorrect for this high-value wire ($2,500+).',
                  style: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
                  icon: <Lock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />,
                };
              }
              if (verificationResult.decision === 'REJECTED_SPOOF') {
                return {
                  title: 'Biometric Verification Blocked · Spoof Attack Detected',
                  subtitle: verificationResult.telemetry.aiSummary || 'Acoustic spoof defense shield triggered: replay playback or synthetic voice artifacts detected.',
                  style: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
                  icon: <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />,
                };
              }
              if (verificationResult.decision === 'REJECTED_MISMATCH') {
                return {
                  title: 'Biometric Verification Blocked · Vocal Resonance Mismatch',
                  subtitle: verificationResult.telemetry.aiSummary || `Voiceprint match confidence did not meet your enrolled threshold (Required: ≥ ${verificationResult.factors.factor1_voiceBiometrics.requiredThreshold ?? 75}%).`,
                  style: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
                  icon: <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />,
                };
              }
              if (verificationResult.decision === 'REJECTED_CHALLENGE') {
                return {
                  title: 'Biometric Verification Blocked · Challenge Phrase Mismatch',
                  subtitle: verificationResult.telemetry.aiSummary || 'The spoken passphrase did not match the dynamic anti-replay challenge phrase.',
                  style: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
                  icon: <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />,
                };
              }
              return {
                title: 'Biometric Verification Blocked',
                subtitle: verificationResult.telemetry.aiSummary && !verificationResult.telemetry.aiSummary.toLowerCase().includes('validated successfully')
                  ? verificationResult.telemetry.aiSummary
                  : 'Acoustic parameters did not meet biometric security criteria.',
                style: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
                icon: <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />,
              };
            };

            const banner = getBannerInfo();

            return (
              <div className="space-y-4">
                {/* Decision Header */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${banner.style}`}>
                  {banner.icon}
                  <div>
                    <h3 className="text-sm font-semibold">{banner.title}</h3>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{banner.subtitle}</p>
                  </div>
                </div>

              {/* Multi-Factor Verification Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Multi-Factor Inspection Breakdown
                </span>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {/* Factor 1: Biometric Voice Match */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verificationResult.factors.factor1_voiceBiometrics.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <div>
                        <span className="font-medium text-slate-200 block">Factor 1: Vocal Tract Biometrics</span>
                        <span className="text-[11px] text-slate-400">
                          Pitch: {verificationResult.factors.factor1_voiceBiometrics.detectedPitchHz} Hz · Strictness Threshold: ≥ {verificationResult.factors.factor1_voiceBiometrics.requiredThreshold ?? 75}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono tabular-nums font-semibold text-slate-200 block">
                        {verificationResult.factors.factor1_voiceBiometrics.confidence}% Match
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Required: ≥ {verificationResult.factors.factor1_voiceBiometrics.requiredThreshold ?? 75}%
                      </span>
                    </div>
                  </div>

                  {/* Factor 2: Anti-Spoofing & Liveness Shield */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verificationResult.factors.factor2_antiSpoofShield.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      )}
                      <div>
                        <span className="font-medium text-slate-200 block">Factor 2: Anti-Spoof & Liveness Shield</span>
                        <span className="text-[11px] text-slate-400">
                          {verificationResult.factors.factor2_antiSpoofShield.detectedAttackType !== 'none'
                            ? `Attack: ${verificationResult.factors.factor2_antiSpoofShield.detectedAttackType.toUpperCase()}`
                            : 'No synthetic or replay artifacts detected'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Spoof Probability</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          verificationResult.factors.factor2_antiSpoofShield.spoofProbability > 30
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {verificationResult.factors.factor2_antiSpoofShield.spoofProbability}%
                      </span>
                    </div>
                  </div>

                  {/* Factor 3: Dynamic Security Challenge */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {verificationResult.factors.factor3_dynamicChallenge.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <div>
                        <span className="font-medium text-slate-200 block">Factor 3: Anti-Replay Challenge Match</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[240px] block">
                          Spoken: "{verificationResult.factors.factor3_dynamicChallenge.spokenTranscript}"
                        </span>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {verificationResult.factors.factor3_dynamicChallenge.accuracy}% Valid
                    </span>
                  </div>

                  {/* Factor 4: Banking PIN (if required) */}
                  {verificationResult.factors.factor4_securePin.required && (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationResult.factors.factor4_securePin.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <div>
                          <span className="font-medium text-slate-200 block">Factor 4: Device Passcode Token</span>
                          <span className="text-[11px] text-slate-400">High-value transfer clearance</span>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {verificationResult.factors.factor4_securePin.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Forensic Details / Anomalies */}
              {verificationResult.factors.factor2_antiSpoofShield.anomalies.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <span className="font-medium text-slate-300 block">Acoustic Forensic Observations:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    {verificationResult.factors.factor2_antiSpoofShield.anomalies.map((anom, idx) => (
                      <li key={idx}>{anom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 pt-2">
                {verificationResult.isApproved ? (
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Done & Return to Accounts
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setStep('challenge');
                        fetchNewChallenge();
                      }}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 bg-rose-950/80 border border-rose-500/40 text-rose-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel Wire
                    </button>
                  </>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
