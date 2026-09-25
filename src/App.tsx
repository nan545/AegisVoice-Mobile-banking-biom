/**
 * AegisVoice Mobile Banking | Biometric Voice Authentication & Anti-Spoof Shield
 */

import React, { useState, useEffect } from 'react';
import { audioDsp } from './utils/audioDsp';
import {
  BankAccount,
  BankTransaction,
  EnrolledVoiceprint,
  AcousticTelemetry,
  VerificationResult,
} from './types';
import { BankingApp } from './components/BankingApp';
import { VoiceAuthModal } from './components/VoiceAuthModal';
import { VoiceEnrollmentModal } from './components/VoiceEnrollmentModal';
import { SpoofAttackLab } from './components/SpoofAttackLab';
import { SecurityAuditLogs } from './components/SecurityAuditLogs';
import { AudioVisualizer } from './components/AudioVisualizer';
import { UserGuideModal } from './components/UserGuideModal';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  LayoutDashboard,
  Mic,
  Waves,
  Fingerprint,
  Radio,
  Lock,
  Zap,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Volume2,
  X,
  Plus,
} from 'lucide-react';

export default function App() {
  // View mode: 'mobile-focus' or 'dual-station'
  const [viewMode, setViewMode] = useState<'mobile-focus' | 'dual-station'>('dual-station');

  // Active view tab in dual station: 'lab' or 'logs'
  const [stationTab, setStationTab] = useState<'lab' | 'logs'>('lab');

  // Active Attack Simulation
  const [activeAttack, setActiveAttack] = useState<'none' | 'replay' | 'tts' | 'noise'>('none');

  // Telemetry state
  const [telemetry, setTelemetry] = useState<AcousticTelemetry>({
    rmsLevel: 0,
    rmsDb: -80,
    snr: 22.4,
    noiseFloorDb: -54,
    pitchHz: 162,
    spectralRolloff: 6800,
    zeroCrossingRate: 0.082,
    spectralCentroid: 1850,
    microJitter: 0.038,
    speechDetected: false,
    noiseCancelled: true,
    simulatedAttack: 'none',
  });

  // Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: 'acc-1',
      name: 'Primary Liquidity Checking',
      type: 'checking',
      accountNumber: 'CH-8419-2041-01',
      balance: 148920.5,
      currency: 'USD',
    },
    {
      id: 'acc-2',
      name: 'High-Yield Sovereign Vault',
      type: 'vault',
      accountNumber: 'CH-9920-4102-88',
      balance: 320400.0,
      currency: 'USD',
    },
  ]);

  // Enrolled Biometric Voiceprint
  const [enrolledVoiceprint, setEnrolledVoiceprint] = useState<EnrolledVoiceprint>({
    userId: 'USR-JULIAN-VANCE',
    userName: 'Julian Vance',
    enrolledAt: '2026-09-24T14:20:00Z',
    pitchMean: 162,
    pitchVariance: 14.2,
    microJitterBaseline: 0.0375,
    spectralRolloffBaseline: 6800,
    sampleCount: 3,
    mfccSignature: [0.82, 0.45, -0.32, 0.15, -0.08, 0.22, -0.14, 0.09, -0.05, 0.03, -0.02, 0.01, 0.0],
    noiseFloorBaselineDb: -56,
    isCalibrated: true,
    sensitivity: 75,
  });

  // Transaction & Audit logs
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    {
      id: 'TX-9482-A',
      date: 'Today, 04:12 PM',
      recipient: 'Sovereign Escrow Ltd',
      accountNumber: 'CH-9482-9014-02',
      amount: 15000,
      category: 'Real Estate Settlement',
      status: 'COMPLETED',
      riskTier: 'HIGH',
      mfaFactorsUsed: ['Voiceprint (94%)', 'Dynamic Challenge', 'PIN Token'],
      spoofScore: 6,
      challengePhrase: 'Sapphire Horizon 742 · Authorize Vault Transfer $15,000',
      auditHash: '0x9a8f...4e1b',
    },
    {
      id: 'TX-9481-B',
      date: 'Today, 02:45 PM',
      recipient: 'Unknown External Wallet',
      accountNumber: 'US-0012-9931-44',
      amount: 4800,
      category: 'Unauthorized Withdrawal Attempt',
      status: 'BLOCKED_SPOOF',
      riskTier: 'HIGH',
      mfaFactorsUsed: ['Voiceprint (Blocked)', 'Anti-Spoof Shield'],
      spoofScore: 92,
      challengePhrase: 'Golden Meridian 429 · Execute Capital Allocation',
      auditHash: '0x3c21...88ff',
    },
    {
      id: 'TX-9479-C',
      date: 'Yesterday, 11:30 AM',
      recipient: 'Horizon Cloud Corp',
      accountNumber: 'US-8419-2041-88',
      amount: 1250,
      category: 'Infrastructure Invoice',
      status: 'COMPLETED',
      riskTier: 'MEDIUM',
      mfaFactorsUsed: ['Voiceprint (92%)', 'Dynamic Challenge'],
      spoofScore: 9,
      challengePhrase: 'Cobalt Horizon 836 · Biometric Sign-off Verified',
      auditHash: '0x7e44...12aa',
    },
  ]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isSimulatedAudio, setIsSimulatedAudio] = useState(audioDsp.getIsSimulated());
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  const [pendingTransfer, setPendingTransfer] = useState<{
    amount: number;
    recipient: string;
    accountNumber: string;
    category: string;
  }>({
    amount: 1250,
    recipient: 'Sovereign Escrow Ltd',
    accountNumber: 'CH-9482-9014-02',
    category: 'Escrow Settlement',
  });

  const handleToggleAudioSource = async () => {
    const current = audioDsp.getIsSimulated();
    const next = !current;
    await audioDsp.setSimulationMode(next);
    setIsSimulatedAudio(next);
  };

  const handleAddFunds = (amount: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.type === 'checking' ? { ...acc, balance: acc.balance + amount } : acc
      )
    );
  };

  const handleResetBalances = () => {
    setAccounts([
      {
        id: 'acc-1',
        name: 'Primary Liquidity Checking',
        type: 'checking',
        accountNumber: 'CH-8419-2041-01',
        balance: 148920.5,
        currency: 'USD',
      },
      {
        id: 'acc-2',
        name: 'High-Yield Sovereign Vault',
        type: 'vault',
        accountNumber: 'CH-9920-4102-88',
        balance: 320400.0,
        currency: 'USD',
      },
    ]);
  };

  // Start continuous acoustic telemetry polling
  useEffect(() => {
    const timer = setInterval(() => {
      const telem = audioDsp.getTelemetry(activeAttack);
      setTelemetry(telem);
    }, 120);

    return () => clearInterval(timer);
  }, [activeAttack]);

  // Handle transfer start
  const handleInitiateTransfer = (details: {
    amount: number;
    recipient: string;
    accountNumber: string;
    category: string;
  }) => {
    setPendingTransfer(details);
    setIsAuthModalOpen(true);
  };

  // Handle verification completed
  const handleVerificationComplete = (result: VerificationResult) => {
    const isApproved = result.isApproved;

    const newTx: BankTransaction = {
      id: result.transactionId,
      date: 'Just now',
      recipient: pendingTransfer.recipient,
      accountNumber: pendingTransfer.accountNumber,
      amount: pendingTransfer.amount,
      category: pendingTransfer.category,
      status: isApproved ? 'COMPLETED' : 'BLOCKED_SPOOF',
      riskTier: pendingTransfer.amount >= 2500 ? 'HIGH' : pendingTransfer.amount >= 250 ? 'MEDIUM' : 'LOW',
      mfaFactorsUsed: [
        `Voice (${result.factors.factor1_voiceBiometrics.confidence}%)`,
        result.factors.factor3_dynamicChallenge.passed ? 'Challenge Valid' : 'Challenge Failed',
        ...(result.factors.factor4_securePin.required ? ['PIN Token'] : []),
      ],
      spoofScore: result.factors.factor2_antiSpoofShield.spoofProbability,
      challengePhrase: result.factors.factor3_dynamicChallenge.challengeText,
      auditHash: `0x${Math.random().toString(16).slice(2, 10)}...${result.transactionId.slice(-4)}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Deduct balance if approved
    if (isApproved) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.type === 'checking' && acc.balance >= pendingTransfer.amount) {
            return { ...acc, balance: acc.balance - pendingTransfer.amount };
          }
          return acc;
        })
      );
    }
  };

  // Run test verification from Spoof Attack Lab
  const handleRunTestVerification = (attack: 'none' | 'replay' | 'tts' | 'noise') => {
    setActiveAttack(attack);
    setPendingTransfer({
      amount: attack === 'none' ? 850 : 3400,
      recipient: attack === 'none' ? 'Sophia Sterling' : 'Adversarial Injection Test',
      accountNumber: 'CH-9900-1122-33',
      category: attack === 'none' ? 'Authorized Transfer' : 'Adversarial Verification Simulation',
    });
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* 1. Universal Top Navigation Bar adhering to Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-900 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Brand title wordmark as single text element */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <a href="/" className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>AegisVoice</span>
            <span className="text-emerald-400 font-mono text-xs font-semibold">BIO-SHIELD</span>
          </a>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>User Guide & Tour</span>
          </button>
          <button
            onClick={() => {
              setViewMode('dual-station');
              setStationTab('lab');
            }}
            className="hover:text-slate-200 transition-colors"
          >
            Acoustic Spoof Lab
          </button>
          <button
            onClick={() => {
              setViewMode('dual-station');
              setStationTab('logs');
            }}
            className="hover:text-slate-200 transition-colors"
          >
            Security Audit Ledger
          </button>
          <button
            onClick={() => setIsEnrollmentModalOpen(true)}
            className="hover:text-slate-200 transition-colors"
          >
            Voice Calibration
          </button>
          <button
            onClick={() => {
              setPendingTransfer({
                amount: 2500,
                recipient: 'Sovereign Trust Escrow',
                accountNumber: 'CH-9920-4102-88',
                category: 'High Value Wire',
              });
              setIsAuthModalOpen(true);
            }}
            className="hover:text-slate-200 transition-colors"
          >
            Test MFA Wire
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          {/* Audio Source Switcher */}
          <button
            onClick={handleToggleAudioSource}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isSimulatedAudio
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
            title={
              isSimulatedAudio
                ? 'Using built-in Synthetic Acoustic Channel (No Mic Needed). Click to switch to Real Microphone.'
                : 'Using Live Hardware Microphone. Click to switch to Synthetic Channel.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulatedAudio ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {isSimulatedAudio ? 'Synthetic Voice Mode' : 'Hardware Mic'}
            </span>
          </button>

          {/* Guide Quick Button for small screens */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            title="System Walkthrough & User Guide"
            aria-label="Open system walkthrough guide"
            className="md:hidden w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('mobile-focus')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'mobile-focus' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Device Focus"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button
              onClick={() => setViewMode('dual-station')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'dual-station' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Dual Security Station (Mobile + Telemetry)"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dual Station</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Quick Orientation & Onboarding Banner for all users */}
        {showWelcomeBanner && (
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-slate-200 text-xs">
                  AegisVoice Biometric Shield · Production Ready for All Users
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  (Live Mic & Synthetic Acoustic Modes)
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Test vocal tract biometrics, background noise cancellation, and adaptive multi-factor banking security.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsEnrollmentModalOpen(true)}
                className="py-1.5 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Mic className="w-3 h-3" />
                <span>1. Calibrate Voice</span>
              </button>
              <button
                onClick={() => {
                  setPendingTransfer({
                    amount: 1250,
                    recipient: 'Sovereign Escrow Ltd',
                    accountNumber: 'CH-9482-9014-02',
                    category: 'Escrow Settlement',
                  });
                  setIsAuthModalOpen(true);
                }}
                className="py-1.5 px-3 bg-sky-600/90 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>2. Test MFA Wire</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('dual-station');
                  setStationTab('lab');
                }}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>3. Spoof Lab</span>
              </button>
              <button
                onClick={() => setIsGuideModalOpen(true)}
                className="py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3 h-3 text-sky-400" />
                <span>Full Guide</span>
              </button>
              <button
                onClick={() => setShowWelcomeBanner(false)}
                aria-label="Dismiss orientation banner"
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {viewMode === 'mobile-focus' ? (
          /* Mobile Single Frame Mode */
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-full max-w-md">
              <BankingApp
                accounts={accounts}
                transactions={transactions}
                enrolledVoiceprint={enrolledVoiceprint}
                telemetry={telemetry}
                onInitiateTransfer={handleInitiateTransfer}
                onOpenEnrollment={() => setIsEnrollmentModalOpen(true)}
                onOpenSpoofLab={() => {
                  setViewMode('dual-station');
                  setStationTab('lab');
                }}
                onOpenAuditLogs={() => {
                  setViewMode('dual-station');
                  setStationTab('logs');
                }}
                onOpenGuideModal={() => setIsGuideModalOpen(true)}
                onAddFunds={handleAddFunds}
              />
            </div>
          </div>
        ) : (
          /* Dual Station Mode: Mobile App on Left + Forensic Telemetry / Spoof Lab on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Mobile Banking App Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md">
                <BankingApp
                  accounts={accounts}
                  transactions={transactions}
                  enrolledVoiceprint={enrolledVoiceprint}
                  telemetry={telemetry}
                  onInitiateTransfer={handleInitiateTransfer}
                  onOpenEnrollment={() => setIsEnrollmentModalOpen(true)}
                  onOpenSpoofLab={() => setStationTab('lab')}
                  onOpenAuditLogs={() => setStationTab('logs')}
                  onOpenGuideModal={() => setIsGuideModalOpen(true)}
                  onAddFunds={handleAddFunds}
                />
              </div>
            </div>

            {/* Right Column: Live Telemetry, Audio DSP & Security Console */}
            <div className="lg:col-span-7 space-y-4">
              {/* Station Navigation Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStationTab('lab')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      stationTab === 'lab'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Spoof Defense & Attack Lab</span>
                  </button>

                  <button
                    onClick={() => setStationTab('logs')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      stationTab === 'logs'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Audit Ledger ({transactions.length})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
                  <span>Strictness:</span>
                  <button
                    onClick={() => setIsEnrollmentModalOpen(true)}
                    className="font-mono text-emerald-400 font-semibold hover:underline"
                    title="Click to adjust Sensitivity & Strictness slider"
                  >
                    {enrolledVoiceprint.sensitivity ?? 75}% (EER)
                  </button>
                  <span>·</span>
                  <span>Pitch:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{enrolledVoiceprint.pitchMean} Hz</span>
                </div>
              </div>

              {/* Station Tab Content */}
              {stationTab === 'lab' ? (
                <SpoofAttackLab
                  telemetry={telemetry}
                  enrolledVoiceprint={enrolledVoiceprint}
                  activeAttack={activeAttack}
                  onSelectAttack={(attack) => setActiveAttack(attack)}
                  onRunTestVerification={handleRunTestVerification}
                />
              ) : (
                <SecurityAuditLogs transactions={transactions} />
              )}

              {/* Acoustic ML Pipeline Architecture Reference */}
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs space-y-3">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Acoustic Machine Learning Defense Pipeline</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-400">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-slate-200 block mb-1">1. Real-Time DSP</span>
                    <span>85Hz highpass rumble filter, 60Hz hum notch, +3.5dB formant peaking & dynamic spectral noise subtraction.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-slate-200 block mb-1">2. Anti-Spoof Radar</span>
                    <span>Transducer cutoff analysis, room echo impulse detection, and biological vocal fold micro-jitter inspection.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-slate-200 block mb-1">3. Dynamic Challenge</span>
                    <span>Cryptographic one-time passphrase validation defeating replay recordings with high phonetic entropy.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Biometric Verification Modal */}
      <VoiceAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setActiveAttack('none');
        }}
        transaction={pendingTransfer}
        enrolledVoiceprint={enrolledVoiceprint}
        telemetry={telemetry}
        activeAttack={activeAttack}
        onVerificationComplete={handleVerificationComplete}
      />

      {/* Voiceprint Calibration Studio Modal */}
      <VoiceEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        currentVoiceprint={enrolledVoiceprint}
        telemetry={telemetry}
        onEnrollmentComplete={(newProfile) => {
          setEnrolledVoiceprint(newProfile);
          setIsEnrollmentModalOpen(false);
        }}
      />

      {/* Interactive System Walkthrough & User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onStartCalibration={() => setIsEnrollmentModalOpen(true)}
        onStartTransfer={(amount, recipient) => {
          setPendingTransfer({
            amount,
            recipient,
            accountNumber: 'CH-9482-9014-02',
            category: 'Wire Authorization',
          });
          setIsAuthModalOpen(true);
        }}
        onOpenSpoofLab={() => {
          setViewMode('dual-station');
          setStationTab('lab');
        }}
        onToggleAudioSource={handleToggleAudioSource}
        isSimulatedAudio={isSimulatedAudio}
      />
    </div>
  );
}
