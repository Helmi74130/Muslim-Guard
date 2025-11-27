// blocked/blocked.js - Page affichée quand un site est bloqué

// Versets du Coran (exemples)
const VERSES = [
  {
    text: "Et quiconque craint Allah, Il lui donnera une issue favorable, et lui accordera Ses dons par [des moyens] sur lesquels il ne comptait pas.",
    ref: "Sourate At-Talaq (65:2-3)"
  },
  {
    text: "Ô les croyants ! Ne suivez pas les pas du Diable. Quiconque suit les pas du Diable, [sachez que] celui-ci ordonne la turpitude et le blâmable.",
    ref: "Sourate An-Nur (24:21)"
  },
  {
    text: "Dis : 'En vérité, ma prière, mes actes de dévotion, ma vie et ma mort appartiennent à Allah, Seigneur de l'Univers.'",
    ref: "Sourate Al-An'am (6:162)"
  },
  {
    text: "Et recherche dans ce qu'Allah t'a donné, la Demeure dernière. Et n'oublie pas ta part dans la vie présente.",
    ref: "Sourate Al-Qasas (28:77)"
  },
  {
    text: "Certes, Allah est avec ceux qui [L'] ont craint avec piété et ceux qui sont bienfaisants.",
    ref: "Sourate An-Nahl (16:128)"
  },
  {
    text: "Et cherchez secours dans l'endurance et la prière : certes, la prière est une lourde obligation, sauf pour les humbles.",
    ref: "Sourate Al-Baqarah (2:45)"
  },
  {
    text: "Ô vous qui avez cru! Préservez vos personnes et vos familles, d'un Feu dont le combustible sera les gens et les pierres.",
    ref: "Sourate At-Tahrim (66:6)"
  }
];

// Raisons de blocage
const BLOCK_REASONS = {
  domain: 'Ce domaine figure sur la liste des sites bloqués.',
  keyword: 'L\'URL contient des mots-clés inappropriés.',
  category: 'Ce site appartient à une catégorie bloquée.',
  strict: 'Mode strict activé : seuls les sites éducatifs et islamiques sont autorisés.',
  schedule: 'Accès Internet bloqué en dehors des horaires autorisés.',
  prayer: '🕌 C\'est l\'heure de la prière ! Internet est en pause pendant 15 minutes.'
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  loadBlockReason();
  loadRandomVerse();
  loadCustomMessage();
  loadNextPrayer();
  setupEventListeners();
});

// Charge la raison du blocage depuis l'URL
function loadBlockReason() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason') || 'domain';
  const blockedUrl = urlParams.get('url') || document.referrer || 'URL non disponible';

  // Affiche la raison
  const reasonText = BLOCK_REASONS[reason] || BLOCK_REASONS.domain;
  document.getElementById('reasonText').textContent = reasonText;

  // Affiche l'URL
  document.getElementById('blockedUrl').textContent = blockedUrl;

  // Si c'est l'heure de prière, met en évidence
  if (reason === 'prayer') {
    const reasonBox = document.getElementById('reasonBox');
    reasonBox.className = 'bg-green-50 border-l-4 border-green-500 p-4 mb-4';
  }
}

// Charge un verset aléatoire
function loadRandomVerse() {
  const randomVerse = VERSES[Math.floor(Math.random() * VERSES.length)];
  document.getElementById('verseText').textContent = `"${randomVerse.text}"`;
  document.getElementById('verseRef').textContent = `— ${randomVerse.ref}`;
}

// Charge le message personnalisé du parent
async function loadCustomMessage() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    const config = response?.config;

    if (config && config.blockPageMessage) {
      document.getElementById('customMessage').textContent = config.blockPageMessage;
    }
  } catch (error) {
    console.error('Erreur lors du chargement du message:', error);
  }
}

// Charge la prochaine prière
async function loadNextPrayer() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    const config = response?.config;

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
      nextPrayer = { ...prayers[0], minutes: 1440 + parseInt(prayers[0].time.split(':')[0]) * 60 + parseInt(prayers[0].time.split(':')[1]) };
    }

    // Affiche la prochaine prière
    document.getElementById('nextPrayerText').textContent = `${nextPrayer.name} - ${nextPrayer.time}`;

    // Met à jour le countdown toutes les secondes
    updateCountdown(nextPrayer.minutes, currentMinutes);
    setInterval(() => {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      updateCountdown(nextPrayer.minutes, current);
    }, 60000);
  } catch (error) {
    console.error('Erreur lors du chargement de la prochaine prière:', error);
  }
}

// Met à jour le countdown
function updateCountdown(prayerMinutes, currentMinutes) {
  let diff = prayerMinutes - currentMinutes;
  if (diff < 0) diff += 1440; // Ajoute 24h si c'est demain

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  const countdown = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  const countdownEl = document.getElementById('prayerCountdown');
  if (countdownEl) {
    countdownEl.querySelector('p:last-child').textContent = countdown;
  }
}

// Configuration des event listeners
function setupEventListeners() {
  const requestBtn = document.getElementById('requestAccessBtn');
  requestBtn.addEventListener('click', async () => {
    const reason = document.getElementById('requestReason').value.trim();

    if (!reason) {
      alert('Veuillez expliquer pourquoi vous avez besoin d\'accéder à ce site.');
      return;
    }

    try {
      // Récupère l'URL bloquée
      const urlParams = new URLSearchParams(window.location.search);
      const blockedUrl = urlParams.get('url') || document.referrer || window.location.href;

      // Envoie la demande au background
      await chrome.runtime.sendMessage({
        action: 'requestAccess',
        url: blockedUrl,
        reason: reason
      });

      // Affiche le message de succès
      document.getElementById('requestSuccess').classList.remove('hidden');
      requestBtn.disabled = true;
      requestBtn.classList.add('opacity-50', 'cursor-not-allowed');
      requestBtn.textContent = 'Demande envoyée ✓';
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  });
}
