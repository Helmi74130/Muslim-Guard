/**
 * Quota Manager Module
 *
 * Gère tous les aspects du système freemium :
 * - Définition des limites Free vs Premium
 * - Synchronisation avec le backend
 * - Vérification des quotas
 * - Gestion des downgrades
 */

import { fetchTeamData, verifyExtensionToken, registerExtension, fetchUserData } from './api.js';
import { getConfig, setValue } from './storage.js';
import { CATEGORIES } from './lists.js';

// ============================================
// DÉFINITION DES LIMITES
// ============================================

export const FREEMIUM_LIMITS = {
  blockedDomains: 10,
  blockedKeywordsUrl: 10,
  blockedKeywordsContent: 10,
  whitelistedSites: 10,
  categoriesEnabled: 3,
  prayerMode: 'manual',
  trialDurationDays: 7
};

export const PREMIUM_LIMITS = {
  blockedDomains: Infinity,
  blockedKeywordsUrl: Infinity,
  blockedKeywordsContent: Infinity,
  whitelistedSites: Infinity,
  categoriesEnabled: Infinity,
  prayerMode: 'all'
};

// ============================================
// SYNCHRONISATION AVEC LE BACKEND
// ============================================

/**
 * Synchronise l'abonnement utilisateur avec le backend
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
export async function syncUserSubscription() {
  try {
    // 1. Vérifier si en période d'essai
    const { trialEndDate, userPlan, extensionToken } = await chrome.storage.local.get([
      'trialEndDate',
      'userPlan',
      'extensionToken'
    ]);

    // Si pas de token d'extension, essayer de s'enregistrer
    if (!extensionToken) {
      console.warn('⚠️ Pas de token d\'extension, tentative d\'enregistrement...');
      const registration = await registerExtension();

      if (!registration.success) {
        console.warn('Enregistrement échoué, mode local uniquement');
      }
    }

    if (userPlan === 'trial' && trialEndDate) {
      if (Date.now() > trialEndDate) {
        // Essai terminé → vérifier backend ou downgrade
        await handleTrialExpiry();
        return { plan: 'free', changed: true };
      } else {
        // Essai toujours actif → pas besoin de sync backend
        const daysRemaining = Math.ceil((trialEndDate - Date.now()) / (24 * 60 * 60 * 1000));

        // Mettre à jour le timestamp même si pas de sync backend nécessaire
        const newTimestamp = Date.now();
        await chrome.storage.local.set({ lastSyncTimestamp: newTimestamp });
        console.log('📅 [Sync] Timestamp mis à jour (essai actif, pas de sync backend):', new Date(newTimestamp));

        return { plan: 'trial', daysRemaining, changed: false };
      }
    }

    // 2. Appeler le backend avec le système de tokens
    let result;

    // Essayer d'abord avec le token d'extension
    if (extensionToken) {
      result = await verifyExtensionToken();

      // Si le token est invalide, réenregistrer
      if (!result.success && result.needsReregistration) {
        console.warn('🔄 Token invalide, réenregistrement...');
        const registration = await registerExtension();
        if (registration.success) {
          result = await verifyExtensionToken();
        }
      }
    } else {
      // Fallback vers l'ancien système (cookies) pour rétrocompatibilité
      result = await fetchTeamData();
    }

    if (!result.success) {
      // Backend inaccessible → garder l'état actuel
      const { userPlan: currentPlan, lastSyncTimestamp } = await chrome.storage.local.get([
        'userPlan',
        'lastSyncTimestamp'
      ]);

      console.warn('Backend inaccessible, conservation du dernier état:', currentPlan);

      // Mettre à jour le timestamp même en mode offline pour indiquer la tentative de sync
      const newTimestamp = Date.now();
      await chrome.storage.local.set({ lastSyncTimestamp: newTimestamp });
      console.log('📅 [Sync] Timestamp mis à jour en mode offline:', new Date(newTimestamp));

      return {
        plan: currentPlan || 'free',
        offline: true,
        lastSync: newTimestamp,
        error: result.error
      };
    }

    const teamData = result.data;
    console.log('📊 [Sync] teamData reçu:', teamData);

    // 3. Récupérer l'email utilisateur si non fourni par teamData
    let userEmail = teamData.email || null;
    console.log('📧 [Sync] Email depuis teamData:', userEmail);

    // Si l'email n'est pas dans teamData, essayer de le récupérer via fetchUserData
    if (!userEmail) {
      console.log('⚠️ [Sync] Email non trouvé dans teamData, tentative fetchUserData...');
      try {
        const userData = await fetchUserData();
        if (userData.success && userData.data?.email) {
          userEmail = userData.data.email;
          console.log('✅ [Sync] Email récupéré via fetchUserData:', userEmail);
        }
      } catch (error) {
        console.warn('❌ [Sync] Impossible de récupérer l\'email utilisateur:', error);
      }
    } else {
      console.log('✅ [Sync] Email trouvé dans teamData:', userEmail);
    }

    // 4. Déterminer le plan
    let newPlan = 'free';
    if (
      teamData.subscriptionStatus === 'active' ||
      teamData.subscriptionStatus === 'trialing'
    ) {
      newPlan = 'premium';
    }

    // 5. Détecter changement de plan
    const { userPlan: oldPlan } = await chrome.storage.local.get('userPlan');
    const planChanged = oldPlan !== newPlan;

    // 6. Sauvegarder
    console.log('💾 [Sync] Sauvegarde dans storage:', {
      userPlan: newPlan,
      subscriptionStatus: teamData.subscriptionStatus,
      planName: teamData.planName || 'Gratuit',
      isAuthenticated: teamData.isAuthenticated || false,
      userEmail: userEmail
    });

    await chrome.storage.local.set({
      userPlan: newPlan,
      subscriptionStatus: teamData.subscriptionStatus,
      planName: teamData.planName || 'Gratuit',
      stripeCustomerId: teamData.stripeCustomerId || null,
      isAuthenticated: teamData.isAuthenticated || false,
      userEmail: userEmail,
      lastSyncTimestamp: Date.now()
    });

    console.log('✅ [Sync] Données sauvegardées dans storage');

    // 7. Si downgrade → tronquer (même depuis trial)
    if (planChanged && newPlan === 'free') {
      await handleDowngrade();
    }

    console.log(`Sync réussie : ${oldPlan || 'unknown'} → ${newPlan}`);

    return { plan: newPlan, changed: planChanged, offline: false };
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);

    // Garder l'état actuel
    const { userPlan, lastSyncTimestamp } = await chrome.storage.local.get([
      'userPlan',
      'lastSyncTimestamp'
    ]);

    // Mettre à jour le timestamp même en cas d'erreur
    const newTimestamp = Date.now();
    await chrome.storage.local.set({ lastSyncTimestamp: newTimestamp });
    console.log('📅 [Sync] Timestamp mis à jour après erreur:', new Date(newTimestamp));

    return {
      plan: userPlan || 'free',
      offline: true,
      lastSync: newTimestamp,
      error: error.message
    };
  }
}

/**
 * Gère l'expiration de la période d'essai
 */
