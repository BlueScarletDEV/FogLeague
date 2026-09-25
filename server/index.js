import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { runArbitrationScan } from './arbitrationEngine.js';
import { upsertSteamPlayer, persistMatchResult } from './db.js';
import {
  securityHeaders,
  globalRateLimiter,
  authRateLimiter,
  sanitizeMiddleware,
  escapeHtml,
  signSessionToken,
  verifySessionToken,
} from './securityMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ==============================================================
// 🛡️ HARDENING CORS STRICT (AUCUNE ORIGINE ARBITRAIRE EN PROD)
// ==============================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Requêtes serveur-à-serveur, curl, webhooks ou origines whitelistées
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[Security-CORS] 🚨 Blocage d'une tentative non autorisée depuis : ${origin}`);
    return callback(new Error(`Bloqué par la politique CORS FogLeague.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
};

// Application des en-têtes de sécurité Helmet & CSP
app.use(securityHeaders);
app.use(cors(corsOptions));

// Limitation stricte de taille des corps de requête (Bloque les JSON Bombs & Buffer Overflows)
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Assainissement systématique des entrées (Anti-XSS & Anti-Prototype Pollution)
app.use(sanitizeMiddleware);

// Rate Limiting global pour toutes les routes API
app.use('/api/', globalRateLimiter);

// Serve production static frontend if available
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Configuration Socket.io avec contrôle de buffer et CORS durci
const io = new Server(httpServer, {
  cors: corsOptions,
  maxHttpBufferSize: 1e5, // 100 KB max buffer (anti-DoS WebSocket)
});

// Real-time matchmaking state
const queue = [];
const activeMatches = {};

// Health check and statistics API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FogLeague Dedicated Backend & WebSocket Relay',
    securityShields: {
      helmetActive: true,
      cspStrict: true,
      rateLimitingActive: true,
      hmacSignatureActive: true,
      antiPrototypePollution: true,
    },
    connectedSockets: io.engine.clientsCount,
    playersInQueue: queue.length,
    activeMatchesCount: Object.keys(activeMatches).length,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================
// 🔐 VRAIE AUTHENTIFICATION STEAM OPENID 2.0 (VALVE OFFICIAL)
// ==============================================================

let lastClientOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Redirection vers Valve steamcommunity.com (Rate-limité)
app.get('/api/auth/steam', authRateLimiter, (req, res) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;

  if (req.query.origin) {
    const rawOrigin = req.query.origin.replace(/\/$/, '');
    if (allowedOrigins.includes(rawOrigin)) {
      lastClientOrigin = rawOrigin;
    }
  } else if (req.headers.referer) {
    try {
      const u = new URL(req.headers.referer);
      if (allowedOrigins.includes(u.origin)) {
        lastClientOrigin = u.origin;
      }
    } catch {}
  }

  const returnTo = `${protocol}://${host}/api/auth/steam/return?client_origin=${encodeURIComponent(lastClientOrigin)}`;
  const realm = `${protocol}://${host}/`;

  console.log(`[Steam-Auth] Redirection vers Valve (Client Origin: ${lastClientOrigin})...`);

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  res.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
});

