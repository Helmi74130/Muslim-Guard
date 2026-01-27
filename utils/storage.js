// utils/storage.js - Helpers pour chrome.storage.local

/**
 * Configuration par défaut de l'extension
 */
export const DEFAULT_CONFIG = {
  // Auth
  parentPinHash: null,
  parentPinSalt: null,
  isSetupComplete: false,

  // Config générale
  protectionEnabled: true,
  protectionMode: 'moderate', // strict, moderate, permissive
  language: 'fr',
  darkMode: false,

  // Listes de blocage
  blockedDomains: [],

  // Mots-clés pour bloquer les URLs (vérifiés dans background.js)
  // IMPORTANT: Liste vide par défaut - l'utilisateur doit les ajouter manuellement ou via bouton "Charger la liste par défaut"
  blockedKeywordsUrl: [],

  // Mots-clés pour détecter le contenu dans les pages (vérifiés dans content.js)
  // IMPORTANT: Liste vide par défaut - l'utilisateur doit les ajouter manuellement ou via bouton "Charger la liste par défaut"
  blockedKeywordsContent: [],

  // Listes recommandées (chargées via bouton dans les options, non utilisées par défaut)
  recommendedKeywordsUrl: [
    'porn', 'porno', 'pornographie', 'xxx', 'sexe', 'nude', 'nudo',
    'webcam', 'cams', 'erotic', 'érotique', 'sexy', 'amateur',
    'lesbian', 'trans', 'casino', 'gambling', 'poker', 'blackjack',
    'roulette', 'slot', 'slots', 'betting', 'bet', 'bingo', 'loto',
    'dating', 'rencontre', 'tinder', 'bumble', 'badoo', 'meetic',
    'hookup', 'flirt', 'alcool', 'alcohol', 'biere', 'vodka', 'whisky',
    'cannabis', 'weed', 'marijuana', 'drogue', 'drug', 'drugs',
    'cocaine', 'heroin', 'meth', 'ecstasy', 'mdma', 'lsd'
  ],

  recommendedKeywordsContent: [
    'music', 'musique', 'spotify', 'soundcloud', 'deezer', 'youtube music',
    'song', 'chanson', 'hip hop', 'rap', 'techno', 'disco', 'club',
    'nightclub', 'concert', 'movie', 'films', 'cinema', 'cinéma',
    'series', 'série', 'streaming', 'netflix', 'hbo', 'disney+',
    'prime video', 'torrent', 'pirate', 'download', 'télécharger',
    'game', 'jeu', 'jeux', 'gaming', 'fortnite', 'pubg', 'gta',
    'call of duty', 'valorant', 'cs go', 'steam', 'twitch',
    'youtube gaming', 'facebook', 'instagram', 'tiktok', 'snapchat',
    'twitter', 'x.com', 'telegram', 'discord', 'whatsapp web', 'viber',
    'violence', 'gore', 'violent', 'brutal', 'war games', 'jeux de guerre',
    'terrorisme', 'terrorist', 'bikini', 'lingerie', 'swimwear', 'maillot',
    'fashion model', 'mannequin', 'shopping', 'luxury', 'luxe', 'gucci',
    'louis vuitton', 'fashion', 'designer', 'atheism', 'athéisme',
    'anti-islam', 'islamophobic', 'critique islam', 'apostasy', 'apostasie',
    'gossip', 'potins', 'celebrity', 'célébrité', 'scandal', 'scandale',
    'trashy', 'vulgar', 'vulgaire', 'curse', 'swear', 'insult'
  ],

  whitelistedSites: ['quran.com', 'coran-en-ligne.com'],

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
  prayerPauseBefore: 5, // minutes avant l'heure de prière
  prayerPauseAfter: 20, // minutes après l'heure de prière
  prayerTimesAutoUpdate: false, // Auto-update via API
  prayerCity: null, // Ville pour récupération automatique
  prayerCityDisplayName: null, // Nom complet de la ville
  prayerCalculationMethod: 3, // Muslim World League par défaut
  prayerTimesLastUpdate: null, // Timestamp de la dernière mise à jour
  dailyLimitMinutes: 0, // 0 = désactivé
  allowedHoursStart: '00:00', // DEPRECATED - gardé pour migration
  allowedHoursEnd: '23:59',   // DEPRECATED - gardé pour migration
  scheduleEnabled: false,
  allowedSchedules: [], // Nouvelles plages horaires multiples: [{ id, start, end, enabled }]

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
  bypassDetection: true,

  // ===== SYSTÈME FREEMIUM =====

  // Informations d'abonnement (synced depuis backend)
  userPlan: 'trial', // 'free' | 'premium' | 'trial'
  subscriptionStatus: null, // 'active' | 'trialing' | 'canceled' | 'unpaid'
  planName: null, // 'free' | 'MuslimGuard Premium'
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionExpiresAt: null,
  lastSyncTimestamp: null,

  // Période d'essai Premium (7 jours)
  trialStartDate: null,
  trialEndDate: null,

  // Migration des données
  quotaMigrationDone: false,
  keywordsMigrationDone: false,

  // Personnalisation des catégories (Premium uniquement)
  customCategoryDomains: {}, // { categoryName: [domains] }
  removedCategoryDomains: {} // { categoryName: [domains] }
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

/**
 * Met à jour l'utilisation des quotas
 * @param {string} type - Type de quota
 * @param {number} count - Nouveau nombre d'éléments
 */
export async function updateQuotaUsage(type, count) {
  try {
    const config = await getConfig();
    const quotaUsage = config.quotaUsage || {};

    quotaUsage[type] = count;

    await setValue('quotaUsage', quotaUsage);
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quota:', error);
    return false;
  }
}

/**
 * Retourne le statut de tous les quotas
 * @returns {Promise<Object>} Objet avec le statut de tous les quotas
 */
export async function getQuotaStatus() {
  try {
    const config = await getConfig();
    const plan = config.userPlan || 'free';

    const status = {
      plan,
      isPremium: plan === 'premium' || plan === 'trial',
      quotas: {
        blockedDomains: {
          used: (config.blockedDomains || []).length,
          limit: plan === 'premium' || plan === 'trial' ? Infinity : 10
        },
        blockedKeywordsUrl: {
          used: (config.blockedKeywordsUrl || []).length,
          limit: plan === 'premium' || plan === 'trial' ? Infinity : 10
        },
        blockedKeywordsContent: {
          used: (config.blockedKeywordsContent || []).length,
          limit: plan === 'premium' || plan === 'trial' ? Infinity : 10
        },
        whitelistedSites: {
          used: (config.whitelistedSites || []).length,
          limit: plan === 'premium' || plan === 'trial' ? Infinity : 10
        }
      }
    };

    // Ajouter les quotas restants
    for (const key in status.quotas) {
      const quota = status.quotas[key];
      quota.remaining =
        quota.limit === Infinity ? Infinity : Math.max(0, quota.limit - quota.used);
      quota.percentage = quota.limit === Infinity ? 0 : Math.round((quota.used / quota.limit) * 100);
    }

    return status;
  } catch (error) {
    console.error('Erreur lors de la récupération du statut des quotas:', error);
    return null;
  }
}