async function handleTrialExpiry() {
  console.log('Essai Premium expiré, vérification backend...');

  // Vérifier si l'utilisateur s'est abonné entre-temps
  const result = await fetchTeamData();

  if (result.success && result.data.subscriptionStatus === 'active') {
    // Abonné → passer en Premium
    await chrome.storage.local.set({
      userPlan: 'premium',
      subscriptionStatus: result.data.subscriptionStatus,
      planName: result.data.planName
    });

    console.log('Utilisateur abonné détecté, passage en Premium');
    return;
  }

  // Pas abonné → downgrade vers Free
  await chrome.storage.local.set({ userPlan: 'free' });
  await handleDowngrade();

  // Notification
  chrome.notifications.create('trial-expired', {
    type: 'basic',
    iconUrl: '../icons/icon128.png',
    title: 'Essai Premium terminé',
    message:
      'Votre essai de 7 jours est terminé. Abonnez-vous pour retrouver toutes les fonctionnalités !',
    buttons: [{ title: 'Voir les offres' }],
    requireInteraction: true
  });

  console.log('Downgrade vers plan gratuit effectué');
}

// ============================================
// VÉRIFICATION DES QUOTAS
// ============================================

/**
 * Retourne le plan actuel de l'utilisateur
 * @returns {Promise<string>} 'free', 'premium' ou 'trial'
 */
