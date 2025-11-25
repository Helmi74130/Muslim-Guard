// utils/storage.js - Helpers pour chrome.storage.local

/**
 * Configuration par défaut de l'extension
 */
export const DEFAULT_CONFIG = {
  // Auth
  parentPinHash: null,
  parentPinSalt: null,
  recoveryEmail: '',
  isSetupComplete: false,

  // Config générale
  protectionEnabled: true,
  protectionMode: 'moderate', // strict, moderate, permissive
  language: 'fr',
  darkMode: false,

  // Listes de blocage
  blockedDomains: [],
  blockedKeywords: ['porn',
    'porno',
    'pornographie',
    'xxx',
    'sexe',
    'adult',
    'nude',
    'nudo',
    'webcam',
    'cam',
    'cams',
    'erotic',
    'érotique',
    'sexy',
    'nude',
    'nues',
    'amateur',
    'couple',
    'amateur',
    'gay',
    'lesbian',
    'trans',

    // Jeux d'argent & Paris
    'casino',
    'gambling',
    'poker',
    'blackjack',
    'roulette',
    'slot',
    'slots',
    'machine à sous',
    'pari',
    'paris',
    'betting',
    'bet',
    'bingo',
    'loto',
    'loterie',
    'hippodrome',

    // Musique & Divertissement
    'music',
    'musique',
    'spotify',
    'soundcloud',
    'deezer',
    'youtube music',
    'song',
    'songs',
    'chanson',
    'chansons',
    'hip hop',
    'rap',
    'techno',
    'disco',
    'club',
    'nightclub',
    'concert',

    // Rencontres & Dating
    'dating',
    'rencontre',
    'rencontres',
    'tinder',
    'bumble',
    'badoo',
    'meetic',
    'match',
    'hookup',
    'flirt',
    'single',
    'couple',
    'love',
    'amour',

    // Drogues & Alcool
    'alcool',
    'alcohol',
    'biere',
    'vin',
    'vodka',
    'whisky',
    'cannabis',
    'weed',
    'marijuana',
    'drogue',
    'drug',
    'drugs',
    'cocaine',
    'heroin',
    'meth',
    'ecstasy',
    'mdma',
    'lsd',
    'acid',
    'trip',

    // Films & Séries inappropriés
    'movie',
    'films',
    'cinema',
    'cinéma',
    'series',
    'série',
    'streaming',
    'netflix',
    'hbo',
    'disney+',
    'prime video',
    'torrent',
    'pirate',
    'download',
    'télécharger',

    // Jeux vidéo (selon politique)
    'game',
    'jeu',
    'jeux',
    'gaming',
    'fortnite',
    'pubg',
    'gta',
    'call of duty',
    'valorant',
    'cs go',
    'steam',
    'twitch',
    'youtube gaming',

    // Réseaux sociaux
    'facebook',
    'instagram',
    'tiktok',
    'snapchat',
    'twitter',
    'x.com',
    'telegram',
    'discord',
    'whatsapp web',
    'viber',

    // Contenu violent
    'violence',
    'gore',
    'violent',
    'brutal',
    'war games',
    'jeux de guerre',
    'terrorisme',
    'terrorist',

    // Mode & Beauté inappropriée
    'bikini',
    'lingerie',
    'swimwear',
    'maillot',
    'fashion model',
    'mannequin',

    // Shopping & Luxe
    'shopping',
    'luxury',
    'luxe',
    'gucci',
    'louis vuitton',
    'fashion',
    'designer',

    // Contenu religieux inapproprié
    'atheism',
    'athéisme',
    'anti-islam',
    'islamophobic',
    'critique islam',
    'apostasy',
    'apostasie',

    // VPN & Proxy (pour contourner)
    'vpn',
    'proxy',
    'tor',
    'anonyme',
    'anonymous',
    'hide',
    'unblock',
    'débloquer',

    // Autres
    'gossip',
    'potins',
    'celebrity',
    'célébrité',
    'scandal',
    'scandale',
    'trashy',
    'vulgar',
    'vulgaire',
    'curse',
    'swear',
    'insult'],

  // Mots-clés pour la détection de contenu dans les pages (content.js)
  contentDetectionKeywords: [
    'porn', 'xxx', 'adult', 'sex', 'nude', 'nsfw',
    'casino', 'gambling', 'bet', 'poker',
    'dating', 'hookup', 'meet singles',
    'music', 'spotify', 'deezer', 'soundcloud'
  ],

  whitelistedSites: ['quran.com', 'islamqa.info', 'bayyinah.tv', 'seekersguidance.org'],

  // Catégories
  blockSocialMedia: true,
  blockMusicStreaming: true,
  blockVideoStreaming: false,
  blockDating: true,
  blockGaming: false,
  blockAdult: true,
  blockReddit: true,

  // Scheduling
  prayerTimes: ['05:30', '13:00', '16:30', '19:00', '20:30'],
  prayerPauseEnabled: true,
  prayerPauseDuration: 15, // minutes
  dailyLimitMinutes: 0, // 0 = désactivé
  allowedHoursStart: '00:00',
  allowedHoursEnd: '23:59',
  scheduleEnabled: false,

  // Monitoring
  loggingEnabled: true,
  blockedLog: [],
  statsToday: {
    date: new Date().toDateString(),
    blockedCount: 0,
    topBlockedSites: {},
    timeSpentByCategory: {}
  },

  // Profiles
  activeProfile: 'default',
  profiles: {
    default: {
      name: 'Profil par défaut',
      age: 0,
      customRestrictions: {}
    }
  },

  // UI
  blockPageMessage: 'Ce site a été bloqué par MuslimGuard pour protéger votre famille.',

  // Fonctionnalités avancées
  temporaryWhitelist: [], // {domain, expiresAt}
  guestModeActive: false,
  alertsEnabled: true,
  bypassDetection: true
};

