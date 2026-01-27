// background.js - Service Worker principal de MuslimGuard

import { getConfig, getValue, setValue, addBlockedLog } from './utils/storage.js';
import { isSetupComplete } from './utils/auth.js';
import {
  matchesDomain,
  containsSuspiciousKeywords,
  getActiveCategories,
  isWhitelisted
} from './utils/lists.js';
import { updatePrayerTimesFromCity } from './utils/prayerApi.js';
import {
  syncUserSubscription,
  enforceQuotasOnLoad,
  migrateKeywords,
  verifyQuotaIntegrity
} from './utils/quotaManager.js';
import { registerExtension, linkExtensionToAccount } from './utils/api.js';

// État global
let config = null;
let isPrayerTime = false;

/**
 * Initialisation au démarrage de l'extension
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Première installation
    await setValue('installDate', Date.now());

    // 1. ENREGISTRER L'EXTENSION AUPRÈS DU BACKEND
    console.log('📡 Enregistrement de l\'extension auprès du backend...');
    const registration = await registerExtension();

    if (registration.success) {
      console.log('✅ Extension enregistrée avec succès, token:', registration.token);
    } else {
      console.warn('⚠️ Échec de l\'enregistrement backend, mode local uniquement:', registration.error);
    }

    // 2. Activer l'essai Premium de 7 jours pour les nouveaux utilisateurs
    const trialStartDate = Date.now();
    const trialEndDate = trialStartDate + 7 * 24 * 60 * 60 * 1000;

    await chrome.storage.local.set({
      userPlan: 'trial',
      trialStartDate,
      trialEndDate,
      lastSyncTimestamp: Date.now()
    });

    // Créer une alarme pour notifier 1 jour avant la fin de l'essai
    chrome.alarms.create('trial-expiring-soon', {
      when: trialEndDate - 24 * 60 * 60 * 1000
    });

    console.log('Essai Premium de 7 jours activé pour le nouvel utilisateur');

    // Ouvre la page de setup
    const setupComplete = await isSetupComplete();
    if (!setupComplete) {
      chrome.tabs.create({ url: 'setup/setup.html' });
    }
  }

  if (details.reason === 'update') {
    // Mise à jour de l'extension
    const { quotaMigrationDone } = await chrome.storage.local.get('quotaMigrationDone');

    if (!quotaMigrationDone) {
      // Première migration - Offrir essai Premium 7 jours aux utilisateurs existants
      const trialStartDate = Date.now();
      const trialEndDate = trialStartDate + 7 * 24 * 60 * 60 * 1000;

      await chrome.storage.local.set({
        userPlan: 'trial',
        trialStartDate,
        trialEndDate,
        quotaMigrationDone: true,
        lastSyncTimestamp: Date.now()
      });

      // Migrer les mots-clés de l'ancienne liste unique vers 2 listes séparées
      await migrateKeywords();

      // Notification
      chrome.notifications.create('trial-started', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'MuslimGuard Premium - Essai gratuit !',
        message:
          '🎉 Profitez de 7 jours d\'essai Premium GRATUIT pour tester toutes les fonctionnalités avancées !'
      });

      // Alarme pour notifier 1 jour avant la fin
      chrome.alarms.create('trial-expiring-soon', {
        when: trialEndDate - 24 * 60 * 60 * 1000
      });

      console.log('Migration vers système freemium effectuée - Essai Premium activé');
    }
  }

  // Charge la config
  await loadConfig();

  // Synchronise l'abonnement avec le backend
  await syncUserSubscription();

  // Applique les quotas si nécessaire
  await enforceQuotasOnLoad();

  // Initialise les alarmes
  setupAlarms();
});

/**
 * Au démarrage du navigateur
 */
chrome.runtime.onStartup.addListener(async () => {
  await loadConfig();

  // Synchroniser l'abonnement avec le backend
  await syncUserSubscription();

  // Appliquer les quotas
  await enforceQuotasOnLoad();

  setupAlarms();
});

/**
 * Charge la configuration depuis le storage
 */
async function loadConfig() {
  try {
    config = await getConfig();
  } catch (error) {
    console.error('Erreur lors du chargement de la config:', error);
  }
}

/**
 * Configure les alarmes (vérifications périodiques)
 */
function setupAlarms() {
  // Vérifie toutes les minutes si c'est l'heure de prière
  chrome.alarms.create('checkPrayer', { periodInMinutes: 1 });

  // Nettoie les vieux logs chaque jour
  chrome.alarms.create('cleanLogs', { periodInMinutes: 1440 }); // 24h

  // Reset les stats quotidiennes à minuit
  chrome.alarms.create('resetDaily', { periodInMinutes: 1440 });

  // Met à jour les horaires de prière quotidiennement (toutes les 24h)
  chrome.alarms.create('updatePrayerTimes', { periodInMinutes: 1440 });

  // Synchronise l'abonnement avec le backend toutes les heures
  chrome.alarms.create('sync-subscription', { periodInMinutes: 60 });

  // Vérifie l'intégrité des quotas quotidiennement
  chrome.alarms.create('verify-quota-integrity', { periodInMinutes: 1440 });

  // Mise à jour immédiate au démarrage si nécessaire
  updatePrayerTimesIfNeeded();
}