export async function getUserPlan() {
  const { userPlan } = await chrome.storage.local.get('userPlan');
  return userPlan || 'free';
}

/**
 * Vérifie si l'utilisateur peut ajouter un nouvel élément
 * @param {string} type - Type d'élément (blockedDomains, blockedKeywordsUrl, etc.)
 * @param {number} currentCount - Nombre actuel d'éléments
 * @returns {Promise<Object>} { allowed, limit, remaining }
 */
export async function canAddItem(type, currentCount) {
  const plan = await getUserPlan();

  // Trial et Premium ont accès illimité
  if (plan === 'premium' || plan === 'trial') {
    return {
      allowed: true,
      limit: Infinity,
      remaining: Infinity
    };
  }

  // Plan Free → vérifier les limites
  const limit = FREEMIUM_LIMITS[type];

  if (limit === undefined) {
    console.warn(`Type de quota inconnu: ${type}`);
    return { allowed: false, limit: 0, remaining: 0 };
  }

  // Permet d'ajouter si currentCount < limit (on peut atteindre la limite mais pas la dépasser)
  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);

  return { allowed, limit, remaining };
}

/**
 * Calcule le quota restant pour un type donné
 * @param {string} type - Type d'élément
 * @returns {Promise<Object>} { used, limit, remaining, percentage }
 */
export async function getRemainingQuota(type) {
  const plan = await getUserPlan();
  const config = await getConfig();

  // Premium et Trial → illimité
  if (plan === 'premium' || plan === 'trial') {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      percentage: 0
    };
  }

  const limit = FREEMIUM_LIMITS[type];
  let used = 0;

  // Compter les éléments actuels
  switch (type) {
    case 'blockedDomains':
      used = (config.blockedDomains || []).length;
      break;
    case 'blockedKeywordsUrl':
      used = (config.blockedKeywordsUrl || []).length;
      break;
    case 'blockedKeywordsContent':
      used = (config.blockedKeywordsContent || []).length;
      break;
    case 'whitelistedSites':
      used = (config.whitelistedSites || []).length;
      break;
    case 'categoriesEnabled':
      used = Object.keys(CATEGORIES).filter(cat => config[`block${capitalize(cat)}`]).length;
      break;
    default:
      console.warn(`Type de quota inconnu: ${type}`);
  }

  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return { used, limit, remaining, percentage };
}

/**
 * Vérifie si une fonctionnalité est disponible pour l'utilisateur
 * @param {string} feature - Nom de la fonctionnalité
 * @returns {Promise<boolean>} True si disponible
 */
export async function isFeatureAvailable(feature) {
  const plan = await getUserPlan();

  // Premium et Trial → toutes les fonctionnalités
  if (plan === 'premium' || plan === 'trial') {
    return true;
  }

  // Fonctionnalités Premium uniquement
  const premiumFeatures = [
    'autoPrayerMode', // Mode automatique des prières
    'advancedAnalytics', // Analytics avancées
    'customCategories', // Personnalisation des catégories
    'exportData' // Export des données
  ];

  return !premiumFeatures.includes(feature);
}

/**
 * Retourne le statut complet des quotas
 * @returns {Promise<Object>} Objet avec tous les quotas
 */
export async function getQuotaStatus() {
  const plan = await getUserPlan();
  const { trialEndDate } = await chrome.storage.local.get('trialEndDate');

  const status = {
    plan,
    trial: {
      active: plan === 'trial',
      daysRemaining:
        plan === 'trial' && trialEndDate
          ? Math.ceil((trialEndDate - Date.now()) / (24 * 60 * 60 * 1000))
          : 0
    },
    quotas: {}
  };

  // Récupérer tous les quotas
  const quotaTypes = [
    'blockedDomains',
    'blockedKeywordsUrl',
    'blockedKeywordsContent',
    'whitelistedSites',
    'categoriesEnabled'
  ];

  for (const type of quotaTypes) {
    status.quotas[type] = await getRemainingQuota(type);
  }

  return status;
}

