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

    // Ouvre la page de setup
    const setupComplete = await isSetupComplete();
    if (!setupComplete) {
      chrome.tabs.create({ url: 'setup/setup.html' });
    }
  }

  // Charge la config
  await loadConfig();

  // Initialise les alarmes
  setupAlarms();
});

/**
 * Au démarrage du navigateur
 */
chrome.runtime.onStartup.addListener(async () => {
  await loadConfig();
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
  }
});

/**
 * Vérifie si c'est l'heure de prière
 */
async function checkPrayerTime() {
  try {
    await loadConfig(); // Recharge la config

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

    // Vérifie les mots-clés suspects
    const keywordCheck = containsSuspiciousKeywords(details.url, config.blockedKeywords);
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
      }
    } catch (error) {
      console.error('Erreur dans le gestionnaire de messages:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Indique qu'on va répondre de manière asynchrone
});

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
