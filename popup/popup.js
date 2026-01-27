// popup/popup.js - Script du popup de l'extension

import { getConfig, getValue, setValue } from '../utils/storage.js';
import { verifyPin, isSetupComplete } from '../utils/auth.js';
import { getTodayStats, calculateStreak, getAchievements } from '../utils/analytics.js';
import { getExtensionStatus } from '../utils/extensionAuth.js';

let config = null;
let pendingAction = null;

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifie si le setup est complet
  const setupComplete = await isSetupComplete();
  if (!setupComplete) {
    // Redirige vers le setup
    chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
    window.close();
    return;
  }

  await loadData();
  setupEventListeners();
  updateNextPrayer();
  await loadPlanBanner(); // Charge le bandeau du plan
  await checkLoginStatus(); // Vérifie si l'utilisateur doit se connecter

  // Met à jour la prochaine prière toutes les minutes
  setInterval(updateNextPrayer, 60000);
});

// Charge les données
async function loadData() {
  try {
    config = await getConfig();

    // Met à jour le statut
    updateStatus();

    // Charge les stats
    await loadStats();

    // Charge les achievements
    await loadAchievements();
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
}

// Met à jour le statut de la protection
function updateStatus() {
  const toggle = document.getElementById('protectionToggle');
  const badge = document.getElementById('statusBadge');
  const text = document.getElementById('statusText');

  toggle.checked = config.protectionEnabled;

  if (config.protectionEnabled) {
    badge.textContent = 'Actif';
    badge.style.background = '#d1fae5';
    badge.style.color = '#065f46';
    text.textContent = `Mode ${config.protectionMode}`;
  } else {
    badge.textContent = 'Inactif';
    badge.style.background = '#fee2e2';
    badge.style.color = '#991b1b';
    text.textContent = 'Protection désactivée';
  }
}

// Charge les statistiques
async function loadStats() {
  try {
    const stats = await getTodayStats();
    const streak = await calculateStreak();

    document.getElementById('blockedCount').textContent = stats.blockedCount || 0;
    document.getElementById('streakDays').textContent = streak || 0;
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
  }
}

// Charge les achievements
async function loadAchievements() {
  try {
    const achievements = await getAchievements();

    if (achievements.length > 0) {
      const latest = achievements[0];
      const card = document.getElementById('achievementCard');
      const icon = document.getElementById('achievementIcon');
      const name = document.getElementById('achievementName');

      icon.textContent = latest.icon;
      name.textContent = latest.name;
      card.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des achievements:', error);
  }
}

// Met à jour la prochaine prière
function updateNextPrayer() {
  try {
    if (!config || !config.prayerTimes) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: config.prayerTimes[0] },
      { name: 'Dhuhr', time: config.prayerTimes[1] },
      { name: 'Asr', time: config.prayerTimes[2] },
      { name: 'Maghrib', time: config.prayerTimes[3] },
      { name: 'Isha', time: config.prayerTimes[4] }
    ];

    // Trouve la prochaine prière
    let nextPrayer = null;
    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentMinutes) {
        nextPrayer = { ...prayer, minutes: prayerMinutes };
        break;
      }
    }

    // Si aucune prière aujourd'hui, prend Fajr demain
    if (!nextPrayer) {
      nextPrayer = { ...prayers[0], minutes: 0 };
    }

    // Affiche la prochaine prière
    document.getElementById('prayerName').textContent = nextPrayer.name;
    document.getElementById('prayerTime').textContent = nextPrayer.time;

    // Calcule le countdown
    let diff = nextPrayer.minutes - currentMinutes;
    if (diff < 0) diff += 1440; // Ajoute 24h si c'est demain

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    const countdown = hours > 0 ? `Dans ${hours}h ${mins}min` : `Dans ${mins}min`;
    document.getElementById('prayerCountdown').textContent = countdown;
  } catch (error) {
    console.error('Erreur lors du calcul de la prochaine prière:', error);
  }
}

// Configuration des event listeners
function setupEventListeners() {
  // Toggle protection
  document.getElementById('protectionToggle').addEventListener('change', async (e) => {
    if (!e.target.checked) {
      // Désactivation = demande PIN
      pendingAction = 'toggleProtection';
      showPinModal();
      e.target.checked = true; // Reste coché le temps de la validation
    } else {
      // Réactivation
      await toggleProtection(true);
    }
  });

  // Bouton Dashboard
  document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  // Bouton Options
  document.getElementById('optionsBtn').addEventListener('click', async () => {
    // Vérifie si le PIN existe
    const hasPin = await getValue('parentPinHash');
    if (!hasPin) {
      // Pas de PIN, redirige vers le setup
      alert('Configuration incomplète. Veuillez compléter le setup initial.');
      chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
      return;
    }

    pendingAction = 'openOptions';
    showPinModal();
  });

  // Modal PIN
  document.getElementById('pinCancel').addEventListener('click', hidePinModal);
  document.getElementById('pinSubmit').addEventListener('click', submitPin);

  // Entrée dans le champ PIN
  document.getElementById('pinInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitPin();
    }
  });
}