// ============================================
// GESTION DU DOWNGRADE
// ============================================

/**
 * Applique les quotas au chargement (tronque si nécessaire)
 */
export async function enforceQuotasOnLoad() {
  const plan = await getUserPlan();

  // Premium et Trial → pas de limitation
  if (plan === 'premium' || plan === 'trial') {
    console.log('Plan Premium/Trial détecté, pas de limitation');
    return;
  }

  // Vérifier chaque quota
  const config = await getConfig();
  const updates = {};
  let needsTruncation = false;

  // Domaines bloqués
  if (config.blockedDomains && config.blockedDomains.length > FREEMIUM_LIMITS.blockedDomains) {
    updates.blockedDomains = config.blockedDomains.slice(0, FREEMIUM_LIMITS.blockedDomains);
    needsTruncation = true;
  }

  // Mots-clés URL
  if (
    config.blockedKeywordsUrl &&
    config.blockedKeywordsUrl.length > FREEMIUM_LIMITS.blockedKeywordsUrl
  ) {
    updates.blockedKeywordsUrl = config.blockedKeywordsUrl.slice(
      0,
      FREEMIUM_LIMITS.blockedKeywordsUrl
    );
    needsTruncation = true;
  }

  // Mots-clés Contenu
  if (
    config.blockedKeywordsContent &&
    config.blockedKeywordsContent.length > FREEMIUM_LIMITS.blockedKeywordsContent
  ) {
    updates.blockedKeywordsContent = config.blockedKeywordsContent.slice(
      0,
      FREEMIUM_LIMITS.blockedKeywordsContent
    );
    needsTruncation = true;
  }

  // Sites en whitelist
  if (
    config.whitelistedSites &&
    config.whitelistedSites.length > FREEMIUM_LIMITS.whitelistedSites
  ) {
    updates.whitelistedSites = config.whitelistedSites.slice(0, FREEMIUM_LIMITS.whitelistedSites);
    needsTruncation = true;
  }

  // Catégories
  const enabledCategories = Object.keys(CATEGORIES).filter(
    cat => config[`block${capitalize(cat)}`]
  );
  if (enabledCategories.length > FREEMIUM_LIMITS.categoriesEnabled) {
    // Désactiver les catégories en trop (garder les 3 premières)
    for (let i = FREEMIUM_LIMITS.categoriesEnabled; i < enabledCategories.length; i++) {
      updates[`block${capitalize(enabledCategories[i])}`] = false;
    }
    needsTruncation = true;
  }

  // Mode prière automatique
  if (config.prayerTimesAutoUpdate) {
    updates.prayerTimesAutoUpdate = false;
    needsTruncation = true;
  }

  if (needsTruncation) {
    console.warn('Quotas dépassés détectés, application des limites gratuites');
    await setValue(updates);
  }
}

/**
 * Gère le downgrade d'un plan Premium vers Free
 */