/**
 * Récupère toute la configuration
 */
export async function getConfig() {
  try {
    const result = await chrome.storage.local.get(null);
    return { ...DEFAULT_CONFIG, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération de la config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Récupère une valeur spécifique
 */
export async function getValue(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] !== undefined ? result[key] : DEFAULT_CONFIG[key];
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${key}:`, error);
    return DEFAULT_CONFIG[key];
  }
}

/**
 * Sauvegarde une ou plusieurs valeurs
 */
export async function setValue(key, value) {
  try {
    if (typeof key === 'object') {
      // Sauvegarde multiple
      await chrome.storage.local.set(key);
    } else {
      // Sauvegarde simple
      await chrome.storage.local.set({ [key]: value });
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
}

/**
 * Réinitialise la configuration
 */
export async function resetConfig() {
  try {
    await chrome.storage.local.clear();
    await chrome.storage.local.set(DEFAULT_CONFIG);
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return false;
  }
}

/**
 * Ajoute un log de blocage
 */
export async function addBlockedLog(url, reason) {
  try {
    const config = await getConfig();
    const log = {
      url,
      reason,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    // Limite à 1000 entrées (FIFO)
    const blockedLog = config.blockedLog || [];
    blockedLog.unshift(log);
    if (blockedLog.length > 1000) {
      blockedLog.pop();
    }

    await setValue('blockedLog', blockedLog);

    // Met à jour les stats du jour
    await updateTodayStats(url, reason);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du log:', error);
    return false;
  }
}

/**
 * Met à jour les statistiques du jour
 */
async function updateTodayStats(url, reason) {
  try {
    const config = await getConfig();
    const today = new Date().toDateString();
    let stats = config.statsToday;

    // Reset si nouveau jour
    if (stats.date !== today) {
      stats = {
        date: today,
        blockedCount: 0,
        topBlockedSites: {},
        timeSpentByCategory: {}
      };
    }

    // Incrémente le compteur
    stats.blockedCount++;

    // Extrait le domaine
    try {
      const domain = new URL(url).hostname;
      stats.topBlockedSites[domain] = (stats.topBlockedSites[domain] || 0) + 1;
    } catch (e) {
      // URL invalide
    }

    await setValue('statsToday', stats);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des stats:', error);
  }
}

/**
 * Exporte la configuration en JSON
 */
export async function exportConfig() {
  try {
    const config = await getConfig();
    // Retire les logs pour réduire la taille
    const exportData = { ...config };
    delete exportData.blockedLog;
    delete exportData.statsToday;

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return null;
  }
}

/**
 * Importe une configuration depuis JSON
 */
export async function importConfig(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    // Garde le PIN actuel par sécurité
    const current = await getConfig();
    imported.parentPinHash = current.parentPinHash;
    imported.parentPinSalt = current.parentPinSalt;

    await chrome.storage.local.set(imported);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return false;
  }
}

/**
 * Nettoie les vieux logs (garde les 30 derniers jours)
 */
export async function cleanOldLogs() {
  try {
    const config = await getConfig();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const filteredLogs = config.blockedLog.filter(log => log.timestamp > thirtyDaysAgo);

    await setValue('blockedLog', filteredLogs);
    return true;
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
    return false;
  }
}
