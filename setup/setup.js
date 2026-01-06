// setup/setup.js - Configuration initiale de l'extension

import { setParentPin, completeSetup } from '../utils/auth.js';
import { setValue } from '../utils/storage.js';
import { initializePrayerTimes } from '../utils/prayerApi.js';

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

  // Met à jour les indicateurs visuels
  for (let i = 1; i <= totalSteps; i++) {
    const indicator = document.getElementById(`indicator${i}`);
    if (i < currentStep) {
      indicator.classList.remove('active');
      indicator.classList.add('completed');
    } else if (i === currentStep) {
      indicator.classList.remove('completed');
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active', 'completed');
    }
  }
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
  errorDiv.classList.remove('show');
  nextStep();
}

function showError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

// Récupération automatique des horaires de prière (Étape 4)
let fetchedPrayerTimes = null;

async function fetchPrayerTimes() {
  const cityInput = document.getElementById('prayerCity');
  const methodSelect = document.getElementById('prayerMethod');
  const errorDiv = document.getElementById('prayerError');
  const previewDiv = document.getElementById('prayerPreview');
  const previewContent = document.getElementById('prayerPreviewContent');
  const fetchBtn = document.getElementById('fetchPrayerTimes');

  const city = cityInput.value.trim();
  const method = parseInt(methodSelect.value);

  if (!city) {
    showError(errorDiv, 'Veuillez entrer le nom de votre ville');
    return;
  }

  try {
    fetchBtn.textContent = 'Récupération en cours...';
    fetchBtn.disabled = true;
    errorDiv.classList.remove('show');

    const result = await initializePrayerTimes(city, method);

    fetchedPrayerTimes = {
      city: city,
      method: method,
      timings: result.timings,
      location: result.location
    };

    // Affiche l'aperçu avec un tableau propre
    previewContent.innerHTML = `
      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
        <strong style="color: #0f172a;">${result.location}</strong>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px; text-align: left; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Prière</th>
            <th style="padding: 10px; text-align: right; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Horaire</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: #0f172a; font-weight: 500;">Fajr</td>
            <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">${result.timings.fajr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: #0f172a; font-weight: 500;">Dhuhr</td>
            <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">${result.timings.dhuhr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: #0f172a; font-weight: 500;">Asr</td>
            <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">${result.timings.asr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; color: #0f172a; font-weight: 500;">Maghrib</td>
            <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">${result.timings.maghrib}</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #0f172a; font-weight: 500;">Isha</td>
            <td style="padding: 12px; text-align: right; color: #0f172a; font-weight: 600; font-size: 15px;">${result.timings.isha}</td>
          </tr>
        </tbody>
      </table>
    `;
    previewDiv.style.display = 'block';

    fetchBtn.textContent = 'Horaires récupérés';
    setTimeout(() => {
      fetchBtn.textContent = 'Récupérer les horaires';
      fetchBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Error fetching prayer times:', error);
    showError(errorDiv, 'Impossible de récupérer les horaires. Vérifiez le nom de la ville.');
    fetchBtn.textContent = 'Récupérer les horaires';
    fetchBtn.disabled = false;
    previewDiv.style.display = 'none';
  }
}

// Finalisation du setup (Étape 5)
async function finishSetup() {
  try {
    // Récupère le mode de protection
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'moderate';

    // Récupère les horaires de prière selon le mode choisi
    const prayerPauseEnabled = document.getElementById('prayerPause').checked;
    const prayerMode = document.querySelector('input[name="prayerMode"]:checked')?.value || 'auto';

    let configToSave = {
      protectionMode: mode,
      prayerPauseEnabled,
      protectionEnabled: true
    };

    if (prayerMode === 'auto') {
      // Mode automatique - vérifie que les horaires ont été récupérés
      if (!fetchedPrayerTimes) {
        alert('Veuillez d\'abord récupérer les horaires de prière en cliquant sur "Récupérer les horaires"');
        return;
      }
      // Les horaires ont déjà été sauvegardés par initializePrayerTimes
      // On n'a rien de plus à faire, prayerTimesAutoUpdate est déjà true
    } else {
      // Mode manuel
      const prayerTimes = [
        document.getElementById('fajr').value,
        document.getElementById('dhuhr').value,
        document.getElementById('asr').value,
        document.getElementById('maghrib').value,
        document.getElementById('isha').value
      ];

      configToSave.prayerTimes = prayerTimes;
      configToSave.prayerTimesAutoUpdate = false;
      configToSave.prayerCity = null;
    }

    // Sauvegarde la configuration
    await setValue(configToSave);

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
    console.error('Setup error:', error);
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
    inputs.querySelectorAll('input, select, button').forEach(input => {
      input.disabled = !e.target.checked;
    });
  });

  // Toggle entre mode automatique et manuel
  document.querySelectorAll('input[name="prayerMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const autoInputs = document.getElementById('autoModeInputs');
      const manualInputs = document.getElementById('manualModeInputs');

      if (e.target.value === 'auto') {
        autoInputs.style.display = 'block';
        manualInputs.style.display = 'none';
      } else {
        autoInputs.style.display = 'none';
        manualInputs.style.display = 'block';
      }
    });
  });

  // Bouton de récupération des horaires
  document.getElementById('fetchPrayerTimes')?.addEventListener('click', fetchPrayerTimes);

  // Permettre de récupérer les horaires en appuyant sur Entrée dans le champ ville
  document.getElementById('prayerCity')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchPrayerTimes();
    }
  });
});