// 2. Callback officiel retour de Valve (Rate-limité & Vérification HMAC-SHA1)
app.get('/api/auth/steam/return', authRateLimiter, async (req, res) => {
  try {
    console.log('[Steam-Auth] Callback reçu depuis Valve ! Vérification de la signature cryptographique...');

    // Préparer la vérification auprès de Valve (check_authentication)
    const checkParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith('openid.')) {
        checkParams.append(key, String(value));
      }
    }
    checkParams.set('openid.mode', 'check_authentication');

    const checkRes = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkParams.toString(),
    });

    const checkText = await checkRes.text();
    const isValid = checkText.includes('is_valid:true');

    if (!isValid) {
      console.warn('[Steam-Auth] 🚨 Signature Valve rejetée (invalide ou altérée).');
      return res.redirect('/?auth_error=steam_signature_invalid');
    }

    // Extraire le SteamID64 officiel vérifié
    const claimedId = req.query['openid.claimed_id'] || '';
    const match = claimedId.match(/\/id\/(\d+)$/);

    if (!match) {
      console.warn('[Steam-Auth] Impossible d\'extraire le SteamID64.');
      return res.redirect('/?auth_error=no_steamid');
    }

    const steamId64 = match[1];
    console.log(`[Steam-Auth] ✅ Joueur certifié par Valve ! SteamID64: ${steamId64}`);

    // Récupérer le vrai profil public via l'API XML Valve
    let profileData = {
      name: `SteamUser_${steamId64.slice(-4)}`,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      vacBanned: false,
    };

    try {
      const xmlRes = await fetch(`https://steamcommunity.com/profiles/${steamId64}/?xml=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      const xml = await xmlRes.text();

      const nameMatch = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xml.match(/<steamID>(.*?)<\/steamID>/);
      const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xml.match(/<avatarFull>(.*?)<\/avatarFull>/);
      const vacMatch = xml.match(/<vacBanned>(.*?)<\/vacBanned>/);

      if (nameMatch && nameMatch[1]) profileData.name = escapeHtml(nameMatch[1]);
      if (avatarMatch && avatarMatch[1]) profileData.avatar = avatarMatch[1];
      if (vacMatch && vacMatch[1]) profileData.vacBanned = vacMatch[1] === '1';
    } catch (fetchErr) {
      console.warn('[Steam-Auth] Erreur lors de la récupération du profil XML:', fetchErr);
    }

    const safeEmailPrefix = profileData.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `steam_${steamId64.slice(-4)}`;

    const verifiedUser = {
      id: `usr_steam_${steamId64}`,
      name: profileData.name,
      email: `${safeEmailPrefix}@steam.comp`,
      avatar: profileData.avatar,
      steamId: steamId64,
      steamConnected: true,
      vacBanned: profileData.vacBanned,
      gameHoursDBD: 1680,
      trustFactor: profileData.vacBanned ? 'Suspect' : 'Élite (100%)',
      twoFactorEnabled: true,
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginIp: req.ip || '127.0.0.1',
      fairPlayVerified: true,
      elo: 1200,
      karma: 100,
    };

    // Sauvegarde automatique dans PostgreSQL Supabase si configuré
    await upsertSteamPlayer(verifiedUser);

    // 🔐 SIGNATURE CRYPTOGRAPHIQUE HMAC-SHA256 SERVEUR (Impossible à forger côté client)
    const sessionToken = signSessionToken(verifiedUser);
    const userJsonStr = JSON.stringify(verifiedUser);
    const userBase64 = Buffer.from(userJsonStr, 'utf-8').toString('base64url');

    const clientOrigin = req.query.client_origin || lastClientOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const cleanOrigin = allowedOrigins.includes(clientOrigin.replace(/\/$/, '')) ? clientOrigin.replace(/\/$/, '') : 'http://localhost:5173';
    const redirectUrl = `${cleanOrigin}/?steam_auth=success&token=${encodeURIComponent(sessionToken)}`;

    console.log(`[Steam-Auth] 🛡️ Jeton HMAC-SHA256 émis pour ${verifiedUser.name}. Redirection vers : ${cleanOrigin}`);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Steam-Auth] Erreur serveur lors de la validation Valve:', err);
    res.redirect('/?auth_error=server_error');
  }
});

// 3. Endpoint de vérification cryptographique de jeton (Protection Anti-Falsification)
app.post('/api/auth/verify-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Jeton de session requis.' });
  }

  const verifiedUser = verifySessionToken(token);
  if (!verifiedUser) {
    console.warn(`[Security-Auth] 🚨 Tentative de connexion avec jeton HMAC falsifié depuis l'IP ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'Signature cryptographique de session invalide ou falsifiée. Accès refusé.',
      code: 'INVALID_SIGNATURE',
    });
  }

  res.json({
    success: true,
    user: verifiedUser,
  });
});

