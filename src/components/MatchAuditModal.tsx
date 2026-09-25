import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, Copy, Check, Hash, Server, Award, Cpu, FileJson, X } from 'lucide-react';
import { CertifiedMatch } from '../lib/matchStore';
import { soundManager } from '../lib/audioManager';

interface MatchAuditModalProps {
  match: CertifiedMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchAuditModal: React.FC<MatchAuditModalProps> = ({ match, isOpen, onClose }) => {
  const [copiedHash, setCopiedHash] = React.useState(false);

  if (!isOpen || !match) return null;

  const handleCopyHash = () => {
    soundManager.playPickSound();
    navigator.clipboard.writeText(match.audit.sha256Proof);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadProof = () => {
    soundManager.playPickSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(match, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FOG_CERTIFICATE_${match.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isCompliant = match.audit.complianceStatus === 'CONFORME_DBDL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141417] border border-zinc-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#18181d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isCompliant
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {isCompliant ? <ShieldCheck className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase text-white tracking-wider">
                  Certificat d'Audit Compétitif
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-mono text-faceit-orange font-bold">
                  {match.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Preuve cryptographique & rapport d'arbitrage officiel FogLeague
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playBanSound();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isCompliant
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/30 border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-bold text-sm">
                  {isCompliant ? 'Match 100% Homologué & Conforme DBDL' : 'Infraction aux Règles Détectée'}
                </div>
                <div className="text-xs opacity-80">{match.audit.ruleNotes}</div>
              </div>
            </div>
            <div className="text-right font-mono text-xs font-bold shrink-0">
              {match.result} ({match.eloChange > 0 ? `+${match.eloChange}` : match.eloChange} ELO)
            </div>
          </div>

          {/* Cryptographic SHA-256 Proof */}
          <div className="bg-[#19191e] border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <Hash className="w-4 h-4 text-faceit-orange" />
                <span>Empreinte Cryptographique (SHA-256 Proof)</span>
              </div>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors font-mono"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 font-mono text-xs text-emerald-400 break-all select-all">
              {match.audit.sha256Proof}
            </div>
            <div className="text-[11px] text-zinc-500">
              Garantit qu'aucun score, perk ou durée de match n'a été modifié après enregistrement.
            </div>
          </div>

          {/* Match & Server Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#19191e] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Lobby Code DBD</div>
              <div className="font-mono font-bold text-white text-xs mt-0.5">{match.audit.lobbyCode}</div>
            </div>
            <div className="bg-[#19191e] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Serveur</div>
              <div className="text-zinc-300 text-xs font-semibold mt-0.5 truncate">{match.audit.serverRegion}</div>
            </div>
            <div className="bg-[#19191e] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Carte</div>
              <div className="text-zinc-300 text-xs font-semibold mt-0.5 truncate">{match.map}</div>
            </div>
            <div className="bg-[#19191e] border border-zinc-800/80 p-3 rounded-xl">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Audité Par</div>
              <div className="text-faceit-orange text-xs font-bold mt-0.5 truncate">{match.audit.verifiedBy}</div>
            </div>
          </div>

          {/* In-Game Scoreboard Breakdown */}
          <div className="bg-[#19191e] border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-faceit-orange" />
              <span>Métriques en Jeu Extraites & Certifiées</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Personnage</span>
                <span className="text-white font-bold">{match.metrics.characterPlayed}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Points de Sang (BP)</span>
                <span className="text-emerald-400 font-mono font-bold">{match.metrics.bloodpointsScore.toLocaleString()} BP</span>
              </div>
              {match.metrics.chaseTimeSeconds !== undefined && (
                <div className="bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Temps de Poursuite</span>
                  <span className="text-white font-mono font-bold">{match.metrics.chaseTimeSeconds} secondes</span>
                </div>
              )}
              {match.userRole === 'killer' && (
                <div className="bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Crochets Infligés</span>
                  <span className="text-white font-mono font-bold">{match.metrics.hooksInflictedOrAvoided} / 12</span>
                </div>
              )}
              {match.userRole === 'survivor' && (
                <div className="bg-black/30 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Générateurs Réparés</span>
                  <span className="text-white font-mono font-bold">{match.metrics.generatorsDoneOrDefended} générateurs</span>
                </div>
              )}
            </div>

            {/* Perks verified */}
            <div>
              <div className="text-[11px] text-zinc-400 font-bold uppercase mb-2">
                Compétences (Perks) Certifiées Conformes au Règlement DBDL
              </div>
              <div className="flex flex-wrap gap-2">
                {match.metrics.perksUsed.map((perk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mathematical ELO Calculation Transparency */}
          <div className="bg-[#19191e] border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Transparence du Calcul ELO (Formule Officielle)</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 font-mono text-xs text-zinc-300">
              {match.audit.eloFormula}
            </div>
            <div className="text-[11px] text-zinc-500">
              Nouvel Elo certifié du joueur : <strong className="text-white">{match.eloAfter} ELO</strong>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#18181d] flex items-center justify-between">
          <button
            onClick={handleDownloadProof}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <FileJson className="w-4 h-4 text-faceit-orange" />
            <span>Exporter Preuve (JSON)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPickSound();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-faceit-glow transition-all"
          >
            Fermer l'Audit
          </button>
        </div>
      </div>
    </div>
  );
};
