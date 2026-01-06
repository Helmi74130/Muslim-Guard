// options/options.js - Page de configuration complète

import { getConfig, setValue, resetConfig } from '../utils/storage.js';
import { changePin, verifyPin, generateSessionToken, verifySessionToken } from '../utils/auth.js';
import { getRecommendedBlockList } from '../utils/lists.js';
import { initializePrayerTimes } from '../utils/prayerApi.js';

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

  if (!pinInput || !submitBtn || !pinError) {
    console.error('Éléments PIN non trouvés !');
    return;
  }

  // Soumission par bouton
  submitBtn.addEventListener('click', () => {
    handlePinSubmit();
  });

  // Soumission par touche Entrée
  pinInput.addEventListener('keypress', (e) => {
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
  const pinInput = document.getElementById('pinInput');
  const submitBtn = document.getElementById('submitPinBtn');
  const pinError = document.getElementById('pinError');
  const pin = pinInput.value.trim();

  // Validation basique
  if (!pin) {
    showPinError('Veuillez entrer votre code PIN');
    return;
  }

  if (pin.length < 4 || pin.length > 6) {
    showPinError('Le PIN doit contenir 4 à 6 chiffres');
    return;
  }

  // Désactive le bouton pendant la vérification
  submitBtn.disabled = true;
  submitBtn.textContent = 'Vérification...';

  try {
    // Vérifie le PIN
    const isValid = await verifyPin(pin);

    if (isValid) {
      // PIN correct - Génère un token de session
      const token = await generateSessionToken();

      if (token) {
        localStorage.setItem('optionsSessionToken', token);
      }

      isAuthenticated = true;
      await unlockPage();
    } else {
      // PIN incorrect
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

  if (pinInput) pinInput.classList.add('error');
  if (pinError) pinError.textContent = message;
}

// Déverrouille la page
async function unlockPage() {
  const overlay = document.getElementById('pinOverlay');
  const container = document.querySelector('.options-container');

  if (!overlay || !container) {
    console.error('Elements for unlocking not found');
    return;
  }

  // Animation de déverrouillage
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease-out';

  setTimeout(() => {
    if (overlay) overlay.classList.add('hidden');
    if (container) container.classList.add('unlocked');
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
  if (!config) {
    console.warn('Config is null, skipping populateFields');
    return;
  }

  // Général
  const protectionModeInput = document.querySelector(`input[name="protectionMode"][value="${config.protectionMode}"]`);
  if (protectionModeInput) protectionModeInput.checked = true;

  const blockSocialMedia = document.getElementById('blockSocialMedia');
  if (blockSocialMedia) blockSocialMedia.checked = config.blockSocialMedia;

  const blockMusicStreaming = document.getElementById('blockMusicStreaming');
  if (blockMusicStreaming) blockMusicStreaming.checked = config.blockMusicStreaming;

  const blockVideoStreaming = document.getElementById('blockVideoStreaming');
  if (blockVideoStreaming) blockVideoStreaming.checked = config.blockVideoStreaming;

  const blockDating = document.getElementById('blockDating');
  if (blockDating) blockDating.checked = config.blockDating;

  const blockGaming = document.getElementById('blockGaming');
  if (blockGaming) blockGaming.checked = config.blockGaming;

  const blockAdult = document.getElementById('blockAdult');
  if (blockAdult) blockAdult.checked = config.blockAdult;

  // Listes
  const blockedDomains = document.getElementById('blockedDomains');
  if (blockedDomains) blockedDomains.value = config.blockedDomains.join('\n');

  const blockedKeywords = document.getElementById('blockedKeywords');
  if (blockedKeywords) blockedKeywords.value = config.blockedKeywords.join('\n');

  const contentDetectionKeywords = document.getElementById('contentDetectionKeywords');
  if (contentDetectionKeywords) contentDetectionKeywords.value = (config.contentDetectionKeywords || []).join('\n');

  const whitelistedSites = document.getElementById('whitelistedSites');
  if (whitelistedSites) whitelistedSites.value = config.whitelistedSites.join('\n');

  // Horaires
  const prayerPauseEnabled = document.getElementById('prayerPauseEnabled');
  if (prayerPauseEnabled) prayerPauseEnabled.checked = config.prayerPauseEnabled;

  // Mode de configuration des horaires de prière
  const isAutoMode = config.prayerTimesAutoUpdate;
  const prayerAutoOptions = document.getElementById('prayer-auto-options');
  if (prayerAutoOptions) prayerAutoOptions.checked = isAutoMode;

  const prayerManualOptions = document.getElementById('prayer-manual-options');
  if (prayerManualOptions) prayerManualOptions.checked = !isAutoMode;

  const autoModeOptions = document.getElementById('autoModeOptions');
  if (autoModeOptions) autoModeOptions.style.display = isAutoMode ? 'block' : 'none';

  const manualModeOptions = document.getElementById('manualModeOptions');
  if (manualModeOptions) manualModeOptions.style.display = isAutoMode ? 'none' : 'block';

  if (isAutoMode) {
    // Mode automatique
    const prayerCityOptions = document.getElementById('prayerCityOptions');
    if (prayerCityOptions) prayerCityOptions.value = config.prayerCity || '';

    const prayerMethodOptions = document.getElementById('prayerMethodOptions');
    if (prayerMethodOptions) prayerMethodOptions.value = config.prayerCalculationMethod || 3;

    // Afficher les horaires actuels et la date de dernière mise à jour
    if (config.prayerTimes && config.prayerTimes.length === 5) {
      const previewDiv = document.getElementById('prayerPreviewOptions');
      const contentDiv = document.getElementById('prayerPreviewContentOptions');
      const lastUpdateSpan = document.getElementById('lastUpdateTime');

      if (contentDiv) {
        contentDiv.innerHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Prière</th>
                <th style="padding: 10px; text-align: right; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Horaire</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Fajr</td>
                <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${config.prayerTimes[0]}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Dhuhr</td>
                <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${config.prayerTimes[1]}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Asr</td>
                <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${config.prayerTimes[2]}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Maghrib</td>
                <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${config.prayerTimes[3]}</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Isha</td>
                <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${config.prayerTimes[4]}</td>
              </tr>
            </tbody>
          </table>
        `;
      }

      if (lastUpdateSpan && config.prayerTimesLastUpdate) {
        const lastUpdate = new Date(config.prayerTimesLastUpdate);
        lastUpdateSpan.textContent = lastUpdate.toLocaleString('fr-FR');
      }

      if (previewDiv) previewDiv.style.display = 'block';
    }
  }

  // Mode manuel - toujours remplir les champs pour la compatibilité
  if (config.prayerTimes && config.prayerTimes.length === 5) {
    const fajr = document.getElementById('fajr');
    if (fajr) fajr.value = config.prayerTimes[0];

    const dhuhr = document.getElementById('dhuhr');
    if (dhuhr) dhuhr.value = config.prayerTimes[1];

    const asr = document.getElementById('asr');
    if (asr) asr.value = config.prayerTimes[2];

    const maghrib = document.getElementById('maghrib');
    if (maghrib) maghrib.value = config.prayerTimes[3];

    const isha = document.getElementById('isha');
    if (isha) isha.value = config.prayerTimes[4];
  }

  const scheduleEnabled = document.getElementById('scheduleEnabled');
  if (scheduleEnabled) scheduleEnabled.checked = config.scheduleEnabled;

  const allowedHoursStart = document.getElementById('allowedHoursStart');
  if (allowedHoursStart) allowedHoursStart.value = config.allowedHoursStart;

  const allowedHoursEnd = document.getElementById('allowedHoursEnd');
  if (allowedHoursEnd) allowedHoursEnd.value = config.allowedHoursEnd;

  // Apparence
  const blockPageMessage = document.getElementById('blockPageMessage');
  if (blockPageMessage) blockPageMessage.value = config.blockPageMessage;
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

      const targetTab = document.getElementById(`tab-${tabName}`);
      if (targetTab) targetTab.classList.add('active');
    });
  });
}

// Configuration des event listeners
function setupEventListeners() {
  // Bouton Sauvegarder
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveConfig);

  // Charger liste recommandée de domaines
  const loadRecommended = document.getElementById('loadRecommended');
  if (loadRecommended) loadRecommended.addEventListener('click', loadRecommendedList);

  // Charger liste recommandée de mots-clés (URLs)
  const loadRecommendedKeywordsBtn = document.getElementById('loadRecommendedKeywords');
  if (loadRecommendedKeywordsBtn) loadRecommendedKeywordsBtn.addEventListener('click', loadRecommendedKeywords);

  // Charger liste recommandée de mots-clés (Détection de contenu)
  const loadRecommendedContentKeywordsBtn = document.getElementById('loadRecommendedContentKeywords');
  if (loadRecommendedContentKeywordsBtn) loadRecommendedContentKeywordsBtn.addEventListener('click', loadRecommendedContentKeywords);

  // Changer PIN
  const changePinBtn = document.getElementById('changePinBtn');
  if (changePinBtn) changePinBtn.addEventListener('click', handleChangePin);

  // Reset
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', handleReset);

  // Lien vers le Dashboard
  document.getElementById('dashboardLink')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  // Toggle entre mode automatique et manuel des horaires de prière
  document.querySelectorAll('input[name="prayerModeOptions"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const autoInputs = document.getElementById('autoModeOptions');
      const manualInputs = document.getElementById('manualModeOptions');

      if (autoInputs && manualInputs) {
        if (e.target.value === 'auto') {
          autoInputs.style.display = 'block';
          manualInputs.style.display = 'none';
        } else {
          autoInputs.style.display = 'none';
          manualInputs.style.display = 'block';
        }
      }
    });
  });

  // Bouton de récupération des horaires
  document.getElementById('fetchPrayerTimesOptions')?.addEventListener('click', fetchPrayerTimesOptions);

  // Permettre de récupérer les horaires en appuyant sur Entrée dans le champ ville
  document.getElementById('prayerCityOptions')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchPrayerTimesOptions();
    }
  });
}

// Sauvegarde la configuration
async function saveConfig() {
  try {
    // Vérification des éléments critiques
    const protectionModeInput = document.querySelector('input[name="protectionMode"]:checked');
    const blockSocialMedia = document.getElementById('blockSocialMedia');
    const blockMusicStreaming = document.getElementById('blockMusicStreaming');
    const blockVideoStreaming = document.getElementById('blockVideoStreaming');
    const blockDating = document.getElementById('blockDating');
    const blockGaming = document.getElementById('blockGaming');
    const blockAdult = document.getElementById('blockAdult');
    const blockedDomains = document.getElementById('blockedDomains');
    const blockedKeywords = document.getElementById('blockedKeywords');
    const contentDetectionKeywords = document.getElementById('contentDetectionKeywords');
    const whitelistedSites = document.getElementById('whitelistedSites');
    const prayerPauseEnabled = document.getElementById('prayerPauseEnabled');
    const scheduleEnabled = document.getElementById('scheduleEnabled');
    const allowedHoursStart = document.getElementById('allowedHoursStart');
    const allowedHoursEnd = document.getElementById('allowedHoursEnd');
    const blockPageMessage = document.getElementById('blockPageMessage');

    if (!protectionModeInput || !blockSocialMedia || !blockedDomains) {
      console.error('Critical form elements not found');
      showNotification('Erreur: Éléments du formulaire non trouvés', 'error');
      return;
    }

    const newConfig = {
      // Général
      protectionMode: protectionModeInput.value,
      blockSocialMedia: blockSocialMedia.checked,
      blockMusicStreaming: blockMusicStreaming?.checked || false,
      blockVideoStreaming: blockVideoStreaming?.checked || false,
      blockDating: blockDating?.checked || false,
      blockGaming: blockGaming?.checked || false,
      blockAdult: blockAdult?.checked || false,

      // Listes
      blockedDomains: blockedDomains.value
        .split('\n')
        .map(d => d.trim())
        .filter(d => d),
      blockedKeywords: (blockedKeywords?.value || '')
        .split('\n')
        .map(k => k.trim())
        .filter(k => k),
      contentDetectionKeywords: (contentDetectionKeywords?.value || '')
        .split('\n')
        .map(k => k.trim())
        .filter(k => k),
      whitelistedSites: (whitelistedSites?.value || '')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s),

      // Horaires de prière - gestion selon le mode
      prayerPauseEnabled: prayerPauseEnabled?.checked || false,
    };

    // Gestion des horaires de prière selon le mode
    const prayerMode = document.querySelector('input[name="prayerModeOptions"]:checked')?.value;

    if (prayerMode === 'manual') {
      const fajr = document.getElementById('fajr');
      const dhuhr = document.getElementById('dhuhr');
      const asr = document.getElementById('asr');
      const maghrib = document.getElementById('maghrib');
      const isha = document.getElementById('isha');

      // Mode manuel - sauvegarde les horaires saisis
      newConfig.prayerTimes = [
        fajr?.value || '00:00',
        dhuhr?.value || '00:00',
        asr?.value || '00:00',
        maghrib?.value || '00:00',
        isha?.value || '00:00'
      ];
      newConfig.prayerTimesAutoUpdate = false;
      newConfig.prayerCity = null;
    }
    // Si mode auto, on ne touche pas aux horaires (déjà sauvegardés par l'API)

    // Autres horaires
    newConfig.scheduleEnabled = scheduleEnabled?.checked || false;
    newConfig.allowedHoursStart = allowedHoursStart?.value || '00:00';
    newConfig.allowedHoursEnd = allowedHoursEnd?.value || '23:59';

    // Apparence
    newConfig.blockPageMessage = blockPageMessage?.value || 'Ce site est bloqué';

    await setValue(newConfig);

    // Recharge la config dans le background
    await chrome.runtime.sendMessage({ action: 'reloadConfig' });

    // Notification de succès
    showNotification('Configuration sauvegardée avec succès', 'success');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    showNotification('Erreur lors de la sauvegarde', 'error');
  }
}

// Charge la liste recommandée de domaines
function loadRecommendedList() {
  const blockedDomainsEl = document.getElementById('blockedDomains');
  if (!blockedDomainsEl) {
    console.error('blockedDomains element not found');
    showNotification('Erreur: Élément non trouvé', 'error');
    return;
  }

  const recommended = getRecommendedBlockList();
  const current = blockedDomainsEl.value
    .split('\n')
    .map(d => d.trim())
    .filter(d => d);

  // Combine les listes sans doublons
  const combined = [...new Set([...current, ...recommended])];

  blockedDomainsEl.value = combined.join('\n');

  showNotification(`${recommended.length} sites ajoutés à la liste`, 'success');
}

// Charge la liste recommandée de mots-clés (URLs)
async function loadRecommendedKeywords() {
  try {
    const blockedKeywordsEl = document.getElementById('blockedKeywords');
    if (!blockedKeywordsEl) {
      console.error('blockedKeywords element not found');
      showNotification('Erreur: Élément non trouvé', 'error');
      return;
    }

    // Charge la liste par défaut depuis storage.js
    const { DEFAULT_CONFIG } = await import('../utils/storage.js');
    const recommended = DEFAULT_CONFIG.blockedKeywords || [];

    const current = blockedKeywordsEl.value
      .split('\n')
      .map(k => k.trim())
      .filter(k => k);

    // Combine les listes sans doublons (insensible à la casse)
    const currentLower = current.map(k => k.toLowerCase());
    const newKeywords = recommended.filter(k => !currentLower.includes(k.toLowerCase()));
    const combined = [...current, ...newKeywords];

    blockedKeywordsEl.value = combined.join('\n');

    showNotification(`${newKeywords.length} nouveaux mots-clés ajoutés (Total: ${combined.length})`, 'success');
  } catch (error) {
    console.error('Erreur lors du chargement des mots-clés recommandés:', error);
    showNotification('Erreur lors du chargement', 'error');
  }
}

// Charge la liste recommandée de mots-clés (Détection de contenu)
async function loadRecommendedContentKeywords() {
  try {
    const contentDetectionKeywordsEl = document.getElementById('contentDetectionKeywords');
    if (!contentDetectionKeywordsEl) {
      console.error('contentDetectionKeywords element not found');
      showNotification('Erreur: Élément non trouvé', 'error');
      return;
    }

    // Charge la liste par défaut depuis storage.js
    const { DEFAULT_CONFIG } = await import('../utils/storage.js');
    const recommended = DEFAULT_CONFIG.contentDetectionKeywords || [];

    const current = contentDetectionKeywordsEl.value
      .split('\n')
      .map(k => k.trim())
      .filter(k => k);

    // Combine les listes sans doublons (insensible à la casse)
    const currentLower = current.map(k => k.toLowerCase());
    const newKeywords = recommended.filter(k => !currentLower.includes(k.toLowerCase()));
    const combined = [...current, ...newKeywords];

    contentDetectionKeywordsEl.value = combined.join('\n');

    showNotification(`${newKeywords.length} nouveaux mots-clés ajoutés (Total: ${combined.length})`, 'success');
  } catch (error) {
    console.error('Erreur lors du chargement des mots-clés de contenu:', error);
    showNotification('Erreur lors du chargement', 'error');
  }
}

// Change le PIN
async function handleChangePin() {
  const oldPinEl = document.getElementById('oldPin');
  const newPinEl = document.getElementById('newPin');
  const confirmPinEl = document.getElementById('confirmPin');

  if (!oldPinEl || !newPinEl || !confirmPinEl) {
    console.error('PIN input elements not found');
    showNotification('Erreur: Éléments non trouvés', 'error');
    return;
  }

  const oldPin = oldPinEl.value;
  const newPin = newPinEl.value;
  const confirmPin = confirmPinEl.value;

  if (!oldPin || !newPin || !confirmPin) {
    showNotification('Veuillez remplir tous les champs', 'error');
    return;
  }

  if (newPin !== confirmPin) {
    showNotification('Les nouveaux PINs ne correspondent pas', 'error');
    return;
  }

  if (newPin.length < 4 || newPin.length > 6) {
    showNotification('Le PIN doit contenir 4 à 6 chiffres', 'error');
    return;
  }

  const result = await changePin(oldPin, newPin);

  if (result.success) {
    showNotification('PIN changé avec succès', 'success');
    oldPinEl.value = '';
    newPinEl.value = '';
    confirmPinEl.value = '';
  } else {
    showNotification(result.error, 'error');
  }
}

// Reset la configuration
async function handleReset() {
  const confirm = window.confirm(
    'ATTENTION\n\n' +
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

    showNotification('Configuration réinitialisée avec succès', 'success');

    // Recharge la page après 2 secondes
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error('Erreur lors du reset:', error);
    showNotification('Erreur lors de la réinitialisation', 'error');
  }
}

// Affiche une notification
function showNotification(message, type = 'info') {
  // Conteneur pour les notifications (créé une seule fois)
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Crée l'élément de notification
  const notif = document.createElement('div');
  notif.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    min-width: 320px;
    max-width: 420px;
    pointer-events: auto;
    backdrop-filter: blur(10px);
    animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform-origin: right center;
  `;

  // Icône et couleur selon le type
  let icon, bgColor, borderColor;
  switch(type) {
    case 'success':
      icon = '✓';
      bgColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      borderColor = '#059669';
      break;
    case 'error':
      icon = '✕';
      bgColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      borderColor = '#dc2626';
      break;
    default:
      icon = 'ℹ';
      bgColor = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      borderColor = '#2563eb';
  }

  notif.style.background = bgColor;
  notif.style.border = `2px solid ${borderColor}`;

  // Créer l'icône
  const iconEl = document.createElement('span');
  iconEl.textContent = icon;
  iconEl.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-size: 16px;
    font-weight: 700;
    flex-shrink: 0;
  `;

  // Créer le texte
  const textEl = document.createElement('span');
  textEl.textContent = message;
  textEl.style.cssText = `
    flex: 1;
    line-height: 1.4;
  `;

  // Bouton de fermeture
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    line-height: 1;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
  closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  closeBtn.onclick = () => removeNotification(notif);

  notif.appendChild(iconEl);
  notif.appendChild(textEl);
  notif.appendChild(closeBtn);

  container.appendChild(notif);

  // Auto-retire après 4 secondes
  setTimeout(() => removeNotification(notif), 4000);

  function removeNotification(element) {
    element.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      if (element.parentNode) {
        element.remove();
      }
    }, 300);
  }
}

// Récupération automatique des horaires de prière
async function fetchPrayerTimesOptions() {
  const cityInput = document.getElementById('prayerCityOptions');
  const methodSelect = document.getElementById('prayerMethodOptions');
  const previewDiv = document.getElementById('prayerPreviewOptions');
  const previewContent = document.getElementById('prayerPreviewContentOptions');
  const lastUpdateSpan = document.getElementById('lastUpdateTime');
  const fetchBtn = document.getElementById('fetchPrayerTimesOptions');

  if (!cityInput || !methodSelect || !previewDiv || !previewContent || !lastUpdateSpan || !fetchBtn) {
    console.error('Prayer time elements not found');
    showNotification('Erreur: Éléments non trouvés', 'error');
    return;
  }

  const city = cityInput.value.trim();
  const method = parseInt(methodSelect.value);

  if (!city) {
    showNotification('Veuillez entrer le nom de votre ville', 'error');
    return;
  }

  try {
    fetchBtn.textContent = 'Récupération en cours...';
    fetchBtn.disabled = true;

    const result = await initializePrayerTimes(city, method);

    // Affiche l'aperçu avec un tableau propre
    previewContent.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color);">
            <th style="padding: 10px; text-align: left; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Prière</th>
            <th style="padding: 10px; text-align: right; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Horaire</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Fajr</td>
            <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${result.timings.fajr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Dhuhr</td>
            <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${result.timings.dhuhr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Asr</td>
            <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${result.timings.asr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Maghrib</td>
            <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${result.timings.maghrib}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: var(--text-color); font-weight: 500;">Isha</td>
            <td style="padding: 12px; text-align: right; color: var(--text-color); font-weight: 600; font-size: 15px;">${result.timings.isha}</td>
          </tr>
        </tbody>
      </table>
    `;

    const now = new Date();
    lastUpdateSpan.textContent = now.toLocaleString('fr-FR');
    previewDiv.style.display = 'block';

    // Recharge la config pour refléter les changements
    await loadConfig();

    fetchBtn.textContent = 'Horaires récupérés';
    showNotification('Horaires de prière mis à jour avec succès', 'success');

    setTimeout(() => {
      fetchBtn.textContent = 'Récupérer les horaires maintenant';
      fetchBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Error fetching prayer times:', error);
    showNotification('Impossible de récupérer les horaires. Vérifiez le nom de la ville.', 'error');
    fetchBtn.textContent = 'Récupérer les horaires maintenant';
    fetchBtn.disabled = false;
    previewDiv.style.display = 'none';
  }
}

