import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getOrCreateSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const secretPath = path.join(__dirname, '.session_secret');
  try {
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
    const newSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, newSecret, 'utf8');
    return newSecret;
  } catch {
    return 'fogleague_fallback_secret_salt_2026_dbd_esport_secure';
  }
}

// Clé secrète de signature HMAC côté serveur (inconnue de tout attaquant, persistée localement)
const SERVER_SECRET = getOrCreateSecret();

// ==============================================================
// 1. EN-TÊTES DE SÉCURITÉ DE NIVEAU MILITAIRE (HELMET & CSP)
// ==============================================================
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline pour Vite dev HMR
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://avatars.steamstatic.com",
        "https://images.unsplash.com",
        "https://*.steamcommunity.com",
      ],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "http:",
        "https:",
        "https://*.supabase.co",
        "https://steamcommunity.com",
      ],
      frameAncestors: ["'none'"], // Bloque toute tentative de Clickjacking / Iframe
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://steamcommunity.com"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// ==============================================================
// 2. PARRE-FEU RATE-LIMITING (ANTI-DDOS, ANTI-BRUTE-FORCE)
// ==============================================================

// Limiteur général d'API : 120 requêtes / minute par IP
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de requêtes atteinte (Anti-DDoS actif). Veuillez patienter 60 secondes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Limiteur ultra-strict sur l'authentification : 12 requêtes / minute par IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de tentatives de connexion (Anti-Brute-Force actif). Réessayez dans 1 minute.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// ==============================================================
// 3. ASSAINISSEMENT & PROTECTION ANTI-INJECTION (XSS / PROTOTYPE)
// ==============================================================

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeInput(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  // Empêcher la pollution de prototype
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Élimination directe des vecteurs de Prototype Pollution
    }
    if (typeof value === 'string') {
      // Nettoyage des chaînes
      clean[key] = escapeHtml(value.trim().slice(0, 5000));
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeInput(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete req.body[key];
      } else if (typeof req.body[key] === 'string') {
        req.body[key] = escapeHtml(req.body[key].trim().slice(0, 5000));
      }
    }
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete req.query[key];
      }
    }
  }
  next();
}

// ==============================================================
// 4. SIGNATURE CRYPTOGRAPHIQUE DES SESSIONS (ANTI-USURPATION)
// ==============================================================
// 4. SIGNATURE CRYPTOGRAPHIQUE DES SESSIONS (ANTI-USURPATION & TTL)
// ==============================================================

/**
 * Crée un jeton de session cryptographiquement signé avec HMAC-SHA256
 * Format : base64url(payload) + '.' + hex(hmacSignature)
 * Inclut une date d'expiration TTL stricte de 24 heures.
 */
export function signSessionToken(userData) {
  const payload = {
    ...userData,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 heures de validité
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(payloadB64)
    .digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Vérifie l'authenticité et l'expiration d'un jeton de session.
 * Retourne les données de l'utilisateur si la signature est valide et non expirée, sinon null.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  try {
    // Calcul de la signature attendue
    const expectedSig = crypto
      .createHmac('sha256', SERVER_SECRET)
      .update(payloadB64)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    // Vérification de la longueur avant comparaison en temps constant (Timing-Attack Safe)
    if (sigBuf.length !== expBuf.length || sigBuf.length === 0) {
      return null;
    }

    const isMatch = crypto.timingSafeEqual(sigBuf, expBuf);
    if (!isMatch) return null;

    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const data = JSON.parse(jsonStr);

    // Contrôle d'expiration TTL (Anti-Replay / Jeton Volé)
    if (data.exp && typeof data.exp === 'number' && Date.now() > data.exp) {
      console.warn(`[Security-Auth] ⏱️ Jeton expiré pour l'utilisateur ${data.name || data.id}`);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

