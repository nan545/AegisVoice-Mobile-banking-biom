import React, { useState } from 'react';
import {
  BankAccount,
  BankTransaction,
  EnrolledVoiceprint,
  AcousticTelemetry,
  RiskTier,
} from '../types';
import { F0FrequencyChart } from './F0FrequencyChart';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Mic,
  CreditCard,
  Building2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Waves,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  Users,
} from 'lucide-react';

interface BankingAppProps {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  enrolledVoiceprint: EnrolledVoiceprint;
  telemetry: AcousticTelemetry;
  onInitiateTransfer: (details: {
    amount: number;
    recipient: string;
    accountNumber: string;
    category: string;
  }) => void;
  onOpenEnrollment: () => void;
  onOpenSpoofLab: () => void;
  onOpenAuditLogs: () => void;
  onOpenProfileModal?: () => void;
  onOpenGuideModal?: () => void;
  onAddFunds?: (amount: number) => void;
}

export const BankingApp: React.FC<BankingAppProps> = ({
  accounts,
  transactions,
  enrolledVoiceprint,
  telemetry,
  onInitiateTransfer,
  onOpenEnrollment,
  onOpenSpoofLab,
  onOpenAuditLogs,
  onOpenProfileModal,
  onOpenGuideModal,
  onAddFunds,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transfers' | 'cards'>('accounts');
  const [transferAmount, setTransferAmount] = useState<string>('1250');
  const [selectedPayee, setSelectedPayee] = useState({
    name: 'Sovereign Escrow Ltd',
    account: 'CH-9482-9014-02',
    category: 'Escrow Settlement',
  });
  const [customPayee, setCustomPayee] = useState('');
  const [showBalance, setShowBalance] = useState(true);

  const PAYEES = [
    { name: 'Sovereign Escrow Ltd', account: 'CH-9482-9014-02', category: 'Escrow Settlement' },
    { name: 'Horizon Cloud Corp', account: 'US-8419-2041-88', category: 'Infrastructure Wire' },
    { name: 'Julian Vance (Vault)', account: 'CH-1002-3920-11', category: 'Internal Transfer' },
    { name: 'Sophia Sterling', account: 'GB-7712-4012-99', category: 'Private Wealth Settlement' },
  ];

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const parsedAmount = parseFloat(transferAmount) || 0;
  const currentRiskTier: RiskTier =
    parsedAmount >= 2500 ? 'HIGH' : parsedAmount >= 250 ? 'MEDIUM' : 'LOW';

  const getAccountVoiceSecurityStatus = (acc: BankAccount) => {
    // If an active spoof attack is being simulated
    if (telemetry.simulatedAttack && telemetry.simulatedAttack !== 'none') {
      return {
        status: 'anomaly' as const,
        label: `Anomaly: ${telemetry.simulatedAttack.toUpperCase()}`,
        description: 'Adversarial spoof attack active · Radar engaged',
        color: 'text-rose-400',
        dotColor: 'bg-rose-400',
        icon: ShieldAlert,
      };
    }

    // If not calibrated or sample count too low
    if (!enrolledVoiceprint.isCalibrated || enrolledVoiceprint.sampleCount < 3) {
      return {
        status: 'recalibration' as const,
        label: 'Re-Calibration Required',
        description: 'Acoustic profile incomplete · Tap to calibrate',
        color: 'text-amber-400',
        dotColor: 'bg-amber-400',
        icon: ShieldAlert,
      };
    }

    // Check if vocal pitch drift is detected
    const pitchDiff = Math.abs(telemetry.pitchHz - enrolledVoiceprint.pitchMean);
    const strictness = enrolledVoiceprint.sensitivity ?? 75;
    const isVaultHighStrictness = acc.type === 'vault' && strictness >= 85;

    if (telemetry.speechDetected && pitchDiff > 28 && isVaultHighStrictness) {
      return {
        status: 'drift' as const,
        label: 'Re-Calibration Advised',
        description: `Pitch drift detected (${telemetry.pitchHz}Hz vs ${enrolledVoiceprint.pitchMean}Hz baseline)`,
        color: 'text-amber-400',
        dotColor: 'bg-amber-400',
        icon: ShieldAlert,
      };
    }

    // Default: Verified & Active (Green Shield)
    return {
      status: 'verified' as const,
      label: acc.type === 'vault' ? 'Voiceprint Verified · 3FA' : 'Voice Biometric: Verified',
      description: `Acoustic baseline active · ${enrolledVoiceprint.sensitivity ?? 75}% strictness`,
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      icon: ShieldCheck,
    };
  };

  const handleStartWire = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    onInitiateTransfer({
      amount: parsedAmount,
      recipient: customPayee.trim() || selectedPayee.name,
      accountNumber: selectedPayee.account,
      category: selectedPayee.category,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[740px]">
      {/* Mobile Top App Bar */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/src/assets/images/bank_user_avatar_1790342748367.jpg"
              alt="Julian Vance"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight">Julian Vance</h1>
              <span className="text-[10px] text-amber-400 font-medium">PRIVATE VAULT</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" />
                <span>Voice Biometric Active</span>
              </span>
              <span>·</span>
              <span className="text-slate-500">Tier 1</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGuideModal && (
            <button
              onClick={onOpenGuideModal}
              title="User Guide & System Walkthrough"
              aria-label="Open user guide and walkthrough"
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </button>
          )}
          <button
            onClick={onOpenEnrollment}
            title="Biometric Voice Calibration & Strictness"
            aria-label="Open voice calibration studio"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
          >
            <Mic className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Navigation Segmented Tabs */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'accounts' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'transfers' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Send Wire
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'cards' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cards & Vault
          </button>
        </div>

        {/* Tab 1: Accounts Overview */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            {/* Total Balance Card */}
            <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Liquid Capital</span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showBalance ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                  {showBalance ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '•••••••• USD'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={onOpenEnrollment}
                  className="flex items-center gap-1.5 hover:brightness-125 transition-all text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
                  title="Click to calibrate voiceprint or adjust matching strictness"
                >
                  {enrolledVoiceprint.isCalibrated ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  )}
                  <span className={enrolledVoiceprint.isCalibrated ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    Aegis Voice Shield: {enrolledVoiceprint.isCalibrated ? 'Verified & Active' : 'Re-Calibration Required'}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      enrolledVoiceprint.isCalibrated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1 text-emerald-400 font-mono">
                  <TrendingUp className="w-3 h-3" />
                  <span>+4.85% APY Vault</span>
                </div>
              </div>
            </div>

            {/* Real-time Frequency Domain F0 Visualizer vs Enrolled Baseline */}
            <F0FrequencyChart
              telemetry={telemetry}
              enrolledVoiceprint={enrolledVoiceprint}
              compact={false}
            />

            {/* Individual Accounts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-medium">
                <span>Deposit Accounts</span>
                <span className="text-[11px] text-slate-500">2 Active</span>
              </div>

              {accounts.map((acc) => {
                const sec = getAccountVoiceSecurityStatus(acc);
                const SecIcon = sec.icon;

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    {/* Top Row: Account Details & Balance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                          {acc.type === 'vault' ? (
                            <Lock className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Building2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200 block">{acc.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{acc.accountNumber}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-100 font-mono tabular-nums block">
                          {showBalance
                            ? `$${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : '••••••'}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{acc.currency}</span>
                      </div>
                    </div>

                    {/* Dynamic Voice Authentication Status Indicator */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEnrollment();
                        }}
                        className={`flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded px-1 -mx-1 ${sec.color} hover:brightness-125`}
                        title={`${sec.description} · Click to calibrate voiceprint or adjust matching strictness`}
                        aria-label={`Voice authentication status: ${sec.label}. Click to calibrate.`}
                      >
                        <SecIcon className={`w-3.5 h-3.5 shrink-0 ${sec.status === 'verified' ? '' : 'animate-pulse'}`} />
                        <span className="font-medium tracking-tight">{sec.label}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sec.dotColor} ${
                            sec.status === 'verified' ? 'animate-pulse' : ''
                          }`}
                        />
                      </button>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {acc.type === 'vault' ? '3FA Protected' : 'MFA Guarded'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {onAddFunds && (
                <div className="flex items-center justify-between pt-1 px-1">
                  <button
                    onClick={() => onAddFunds(10000)}
                    className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none"
                    title="Deposit $10,000 demo capital to test transactions"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quick Deposit +$10,000</span>
                  </button>
                  <span className="text-[10px] text-slate-500">Test Account Liquidity</span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setActiveTab('transfers')}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Instant Wire Transfer</span>
              </button>

              <button
                onClick={onOpenSpoofLab}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Spoof Test Lab</span>
              </button>
            </div>

            {/* Recent Verified Activity */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-medium">
                <span>Recent Activity & MFA Logs</span>
                <button
                  onClick={onOpenAuditLogs}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  View All ({transactions.length})
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    onClick={onOpenAuditLogs}
                    className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl flex items-center justify-between hover:bg-slate-850 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          tx.status === 'BLOCKED_SPOOF'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {tx.status === 'BLOCKED_SPOOF' ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block truncate max-w-[150px]">
                          {tx.recipient}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>{tx.date}</span>
                          <span>·</span>
                          <span className={tx.status === 'BLOCKED_SPOOF' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {tx.status === 'BLOCKED_SPOOF' ? 'Spoof Attack Blocked' : 'Voice MFA Verified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-100 font-mono tabular-nums block">
                        -${tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500">{tx.riskTier} RISK</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Send Wire Transfer */}
        {activeTab === 'transfers' && (
          <form onSubmit={handleStartWire} className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                1. Transfer Amount & Risk Calculation
              </span>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Transfer Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-slate-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Quick Risk Tier Preset Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setTransferAmount('180')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none ${
                      transferAmount === '180'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>$180 (Tier 1 Low)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferAmount('1250')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none ${
                      transferAmount === '1250'
                        ? 'bg-sky-950/60 border-sky-500/60 text-sky-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>$1,250 (Tier 2 Med)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferAmount('5000')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500 focus:outline-none ${
                      transferAmount === '5000'
                        ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>$5,000 (Tier 3 High)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Risk Tier Assessment Indicator */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  currentRiskTier === 'HIGH'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : currentRiskTier === 'MEDIUM'
                    ? 'bg-sky-950/30 border-sky-500/40 text-sky-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">
                    Security Level: {currentRiskTier} RISK (${parsedAmount.toLocaleString()})
                  </span>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    {currentRiskTier === 'HIGH'
                      ? 'Requires 3-Factor Verification: Biometric Voice Match + Dynamic Challenge + 6-digit Banking PIN.'
                      : currentRiskTier === 'MEDIUM'
                      ? 'Requires 2-Factor Verification: Biometric Voiceprint + Dynamic Anti-Replay Challenge.'
                      : 'Requires Standard Voice Biometric Verification.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payee Selection */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                2. Select Verified Beneficiary
              </span>

              <div className="space-y-2">
                {PAYEES.map((payee) => (
                  <div
                    key={payee.account}
                    onClick={() => {
                      setSelectedPayee(payee);
                      setCustomPayee('');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                      selectedPayee.account === payee.account && !customPayee
                        ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{payee.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{payee.account}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">Verified Payee</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              disabled={parsedAmount <= 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Verify & Authorize Wire (${parsedAmount.toLocaleString()})</span>
            </button>
          </form>
        )}

        {/* Tab 3: Obsidian Black Private Card */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <img
                src="/src/assets/images/bank_card_chip_1790342771583.jpg"
                alt="Obsidian Private Card"
                referrerPolicy="no-referrer"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-slate-200 uppercase">
                    Aegis Sovereign Reserve
                  </span>
                  <img
                    src="/src/assets/images/banking_security_shield_1790342760065.jpg"
                    alt="Shield Crest"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                  />
                </div>

                <div>
                  <span className="font-mono text-base tracking-widest text-white block">
                    •••• •••• •••• 9104
                  </span>
                  <div className="flex justify-between text-[11px] text-slate-300 mt-2 font-mono">
                    <span>JULIAN VANCE</span>
                    <span>EXP 09/31</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Profile Info */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
              <span className="font-semibold text-slate-200 block">Biometric Security Status</span>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Voiceprint Calibration:</span>
                  <button
                    type="button"
                    onClick={onOpenEnrollment}
                    className="flex items-center gap-1.5 font-mono text-xs font-semibold hover:brightness-125 transition-all focus:outline-none"
                    title="Click to calibrate voiceprint or adjust matching strictness"
                  >
                    {enrolledVoiceprint.isCalibrated ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">VERIFIED (3 SAMPLES)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="text-amber-400">RE-CALIBRATION REQUIRED</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </>
                    )}
                  </button>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Fundamental Pitch ($F_0$):</span>
                  <span className="font-mono text-slate-200">{enrolledVoiceprint.pitchMean} Hz</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Micro-Jitter Baseline:</span>
                  <span className="font-mono text-slate-200">
                    {enrolledVoiceprint.microJitterBaseline.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Algorithm Strictness:</span>
                  <button
                    onClick={onOpenEnrollment}
                    className="font-mono text-emerald-400 font-semibold hover:underline"
                    title="Click to adjust Sensitivity & Strictness slider"
                  >
                    {enrolledVoiceprint.sensitivity ?? 75}% Threshold
                  </button>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Multi-Factor Engine:</span>
                  <span className="text-emerald-400 font-mono">AEGIS-ML-v4.2</span>
                </div>
              </div>

              <button
                onClick={onOpenEnrollment}
                className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recalibrate Voiceprint</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom Tab Bar */}
      <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-slate-400 text-xs">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'accounts' ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'}`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-[10px]">Banking</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'transfers' ? 'text-emerald-400 font-medium' : 'hover:text-slate-200'}`}
        >
          <Send className="w-4 h-4" />
          <span className="text-[10px]">Transfer</span>
        </button>

        <button
          onClick={onOpenSpoofLab}
          className="flex flex-col items-center gap-0.5 hover:text-slate-200"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="text-[10px]">Spoof Lab</span>
        </button>

        <button
          onClick={onOpenAuditLogs}
          className="flex flex-col items-center gap-0.5 hover:text-slate-200"
        >
          <Fingerprint className="w-4 h-4" />
          <span className="text-[10px]">Audits</span>
        </button>
      </div>
    </div>
  );
};
