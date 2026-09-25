import React, { useState } from 'react';
import { Users, Trophy, Flame, Shield, Swords, Sparkles, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';

interface HubsViewProps {
  onStartQueue?: () => void;
}

export const HubsView: React.FC<HubsViewProps> = ({ onStartQueue }) => {
  const [joinedHubs, setJoinedHubs] = useState<string[]>(['hub_shack']);

  const hubs = [
    {
      id: 'hub_shack',
      name: 'Hub Officiel : Shack 1v1 Arena',
      format: '1v1 Shack Duel',
      category: 'Entraînement Mécanique',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      description: 'L\'arène dédiée aux duels de poursuite purs autour du Shack. Idéal pour travailler ses mindgames et mécaniques sans pression.',
      rules: '3 palettes max, 0 bloodlust, chronomètre officiel (seuil 55s).',
      eloRequirement: 'Tous niveaux (Rangs 1 à 10)',
      statusText: 'Queue Ouverte 24/7',
    },
    {
      id: 'hub_ranked_4v1',
      name: 'Hub Officiel : Ranked PUG 1v4',
      format: 'Ranked 4v1 DBDL',
      category: 'Compétitif SoloQ',
      banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      description: 'L\'environnement de match classé DBDL le plus équilibré. Ban des abus, files supervisées et vérification du fair-play.',
      rules: 'Protection anti-tunnel 10s, 1 seule régression par tueur, quota d\'objets.',
      eloRequirement: 'Rangs 1 à 10',
      statusText: 'Matchmaking Actif',
    },
    {
      id: 'hub_scrims_5v5',
      name: 'Hub Officiel : Team Scrims 5v5',
      format: '5v5 Miroir DBDL',
      category: 'Rosters & Équipes',
      banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      description: 'Format officiel de compétition pour équipes complètes. Matchs aller-retour selon le rulebook DBDL 2026 avec feuille de score scellée.',
      rules: 'Match miroir, calcul des crochets, bans de tueurs et veto de maps.',
      eloRequirement: 'Équipes complètes',
      statusText: 'Salons KYF Privés',
    }
  ];

  const handleToggleJoin = (hubId: string) => {
    if (joinedHubs.includes(hubId)) {
      setJoinedHubs(joinedHubs.filter((id) => id !== hubId));
    } else {
      setJoinedHubs([...joinedHubs, hubId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-faceit-orange" />
            <h1 className="text-2xl font-black uppercase text-white tracking-wide">
              Hubs & Formats Officiels FogLeague
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Choisissez votre arène compétitive selon votre style de jeu : perfectionnez vos boucles au Shack en 1v1, défendez l'équité en 4v1 ou affrontez d'autres équipes en Scrim 5v5 miroir.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>3 Formats Actifs</span>
        </div>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => {
          const isJoined = joinedHubs.includes(hub.id);

          return (
            <div
              key={hub.id}
              className="bg-[#141417] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Banner */}
                <div className="h-36 relative overflow-hidden bg-zinc-900">
                  <img
                    src={hub.banner}
                    alt={hub.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-transparent to-black/50" />

                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-faceit-orange text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                      {hub.format}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{hub.statusText}</span>
                  </div>
                </div>

                {/* Hub Meta */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                      {hub.category}
                    </span>
                    <h3 className="font-black text-base text-white group-hover:text-faceit-orange transition-colors">
                      {hub.name}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {hub.description}
                  </p>

                  <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-400">
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] leading-relaxed">
                      <strong className="text-zinc-300">Règlement :</strong> {hub.rules}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Conditions d'accès :</span>
                      <span className="font-mono text-faceit-orange font-bold">{hub.eloRequirement}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleToggleJoin(hub.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    isJoined
                      ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-400'
                      : 'bg-zinc-800 hover:bg-faceit-orange hover:text-white text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Format Sélectionné (Favori)</span>
                    </>
                  ) : (
                    <span>Ajouter aux Formats Favoris</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Clan & League Creation Callout */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-faceit-orange shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase text-white">
              Vous organisez un tournoi ou gérez une équipe ?
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              FogLeague est une plateforme ouverte. Proposez vos règles personnalisées ou homologuez votre ligue privée en contactant la communauté sur Discord.
            </p>
          </div>
        </div>

        <a
          href="https://discord.com"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-2"
        >
          <span>Rejoindre le Discord</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
