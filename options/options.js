// options/options.js - Page de configuration complète

import { getConfig, setValue, resetConfig } from '../utils/storage.js';
import { changePin } from '../utils/auth.js';
import { getRecommendedBlockList } from '../utils/lists.js';

let config = null;

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupTabs();
  setupEventListeners();
});

// Charge la configuration
async function loadConfig() {
  try {
    config = await getConfig();
    populateFields();
  } catch (error) {
    console.error('Erreur lors du chargement de la config:', error);
    alert('Erreur lors du chargement de la configuration');
  }
}

// Remplit les champs avec les valeurs actuelles
function populateFields() {
  // Général
  document.querySelector(`input[name="protectionMode"][value="${config.protectionMode}"]`).checked = true;
  document.getElementById('blockSocialMedia').checked = config.blockSocialMedia;
  document.getElementById('blockMusicStreaming').checked = config.blockMusicStreaming;
  document.getElementById('blockVideoStreaming').checked = config.blockVideoStreaming;
  document.getElementById('blockDating').checked = config.blockDating;
  document.getElementById('blockGaming').checked = config.blockGaming;
  document.getElementById('blockAdult').checked = config.blockAdult;

  // Listes
  document.getElementById('blockedDomains').value = config.blockedDomains.join('\n');
  document.getElementById('blockedKeywords').value = config.blockedKeywords.join('\n');
  document.getElementById('whitelistedSites').value = config.whitelistedSites.join('\n');

  // Horaires
  document.getElementById('prayerPauseEnabled').checked = config.prayerPauseEnabled;
  document.getElementById('fajr').value = config.prayerTimes[0];
  document.getElementById('dhuhr').value = config.prayerTimes[1];
  document.getElementById('asr').value = config.prayerTimes[2];
  document.getElementById('maghrib').value = config.prayerTimes[3];
  document.getElementById('isha').value = config.prayerTimes[4];
  document.getElementById('scheduleEnabled').checked = config.scheduleEnabled;
  document.getElementById('allowedHoursStart').value = config.allowedHoursStart;
  document.getElementById('allowedHoursEnd').value = config.allowedHoursEnd;

  // Apparence
  document.getElementById('blockPageMessage').value = config.blockPageMessage;
  document.getElementById('recoveryEmail').value = config.recoveryEmail || '';
}

// Gestion des tabs
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Retire les classes actives
      tabBtns.forEach(b => {
        b.classList.remove('active', 'border-green-500', 'text-green-600');
        b.classList.add('border-transparent', 'text-gray-600');
      });
      tabContents.forEach(c => c.classList.remove('active'));

      // Ajoute les classes actives
      btn.classList.add('active', 'border-green-500', 'text-green-600');
      btn.classList.remove('border-transparent', 'text-gray-600');
      document.getElementById(`tab-${tabName}`).classList.add('active');
    });
  });
}

// Configuration des event listeners
function setupEventListeners() {
  // Bouton Sauvegarder
  document.getElementById('saveBtn').addEventListener('click', saveConfig);

  // Charger liste recommandée
  document.getElementById('loadRecommended').addEventListener('click', loadRecommendedList);

  // Changer PIN
  document.getElementById('changePinBtn').addEventListener('click', handleChangePin);

  // Reset
  document.getElementById('resetBtn').addEventListener('click', handleReset);
}

