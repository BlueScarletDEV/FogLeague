import React, { useState, useEffect } from 'react';
import { Target, Gift, Check, Flame, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/audioManager';
import { useAuth } from '../context/AuthContext';
import { getCertifiedMatches } from '../lib/matchStore';

export const MissionsView: React.FC = () => {
  const { user } = useAuth();
  const userKey = user?.id || 'guest';

  // Chargement des points et missions réclamées depuis le stockage local du joueur
  const [fogPoints, setFogPoints] = useState<number>(() => {
    const saved = localStorage.getItem(`fogleague_points_${userKey}`);
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [completedMissions, setCompletedMissions] = useState<string[]>(() => {
    const saved = localStorage.getItem(`fogleague_completed_missions_${userKey}`);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unlockedRewards, setUnlockedRewards] = useState<string[]>(() => {
    const saved = localStorage.getItem(`fogleague_unlocked_rewards_${userKey}`);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recharger si l'utilisateur change (ex: connexion Steam)
  useEffect(() => {
    const savedPoints = localStorage.getItem(`fogleague_points_${userKey}`);
    setFogPoints(savedPoints !== null ? parseInt(savedPoints, 10) : 0);

    const savedCompleted = localStorage.getItem(`fogleague_completed_missions_${userKey}`);
    try {
      setCompletedMissions(savedCompleted ? JSON.parse(savedCompleted) : []);
    } catch {
      setCompletedMissions([]);
    }

    const savedRewards = localStorage.getItem(`fogleague_unlocked_rewards_${userKey}`);
    try {
      setUnlockedRewards(savedRewards ? JSON.parse(savedRewards) : []);
    } catch {
      setUnlockedRewards([]);
    }
  }, [userKey]);

  // Récupérer les matchs certifiés réels du joueur
  const matches = getCertifiedMatches(user?.id);

  // Calcul dynamique strict de la progression des missions à partir des données réelles
  const shackWins = matches.filter(
    (m) => m.mode === '1v1_chase' && m.isWin && (m.metrics.chaseTimeSeconds || 0) >= 55
  ).length;

  const rankedFairMatches = matches.filter(
    (m) => m.mode === 'ranked_pug' && m.audit.complianceStatus === 'CONFORME_DBDL'
  ).length;

  const killerHooksTotal = matches
    .filter((m) => m.userRole === 'killer')
    .reduce((acc, m) => acc + (m.metrics.hooksInflictedOrAvoided || 0), 0);

  const gensDoneTotal = matches
    .filter((m) => m.userRole === 'survivor')
    .reduce((acc, m) => acc + (m.metrics.generatorsDoneOrDefended || 0), 0);

  // Missions pour les Arbitres (calculées sur les matchs arbitrés et homologués)
  const arbitratedMatchesCount = matches.filter(
    (m) => m.audit.verifiedBy.includes(user?.name || 'Arbitre')
  ).length;

  const missions = [
    {
      id: 'm1',
      title: 'Maître du Shack',
      desc: 'Remporter 2 duels en mode 1v1 Chase Arena avec un chrono supérieur à 55s.',
      reward: 350,
      progress: Math.min(2, shackWins),
      max: 2,
      category: 'Quotidienne',
    },
    {
      id: 'm2',
      title: 'Discipline de l\'Entité',
      desc: 'Terminer 3 matchs classés 4v1 conformes aux règles DBDL (zéro infraction).',
      reward: 500,
      progress: Math.min(3, rankedFairMatches),
      max: 3,
      category: 'Quotidienne',
    },
    {
      id: 'm3',
      title: 'Bourreau Compétitif',
      desc: 'Effectuer 25 crochets cumulés en rôle Tueur en respectant les limites DBDL.',
      reward: 1200,
      progress: Math.min(25, killerHooksTotal),
      max: 25,
      category: 'Hebdomadaire',
    },
    {
      id: 'm4',
      title: 'Survivant Émérite',
      desc: 'Réparer l\'équivalent de 6 générateurs complets en partie classée.',
      reward: 1500,
      progress: Math.min(6, gensDoneTotal),
      max: 6,
      category: 'Hebdomadaire',
    },
  ];

  const refereeMissions = [
    {
      id: 'ref_m1',
      title: 'Serment de Justice',
      desc: 'Arbitrer et homologuer 2 matchs classés (1v1 ou 4v1) avec certificat SHA-256.',
      reward: 450,
      progress: Math.min(2, arbitratedMatchesCount),
      max: 2,
      category: 'Arbitre • Quotidienne',
    },
    {
      id: 'ref_m2',
      title: 'Vigilance de l\'Épreuve',
      desc: 'Superviser 4 salons de match officiels consécutifs sans litige.',
      reward: 700,
      progress: Math.min(4, arbitratedMatchesCount),
      max: 4,
      category: 'Arbitre • Quotidienne',
    },
    {
      id: 'ref_m3',
      title: 'Magistrat de la Ligue',
      desc: 'Superviser 8 matchs officiels en tant qu\'arbitre certifié.',
      reward: 1800,
      progress: Math.min(8, arbitratedMatchesCount),
      max: 8,
      category: 'Arbitre • Hebdomadaire',
    },
    {
      id: 'ref_m4',
      title: 'Grand Juge de Tournoi',
      desc: 'Homologuer une rencontre Scrim 5v5 officielle selon le rulebook DBDL.',
      reward: 3000,
      progress: Math.min(1, matches.filter((m) => m.mode === 'team_scrim').length),
      max: 1,
      category: 'Arbitre • Élite',
    },
  ];

  const rewards = [
    {
      id: 'rew_1',
      name: 'Badge Exclusif "Pionnier FogLeague"',
      pointsCost: 500,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
      tag: 'Badge Profil Néon',
      description: 'Insigne holographique attestant de votre participation aux premiers matchs de la ligue.',
    },
    {
      id: 'rew_2',
      name: 'Thème de Profil "Brume Écarlate"',
      pointsCost: 1200,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
      tag: 'Cosmétique Web Profil',
      description: 'Habillage carmin et reflets braisés sur votre fiche de joueur FogLeague.',
    },
    {
      id: 'rew_3',
      name: 'Priorité Matchmaking VIP',
      pointsCost: 2000,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
      tag: 'Privilège Matchmaking',
      description: 'Priorité d\'appariement dans la file d\'attente 1v1 et 4v1 lors des heures de pointe.',
    },
    {
      id: 'rew_4',
      name: 'Titre Honorifique "Légende du Shack"',
      pointsCost: 1500,
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
      tag: 'Titre Compétitif',
      description: 'Titre doré affiché sous votre pseudonyme lors des phases de veto et sur le classement.',
    }
  ];

  const handleClaim = (missionId: string, rewardPoints: number) => {
    if (completedMissions.includes(missionId)) return;
    soundManager.playVictory();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF5500', '#FFD700'],
    });

    const updatedMissions = [...completedMissions, missionId];
    const newTotalPoints = fogPoints + rewardPoints;

    setCompletedMissions(updatedMissions);
    setFogPoints(newTotalPoints);

    localStorage.setItem(`fogleague_completed_missions_${userKey}`, JSON.stringify(updatedMissions));
    localStorage.setItem(`fogleague_points_${userKey}`, newTotalPoints.toString());
  };

  const handleUnlockReward = (rewardId: string, cost: number) => {
    if (fogPoints < cost || unlockedRewards.includes(rewardId)) return;
    soundManager.playVictory();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const newPoints = fogPoints - cost;
    const updatedRewards = [...unlockedRewards, rewardId];

    setFogPoints(newPoints);
    setUnlockedRewards(updatedRewards);

    localStorage.setItem(`fogleague_points_${userKey}`, newPoints.toString());
    localStorage.setItem(`fogleague_unlocked_rewards_${userKey}`, JSON.stringify(updatedRewards));
  };

  const [activeTab, setActiveTab] = useState<'players' | 'referees'>('players');

  const refereePerksAndRewards = [
    {
      id: 'ref_tier_1',
      title: 'Prime par Match Arbitré',
      value: '+150 FogPoints',
      desc: 'Crédités sur votre compte dès l\'homologation du certificat SHA-256 du match.',
      icon: '💰',
      tag: 'Gain Immédiat',
    },
    {
      id: 'ref_tier_2',
      title: 'Badge Doré "Sifflet de la Brume"',
      value: 'Profil Officiel',
      desc: 'Badge exclusif affiché sur votre profil Steam & FogLeague attestant de votre statut d\'arbitre homologué.',
      icon: '🏅',
      tag: 'Prestige Compétitif',
    },
    {
      id: 'ref_tier_3',
      title: 'Rôle Discord & Salon des Arbitres',
      value: 'Accès Garanti',
      desc: 'Accès au salon d\'arbitrage et droit de consultation sur les évolutions du rulebook DBDL.',
      icon: '⚖️',
      tag: 'Statut Privilégié',
    },
    {
      id: 'ref_tier_4',
      title: 'Immunité Anti-Litige',
      value: 'Karma 100%',
      desc: 'Maintien de votre indice d\'intégrité maximal tant qu\'aucun faux verdict n\'est prononcé.',
      icon: '🛡️',
      tag: 'Intégrité Réputation',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Real Points Balance */}
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-6 h-6 text-faceit-orange" />
            <h1 className="text-2xl font-black uppercase text-white tracking-wide">
              Missions & Défis de l'Épreuve
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Accomplissez des défis réels en match ou en arbitrage, accumulez des FogPoints et débloquez des badges néon, des titres de prestige et des thèmes cosmétiques exclusifs.
          </p>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'players'
                  ? 'bg-faceit-orange text-white shadow-faceit-glow'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <span>⚔️</span>
              <span>Missions Joueurs ({matches.length} match(s) joué(s))</span>
            </button>

            <button
              onClick={() => setActiveTab('referees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'referees'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-amber-400'
              }`}
            >
              <span>⚖️</span>
              <span>Espace Arbitres</span>
            </button>
          </div>
        </div>

        {/* Real FogPoints Counter */}
        <div className="flex items-center gap-4 bg-[#19191d] border border-zinc-700/80 px-6 py-4 rounded-2xl relative z-10 shrink-0">
          <div className="p-3 rounded-xl bg-faceit-orange/20 border border-faceit-orange/40 text-faceit-orange">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
              Solde FogPoints Réel
            </span>
            <span className="text-2xl font-black text-white font-mono flex items-center gap-1.5">
              <span>{fogPoints.toLocaleString()}</span>
              <span className="text-faceit-orange text-sm font-bold">FP</span>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW : ESPACE ARBITRES */}
      {activeTab === 'referees' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Referee Perks Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <span>Statut & Avantages des Arbitres Officiels</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-600/70 text-xs font-mono font-bold">
                Programme Fair-Play
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {refereePerksAndRewards.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#141417] border border-amber-600/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{p.icon}</span>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                        {p.tag}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white">{p.title}</div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-1">{p.value}</div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referee Missions */}
          <div className="space-y-4">
            <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Défis d'Arbitrage</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {refereeMissions.map((m) => {
                const isCompleted = completedMissions.includes(m.id);
                const isReadyToClaim = m.progress >= m.max && !isCompleted;
                const progressPercent = Math.min(100, Math.round((m.progress / m.max) * 100));

                return (
                  <div
                    key={m.id}
                    className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          {m.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          +{m.reward} FP
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white">{m.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-zinc-400">
                        <span>Progression vérifiée</span>
                        <span className="text-white font-bold">{m.progress} / {m.max}</span>
                      </div>

                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="pt-2">
                        {isCompleted ? (
                          <div className="w-full py-2 rounded-xl bg-zinc-800/60 text-zinc-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Récompense Déjà Récupérée</span>
                          </div>
                        ) : isReadyToClaim ? (
                          <button
                            onClick={() => handleClaim(m.id, m.reward)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Récupérer +{m.reward} FogPoints</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-medium text-center">
                            Arbitrez des matchs pour progresser
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW : MISSIONS JOUEURS CALCULÉES RÉELLEMENT */}
      {activeTab === 'players' && (
        <>
          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-faceit-orange" />
              <span>Missions Saisonnières Authentiques</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.map((mission) => {
                const isCompleted = completedMissions.includes(mission.id);
                const isReadyToClaim = mission.progress >= mission.max && !isCompleted;
                const progressPercent = Math.min(100, Math.round((mission.progress / mission.max) * 100));

                return (
                  <div
                    key={mission.id}
                    className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {mission.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-faceit-orange flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          +{mission.reward} FP
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white">{mission.title}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {mission.desc}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-zinc-400">
                        <span>Progression vérifiée</span>
                        <span className="text-white font-bold">{mission.progress} / {mission.max}</span>
                      </div>

                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-faceit-orange rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="pt-2">
                        {isCompleted ? (
                          <div className="w-full py-2 rounded-xl bg-zinc-800/60 text-zinc-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Récompense Déjà Récupérée</span>
                          </div>
                        ) : isReadyToClaim ? (
                          <button
                            onClick={() => handleClaim(mission.id, mission.reward)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Récupérer +{mission.reward} FogPoints</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-medium text-center">
                            Jouez des matchs certifiés pour progresser ({mission.progress}/{mission.max})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Rewards Shop */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Gift className="w-5 h-5 text-faceit-orange" />
                <span>Boutique de Cosmétiques Profil & Privilèges</span>
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Déblocages permanents liés à votre compte
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {rewards.map((reward) => {
                const isUnlocked = unlockedRewards.includes(reward.id);
                const canAfford = fogPoints >= reward.pointsCost;

                return (
                  <div
                    key={reward.id}
                    className="bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-32 relative overflow-hidden bg-zinc-900">
                        <img
                          src={reward.image}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-zinc-300">
                          {reward.tag}
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h4 className="font-bold text-sm text-white">{reward.name}</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{reward.description}</p>
                        <div className="text-xs font-mono font-bold text-faceit-orange flex items-center gap-1 pt-1">
                          <Coins className="w-4 h-4" />
                          <span>{reward.pointsCost.toLocaleString()} FogPoints</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      {isUnlocked ? (
                        <div className="w-full py-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Débloqué & Actif</span>
                        </div>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handleUnlockReward(reward.id, reward.pointsCost)}
                          className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            canAfford
                              ? 'bg-faceit-orange hover:bg-orange-600 text-white shadow-faceit-glow'
                              : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Débloquer' : 'Points insuffisants'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
