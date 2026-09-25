import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Sparkles, X, ShieldAlert, Cpu, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { simulateOCRScan, OCRScanReport } from '../lib/ocrSimulator';
import { soundManager } from '../lib/audioManager';
import { GameMode } from '../types';

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  onConfirmScore: (report: OCRScanReport) => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  isOpen,
  onClose,
  mode,
  onConfirmScore,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [report, setReport] = useState<OCRScanReport | null>(null);

  if (!isOpen) return null;

  const runScan = async (presetType: '4k' | 'draw' | 'cheat' | 'custom', customFileName?: string) => {
    setIsScanning(true);
    setReport(null);

    soundManager.playPickSound();
    setScanStep('Extraction de l\'image et prétraitement...');
    await new Promise((r) => setTimeout(r, 450));

    soundManager.playPickSound();
    setScanStep('Lecture OCR des pseudonymes, tueurs et crochets...');
    await new Promise((r) => setTimeout(r, 450));

    setScanStep('Vérification de la banlist DBDL et détection des perks...');
    await new Promise((r) => setTimeout(r, 500));

    let finalReport: OCRScanReport;

    if (presetType === 'cheat') {
      finalReport = {
        success: true,
        killerDetected: 'Le Fléau (The Blight)',
        totalHooks: 11,
        escapes: 0,
        gensRemaining: 3,
        perksFound: [
          'Scourge Hook: Pain Resonance',
          'Pop Goes The Weasel',
          'Compound Thirty-Three (Addon Irisé Interdit)',
          'Corrupt Intervention'
        ],
        ruleViolationDetected: 'INFRACTION LIGUE DBDL : Double régression (Pain Res + Pop) ET Addon Irisé équipés. Match perdu par pénalité.',
        processingTimeMs: 1420,
        matchResult: {
          winner: 'survivors',
          killerHooks: 11,
          escapes: 4,
          eloChange: -35,
          bannedPerkDetected: 'Double Régression + Addon Irisé',
          verifiedByOCR: true,
        }
      };
    } else if (presetType === '4k') {
      finalReport = {
        success: true,
        killerDetected: 'La Chasseuse (The Huntress)',
        totalHooks: 12,
        escapes: 0,
        gensRemaining: 2,
        perksFound: [
          'Scourge Hook: Pain Resonance',
          'Barbecue & Chilli',
          'Lethal Pursuer',
          'Deadlock'
        ],
        processingTimeMs: 1280,
        matchResult: {
          winner: 'killer',
          killerHooks: 12,
          escapes: 0,
          gensRemaining: 2,
          eloChange: 26,
          verifiedByOCR: true,
        }
      };
    } else {
      // Draw / close match or 1v1
      finalReport = await simulateOCRScan(customFileName || 'scoreboard.png', mode);
    }

    setReport(finalReport);
    setIsScanning(false);
    setScanStep('');

    if (finalReport.matchResult.eloChange > 0) {
      soundManager.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF5500', '#FFD700', '#B21818'],
      });
    } else {
      soundManager.playBanSound();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      runScan('custom', e.target.files[0].name);
    }
  };

  const handleApplyResult = () => {
    if (report) {
      onConfirmScore(report);
      onClose();
    }
  };

  // Écoute du Ctrl+V pour coller directement la capture d'écran depuis le presse-papier
  React.useEffect(() => {
    if (!isOpen || report || isScanning) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          soundManager.playPickSound();
          runScan('custom', file.name || 'clipboard_screenshot.png');
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, report, isScanning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141417] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#19191d]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-faceit-orange/10 border border-faceit-orange/30 text-faceit-orange">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  Arbitre Numérique & Validation Web
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                  100% Cloud • Sans App
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Lecture instantanée du tableau des scores, contrôle des perks et certification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!report && !isScanning && (
            <div className="space-y-5">
              {/* Dropzone with Ctrl+V support */}
              <label className="border-2 border-dashed border-zinc-700 hover:border-faceit-orange rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-900/40 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-faceit-orange/20 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-faceit-orange" />
                </div>
                <span className="font-bold text-sm text-white group-hover:text-faceit-orange transition-colors">
                  Glisse ta capture d'écran DBD ou fais un simple <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-faceit-orange text-xs">Ctrl + V</kbd>
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  Reconnaissance instantanée dans le cloud • PNG, JPG ou Presse-papier Windows
                </span>
              </label>

              {/* 3 Quick Presets */}
              <div>
                <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2.5 block">
                  Ou teste directement un scénario réel de match :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => runScan('4k')}
                    className="p-3 rounded-xl bg-[#19191d] hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Award className="w-4 h-4" />
                      <span>Victoire 4K (+26 ELO)</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      12 crochets parfaits, respect des règles
                    </div>
                  </button>

                  <button
                    onClick={() => runScan('draw')}
                    className="p-3 rounded-xl bg-[#19191d] hover:bg-zinc-800 border border-zinc-800 hover:border-faceit-orange text-left transition-all"
                  >
                    <div className="text-xs font-bold text-faceit-orange flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Match Serré (8 Crochets)</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      2 survivants évadés, duel intense
                    </div>
                  </button>

                  <button
                    onClick={() => runScan('cheat')}
                    className="p-3 rounded-xl bg-[#19191d] hover:bg-zinc-800 border border-zinc-800 hover:border-red-500 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Tricherie Détectée (-35)</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Double régression + Addon rouge banni
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-faceit-orange/20 border-t-faceit-orange animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-faceit-orange animate-pulse" />
                </div>
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Vision Neuronale & Analyse OCR en cours...
              </h4>
              <p className="text-xs text-zinc-400 font-mono">
                {scanStep}
              </p>
            </div>
          )}

          {/* Report Screen */}
          {report && !isScanning && (
            <div className="space-y-5 animate-fadeIn">
              {/* Scan summary banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  report.ruleViolationDetected
                    ? 'bg-red-950/40 border-red-700/80 text-red-200'
                    : 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                }`}
              >
                {report.ruleViolationDetected ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {report.ruleViolationDetected
                      ? 'Infraction aux règles de la ligue détectée !'
                      : 'Capture d\'écran validée avec succès par l\'IA'}
                  </div>
                  <div className="text-xs mt-0.5 text-zinc-300">
                    {report.ruleViolationDetected ||
                      'Toutes les perks et addons sont conformes au règlement DBDL.'}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Tueur Détecté
                  </span>
                  <div className="font-bold text-sm text-white mt-1">
                    {report.killerDetected}
                  </div>
                </div>

                <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    {mode === '1v1_chase' ? 'Temps de Chase' : 'Crochets Total'}
                  </span>
                  <div className="font-bold text-sm text-white mt-1 font-mono">
                    {mode === '1v1_chase'
                      ? `${report.matchResult.chaseTimeSeconds}s`
                      : `${report.totalHooks} / 12`}
                  </div>
                </div>

                <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Évasions / Sacrifices
                  </span>
                  <div className="font-bold text-sm text-white mt-1 font-mono">
                    {report.escapes} Échappé(s)
                  </div>
                </div>

                <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Impact ELO
                  </span>
                  <div
                    className={`font-black text-sm mt-1 font-mono flex items-center gap-1 ${
                      report.matchResult.eloChange >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    <span>
                      {report.matchResult.eloChange >= 0 ? '+' : ''}
                      {report.matchResult.eloChange} ELO
                    </span>
                    {report.matchResult.eloChange >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Perks detected */}
              <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2 block">
                  Perks & Addons Reconnus sur le Scoreboard :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {report.perksFound.map((perk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setReport(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Tester un autre résultat
                </button>
                <button
                  onClick={handleApplyResult}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-faceit-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white text-xs font-black uppercase tracking-wider shadow-faceit-glow transition-all"
                >
                  Confirmer & Mettre à jour l'ELO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