/**
 * Gestionnaire d'alarmes
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPrayer') {
    await checkPrayerTime();
  } else if (alarm.name === 'cleanLogs') {
    await cleanOldLogs();
  } else if (alarm.name === 'resetDaily') {
    await resetDailyStats();
  } else if (alarm.name === 'updatePrayerTimes') {
    await updatePrayerTimesIfNeeded();
  } else if (alarm.name === 'sync-subscription') {
    // Synchronisation périodique de l'abonnement
    await syncUserSubscription();
    await enforceQuotasOnLoad();
  } else if (alarm.name === 'verify-quota-integrity') {
    // Vérification quotidienne de l'intégrité des quotas
    await verifyQuotaIntegrity();
  } else if (alarm.name === 'trial-expiring-soon') {
    // Notification 24h avant la fin de l'essai
    chrome.notifications.create('trial-ending', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'MuslimGuard - Essai se termine demain',
      message:
        'Votre essai Premium se termine demain. Abonnez-vous pour conserver toutes les fonctionnalités !',
      buttons: [{ title: 'Voir les offres' }],
      requireInteraction: true
    });
  }
});

/**
 * Vérifie si c'est l'heure de prière
 */
async function checkPrayerTime() {
  try {
    await loadConfig(); // Recharge la config

    // Ne rien faire si la protection est désactivée
    if (!config.protectionEnabled) {
      isPrayerTime = false;
      return;
    }

    if (!config.prayerPauseEnabled) {
      isPrayerTime = false;
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = now.toDateString();

    // Récupère les prières déjà notifiées aujourd'hui
    const result = await chrome.storage.local.get(['notifiedPrayers']);
    let notifiedPrayers = result.notifiedPrayers || {};

    // Réinitialise si on a changé de jour
    if (notifiedPrayers.date !== today) {
      notifiedPrayers = { date: today, prayers: [] };
      await chrome.storage.local.set({ notifiedPrayers });
    }

    // Vérifie chaque heure de prière
    for (const prayerTime of config.prayerTimes) {
      const [hours, minutes] = prayerTime.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      // Vérifie si on est dans la plage de blocage (avant ou après la prière)
      const diff = currentMinutes - prayerMinutes;
      const isBeforePrayer = diff < 0 && Math.abs(diff) <= config.prayerPauseBefore;
      const isAfterPrayer = diff >= 0 && diff <= config.prayerPauseAfter;

      if (isBeforePrayer || isAfterPrayer) {
        isPrayerTime = true;

        // N'affiche la notification que si elle n'a pas déjà été affichée aujourd'hui
        if (!notifiedPrayers.prayers.includes(prayerTime)) {
          notifiedPrayers.prayers.push(prayerTime);
          await chrome.storage.local.set({ notifiedPrayers });
          showPrayerNotification(prayerTime, config.prayerPauseBefore, config.prayerPauseAfter);
        }
        return;
      }
    }

    isPrayerTime = false;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'heure de prière:', error);
  }
}

/**
 * Affiche une notification pour la prière
 */
function showPrayerNotification(prayerTime, pauseBefore, pauseAfter) {
  const totalDuration = pauseBefore + pauseAfter;
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon-128.png',
    title: '🕌 C\'est l\'heure de la prière',
    message: `Prière à ${prayerTime}. Internet est en pause (${pauseBefore} min avant, ${pauseAfter} min après).`,
    priority: 2
  });
}

/**
 * Met à jour les horaires de prière si le mode auto est activé
 */
async function updatePrayerTimesIfNeeded() {
  try {
    await loadConfig();

    // Vérifie si l'auto-update est activé
    if (!config.prayerTimesAutoUpdate || !config.prayerCity) {
      return;
    }

    const lastUpdate = config.prayerTimesLastUpdate;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Met à jour si jamais mis à jour ou si dernier update > 24h
    if (!lastUpdate || (now - lastUpdate > oneDayMs)) {
      console.log('Updating prayer times from API...');
      const success = await updatePrayerTimesFromCity();

      if (success) {
        console.log('Prayer times updated successfully');
        await loadConfig(); // Recharge la config mise à jour
      } else {
        console.warn('Failed to update prayer times');
      }
    }
  } catch (error) {
    console.error('Error in updatePrayerTimesIfNeeded:', error);
  }
}

