import { DBDMap, DBDKiller, CompRule, Player } from '../types';

export const DBD_MAPS_POOL: DBDMap[] = [
  {
    id: 'coal_tower',
    name: 'Tour de charbon (Coal Tower)',
    realm: 'Domaine MacMillan',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    type: 'Balanced',
    isCompApproved: true,
  },
  {
    id: 'groaning_storehouse',
    name: 'Entrepôt gémissant',
    realm: 'Domaine MacMillan',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    type: 'Balanced',
    isCompApproved: true,
  },
  {
    id: 'azarov',
    name: 'Demeure des Azarov',
    realm: 'Casse d\'Autohaven',
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=600&auto=format&fit=crop&q=80',
    type: 'Balanced',
    isCompApproved: true,
  },
  {
    id: 'chapel',
    name: 'Chapelle du père Campbell',
    realm: 'Asile de Crotus Prenn',
    image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600&auto=format&fit=crop&q=80',
    type: 'Balanced',
    isCompApproved: true,
  },
  {
    id: 'ormond',
    name: 'Station du mont Ormond',
    realm: 'Mont Ormond',
    image: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&auto=format&fit=crop&q=80',
    type: 'Survivor-Favored',
    isCompApproved: true,
  },
  {
    id: 'dead_dawg',
    name: 'Saloon de Dead Dawg',
    realm: 'Grave of Glenvale',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    type: 'Killer-Favored',
    isCompApproved: true,
  },
  {
    id: 'suffocation_pit',
    name: 'Fosse d\'étouffement',
    realm: 'Domaine MacMillan',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    type: 'Balanced',
    isCompApproved: true,
  },
];

export const DBD_KILLERS_POOL: DBDKiller[] = [
  {
    id: 'nurse',
    name: 'Sally Smithson',
    alias: 'L\'Infirmière (The Nurse)',
    difficulty: 'Très Difficile',
    tier: 'S',
    icon: '👻',
  },
  {
    id: 'blight',
    name: 'Talbot Grimes',
    alias: 'Le Fléau (The Blight)',
    difficulty: 'Très Difficile',
    tier: 'S',
    icon: '💉',
  },
  {
    id: 'wesker',
    name: 'Albert Wesker',
    alias: 'Le Cerveau (The Mastermind)',
    difficulty: 'Moyen',
    tier: 'A',
    icon: '🕶️',
  },
  {
    id: 'huntress',
    name: 'Anna',
    alias: 'La Chasseuse (The Huntress)',
    difficulty: 'Difficile',
    tier: 'A',
    icon: '🪓',
  },
  {
    id: 'billy',
    name: 'Max Thompson Jr.',
    alias: 'Le Montagnard (The Hillbilly)',
    difficulty: 'Difficile',
    tier: 'A',
    icon: '⚡',
  },
  {
    id: 'spirit',
    name: 'Rin Yamaoka',
    alias: 'L\'Esprit (The Spirit)',
    difficulty: 'Difficile',
    tier: 'A',
    icon: '🗡️',
  },
  {
    id: 'oni',
    name: 'Kazan Yamaoka',
    alias: 'L\'Oni',
    difficulty: 'Difficile',
    tier: 'A',
    icon: '👹',
  },
];

export const COMP_RULES: CompRule[] = [
  {
    id: 'rule_regression_limit',
    name: 'Limite de Régression',
    category: 'perk',
    description: 'Maximum 1 perk de régression de générateur par build (ex: Pain Res OU Pop Goes the Weasel).',
    isRestricted: true,
  },
  {
    id: 'rule_anti_tunnel',
    name: 'Protection Anti-Tunnel',
    category: 'killer',
    description: 'Interdiction de frapper le survivant décroché avant 10s si aucune provocation active n\'est faite.',
    isRestricted: true,
  },
  {
    id: 'rule_banned_addons',
    name: 'Addons Ultra-Rares (Iri) Interdits',
    category: 'item',
    description: 'Addons rouges (Irisés) interdits en match officiel 5v5 et 1v1.',
    isRestricted: true,
  },
  {
    id: 'rule_items_cap',
    name: 'Quota Objets Survivants',
    category: 'item',
    description: 'Maximum 1 boîte à outils de réparation et 1 trousse de soins par équipe de 4.',
    isRestricted: true,
  },
  {
    id: 'rule_1v1_tile',
    name: 'Règle du Shack 1v1',
    category: 'map',
    description: 'Le duel 1v1 se déroule uniquement dans la zone du Shack. Le survivant a 3 palettes max.',
    isRestricted: true,
  }
];

export const GUEST_PLAYER: Player = {
  id: 'usr_guest',
  name: 'Visiteur (Non Connecté)',
  avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
  elo: 1200,
  level: 1,
  role: 'flex',
  karma: 100,
  matchesPlayed: 0,
  winRate: 0,
  isCaptain: true,
};

export const CURRENT_USER: Player = GUEST_PLAYER;

export const MOCK_LEADERBOARD: Player[] = [];

