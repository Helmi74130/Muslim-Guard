/**
 * Quota Bar Component
 *
 * Affiche les quotas utilisés et restants pour chaque type de ressource
 */

import { getQuotaStatus } from '../utils/quotaManager.js';

/**
 * Initialise l'affichage des quotas
 */
export async function initQuotaBar() {
  const quotaSection = document.getElementById('quota-section');
  if (!quotaSection) {
    console.warn('Section quota introuvable');
    return;
  }

  // Récupérer le statut des quotas
  const status = await getQuotaStatus();

  if (!status) {
    console.error('Impossible de récupérer le statut des quotas');
    return;
  }

  // Afficher ou masquer la section selon le plan
  if (status.plan === 'premium') {
    // Premium → masquer complètement la section quotas
    quotaSection.style.display = 'none';
    return;
  }

  // Free ou Trial → afficher la section
  quotaSection.style.display = 'block';

  // Mettre à jour le badge du plan
  updatePlanBadge(status.plan, status.trial.daysRemaining);

  // Afficher/masquer le banner d'essai
  updateTrialBanner(status.plan, status.trial.daysRemaining);

  // Mettre à jour chaque quota
  updateQuotaDisplay('domains', status.quotas.blockedDomains);
  updateQuotaDisplay('keywords-url', status.quotas.blockedKeywordsUrl);
  updateQuotaDisplay('keywords-content', status.quotas.blockedKeywordsContent);
  updateQuotaDisplay('whitelist', status.quotas.whitelistedSites);

  // Catégories (calcul spécial)
  const categoriesQuota = await getCategoriesQuota(status.plan);
  updateQuotaDisplay('categories', categoriesQuota);

  // Bouton upgrade
  setupUpgradeButton();
}

/**
 * Met à jour le badge du plan (version compacte)
 * @param {string} plan - 'free', 'premium' ou 'trial'
 * @param {number} daysRemaining - Jours restants de l'essai
 */
function updatePlanBadge(plan, daysRemaining) {
  const badge = document.getElementById('plan-badge');
  const trialBadge = document.getElementById('trial-days-badge');
  const trialDays = document.getElementById('trial-days-remaining');

  if (!badge) return;

  if (plan === 'premium') {
    badge.className = 'plan-badge premium';
    badge.textContent = 'Premium';
    if (trialBadge) trialBadge.style.display = 'none';
  } else if (plan === 'trial') {
    badge.className = 'plan-badge trial';
    badge.textContent = 'Essai';
    if (trialBadge && trialDays) {
      trialBadge.style.display = 'inline-flex';
      trialDays.textContent = `${daysRemaining}j`;
    }
  } else {
    badge.className = 'plan-badge';
    badge.textContent = 'Gratuit';
    if (trialBadge) trialBadge.style.display = 'none';
  }
}

/**
 * Met à jour le banner d'essai (maintenant géré dans updatePlanBadge)
 * @param {string} plan - Plan actuel
 * @param {number} daysRemaining - Jours restants
 */
function updateTrialBanner(plan, daysRemaining) {
  // Banner d'essai supprimé dans le nouveau design compact
  // Les jours restants sont affichés dans le badge header
}

/**
 * Met à jour l'affichage d'un quota spécifique (version compacte)
 * @param {string} type - Type de quota (ex: 'domains')
 * @param {Object} quota - Objet quota avec used, limit, remaining, percentage
 */
function updateQuotaDisplay(type, quota) {
  const countEl = document.getElementById(`quota-${type}-count`);
  const fillEl = document.getElementById(`quota-${type}-fill`);

  if (!countEl || !fillEl) {
    console.warn(`Éléments quota introuvables pour: ${type}`);
    return;
  }

  const { used, limit, percentage } = quota;

  // Mettre à jour le compteur
  if (limit === Infinity) {
    countEl.textContent = '∞';
  } else {
    countEl.textContent = `${used}/${limit}`;
  }

  // Mettre à jour la barre de progression
  fillEl.style.width = `${Math.min(percentage, 100)}%`;

  // Changer la couleur selon le pourcentage
  fillEl.classList.remove('warning', 'danger');
  if (percentage >= 80) {
    fillEl.classList.add('danger');
  } else if (percentage >= 50) {
    fillEl.classList.add('warning');
  }

  // Gérer le warning global (affiché une seule fois pour tous les quotas)
  updateGlobalWarning();
}

/**
 * Met à jour le warning global si au moins un quota > 80%
 */
function updateGlobalWarning() {
  const warningEl = document.getElementById('quota-global-warning');
  const warningText = document.getElementById('quota-warning-text');

  if (!warningEl || !warningText) return;

  // Compter combien de quotas sont en danger (>= 80%)
  const dangerItems = [];
  const quotaTypes = ['domains', 'keywords-url', 'keywords-content', 'whitelist', 'categories'];

  quotaTypes.forEach(type => {
    const fillEl = document.getElementById(`quota-${type}-fill`);
    if (fillEl && fillEl.classList.contains('danger')) {
      dangerItems.push(type);
    }
  });

  if (dangerItems.length > 0) {
    warningEl.style.display = 'flex';
    if (dangerItems.length === 1) {
      warningText.textContent = 'Un quota est presque plein';
    } else {
      warningText.textContent = `${dangerItems.length} quotas sont presque pleins`;
    }
  } else {
    warningEl.style.display = 'none';
  }
}

/**
 * Récupère le quota des catégories
 * @param {string} plan - Plan actuel
 * @returns {Object} Quota des catégories
 */
async function getCategoriesQuota(plan) {
  try {
    const config = await chrome.storage.local.get(null);

    // Compter les catégories activées
    const categoryKeys = [
      'blockSocialMedia',
      'blockMusicStreaming',
      'blockVideoStreaming',
      'blockDating',
      'blockGaming',
      'blockAdult',
      'blockReddit'
    ];

    const enabledCount = categoryKeys.filter(key => config[key] === true).length;

    const limit = plan === 'free' ? 3 : Infinity;

    return {
      used: enabledCount,
      limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - enabledCount),
      percentage: limit === Infinity ? 0 : Math.round((enabledCount / limit) * 100)
    };
  } catch (error) {
    console.error('Erreur lors du calcul du quota des catégories:', error);
    return { used: 0, limit: 3, remaining: 3, percentage: 0 };
  }
}

/**
 * Configure le bouton d'upgrade
 */
function setupUpgradeButton() {
  const upgradeButton = document.getElementById('upgrade-button');
  if (!upgradeButton) return;

  upgradeButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.muslim-guard.com/pricing' });
  });
}

/**
 * Rafraîchit l'affichage des quotas
 */
export async function refreshQuotaBar() {
  await initQuotaBar();
}
