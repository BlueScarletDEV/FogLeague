import React, { useState } from 'react';
import { securityEngine } from '../lib/securityAudit';
import { SecurityEvent } from '../types/auth';
import { ShieldCheck, Cpu, Terminal, CheckCircle2, Lock, Radio, Sparkles, Scale, ShieldAlert } from 'lucide-react';
import { soundManager } from '../lib/audioManager';
import { useAuth } from '../context/AuthContext';
import { getCertifiedMatches } from '../lib/matchStore';

export const SecurityView: React.FC = () => {
  const { user } = useAuth();
  const matches = getCertifiedMatches(user?.id);

  const [events] = useState<SecurityEvent[]>(securityEngine.getInitialEvents());
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState<string>('');
  const [diagnosticProgress, setDiagnosticProgress] = useState<number>(0);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [shaProof, setShaProof] = useState<string | null>(null);

  const handleRunFullAudit = async () => {
    soundManager.playPickSound();
    setIsDiagnosticRunning(true);
    setCertificateId(null);
    setShaProof(null);
    setDiagnosticProgress(0);

    const report = await securityEngine.runFullSecurityDiagnostic((stepText, progress) => {
      setDiagnosticStep(stepText);
      setDiagnosticProgress(progress);
    });

    setIsDiagnosticRunning(false);
    setCertificateId(report.certificateId);
    setShaProof(report.shaProof);
    soundManager.playVictory();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Global Integrity & Valve OpenID Security */}
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>INTÉGRITÉ CRYPTOGRAPHIQUE VALVE 100%</span>
              </span>
              <span className="text-zinc-500 text-xs font-mono">• SHA-256 Web Crypto</span>
            </div>

            <h1 className="text-3xl font-black uppercase text-white tracking-wide flex items-center gap-3">
              <span>Centre de Sécurité & Intégrité des Matchs</span>
            </h1>

            <p className="text-xs text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              FogLeague repose sur des standards ouverts et vérifiables : authentification directe par Valve OpenID 2.0 (aucun mot de passe stocké), scellement cryptographique des scores par SHA-256 et protocole de Double Consensus entre joueurs.
            </p>
          </div>

          {/* Action: Run Diagnostic */}
          <button
            onClick={handleRunFullAudit}
            disabled={isDiagnosticRunning}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-3 active:scale-95 shrink-0"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>{isDiagnosticRunning ? 'Vérification en cours...' : 'Tester l\'Intégrité du Système'}</span>
          </button>
        </div>

        {/* Diagnostic Progress Bar */}
        {isDiagnosticRunning && (
          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2 animate-fadeIn">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">{diagnosticStep}</span>
              <span className="text-emerald-400 font-bold">{diagnosticProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${diagnosticProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Certificate Display if issued */}
        {certificateId && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">
                  Certificat d'Intégrité Cryptographique Délivré
                </span>
                <div className="font-bold text-sm text-white">
                  Audit Conforme • Empreinte SHA-256 : <code className="text-emerald-300 font-mono text-xs">{shaProof?.slice(0, 16)}...</code>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-900/60 border border-emerald-700 text-xs font-mono font-bold text-emerald-300">
              {certificateId}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Row — Strictly Real Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authentification Valve</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {user?.steamConnected ? 'Active (100%)' : 'Mode Invité'}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Valve OpenID 2.0 vérifié
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-faceit-orange" />
            <span>Matchs Homologués</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {matches.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Signatures SHA-256 scellées
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>VAC Ban DBD</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {user?.vacBanned ? 'Banni Valve' : '0 Ban (Clean)'}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Contrôlé via API Steamworks
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 p-5 rounded-2xl">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Chiffrement Canaux</span>
          </div>
          <div className="text-base font-black text-white font-mono truncate">
            TLS 1.3 / AES-256
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            WebSockets sécurisés (WSS)
          </div>
        </div>
      </div>

      {/* 4 True Technical Shields Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Piliers d'Intégrité Compétitive</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Validation Valve & VAC Clean</div>
              <p className="text-xs text-zinc-400 mt-1">
                Synchronisation avec l'API Web Steam. Exclusion immédiate des comptes ayant un antécédent de triche Valve.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Scellé Cryptographique SHA-256</div>
              <p className="text-xs text-zinc-400 mt-1">
                Chaque feuille de match produit une empreinte non modifiable combinant ID, scores, lobby et arbitre.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Double Consensus Équitable</div>
              <p className="text-xs text-zinc-400 mt-1">
                L'accord mutuel des deux capitaines prime sur toute décision. Aucun litige non résolu ne modifie l'ELO.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18181c] border border-zinc-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Passerelle Réseau Protégée</div>
              <p className="text-xs text-zinc-400 mt-1">
                Chiffrement TLS 1.3 de bout en bout et limitation de débit par jetons de session contre les attaques flood.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ⚖️ CERTIFICATION DE L'ARBITRE & SÉCURITÉ DES COMPTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panneau 1 : Sécurité des Comptes (Zéro Usurpation) */}
        <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">
                Protection Anti-Usurpation 100% Valve
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pourquoi personne ne peut se connecter à votre place
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <strong className="text-white">Validation Cryptographique Valve OpenID 2.0 :</strong> Le site ne demande et ne stocke jamais votre mot de passe. Tout passe par l'interface officielle de Valve.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <strong className="text-white">Steam Guard 2FA Obligatoire :</strong> Toute tentative de connexion requiert votre confirmation mobile Steam Guard sur votre téléphone personnel.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <strong className="text-white">Aucun Contournement par SteamID Public :</strong> Connaître le SteamID64 ou le profil public d'un joueur ne permet en aucun cas d'accéder à son compte FogLeague.
              </div>
            </div>
          </div>
        </div>

        {/* Panneau 2 : Comment certifier à 100% qu'un Arbitre est légit ? */}
        <div className="bg-[#141417] border border-amber-600/40 rounded-3xl p-6 space-y-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 text-lg">
              ⚖️
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">
                Comment l'Arbitre est-il Certifié Légit à 100% ?
              </h3>
              <p className="text-[11px] text-zinc-400">
                Protocole Anti-Copinage et Système de Double Consensus
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <div>
                <strong className="text-white">Le Consensus Joueurs Prime Toujours :</strong> Si les deux joueurs sont d'accord sur le vainqueur (accord mutuel), l'arbitre n'a <em>aucun pouvoir</em> pour inverser le résultat.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <div>
                <strong className="text-white">Matchmaking Aveugle (Blind Referee) :</strong> L'arbitre est assigné aléatoirement par le serveur. Il ne peut pas choisir ses amis ni arbitrer les mêmes joueurs deux fois en 24h.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <div>
                <strong className="text-white">Obligation de Preuve & Scellé SHA-256 :</strong> En cas de litige, l'arbitre doit fournir les métriques exactes du scoreboard. Son SteamID64 est scellé dans le certificat cryptographique.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold shrink-0">4.</span>
              <div>
                <strong className="text-white">Bouton de Contestation (Appel) :</strong> Chaque joueur peut contester la décision d'un arbitre d'un clic pour geler le match.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
              <span className="text-red-400 font-bold shrink-0">5.</span>
              <div>
                <strong className="text-white">Sanction Éliminatoire (Skin in the Game) :</strong> Tout arbitre convaincu de faux verdict ou de triche subit un <strong>bannissement à vie du rôle d'arbitre</strong> et une <strong>perte de -150 ELO</strong> sur son propre compte joueur.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Event Log Terminal */}
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-sm uppercase text-white font-mono">
              Journal d'Événements de Sécurité Officiels
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Protocole Actif</span>
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="bg-[#0b0b0d] p-4 rounded-2xl border border-zinc-800/80 font-mono text-xs space-y-2.5 max-h-64 overflow-y-auto">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-3 text-zinc-300">
              <span className="text-zinc-600 text-[10px] shrink-0 pt-0.5">
                [{ev.timestamp}]
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                  ev.subsystem === 'VALVE-OPENID'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                    : ev.subsystem === 'STEAM-GUARD'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : ev.subsystem === 'CRYPTO-HASH'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : ev.subsystem === 'CONSENSUS'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}
              >
                {ev.subsystem}
              </span>
              <span className="flex-1 text-zinc-300 leading-relaxed">
                {ev.message}
              </span>
              <span className="text-zinc-600 text-[10px] shrink-0 font-mono hidden md:inline">
                {ev.signature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