export async function handleDowngrade() {
  console.log('Downgrade vers plan gratuit...');

  const config = await getConfig();
  const updates = {};
  const removedItems = {
    domains: 0,
    keywordsUrl: 0,
    keywordsContent: 0,
    whitelist: 0,
    categories: 0
  };

  // 1. Tronquer les domaines bloqués
  if (config.blockedDomains && config.blockedDomains.length > FREEMIUM_LIMITS.blockedDomains) {
    removedItems.domains = config.blockedDomains.length - FREEMIUM_LIMITS.blockedDomains;
    updates.blockedDomains = config.blockedDomains.slice(0, FREEMIUM_LIMITS.blockedDomains);
  }

  // 2. Tronquer les mots-clés URL
  if (
    config.blockedKeywordsUrl &&
    config.blockedKeywordsUrl.length > FREEMIUM_LIMITS.blockedKeywordsUrl
  ) {
    removedItems.keywordsUrl =
      config.blockedKeywordsUrl.length - FREEMIUM_LIMITS.blockedKeywordsUrl;
    updates.blockedKeywordsUrl = config.blockedKeywordsUrl.slice(
      0,
      FREEMIUM_LIMITS.blockedKeywordsUrl
    );
  }

  // 3. Tronquer les mots-clés de contenu
  if (
    config.blockedKeywordsContent &&
    config.blockedKeywordsContent.length > FREEMIUM_LIMITS.blockedKeywordsContent
  ) {
    removedItems.keywordsContent =
      config.blockedKeywordsContent.length - FREEMIUM_LIMITS.blockedKeywordsContent;
    updates.blockedKeywordsContent = config.blockedKeywordsContent.slice(
      0,
      FREEMIUM_LIMITS.blockedKeywordsContent
    );
  }

  // 4. Tronquer la whitelist
  if (
    config.whitelistedSites &&
    config.whitelistedSites.length > FREEMIUM_LIMITS.whitelistedSites
  ) {
    removedItems.whitelist = config.whitelistedSites.length - FREEMIUM_LIMITS.whitelistedSites;
    updates.whitelistedSites = config.whitelistedSites.slice(0, FREEMIUM_LIMITS.whitelistedSites);
  }

  // 5. Désactiver les catégories excédentaires
  const enabledCategories = Object.keys(CATEGORIES).filter(
    cat => config[`block${capitalize(cat)}`]
  );
  if (enabledCategories.length > FREEMIUM_LIMITS.categoriesEnabled) {
    removedItems.categories = enabledCategories.length - FREEMIUM_LIMITS.categoriesEnabled;
    // Garder les 3 premières catégories activées
    for (let i = FREEMIUM_LIMITS.categoriesEnabled; i < enabledCategories.length; i++) {
      updates[`block${capitalize(enabledCategories[i])}`] = false;
    }
  }

  // 6. Désactiver le mode automatique des prières
  if (config.prayerTimesAutoUpdate) {
    updates.prayerTimesAutoUpdate = false;
  }

  // 7. Supprimer les personnalisations des catégories
  if (config.customCategoryDomains) {
    updates.customCategoryDomains = {};
  }
  if (config.removedCategoryDomains) {
    updates.removedCategoryDomains = {};
  }

  // Appliquer les changements
  await setValue(updates);

  // Construire le message de notification
  const messages = [];
  if (removedItems.domains > 0) {
    messages.push(`${removedItems.domains} domaines bloqués supprimés`);
  }
  if (removedItems.keywordsUrl > 0) {
    messages.push(`${removedItems.keywordsUrl} mots-clés URL supprimés`);
  }
  if (removedItems.keywordsContent > 0) {
    messages.push(`${removedItems.keywordsContent} mots-clés de contenu supprimés`);
  }
  if (removedItems.whitelist > 0) {
    messages.push(`${removedItems.whitelist} sites en whitelist supprimés`);
  }
  if (removedItems.categories > 0) {
    messages.push(`${removedItems.categories} catégories désactivées`);
  }
  if (config.prayerTimesAutoUpdate) {
    messages.push('Mode automatique des prières désactivé');
  }

  // Notification si des éléments ont été supprimés
  if (messages.length > 0) {
    chrome.notifications.create('downgrade-notification', {
      type: 'basic',
      iconUrl: '../icons/icon128.png',
      title: 'Plan gratuit activé',
      message: `Votre configuration a été ajustée :\n- ${messages.join('\n- ')}\n\nPassez à Premium pour retrouver toutes vos configurations.`,
      buttons: [{ title: 'Voir les offres' }],
      requireInteraction: true
    });
  }

  console.log('Downgrade terminé:', updates);
}

// ============================================
// MIGRATION DES MOTS-CLÉS
// ============================================

/**
 * Migre la liste unique blockedKeywords vers 2 listes séparées
 */
