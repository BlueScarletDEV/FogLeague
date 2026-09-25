import React, { useState } from 'react';
import { COMP_RULES, DBD_KILLERS_POOL } from '../data/dbdData';
import { BookOpen, AlertOctagon, CheckCircle2, Skull, Shield, Flame } from 'lucide-react';

export const RulesView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'killer' | 'perk' | 'item' | '1v1'>('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-faceit-orange" />
          <h1 className="text-2xl font-black uppercase text-white tracking-wide">
            Règlement Compétitif Officiel (DBDL & FogLeague)
          </h1>
        </div>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          Afin de garantir une équité parfaite et éliminer les abus de l'in-game DBD, tous les matchs FogLeague sont soumis aux restrictions suivantes. Toute infraction constatée sur la capture de score ou signalée par l'arbitre officiel entraîne une pénalité d'Elo immédiate.
        </p>
      </div>

      {/* Rules categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-faceit-orange font-bold text-sm uppercase">
            <Flame className="w-4 h-4" />
            <span>Format 1v1 Shack Duel</span>
          </div>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>Le duel se dispute exclusivement autour de la cabane (Shack).</li>
            <li>3 palettes maximum utilisables par le survivant.</li>
            <li>Bloodlust (Soif de sang) désactivée ou interdite d'utilisation.</li>
            <li>Le chrono s'arrête au premier coup fatal (Down).</li>
          </ul>
        </div>

        <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-sm uppercase">
            <Skull className="w-4 h-4" />
            <span>Règles Tueurs Compétitifs</span>
          </div>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>Interdiction formelle de camper ou tunneler en dessous de 10 secondes post-décrochage.</li>
            <li>Maximum 1 compétence de régression par équipement.</li>
            <li>Addons Irisés (rouges) interdits en match officiel.</li>
            <li>Slugging (laisser agoniser au sol) limité à 45s max.</li>
          </ul>
        </div>

        <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm uppercase">
            <Shield className="w-4 h-4" />
            <span>Règles Survivants</span>
          </div>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>Maximum 1 boîte à outils et 1 trousse de soins par équipe.</li>
            <li>Pas de doublon de la même perk d'épuisement dans l'équipe.</li>
            <li>Interdiction de spammer les gestes provocateurs (teabag aux sorties).</li>
            <li>Objets de rareté exceptionnelle (Clés squelettes) bannis.</li>
          </ul>
        </div>
      </div>

      {/* Rules list */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-faceit-orange" />
          <span>Liste Complète des Restrictions de Ligue</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMP_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl bg-[#19191d] border border-zinc-800/80 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400 shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{rule.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {rule.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
