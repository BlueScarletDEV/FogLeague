import React, { useState } from 'react';
import { DBDKiller } from '../types';
import { DBD_KILLERS_POOL } from '../data/dbdData';
import { soundManager } from '../lib/audioManager';
import { Ban, CheckCircle2, Skull, Shield, Flame } from 'lucide-react';

interface KillerDraftProps {
  onDraftComplete: (bannedKiller: DBDKiller, pickedKiller: DBDKiller) => void;
  killerPlayerName: string;
  survivorCaptainName: string;
}

export const KillerDraft: React.FC<KillerDraftProps> = ({
  onDraftComplete,
  killerPlayerName,
  survivorCaptainName,
}) => {
  const [bannedKiller, setBannedKiller] = useState<DBDKiller | null>(null);
  const [pickedKiller, setPickedKiller] = useState<DBDKiller | null>(null);
  const [draftStep, setDraftStep] = useState<'ban' | 'pick' | 'completed'>('ban');

  const handleBanKiller = (killer: DBDKiller) => {
    if (draftStep !== 'ban') return;
    soundManager.playBanSound();
    setBannedKiller(killer);
    setDraftStep('pick');
  };

  const handlePickKiller = (killer: DBDKiller) => {
    if (draftStep !== 'pick' || killer.id === bannedKiller?.id) return;
    soundManager.playPickSound();
    setPickedKiller(killer);
    setDraftStep('completed');
    if (bannedKiller) {
      onDraftComplete(bannedKiller, killer);
    }
  };

  return (
    <div className="bg-[#151518] rounded-2xl border border-zinc-800 p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skull className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Phase de Draft & Ban des Tueurs
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Les Survivants bannissent 1 Tueur, puis le Tueur sélectionne son personnage pour le match.
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center gap-2 ${
              draftStep === 'ban'
                ? 'bg-red-950/80 border-red-500 text-red-400 shadow-blood-glow'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Ban Survivants ({survivorCaptainName})</span>
          </div>

          <span className="text-zinc-600 text-xs font-mono font-bold">➜</span>

          <div
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center gap-2 ${
              draftStep === 'pick'
                ? 'bg-orange-950/80 border-faceit-orange text-faceit-orange shadow-faceit-glow'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
            }`}
          >
            <Skull className="w-4 h-4" />
            <span>Pick Tueur ({killerPlayerName})</span>
          </div>
        </div>
      </div>

      {/* Selected & Banned Display */}
      {(bannedKiller || pickedKiller) && (
        <div className="mb-6 p-4 rounded-xl bg-[#19191d] border border-zinc-800 flex flex-wrap gap-4 items-center justify-around">
          {bannedKiller && (
            <div className="flex items-center gap-3 text-red-400">
              <Ban className="w-5 h-5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tueur Banni :</span>
                <span className="font-bold text-sm text-red-300">{bannedKiller.alias}</span>
              </div>
            </div>
          )}

          {pickedKiller && (
            <div className="flex items-center gap-3 text-faceit-orange">
              <CheckCircle2 className="w-5 h-5 text-faceit-orange" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tueur Joué :</span>
                <span className="font-bold text-sm text-white">{pickedKiller.alias}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Killers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DBD_KILLERS_POOL.map((killer) => {
          const isBanned = bannedKiller?.id === killer.id;
          const isPicked = pickedKiller?.id === killer.id;
          const isClickable =
            (draftStep === 'ban') ||
            (draftStep === 'pick' && !isBanned);

          return (
            <div
              key={killer.id}
              onClick={() => {
                if (draftStep === 'ban') handleBanKiller(killer);
                else if (draftStep === 'pick') handlePickKiller(killer);
              }}
              className={`relative rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                isPicked
                  ? 'bg-orange-950/40 border-faceit-orange shadow-faceit-glow scale-105 z-10'
                  : isBanned
                  ? 'bg-zinc-900 border-zinc-800 opacity-40 grayscale pointer-events-none'
                  : isClickable
                  ? 'bg-[#18181c] border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 cursor-pointer'
                  : 'bg-[#18181c] border-zinc-800 opacity-60 pointer-events-none'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{killer.icon}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      killer.tier === 'S'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-orange-950 text-orange-400 border border-orange-800'
                    }`}
                  >
                    Tier {killer.tier}
                  </span>
                </div>

                <div className="font-bold text-xs text-white truncate" title={killer.alias}>
                  {killer.alias}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {killer.difficulty}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60">
                {isBanned && (
                  <span className="text-[10px] font-bold uppercase text-red-500 flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    <span>Banni</span>
                  </span>
                )}
                {isPicked && (
                  <span className="text-[10px] font-bold uppercase text-faceit-orange flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sélectionné</span>
                  </span>
                )}
                {!isBanned && !isPicked && draftStep === 'ban' && (
                  <span className="text-[10px] font-bold uppercase text-red-400 hover:underline">
                    Bannir
                  </span>
                )}
                {!isBanned && !isPicked && draftStep === 'pick' && (
                  <span className="text-[10px] font-bold uppercase text-faceit-orange hover:underline">
                    Choisir
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
