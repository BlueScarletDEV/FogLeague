export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  steamId: string;
  steamConnected: boolean;
  vacBanned: boolean;
  gameHoursDBD: number;
  trustFactor: 'Élite (100%)' | 'Élevé (95%)' | 'Standard (80%)' | 'Suspect';
  twoFactorEnabled: boolean;
  registeredAt: string;
  lastLoginIp: string;
  sentinelVerified?: boolean;
  fairPlayVerified?: boolean;
  elo?: number;
  karma?: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'alert';
  subsystem: 'VALVE-OPENID' | 'STEAM-GUARD' | 'CRYPTO-HASH' | 'RATE-LIMITER' | 'CONSENSUS' | 'WEBSOCKET' | 'SENTINEL-AI' | 'ANTI-CHEAT' | 'OCR-INTEGRITY';
  message: string;
  signature: string;
}

export interface SecurityStatus {
  threatLevel: 'NULLE' | 'BASSE' | 'MOYENNE' | 'CRITIQUE';
  threatScore: number; // 0 à 100 (0 = 100% sécurisé)
  inspectionsCount: number;
  tamperAttemptsBlocked: number;
  encryptionProtocol: string;
  securityEngineVersion: string;
  aiModelVersion?: string;
  activeShields: {
    valveOpenIdAuth: boolean;
    vacCleanCheck: boolean;
    ddosMitigation: boolean;
    sha256Sealing: boolean;
    dualConsensus: boolean;
    steamIntegrity?: boolean;
    ocrAntiPhotoshop?: boolean;
    kyfMemoryScan?: boolean;
    smartPerkValidator?: boolean;
  };
}