/**
 * Nettoie les vieux logs
 */
async function cleanOldLogs() {
  try {
    const { cleanOldLogs } = await import('./utils/storage.js');
    await cleanOldLogs();
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
  }
}

/**
 * Reset les stats quotidiennes
 */
async function resetDailyStats() {
  try {
    const today = new Date().toDateString();
    await setValue('statsToday', {
      date: today,
      blockedCount: 0,
      topBlockedSites: {},
      timeSpentByCategory: {}
    });
  } catch (error) {
    console.error('Erreur lors du reset des stats:', error);
  }
}

/**
 * Intercepte les navigations pour bloquer (Manifest V3 compatible)
 * Utilise webNavigation au lieu de webRequest
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    // Ignore les navigations non-principales (iframes, etc.)
    if (details.frameId !== 0) {
      return;
    }

    // Ignore les requêtes internes de l'extension
    if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://')) {
      return;
    }

    // Charge la config si pas déjà fait
    if (!config) {
      await loadConfig();
    }

    // Vérifie si la protection est activée
    if (!config.protectionEnabled) {
      return;
    }

    // Vérifie si c'est l'heure de prière
    if (isPrayerTime && !isWhitelisted(details.url, [...config.whitelistedSites])) {
      await addBlockedLog(details.url, 'prayer_time');
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=prayer&url=' + encodeURIComponent(details.url)
      });
      return;
    }

    // Mode invité actif = pas de blocage
    if (config.guestModeActive) {
      return;
    }

    // Vérifie la whitelist temporaire
    const tempWhitelist = config.temporaryWhitelist || [];
    for (const item of tempWhitelist) {
      if (item.expiresAt > Date.now() && matchesDomain(details.url, item.domain)) {
        return;
      }
    }

    // Vérifie si le site est whitelisté
    if (isWhitelisted(details.url, config.whitelistedSites)) {
      return;
    }

    // Mode strict: bloque tout sauf whitelist
    if (config.protectionMode === 'strict') {
      await addBlockedLog(details.url, 'strict_mode');
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=strict&url=' + encodeURIComponent(details.url)
      });
      return;
    }

    // Vérifie les domaines bloqués
    for (const domain of config.blockedDomains) {
      if (matchesDomain(details.url, domain)) {
        await addBlockedLog(details.url, 'blocked_domain');
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=domain&url=' + encodeURIComponent(details.url)
        });
        return;
      }
    }

    // Vérifie les catégories actives
    const activeDomains = await getActiveCategories(config);
    for (const domain of activeDomains) {
      if (matchesDomain(details.url, domain)) {
        await addBlockedLog(details.url, 'category');
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=category&url=' + encodeURIComponent(details.url)
        });
        return;
      }
    }

    // Vérifie les mots-clés suspects dans l'URL
    const keywordCheck = containsSuspiciousKeywords(details.url, config.blockedKeywordsUrl || []);
    if (keywordCheck.blocked) {
      await addBlockedLog(details.url, `keyword:${keywordCheck.keyword}`);
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=keyword&url=' + encodeURIComponent(details.url)
      });
      return;
    }

    // Vérifie les horaires autorisés
    if (config.scheduleEnabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = config.allowedHoursStart.split(':').map(Number);
      const [endH, endM] = config.allowedHoursEnd.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentTime < startMinutes || currentTime > endMinutes) {
        await addBlockedLog(details.url, 'outside_schedule');
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked/blocked.html') + '?reason=schedule&url=' + encodeURIComponent(details.url)
        });
        return;
      }
    }
  } catch (error) {
    console.error('Erreur dans onBeforeNavigate:', error);
  }
});

/**
 * Écoute les messages des autres scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'reloadConfig') {
        await loadConfig();
        // Recalcule immédiatement le statut des prières
        await checkPrayerTime();
        sendResponse({ success: true, protectionEnabled: config.protectionEnabled });
      } else if (message.action === 'getConfig') {
        await loadConfig();
        sendResponse({ config });
      } else if (message.action === 'checkBlock') {
        const shouldBlock = await shouldBlockUrl(message.url);
        sendResponse({ shouldBlock });
      } else if (message.action === 'addTempWhitelist') {
        await addTemporaryWhitelist(message.domain, message.minutes);
        sendResponse({ success: true });
      } else if (message.action === 'enforceQuotas') {
        // Force l'application des quotas (tronquer si nécessaire)
        await enforceQuotasOnLoad();
        await loadConfig(); // Recharge la config pour avoir les nouvelles valeurs

        // Notifier la page des options de recharger sa config (si ouverte)
        try {
          const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('options/options.html') });
          for (const tab of tabs) {
            await chrome.tabs.sendMessage(tab.id, { action: 'reloadOptionsConfig' });
          }
        } catch (e) {
          // Pas grave si la page des options n'est pas ouverte
        }

        sendResponse({ success: true });
      } else if (message.action === 'migrateKeywords') {
        // Force la migration des mots-clés
        await migrateKeywords();
        await loadConfig();

        // Notifier la page des options de recharger sa config (si ouverte)
        try {
          const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('options/options.html') });
          for (const tab of tabs) {
            await chrome.tabs.sendMessage(tab.id, { action: 'reloadOptionsConfig' });
          }
        } catch (e) {
          // Pas grave si la page des options n'est pas ouverte
        }

        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Erreur dans le gestionnaire de messages:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Indique qu'on va répondre de manière asynchrone
});

// NOTE: Listener tabs.onUpdated déplacé plus bas (ligne 626+)
// pour éviter les doublons et fusionner la logique d'enregistrement + sync

/**
 * Ajoute un domaine à la whitelist temporaire
 */
