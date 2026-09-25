export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EnrolledVoiceprint {
  userId: string;
  userName: string;
  enrolledAt: string;
  pitchMean: number;
  pitchVariance: number;
  microJitterBaseline: number;
  spectralRolloffBaseline: number;
  sampleCount: number;
  mfccSignature: number[];
  noiseFloorBaselineDb: number;
  isCalibrated: boolean;
  sensitivity?: number; // Matching strictness threshold percentage (50% - 95%, default 75%)
  customPin?: string; // Optional user-chosen 6-digit banking PIN
  vocalRange?: 'baritone' | 'tenor' | 'alto' | 'soprano' | 'custom';
  avatarUrl?: string;
}

export interface AcousticTelemetry {
  rmsLevel: number;
  rmsDb: number;
  snr: number;
  noiseFloorDb: number;
  pitchHz: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  microJitter: number;
  speechDetected: boolean;
  noiseCancelled: boolean;
  simulatedAttack?: 'none' | 'replay' | 'tts' | 'noise';
}

export interface DynamicChallenge {
  challengeId: string;
  phrase: string;
  nonce: number;
  issuedAt: number;
  expiresAt: number;
  targetKeyPhonemes: string[];
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'vault' | 'investment';
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  recipient: string;
  accountNumber: string;
  amount: number;
  category: string;
  status: 'COMPLETED' | 'BLOCKED_SPOOF' | 'PENDING_MFA' | 'REJECTED';
  riskTier: RiskTier;
  mfaFactorsUsed: string[];
  spoofScore?: number;
  challengePhrase?: string;
  auditHash?: string;
}

export interface VerificationResult {
  decision: 'APPROVED' | 'REJECTED_SPOOF' | 'REJECTED_MISMATCH' | 'REJECTED_PIN' | 'REJECTED_CHALLENGE';
  isApproved: boolean;
  factors: {
    factor1_voiceBiometrics: {
      passed: boolean;
      confidence: number;
      requiredThreshold?: number;
      enrolledPitchHz: number;
      detectedPitchHz: number;
    };
    factor2_antiSpoofShield: {
      passed: boolean;
      spoofProbability: number;
      detectedAttackType: 'none' | 'replay_attack' | 'tts_synthetic' | 'voice_clone' | 'spectral_anomaly';
      livenessScore: number;
      anomalies: string[];
    };
    factor3_dynamicChallenge: {
      passed: boolean;
      accuracy: number;
      challengeText: string;
      spokenTranscript: string;
    };
    factor4_securePin: {
      required: boolean;
      passed: boolean;
    };
  };
  telemetry: {
    snrDb: number;
    spectralRolloffHz: number;
    microJitter: number;
    aiEnhanced: boolean;
    aiSummary: string;
  };
  auditTimestamp: string;
  transactionId: string;
}

export interface SpoofAttackConfig {
  activeAttack: 'none' | 'replay' | 'tts' | 'noise';
  reverberationAmount: number; // 0 to 1
  speakerFilterCutoff: number; // e.g. 3500 Hz for low quality speaker replay
  pitchFlattening: number; // 0 to 1 (monotone synthetic)
  injectedNoiseLevel: number; // in dB, e.g. -15dB to 0dB
}

export interface NoiseCancellationConfig {
  enabled: boolean;
  highpassCutoff: number; // 85Hz
  notchHum60Hz: boolean;
  vocalFormantBoost: boolean; // +3.5dB at 1.8kHz
  spectralSubtraction: boolean;
  aggressiveness: number; // 1 to 5
}
