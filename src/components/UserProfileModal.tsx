import React, { useState } from 'react';
import { EnrolledVoiceprint } from '../types';
import {
  User,
  Users,
  ShieldCheck,
  Check,
  Sparkles,
  Sliders,
  Lock,
  Mic,
  Radio,
  Plus,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: EnrolledVoiceprint;
  onSelectProfile: (profile: EnrolledVoiceprint) => void;
  isSimulatedAudio: boolean;
  onToggleSimulatedAudio: (enabled: boolean) => void;
}

export const PRESET_PROFILES: EnrolledVoiceprint[] = [
  {
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
    customPin: '849201',
    vocalRange: 'baritone',
    avatarUrl: '/src/assets/images/bank_user_avatar_1790342748367.jpg',
  },
  {
    userId: 'USR-ELENA-ROSTOVA',
    userName: 'Elena Rostova',
    enrolledAt: '2026-09-25T02:10:00Z',
    pitchMean: 215,
    pitchVariance: 16.0,
    microJitterBaseline: 0.034,
    spectralRolloffBaseline: 7200,
    sampleCount: 3,
    mfccSignature: [0.91, 0.52, -0.28, 0.18, -0.04, 0.26, -0.11, 0.08, -0.03, 0.02, -0.01, 0.01, 0.0],
    noiseFloorBaselineDb: -54,
    isCalibrated: true,
    sensitivity: 80,
    customPin: '902144',
    vocalRange: 'alto',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSelectProfile,
  isSimulatedAudio,
  onToggleSimulatedAudio,
}) => {
  const [customName, setCustomName] = useState(
    currentProfile.userId.startsWith('USR-CUSTOM') ? currentProfile.userName : 'My Voice Profile'
  );
  const [customPin, setCustomPin] = useState(currentProfile.customPin || '849201');
  const [vocalRange, setVocalRange] = useState<'baritone' | 'tenor' | 'alto' | 'soprano'>(
    (currentProfile.vocalRange as any) || 'baritone'
  );

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const pitchMap = {
      baritone: 135,
      tenor: 165,
      alto: 210,
      soprano: 245,
    };

    const newProfile: EnrolledVoiceprint = {
      userId: `USR-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
      userName: customName.trim() || 'Custom User',
      enrolledAt: new Date().toISOString(),
      pitchMean: pitchMap[vocalRange],
      pitchVariance: 15.0,
      microJitterBaseline: 0.036,
      spectralRolloffBaseline: 6900,
      sampleCount: 3,
      mfccSignature: [0.85, 0.48, -0.3, 0.16, -0.06, 0.24, -0.12, 0.08, -0.04, 0.02, -0.01, 0.01, 0.0],
      noiseFloorBaselineDb: -55,
      isCalibrated: true,
      sensitivity: 75,
      customPin: customPin.trim() || '849201',
      vocalRange,
    };

    onSelectProfile(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                User Profiles & Audio Channel Setup
              </h2>
              <p className="text-[11px] text-slate-400">
                Select or configure your voiceprint identity
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Audio Input Channel Selector (Live Mic vs Virtual Simulator) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                <span>Audio Input Channel Mode</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isSimulatedAudio ? 'bg-sky-950/80 border-sky-500/40 text-sky-300' : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'}`}>
                {isSimulatedAudio ? 'Acoustic Simulator' : 'Physical Microphone'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isSimulatedAudio
                ? 'Simulation channel active: ideal for testing in quiet rooms, restricted browser permissions, or without a microphone.'
                : 'Live microphone active: captures real vocal acoustics, formants, and ambient noise.'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => onToggleSimulatedAudio(false)}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  !isSimulatedAudio
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Live Mic Mode</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleSimulatedAudio(true)}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  isSimulatedAudio
                    ? 'bg-sky-950/70 border-sky-500/60 text-sky-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Simulator Mode</span>
              </button>
            </div>
          </div>

          {/* Preset Profiles */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              1. Enrolled Banking Personas
            </span>

            <div className="space-y-2">
              {PRESET_PROFILES.map((profile) => {
                const isSelected = currentProfile.userId === profile.userId;
                return (
                  <div
                    key={profile.userId}
                    onClick={() => {
                      onSelectProfile(profile);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs overflow-hidden">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          profile.userName[0]
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-100">{profile.userName}</span>
                          {isSelected && <span className="text-[10px] text-emerald-400 font-medium">Active</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Pitch: {profile.pitchMean} Hz ({profile.vocalRange?.toUpperCase()}) · PIN: {profile.customPin}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] text-slate-500 hover:text-slate-300">Switch</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Custom Profile */}
          <form onSubmit={handleCreateCustom} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Create / Personalize Your Own Profile</span>
              </span>
              <span className="text-[10px] text-slate-500">Custom Identity</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Your Display Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Vocal Register</label>
                <select
                  value={vocalRange}
                  onChange={(e) => setVocalRange(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="baritone">Baritone (~135 Hz)</option>
                  <option value="tenor">Tenor (~165 Hz)</option>
                  <option value="alto">Alto (~210 Hz)</option>
                  <option value="soprano">Soprano (~245 Hz)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Secondary PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="849201"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono text-center tracking-wider focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Activate & Save Custom Profile</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
