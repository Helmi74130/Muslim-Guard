// options/options.js - Page de configuration complète

import { getConfig, setValue, resetConfig } from '../utils/storage.js';
import { changePin, verifyPin, generateSessionToken, verifySessionToken } from '../utils/auth.js';
import { getRecommendedBlockList } from '../utils/lists.js';

let config = null;
let isAuthenticated = false;

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  setupPinProtection();
});

// Vérifie si l'utilisateur a une session valide
async function checkAuthentication() {
  try {
    // Vérifie si un token de session existe et est valide
    const sessionToken = localStorage.getItem('optionsSessionToken');

    if (sessionToken) {
      const isValid = await verifySessionToken(sessionToken);

      if (isValid) {
        isAuthenticated = true;
        await unlockPage();
        return;
      }
    }

    // Pas de session valide, afficher l'overlay de PIN
    isAuthenticated = false;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    isAuthenticated = false;
  }
}

// Configure la protection par PIN
function setupPinProtection() {
  const pinInput = document.getElementById('pinInput');
  const submitBtn = document.getElementById('submitPinBtn');
  const pinError = document.getElementById('pinError');

  console.log('setupPinProtection - Elements trouvés:', {
    pinInput: !!pinInput,
    submitBtn: !!submitBtn,
    pinError: !!pinError
  });

  if (!pinInput || !submitBtn || !pinError) {
    console.error('Éléments PIN non trouvés !');
    return;
  }

  // Soumission par bouton
  submitBtn.addEventListener('click', () => {
    console.log('Bouton cliqué !');
    handlePinSubmit();
  });

  // Soumission par touche Entrée
  pinInput.addEventListener('keypress', (e) => {
    console.log('Touche pressée:', e.key);
    if (e.key === 'Enter') {
      handlePinSubmit();
    }
  });

  // Retire l'erreur quand l'utilisateur tape
  pinInput.addEventListener('input', () => {
    pinInput.classList.remove('error');
    pinError.textContent = '';
  });

  // Focus automatique sur le champ PIN
  if (!isAuthenticated) {
    setTimeout(() => {
      pinInput.focus();
    }, 100);
  }
}

// Gère la soumission du PIN
async function handlePinSubmit() {
  console.log('handlePinSubmit appelée');

  const pinInput = document.getElementById('pinInput');
  const submitBtn = document.getElementById('submitPinBtn');
  const pinError = document.getElementById('pinError');
  const pin = pinInput.value.trim();

  console.log('PIN saisi:', pin ? '****' : '(vide)', 'Longueur:', pin.length);

  // Validation basique
  if (!pin) {
    console.log('PIN vide');
    showPinError('Veuillez entrer votre code PIN');
    return;
  }

  if (pin.length < 4 || pin.length > 6) {
    console.log('PIN longueur invalide');
    showPinError('Le PIN doit contenir 4 à 6 chiffres');
    return;
  }

  // Désactive le bouton pendant la vérification
  submitBtn.disabled = true;
  submitBtn.textContent = 'Vérification...';

  try {
    console.log('Appel de verifyPin...');
    // Vérifie le PIN
    const isValid = await verifyPin(pin);
    console.log('Résultat verifyPin:', isValid);

    if (isValid) {
      console.log('PIN valide ! Génération du token...');
      // PIN correct - Génère un token de session
      const token = await generateSessionToken();
      console.log('Token généré:', token ? 'OK' : 'ERREUR');

      if (token) {
        localStorage.setItem('optionsSessionToken', token);
      }

      isAuthenticated = true;
      console.log('Déverrouillage de la page...');
      await unlockPage();
    } else {
      // PIN incorrect
      console.log('PIN incorrect');
      showPinError('❌ Code PIN incorrect');
      pinInput.value = '';
      pinInput.focus();
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du PIN:', error);
    showPinError('❌ Erreur lors de la vérification');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Déverrouiller';
  }
}

// Affiche une erreur de PIN
function showPinError(message) {
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');

  pinInput.classList.add('error');
  pinError.textContent = message;
}

// Déverrouille la page
async function unlockPage() {
  const overlay = document.getElementById('pinOverlay');
  const container = document.querySelector('.options-container');

  // Animation de déverrouillage
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease-out';

  setTimeout(() => {
    overlay.classList.add('hidden');
    container.classList.add('unlocked');
  }, 300);

  // Charge la configuration et initialise la page
  await loadConfig();
  setupTabs();
  setupEventListeners();
}

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
  document.getElementById('contentDetectionKeywords').value = (config.contentDetectionKeywords || []).join('\n');
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

  // Charger liste recommandée de domaines
  document.getElementById('loadRecommended').addEventListener('click', loadRecommendedList);

  // Charger liste recommandée de mots-clés (URLs)
  document.getElementById('loadRecommendedKeywords').addEventListener('click', loadRecommendedKeywords);

  // Charger liste recommandée de mots-clés (Détection de contenu)
  document.getElementById('loadRecommendedContentKeywords').addEventListener('click', loadRecommendedContentKeywords);

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
      contentDetectionKeywords: document.getElementById('contentDetectionKeywords').value
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

// Charge la liste recommandée de domaines
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

// Charge la liste recommandée de mots-clés (URLs)
async function loadRecommendedKeywords() {
  try {
    // Charge la liste par défaut depuis storage.js
    const { DEFAULT_CONFIG } = await import('../utils/storage.js');
    const recommended = DEFAULT_CONFIG.blockedKeywords || [];

    const current = document.getElementById('blockedKeywords').value
      .split('\n')
      .map(k => k.trim())
      .filter(k => k);

    // Combine les listes sans doublons (insensible à la casse)
    const currentLower = current.map(k => k.toLowerCase());
    const newKeywords = recommended.filter(k => !currentLower.includes(k.toLowerCase()));
    const combined = [...current, ...newKeywords];

    document.getElementById('blockedKeywords').value = combined.join('\n');

    showNotification(`✅ ${newKeywords.length} nouveaux mots-clés ajoutés ! (Total: ${combined.length})`, 'success');
  } catch (error) {
    console.error('Erreur lors du chargement des mots-clés recommandés:', error);
    showNotification('❌ Erreur lors du chargement', 'error');
  }
}

// Charge la liste recommandée de mots-clés (Détection de contenu)
async function loadRecommendedContentKeywords() {
  try {
    // Charge la liste par défaut depuis storage.js
    const { DEFAULT_CONFIG } = await import('../utils/storage.js');
    const recommended = DEFAULT_CONFIG.contentDetectionKeywords || [];

    const current = document.getElementById('contentDetectionKeywords').value
      .split('\n')
      .map(k => k.trim())
      .filter(k => k);

    // Combine les listes sans doublons (insensible à la casse)
    const currentLower = current.map(k => k.toLowerCase());
    const newKeywords = recommended.filter(k => !currentLower.includes(k.toLowerCase()));
    const combined = [...current, ...newKeywords];

    document.getElementById('contentDetectionKeywords').value = combined.join('\n');

    showNotification(`✅ ${newKeywords.length} nouveaux mots-clés ajoutés ! (Total: ${combined.length})`, 'success');
  } catch (error) {
    console.error('Erreur lors du chargement des mots-clés de contenu:', error);
    showNotification('❌ Erreur lors du chargement', 'error');
  }
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
  notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 ${type === 'success' ? 'bg-green-500' :
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
