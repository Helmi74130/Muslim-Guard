// setup/setup.js - Configuration initiale de l'extension

import { setParentPin, completeSetup } from '../utils/auth.js';
import { setValue } from '../utils/storage.js';

let currentStep = 1;
const totalSteps = 5;

// Navigation entre les étapes
function nextStep() {
  if (currentStep < totalSteps) {
    // Cache l'étape actuelle
    document.getElementById(`step${currentStep}`).classList.remove('active');

    // Affiche la prochaine étape
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');

    // Met à jour la barre de progression
    updateProgress();
  }
}

function prevStep() {
  if (currentStep > 1) {
    // Cache l'étape actuelle
    document.getElementById(`step${currentStep}`).classList.remove('active');

    // Affiche l'étape précédente
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');

    // Met à jour la barre de progression
    updateProgress();
  }
}

function updateProgress() {
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
}

// Sauvegarde du PIN (Étape 2)
async function savePin() {
  const pin = document.getElementById('pinInput').value;
  const confirm = document.getElementById('pinConfirm').value;
  const errorDiv = document.getElementById('pinError');

  // Validation
  if (!pin || pin.length < 4 || pin.length > 6) {
    showError(errorDiv, 'Le PIN doit contenir entre 4 et 6 chiffres');
    return;
  }

  if (!/^\d+$/.test(pin)) {
    showError(errorDiv, 'Le PIN ne doit contenir que des chiffres');
    return;
  }

  if (pin !== confirm) {
    showError(errorDiv, 'Les codes PIN ne correspondent pas');
    return;
  }

  // Sauvegarde le PIN
  const result = await setParentPin(pin);

  if (!result.success) {
    showError(errorDiv, result.error || 'Erreur lors de la sauvegarde du PIN');
    return;
  }

  // Cache l'erreur et passe à l'étape suivante
  errorDiv.classList.add('hidden');
  nextStep();
}

function showError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

// Finalisation du setup (Étape 5)
async function finishSetup() {
  try {
    // Récupère le mode de protection
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'moderate';

    // Récupère les horaires de prière
    const prayerPauseEnabled = document.getElementById('prayerPause').checked;
    const prayerTimes = [
      document.getElementById('fajr').value,
      document.getElementById('dhuhr').value,
      document.getElementById('asr').value,
      document.getElementById('maghrib').value,
      document.getElementById('isha').value
    ];

    // Sauvegarde la configuration
    await setValue({
      protectionMode: mode,
      prayerPauseEnabled,
      prayerTimes,
      protectionEnabled: true
    });

    // Marque le setup comme terminé
    await completeSetup();

    // Recharge la config dans le background
    await chrome.runtime.sendMessage({ action: 'reloadConfig' });

    // Affiche un message de succès
    alert('MuslimGuard est maintenant actif ! Veuillez vous rendre dans les parametres pour modiffiers vos préférences.');

    // Ferme l'onglet ou redirige vers le dashboard
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    window.close();
  } catch (error) {
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
}

// Initialisation des event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Bouton Step 1 - Next
  document.getElementById('step1Next')?.addEventListener('click', nextStep);

  // Boutons Step 2 - Prev et Save
  document.getElementById('step2Prev')?.addEventListener('click', prevStep);
  document.getElementById('step2Save')?.addEventListener('click', savePin);

  // Tous les boutons avec data-action
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'prev') prevStep();
      else if (action === 'next') nextStep();
      else if (action === 'savePin') savePin();
      else if (action === 'finish') finishSetup();
    });
  });

  // Toggle des inputs de prière
  document.getElementById('prayerPause')?.addEventListener('change', (e) => {
    const inputs = document.getElementById('prayerInputs');
    inputs.style.opacity = e.target.checked ? '1' : '0.5';
    inputs.querySelectorAll('input').forEach(input => {
      input.disabled = !e.target.checked;
    });
  });
});