// Affiche le modal PIN
function showPinModal() {
  const modal = document.getElementById('pinModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').classList.add('hidden');
  document.getElementById('pinInput').focus();
}

// Cache le modal PIN
function hidePinModal() {
  const modal = document.getElementById('pinModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');

  // Remet le toggle à sa position originale si l'action était de désactiver
  if (pendingAction === 'toggleProtection') {
    document.getElementById('protectionToggle').checked = true;
  }

  pendingAction = null;
}

// Soumet le PIN
async function submitPin() {
  const pin = document.getElementById('pinInput').value;
  const errorDiv = document.getElementById('pinError');


  if (!pin) {
    errorDiv.textContent = 'Entrez le code PIN';
    errorDiv.classList.remove('hidden');
    return;
  }

  try {
    // Vérifie le PIN
    const isValid = await verifyPin(pin);

    if (!isValid) {
      errorDiv.textContent = 'Code PIN incorrect';
      errorDiv.classList.remove('hidden');
      return;
    }

    // Sauvegarde l'action avant de cacher le modal
    const action = pendingAction;

    // Cache le modal
    hidePinModal();

    if (action === 'toggleProtection') {
      await toggleProtection(false);
    } else if (action === 'openOptions') {
      // Ouvre les options dans un nouvel onglet
      const url = chrome.runtime.getURL('options/options.html');

      try {
        const tab = await chrome.tabs.create({ url });

        // Ferme le popup après un court délai
        setTimeout(() => {
          window.close();
        }, 100);
      } catch (tabError) {
        alert('Erreur lors de l\'ouverture des paramètres: ' + tabError.message);
      }
    }
  } catch (error) {
    errorDiv.textContent = 'Erreur : ' + error.message;
    errorDiv.classList.remove('hidden');
  }
}

// Toggle la protection
async function toggleProtection(enabled) {
  try {
    await setValue('protectionEnabled', enabled);
    config.protectionEnabled = enabled;

    // IMPORTANT : Attendre un peu pour s'assurer que le storage est bien écrit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Recharge la config dans le background
    await chrome.runtime.sendMessage({ action: 'reloadConfig' });

    // Met à jour l'UI
    updateStatus();

    // Notification
    if (enabled) {
      showNotification('Protection activée');
    } else {
      showNotification('Protection désactivée');
    }
  } catch (error) {
    console.error('Erreur lors du toggle:', error);
  }
}

// Affiche une notification temporaire
function showNotification(message) {
  // Note: Dans un popup, on peut juste logger ou utiliser une alerte discrète
}

/**
 * Charge et affiche le bandeau de plan
 */
async function loadPlanBanner() {
  try {
    const userPlan = await getValue('userPlan') || 'free';
    const trialEndDate = await getValue('trialEndDate');

    const banner = document.getElementById('planBanner');
    const icon = document.getElementById('planIcon');
    const title = document.getElementById('planTitle');
    const subtitle = document.getElementById('planSubtitle');
    const upgradeBtn = document.getElementById('upgradePlanBtn');

    // Masquer le bandeau pour les utilisateurs Premium
    if (userPlan === 'premium') {
      banner.classList.add('hidden');
      return;
    }

    // Afficher le bandeau pour Free et Trial
    banner.classList.remove('hidden');

    if (userPlan === 'trial') {
      // Mode Essai
      const now = Date.now();
      const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      banner.className = 'trial';
      icon.textContent = '🎉';
      title.textContent = `Essai Premium`;
      subtitle.textContent = `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`;
      upgradeBtn.textContent = '✨ S\'abonner';
    } else {
      // Mode Gratuit
      banner.className = '';
      icon.textContent = '🔓';
      title.textContent = 'Version Gratuite';
      subtitle.textContent = 'Quotas limités';
      upgradeBtn.textContent = '✨ Upgrade';
    }

    // Event listener pour le bouton upgrade
    upgradeBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.muslim-guard.com/pricing' });
    });
  } catch (error) {
    console.error('Erreur lors du chargement du bandeau de plan:', error);
  }
}

/**
 * Vérifie si l'utilisateur doit se connecter et affiche le prompt
 */
async function checkLoginStatus() {
  try {
    const extensionStatus = await getExtensionStatus();
    const userPlan = await getValue('userPlan') || 'free';
    const loginPrompt = document.getElementById('loginPrompt');
    const loginButton = document.getElementById('loginButton');

    // Afficher le bouton de connexion uniquement si:
    // 1. L'extension est enregistrée (a un token)
    // 2. Mais n'est PAS liée à un compte utilisateur
    // 3. Et le plan est Free (potentiellement premium non réclamé)
    if (extensionStatus.registered && !extensionStatus.linked && userPlan === 'free') {
      loginPrompt.classList.remove('hidden');

      // Event listener pour le bouton de connexion
      loginButton.addEventListener('click', () => {
        chrome.tabs.create({
          url: 'https://www.muslim-guard.com/login?redirect=/dashboard'
        });
        window.close();
      });
    } else {
      loginPrompt.classList.add('hidden');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de connexion:', error);
  }
}