export async function migrateKeywords() {
  const { blockedKeywords, keywordsMigrationDone } = await chrome.storage.local.get([
    'blockedKeywords',
    'keywordsMigrationDone'
  ]);

  if (keywordsMigrationDone || !blockedKeywords || blockedKeywords.length === 0) {
    return; // Déjà migré ou pas de keywords
  }

  console.log('Migration des mots-clés:', blockedKeywords.length, 'mots-clés à migrer');

  // Liste pré-définie des keywords critiques pour URL
  const urlKeywordsList = [
    'porn',
    'xxx',
    'sex',
    'adult',
    'nude',
    'naked',
    'casino',
    'betting',
    'gamble',
    'poker',
    'strip',
    'escort',
    'dating',
    'hookup',
    'nsfw',
    'explicit',
    'erotic',
    'hentai',
    'webcam',
    'cam',
    'live',
    'sexy',
    'hot',
    'milf',
    'teen',
    'anal',
    'lesbian',
    'gay',
    'shemale',
    'tranny',
    'pussy',
    'dick',
    'cock',
    'boobs',
    'tits',
    'ass',
    'fuck',
    'viagra',
    'cialis',
    'drugs',
    'weed',
    'cocaine',
    'heroin',
    'pills',
    'torrent',
    'pirate',
    'crack',
    'keygen',
    'vpn',
    'proxy',
    'unblock'
  ];

  // Séparer la liste existante
  const keywordsUrl = blockedKeywords.filter(kw =>
    urlKeywordsList.includes(kw.toLowerCase())
  );
  const keywordsContent = blockedKeywords.filter(
    kw => !urlKeywordsList.includes(kw.toLowerCase())
  );

  // Sauvegarder
  await chrome.storage.local.set({
    blockedKeywordsUrl: keywordsUrl,
    blockedKeywordsContent: keywordsContent,
    keywordsMigrationDone: true
  });

  // Supprimer l'ancienne clé
  await chrome.storage.local.remove('blockedKeywords');

  console.log(
    'Migration terminée:',
    keywordsUrl.length,
    'URL keywords,',
    keywordsContent.length,
    'content keywords'
  );
}

/**
 * Migre l'ancienne plage horaire unique (allowedHoursStart/End) vers le système multi-plages
 */
export async function migrateSchedules() {
  const { allowedSchedules, allowedHoursStart, allowedHoursEnd, scheduleEnabled } =
    await chrome.storage.local.get([
      'allowedSchedules',
      'allowedHoursStart',
      'allowedHoursEnd',
      'scheduleEnabled'
    ]);

  // Si déjà migré (allowedSchedules existe et n'est pas vide), on skip
  if (allowedSchedules && allowedSchedules.length > 0) {
    return;
  }

  // Si l'ancienne config n'existe pas ou est désactivée, on ne fait rien
  if (!allowedHoursStart || !allowedHoursEnd) {
    return;
  }

  console.log('Migration des plages horaires: conversion de l\'ancienne plage unique');

  // Créer une plage unique à partir de l'ancienne config
  const migratedSchedule = {
    id: Date.now().toString(),
    start: allowedHoursStart,
    end: allowedHoursEnd,
    enabled: scheduleEnabled || false
  };

  await chrome.storage.local.set({
    allowedSchedules: [migratedSchedule]
  });

  console.log('Migration des plages horaires terminée:', migratedSchedule);
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Capitalise la première lettre d'une chaîne
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Vérifie l'intégrité des quotas et force une sync si nécessaire
 */
export async function verifyQuotaIntegrity() {
  const { userPlan, lastSyncTimestamp } = await chrome.storage.local.get([
    'userPlan',
    'lastSyncTimestamp'
  ]);

  // Forcer sync si > 24h
  if (!lastSyncTimestamp || Date.now() - lastSyncTimestamp > 24 * 60 * 60 * 1000) {
    console.warn('Dernière sync > 24h, synchronisation forcée');
    await syncUserSubscription();
  }

  // Vérifier cohérence quotas vs plan
  if (userPlan === 'free') {
    await enforceQuotasOnLoad();
  }
}