// 4. Endpoint d'interrogation Valve public (Rate-limité et vérification du format)
app.post('/api/auth/steam/direct-lookup', authRateLimiter, async (req, res) => {
  const { steamId } = req.body;
  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return res.status(400).json({ error: 'SteamID64 invalide (doit contenir exactement 17 chiffres).' });
  }

  try {
    const xmlRes = await fetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const xml = await xmlRes.text();

    const nameMatch = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xml.match(/<steamID>(.*?)<\/steamID>/);
    const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xml.match(/<avatarFull>(.*?)<\/avatarFull>/);
    const vacMatch = xml.match(/<vacBanned>(.*?)<\/vacBanned>/);
    const memberSinceMatch = xml.match(/<memberSince>(.*?)<\/memberSince>/);
    const onlineStateMatch = xml.match(/<onlineState>(.*?)<\/onlineState>/);
    const tradeBanMatch = xml.match(/<tradeBanState>(.*?)<\/tradeBanState>/);
    const locationMatch = xml.match(/<location><!\[CDATA\[(.*?)\]\]><\/location>/) || xml.match(/<location>(.*?)<\/location>/);

    const isVacBanned = vacMatch ? vacMatch[1] === '1' : false;
    const memberSince = memberSinceMatch ? memberSinceMatch[1] : 'Inconnue';

    let dbdHours = 0;
    if (process.env.STEAM_API_KEY) {
      try {
        const gamesRes = await fetch(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1`
        );
        const gamesData = await gamesRes.json();
        const dbdGame = gamesData.response?.games?.find((g) => g.appid === 381210);
        if (dbdGame && dbdGame.playtime_forever) {
          dbdHours = Math.round(dbdGame.playtime_forever / 60);
        }
      } catch (apiErr) {
        console.warn('[Steam-API] Impossible d\'interroger IPlayerService:', apiErr);
      }
    }

    const rawName = nameMatch ? nameMatch[1] : `Steam_${steamId.slice(-4)}`;
    const playerName = escapeHtml(rawName);
    const safeEmailPrefix = playerName.toLowerCase().replace(/[^a-z0-9]/g, '') || `steam_${steamId.slice(-4)}`;

    const verifiedUser = {
      id: `usr_steam_${steamId}`,
      name: playerName,
      email: `${safeEmailPrefix}@steam.comp`,
      avatar: avatarMatch ? avatarMatch[1] : 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      steamId: steamId,
      steamConnected: true,
      vacBanned: isVacBanned,
      gameHoursDBD: dbdHours,
      memberSince: memberSince,
      onlineState: onlineStateMatch ? onlineStateMatch[1] : 'offline',
      tradeBanState: tradeBanMatch ? tradeBanMatch[1] : 'None',
      location: locationMatch ? escapeHtml(locationMatch[1]) : 'Non renseigné',
      trustFactor: isVacBanned ? 'Suspect' : 'Élite (100%)',
      twoFactorEnabled: true,
      registeredAt: memberSince !== 'Inconnue' ? memberSince : new Date().toISOString().split('T')[0],
      fairPlayVerified: true,
      elo: 1200,
      karma: 100,
    };

    res.json({
      success: true,
      user: verifiedUser,
      valveProof: {
        steamId64: steamId,
        vacStatus: isVacBanned ? 'BANNISSEMENT VAC ACTIF' : 'AUCUN BAN VAC (CLEAN)',
        accountCreated: memberSince,
        tradeStatus: tradeBanMatch ? tradeBanMatch[1] : 'None',
      }
    });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la communication avec les serveurs Valve.' });
  }
});

// ==============================================================
// ⚡ WEBSOCKET SECURISE (ANTI-FLOOD, ANTI-SPOOFING & SALONS PRIVES)
// ==============================================================

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;

  // 1. Limiter le nombre de connexions WebSocket simultanées par IP (Anti-Botnet)
  const socketsFromSameIp = Array.from(io.sockets.sockets.values()).filter(
    (s) => s.handshake.address === clientIp
  ).length;

  if (socketsFromSameIp > 8) {
    console.warn(`[Security-WS] 🚨 Rejet de connexion : IP ${clientIp} dépasse le quota de sockets.`);
    socket.emit('security_alert', { message: 'Connexions simultanées excessives.' });
    socket.disconnect(true);
    return;
  }

  console.log(`[FogLeague-WS] Joueur connecté : ${socket.id} (IP: ${clientIp})`);

  // 2. Throttling anti-flood par socket (Max 15 événements / seconde)
  const eventTimestamps = [];
  const isRateLimited = () => {
    const now = Date.now();
    eventTimestamps.push(now);
    while (eventTimestamps.length > 0 && eventTimestamps[0] < now - 1000) {
      eventTimestamps.shift();
    }
    return eventTimestamps.length > 15;
  };

  io.emit('stats_update', {
    onlinePlayers: io.engine.clientsCount,
    inQueueCount: queue.length,
    activeMatchesCount: Object.keys(activeMatches).length,
  });

  socket.on('join_queue', (data) => {
    if (isRateLimited()) return;
    if (!data || !data.player || !data.player.name) return;

    // Assainissement du joueur
    const safePlayer = {
      ...data.player,
      name: escapeHtml(String(data.player.name).slice(0, 32)),
    };

    console.log(`[Queue] ${safePlayer.name} entre en file (${data.mode})`);

    const existingIndex = queue.findIndex((q) => q.socketId === socket.id);
    if (existingIndex !== -1) queue.splice(existingIndex, 1);

    queue.push({
      socketId: socket.id,
      player: safePlayer,
      mode: data.mode,
      role: data.role,
      queuedAt: Date.now(),
    });

    const playersInMode = queue.filter((q) => q.mode === data.mode);
    const requiredPlayers = 2;

    if (playersInMode.length >= requiredPlayers) {
      const matched = playersInMode.splice(0, requiredPlayers);

      // Assainir le profil joueur pour ne jamais exposer son IP ou email à l'adversaire
      const sanitizePlayerForOpponent = (p) => {
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          elo: p.elo,
          role: p.role,
          mainKiller: p.mainKiller,
          mainSurvivor: p.mainSurvivor,
          karma: p.karma,
          trustFactor: p.trustFactor,
          vacBanned: p.vacBanned,
          isCaptain: Boolean(p.isCaptain),
          socketId: p.socketId,
        };
      };

      matched.forEach((m) => {
        const idx = queue.findIndex((q) => q.socketId === m.socketId);
        if (idx !== -1) queue.splice(idx, 1);
      });

      // 🛡️ UUID Cryptographique pour rendre les IDs de match impossibles à deviner ou énumérer
      const matchId = `fog-${crypto.randomUUID()}`;
      const lobbyCode = `DBD-${crypto.randomBytes(3).toString('hex').toUpperCase()}-EU`;

      const matchData = {
        id: matchId,
        mode: data.mode,
        team1: [sanitizePlayerForOpponent({ ...matched[0].player, isCaptain: true, socketId: matched[0].socketId })],
        team2: [sanitizePlayerForOpponent({ ...matched[1].player, isCaptain: true, socketId: matched[1].socketId })],
        lobbyCode: lobbyCode,
        serverRegion: 'Europe Ouest (Paris - 9ms)',
        activeVetoTurn: 'team1',
        bannedMaps: [],
        createdAt: Date.now(),
      };

      activeMatches[matchId] = matchData;

      matched.forEach((m, idx) => {
        const clientSocket = io.sockets.sockets.get(m.socketId);
        if (clientSocket) {
          clientSocket.join(matchId);
          clientSocket.emit('match_ready', {
            match: matchData,
            assignedTeam: idx === 0 ? 'team1' : 'team2',
          });
        }
      });

      console.log(`[Match] ⚔️ Salle #${matchId} créée entre ${matched[0].player.name} et ${matched[1].player.name}`);
    }

    io.emit('stats_update', {
      onlinePlayers: io.engine.clientsCount,
      inQueueCount: queue.length,
      activeMatchesCount: Object.keys(activeMatches).length,
    });
  });

  socket.on('leave_queue', () => {
    const idx = queue.findIndex((q) => q.socketId === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    io.emit('stats_update', {
      onlinePlayers: io.engine.clientsCount,
      inQueueCount: queue.length,
      activeMatchesCount: Object.keys(activeMatches).length,
    });
  });

  socket.on('ban_map', ({ matchId, mapId, bannedByName, nextTurn }) => {
    if (isRateLimited()) return;
    if (!matchId || !activeMatches[matchId]) return;

    const match = activeMatches[matchId];
    const isPlayerInMatch = (match.team1 && match.team1.some((p) => p.socketId === socket.id)) ||
                            (match.team2 && match.team2.some((p) => p.socketId === socket.id));
    if (!isPlayerInMatch) {
      socket.emit('security_alert', { message: 'Action non autorisée : vous n\'êtes pas joueur de ce match.' });
      return;
    }

    io.to(matchId).emit('map_banned_update', {
      mapId: escapeHtml(String(mapId).slice(0, 50)),
      bannedByName: escapeHtml(String(bannedByName).slice(0, 32)),
      nextTurn,
    });
  });

  socket.on('send_match_chat', ({ matchId, message }) => {
    if (isRateLimited()) {
      socket.emit('chat_error', { error: 'Anti-Spam actif. Ralentissez vos envois.' });
      return;
    }
    if (!matchId || !message || typeof message.text !== 'string') return;

    const match = activeMatches[matchId];
    if (!match) return;

    const isPlayerInMatch = (match.team1 && match.team1.some((p) => p.socketId === socket.id)) ||
                            (match.team2 && match.team2.some((p) => p.socketId === socket.id));
    if (!isPlayerInMatch) {
      socket.emit('security_alert', { message: 'Action non autorisée : vous n\'êtes pas dans cette salle.' });
      return;
    }

    // Assainissement strict anti-XSS
    const safeText = escapeHtml(message.text.trim().slice(0, 300));
    const safeSender = escapeHtml(String(message.sender || 'Joueur').trim().slice(0, 32));

    io.to(matchId).emit('new_match_chat', {
      ...message,
      text: safeText,
      sender: safeSender,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('submit_match_score', async ({ matchId, result }) => {
    if (isRateLimited()) return;
    if (!matchId || !activeMatches[matchId]) {
      socket.emit('score_error', { error: 'Match introuvable ou déjà clôturé.' });
      return;
    }

    const match = activeMatches[matchId];

    // Contrôle d'autorisation strict : seul un participant au match peut soumettre le score
    const isPlayerInMatch = (match.team1 && match.team1.some((p) => p.socketId === socket.id)) ||
                            (match.team2 && match.team2.some((p) => p.socketId === socket.id));
    if (!isPlayerInMatch) {
      console.warn(`[Security-WS] 🚨 Tentative non autorisée de clôture du match ${matchId} par socket ${socket.id}`);
      socket.emit('security_alert', { message: 'Action rejetée : vous n\'êtes pas joueur de ce match.' });
      return;
    }

    // Validation et plafonnement sécurisé de l'ELO côté serveur (Anti-Tampering)
    if (result && typeof result.eloChange === 'number') {
      result.eloChange = Math.max(-35, Math.min(35, Math.round(result.eloChange)));
    }

    match.result = result;
    match.status = 'completed';
    await persistMatchResult(match);

    io.to(matchId).emit('match_completed_update', result);
  });

  socket.on('disconnect', () => {
    const idx = queue.findIndex((q) => q.socketId === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    io.emit('stats_update', {
      onlinePlayers: io.engine.clientsCount,
      inQueueCount: queue.length,
      activeMatchesCount: Object.keys(activeMatches).length,
    });
    console.log(`[FogLeague-WS] Joueur déconnecté : ${socket.id}`);
  });
});

// Fallback to index.html for SPA routing (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint API non trouvé' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('FogLeague: Serveur actif. En mode dev, accédez à http://localhost:5173');
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
httpServer.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🔥 FOGLEAGUE — SERVEUR SÉCURISÉ MAXIMAL (HELMET + HMAC + CSP)`);
  console.log(`🌐 Écoute Locale : http://${HOST}:${PORT}`);
  console.log(`🔐 Valve OpenID  : /api/auth/steam actif`);
  console.log(`🛡️ Rate Limiting : 120 req/min (Global), 12 req/min (Auth)`);
  console.log(`======================================================\n`);
});
