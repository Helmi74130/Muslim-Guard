/**
 * Upgrade Modal Component
 *
 * Gère l'affichage et les interactions du modal d'upgrade Premium
 */

/**
 * Affiche le modal d'upgrade avec un message personnalisé
 * @param {Object} options - Options du modal
 * @param {string} options.title - Titre du modal
 * @param {string} options.message - Message principal
 * @param {string} options.upgradeUrl - URL de la page pricing
 * @param {number} options.limit - Limite atteinte
 * @param {number} options.remaining - Items restants
 */
export function showUpgradeModal(options = {}) {
  const defaults = {
    title: 'Passez à Premium',
    message: 'Vous avez atteint la limite gratuite',
    upgradeUrl: 'https://www.muslim-guard.com/pricing',
    limit: null,
    remaining: null
  };

  const config = { ...defaults, ...options };

  // Récupérer le modal
  const modal = document.getElementById('upgrade-modal');
  if (!modal) {
    console.error('Modal d\'upgrade introuvable');
    return;
  }

  // Mettre à jour le titre et le message
  const titleEl = document.getElementById('upgrade-modal-title');
  const messageEl = document.getElementById('upgrade-modal-message');

  if (titleEl) {
    titleEl.textContent = config.title;
  }

  if (messageEl) {
    let message = config.message;

    // Ajouter les informations de limite si disponibles
    if (config.limit !== null && config.remaining !== null) {
      message += ` (${config.limit} max)`;
    }

    messageEl.textContent = message;
  }

  // Afficher le modal
  modal.style.display = 'flex';

  // Ajouter les événements
  setupModalEvents(modal, config.upgradeUrl);

  // Empêcher le scroll de la page
  document.body.style.overflow = 'hidden';
}

/**
 * Ferme le modal d'upgrade
 */
export function hideUpgradeModal() {
  const modal = document.getElementById('upgrade-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Configure les événements du modal
 * @param {HTMLElement} modal - Élément DOM du modal
 * @param {string} upgradeUrl - URL de la page pricing
 */
function setupModalEvents(modal, upgradeUrl) {
  // Bouton "Voir les offres"
  const ctaButton = document.getElementById('upgrade-modal-cta');
  if (ctaButton) {
    // Supprimer les anciens événements
    const newCtaButton = ctaButton.cloneNode(true);
    ctaButton.parentNode.replaceChild(newCtaButton, ctaButton);

    // Ajouter le nouvel événement
    newCtaButton.addEventListener('click', () => {
      chrome.tabs.create({ url: upgradeUrl });
      hideUpgradeModal();
    });
  }

  // Bouton "Fermer"
  const closeButton = document.getElementById('upgrade-modal-close');
  if (closeButton) {
    // Supprimer les anciens événements
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);

    // Ajouter le nouvel événement
    newCloseButton.addEventListener('click', () => {
      hideUpgradeModal();
    });
  }

  // Clic en dehors du modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideUpgradeModal();
    }
  });

  // Touche Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      hideUpgradeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };

  document.addEventListener('keydown', handleEscape);
}

/**
 * Affiche le modal pour une fonctionnalité Premium spécifique
 * @param {string} featureName - Nom de la fonctionnalité
 */
export function showFeatureLockedModal(featureName) {
  const featureMessages = {
    autoPrayerMode: {
      title: 'Fonctionnalité Premium',
      message:
        'Le mode automatique des pauses de prière est réservé aux utilisateurs Premium.'
    },
    advancedAnalytics: {
      title: 'Fonctionnalité Premium',
      message: 'Les analytics avancées sont disponibles uniquement avec Premium.'
    },
    customCategories: {
      title: 'Fonctionnalité Premium',
      message: 'La personnalisation des catégories nécessite un abonnement Premium.'
    },
    exportData: {
      title: 'Fonctionnalité Premium',
      message: 'L\'export des données est une fonctionnalité Premium.'
    }
  };

  const feature = featureMessages[featureName] || {
    title: 'Fonctionnalité Premium',
    message: 'Cette fonctionnalité est réservée aux utilisateurs Premium.'
  };

  showUpgradeModal(feature);
}

/**
 * Affiche le modal pour un quota atteint
 * @param {string} quotaType - Type de quota (blockedDomains, blockedKeywordsUrl, etc.)
 * @param {number} limit - Limite du quota
 */
export function showQuotaReachedModal(quotaType, limit) {
  const quotaMessages = {
    blockedDomains: {
      title: 'Limite de domaines atteinte',
      message: `Vous avez atteint la limite de ${limit} domaines bloqués. Passez à Premium pour des domaines illimités.`
    },
    blockedKeywordsUrl: {
      title: 'Limite de mots-clés atteinte',
      message: `Vous avez atteint la limite de ${limit} mots-clés URL. Passez à Premium pour des mots-clés illimités.`
    },
    blockedKeywordsContent: {
      title: 'Limite de mots-clés atteinte',
      message: `Vous avez atteint la limite de ${limit} mots-clés de contenu. Passez à Premium pour des mots-clés illimités.`
    },
    whitelistedSites: {
      title: 'Limite de sites autorisés atteinte',
      message: `Vous avez atteint la limite de ${limit} sites en whitelist. Passez à Premium pour une whitelist illimitée.`
    },
    categoriesEnabled: {
      title: 'Limite de catégories atteinte',
      message: `Version gratuite limitée à ${limit} catégories. Passez à Premium pour activer toutes les catégories.`
    }
  };

  const quota = quotaMessages[quotaType] || {
    title: 'Limite atteinte',
    message: `Vous avez atteint votre quota. Passez à Premium pour un accès illimité.`
  };

  showUpgradeModal({ ...quota, limit });
}