async function addTemporaryWhitelist(domain, minutes) {
  try {
    await loadConfig();
    const tempWhitelist = config.temporaryWhitelist || [];

    tempWhitelist.push({
      domain,
      expiresAt: Date.now() + (minutes * 60 * 1000)
    });

    await setValue('temporaryWhitelist', tempWhitelist);
    await loadConfig();
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la whitelist temporaire:', error);
  }
}

/**
 * Met à jour l'icône de l'extension selon l'état
 * Note: setIcon() désactivé car les icônes placeholder ne sont pas valides
 */
async function updateIcon() {
  try {
    await loadConfig();

    if (config.protectionEnabled) {
      // Icône normale (protection active)
      // chrome.action.setIcon({ path: 'assets/icon-128.png' }); // Désactivé - icône invalide
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
    } else {
      // Icône grisée (protection désactivée)
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'icône:', error);
  }
}

// Met à jour l'icône au démarrage
updateIcon();

// Écoute les changements dans le storage pour mettre à jour l'icône
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.protectionEnabled) {
    updateIcon();
  }
});

/**
 * Gestionnaire de clics sur les boutons des notifications
 */
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (
    notificationId === 'trial-ending' ||
    notificationId === 'trial-expired' ||
    notificationId === 'downgrade-notification'
  ) {
    // Ouvrir la page pricing
    chrome.tabs.create({ url: 'https://www.muslim-guard.com/pricing' });
  }

  // Fermer la notification
  chrome.notifications.clear(notificationId);
});

/**
 * Détecte quand l'utilisateur visite muslim-guard.com
 * et tente de lier l'extension à son compte
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Attendre que la page soit complètement chargée
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || !tab.url.includes('muslim-guard.com')) return;

  console.log('🌐 Visite de muslim-guard.com détectée');

  // Vérifier si on a déjà un token
  const { extensionToken } = await chrome.storage.local.get('extensionToken');

  if (!extensionToken) {
    console.warn('⚠️ Pas de token, enregistrement nécessaire');
    const registration = await registerExtension();

    if (!registration.success) {
      console.error('❌ Échec de l\'enregistrement');
      return;
    }
  }

  // Attendre 2 secondes pour que les cookies de session soient définis
  setTimeout(async () => {
    // Toujours vérifier si l'utilisateur est toujours connecté
    const linkResult = await linkExtensionToAccount();

    if (linkResult.success) {
      // Utilisateur connecté
      const { isAuthenticated: wasAuthenticated } = await chrome.storage.local.get('isAuthenticated');

      if (!wasAuthenticated) {
        // Nouvelle connexion
        console.log('✅ Extension liée à l\'équipe:', linkResult.message);
      } else {
        // Déjà connecté, juste faire un sync
        console.log('✅ Extension déjà liée, synchronisation du plan...');
      }

      // Synchroniser pour récupérer les nouvelles données utilisateur
      const syncResult = await syncUserSubscription();

      if (syncResult.plan === 'premium' && syncResult.changed) {
        // Passage en Premium détecté
        chrome.notifications.create('premium-activated', {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '✅ Compte Premium activé !',
          message:
            'Votre extension est maintenant liée à votre abonnement Premium. Toutes les fonctionnalités sont débloquées !'
        });

        await loadConfig();
      }
    } else {
      // Utilisateur déconnecté
      const { isAuthenticated: wasAuthenticated } = await chrome.storage.local.get('isAuthenticated');

      if (wasAuthenticated) {
        // Déconnexion détectée - vider les données utilisateur
        console.log('🚪 Déconnexion détectée, nettoyage des données utilisateur...');
        await chrome.storage.local.set({
          isAuthenticated: false,
          userEmail: null,
          storedEmail: null
        });
      } else {
        // Jamais connecté
        console.log('ℹ️ Utilisateur non connecté:', linkResult.message);
      }
    }
  }, 2000);
});