// Sauvegarde la configuration
async function saveConfig() {
  try {
    const newConfig = {
      // Général
      protectionMode: document.querySelector('input[name="protectionMode"]:checked').value,
      blockSocialMedia: document.getElementById('blockSocialMedia').checked,
      blockMusicStreaming: document.getElementById('blockMusicStreaming').checked,
      blockVideoStreaming: document.getElementById('blockVideoStreaming').checked,
      blockDating: document.getElementById('blockDating').checked,
      blockGaming: document.getElementById('blockGaming').checked,
      blockAdult: document.getElementById('blockAdult').checked,

      // Listes
      blockedDomains: document.getElementById('blockedDomains').value
        .split('\n')
        .map(d => d.trim())
        .filter(d => d),
      blockedKeywords: document.getElementById('blockedKeywords').value
        .split('\n')
        .map(k => k.trim())
        .filter(k => k),
      whitelistedSites: document.getElementById('whitelistedSites').value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s),

      // Horaires
      prayerPauseEnabled: document.getElementById('prayerPauseEnabled').checked,
      prayerTimes: [
        document.getElementById('fajr').value,
        document.getElementById('dhuhr').value,
        document.getElementById('asr').value,
        document.getElementById('maghrib').value,
        document.getElementById('isha').value
      ],
      scheduleEnabled: document.getElementById('scheduleEnabled').checked,
      allowedHoursStart: document.getElementById('allowedHoursStart').value,
      allowedHoursEnd: document.getElementById('allowedHoursEnd').value,

      // Apparence
      blockPageMessage: document.getElementById('blockPageMessage').value,
      recoveryEmail: document.getElementById('recoveryEmail').value
    };

    await setValue(newConfig);

    // Recharge la config dans le background
    await chrome.runtime.sendMessage({ action: 'reloadConfig' });

    // Notification de succès
    showNotification('✅ Configuration sauvegardée !', 'success');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification('❌ Erreur lors de la sauvegarde', 'error');
  }
}

// Charge la liste recommandée
function loadRecommendedList() {
  const recommended = getRecommendedBlockList();
  const current = document.getElementById('blockedDomains').value
    .split('\n')
    .map(d => d.trim())
    .filter(d => d);

  // Combine les listes sans doublons
  const combined = [...new Set([...current, ...recommended])];

  document.getElementById('blockedDomains').value = combined.join('\n');

  showNotification(`✅ ${recommended.length} sites ajoutés !`, 'success');
}

// Change le PIN
async function handleChangePin() {
  const oldPin = document.getElementById('oldPin').value;
  const newPin = document.getElementById('newPin').value;
  const confirmPin = document.getElementById('confirmPin').value;

  if (!oldPin || !newPin || !confirmPin) {
    showNotification('❌ Veuillez remplir tous les champs', 'error');
    return;
  }

  if (newPin !== confirmPin) {
    showNotification('❌ Les nouveaux PINs ne correspondent pas', 'error');
    return;
  }

  if (newPin.length < 4 || newPin.length > 6) {
    showNotification('❌ Le PIN doit contenir 4 à 6 chiffres', 'error');
    return;
  }

  const result = await changePin(oldPin, newPin);

  if (result.success) {
    showNotification('✅ PIN changé avec succès !', 'success');
    document.getElementById('oldPin').value = '';
    document.getElementById('newPin').value = '';
    document.getElementById('confirmPin').value = '';
  } else {
    showNotification(`❌ ${result.error}`, 'error');
  }
}

// Reset la configuration
async function handleReset() {
  const confirm = window.confirm(
    '⚠️ ATTENTION ⚠️\n\n' +
    'Ceci va réinitialiser TOUTE la configuration, y compris :\n' +
    '- Les listes de blocage\n' +
    '- Les horaires\n' +
    '- Les paramètres\n\n' +
    'Le PIN sera conservé.\n\n' +
    'Êtes-vous sûr ?'
  );

  if (!confirm) return;

  try {
    // Sauvegarde le PIN actuel
    const currentPin = config.parentPinHash;
    const currentSalt = config.parentPinSalt;

    await resetConfig();

    // Restaure le PIN
    await setValue({
      parentPinHash: currentPin,
      parentPinSalt: currentSalt,
      isSetupComplete: true
    });

    showNotification('✅ Configuration réinitialisée !', 'success');

    // Recharge la page après 2 secondes
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error('Erreur lors du reset:', error);
    showNotification('❌ Erreur lors de la réinitialisation', 'error');
  }
}

// Affiche une notification
function showNotification(message, type = 'info') {
  // Crée l'élément de notification
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500'
  }`;
  notif.textContent = message;
  notif.style.animation = 'slideIn 0.3s ease-out';

  document.body.appendChild(notif);

  // Retire après 3 secondes
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Ajoute les animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

console.log('Options page chargée');
