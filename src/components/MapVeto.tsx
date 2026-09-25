import React, { useState } from 'react';
import { DBDMap } from '../types';
import { Ban, CheckCircle2, Flame } from 'lucide-react';
import { soundManager } from '../lib/audioManager';

interface MapVetoProps {
  maps: DBDMap[];
  onVetoComplete: (finalMap: DBDMap) => void;
  team1Name: string;
  team2Name: string;
}

export const MapVeto: React.FC<MapVetoProps> = ({
  maps: initialMaps,
  onVetoComplete,
  team1Name,
  team2Name,
}) => {
  const [mapsState, setMapsState] = useState<DBDMap[]>(initialMaps);
  const [currentTurn, setCurrentTurn] = useState<'team1' | 'team2'>('team1');
  const [finalMap, setFinalMap] = useState<DBDMap | null>(null);

  const handleBanMap = (mapId: string) => {
    if (finalMap) return;

    const remaining = mapsState.filter((m) => !m.bannedBy);
    if (remaining.length <= 1) return;

    soundManager.playBanSound();

    const banner = currentTurn === 'team1' ? team1Name : team2Name;
    const nextTurn = currentTurn === 'team1' ? 'team2' : 'team1';

    const updated = mapsState.map((m) =>
      m.id === mapId ? { ...m, bannedBy: banner } : m
    );

    setMapsState(updated);

    const nowRemaining = updated.filter((m) => !m.bannedBy);
    if (nowRemaining.length === 1) {
      setFinalMap(nowRemaining[0]);
      onVetoComplete(nowRemaining[0]);
    } else {
      setCurrentTurn(nextTurn);
    }
  };

  return (
    <div className="bg-[#151518] rounded-2xl border border-zinc-800 p-6 shadow-xl">
      {/* Veto Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-faceit-orange" />
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Phase de Veto des Cartes (Map Veto)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Les capitaines bannissent les cartes à tour de rôle jusqu'à ce qu'il n'en reste qu'une.
          </p>
        </div>

        {/* Status Indicator */}
        {finalMap ? (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-400 font-bold text-sm shadow-emerald-500/20 shadow-lg animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>CARTE CHOISIE : {finalMap.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                currentTurn === 'team1'
                  ? 'bg-orange-950/80 border-faceit-orange text-faceit-orange shadow-faceit-glow'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
              }`}
            >
              Tour de : {team1Name}
            </div>
            <span className="text-zinc-600 text-xs font-mono font-bold">VS</span>
            <div
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                currentTurn === 'team2'
                  ? 'bg-red-950/80 border-red-500 text-red-400 shadow-blood-glow'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
              }`}
            >
              Tour de : {team2Name}
            </div>
          </div>
        )}
      </div>

      {/* Maps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mapsState.map((map) => {
          const isBanned = Boolean(map.bannedBy);
          const isSelected = finalMap?.id === map.id;

          return (
            <div
              key={map.id}
              className={`relative group rounded-xl overflow-hidden border transition-all duration-300 ${
                isSelected
                  ? 'border-faceit-orange shadow-faceit-glow scale-105 z-10'
                  : isBanned
                  ? 'border-zinc-800 opacity-40 grayscale pointer-events-none'
                  : 'border-zinc-700 hover:border-faceit-orange hover:shadow-lg'
              }`}
            >
              {/* Map Image Background */}
              <div className="h-36 relative overflow-hidden bg-zinc-900">
                <img
                  src={map.image}
                  alt={map.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-black/60" />

                {/* Balance Tag */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${
                      map.type === 'Balanced'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-700'
                        : map.type === 'Killer-Favored'
                        ? 'bg-red-950/80 text-red-300 border border-red-700'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                    }`}
                  >
                    {map.type}
                  </span>
                </div>

                {/* Banned Overlay Stamp */}
                {isBanned && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2">
                    <Ban className="w-8 h-8 text-red-500 mb-1" />
                    <span className="text-xs font-black uppercase text-red-500 tracking-wider">
                      Bannie
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      par {map.bannedBy}
                    </span>
                  </div>
                )}

                {/* Picked Final Overlay Stamp */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-faceit-orange text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md animate-pulse">
                    ★ Choix Final
                  </div>
                )}
              </div>

              {/* Map Info & Ban Action */}
              <div className="p-3 bg-[#18181c]">
                <div className="font-bold text-sm text-white truncate" title={map.name}>
                  {map.name}
                </div>
                <div className="text-[11px] text-zinc-400 truncate mb-3">
                  {map.realm}
                </div>

                {!isBanned && !finalMap && (
                  <button
                    onClick={() => handleBanMap(map.id)}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/80 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bannir cette carte</span>
                  </button>
                )}

                {isSelected && (
                  <div className="w-full py-1.5 px-3 rounded-lg bg-faceit-orange/20 border border-faceit-orange text-faceit-orange text-xs font-black uppercase tracking-wider text-center">
                    Prêt pour le match
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
