/**
 * API Helper Module
 *
 * Gère toutes les communications avec le backend SaaS Next.js
 * pour la synchronisation des abonnements et la validation des quotas.
 */

const BACKEND_URL = 'https://www.muslim-guard.com';
const API_TIMEOUT = 10000; // 10 secondes

/**
 * Récupère les données de l'équipe (team) depuis le backend
 * @returns {Promise<Object>} Données de l'équipe avec subscriptionStatus et planName
 * @throws {Error} Si l'appel API échoue
 */
export async function fetchTeamData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/team`, {
      method: 'GET',
      credentials: 'include', // Important pour envoyer les cookies httpOnly
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const teamData = await response.json();

    // Validation basique des données reçues
    if (!teamData || typeof teamData !== 'object') {
      throw new Error('Invalid team data received from backend');
    }

    return {
      success: true,
      data: {
        id: teamData.id,
        name: teamData.name,
        stripeCustomerId: teamData.stripeCustomerId || null,
        stripeSubscriptionId: teamData.stripeSubscriptionId || null,
        planName: teamData.planName || 'free',
        subscriptionStatus: teamData.subscriptionStatus || 'inactive'
      }
    };

  } catch (error) {
    console.error('Error fetching team data:', error);

    // Distinguer les types d'erreurs
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'La requête a expiré (timeout)'
      };
    }

    if (!navigator.onLine) {
      return {
        success: false,
        error: 'OFFLINE',
        message: 'Pas de connexion Internet'
      };
    }

    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error.message
    };
  }
}

/**
 * Récupère les informations de l'utilisateur connecté
 * @returns {Promise<Object>} Données utilisateur
 */
export async function fetchUserData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userData = await response.json();

    return {
      success: true,
      data: userData
    };

  } catch (error) {
    console.error('Error fetching user data:', error);

    return {
      success: false,
      error: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: error.message
    };
  }
}

/**
 * Valide un quota côté backend (optionnel - pour sécurité renforcée)
 * @param {string} action - Type d'action (ex: 'add_blocked_domain')
 * @param {number} currentCount - Nombre actuel d'éléments
 * @returns {Promise<Object>} Résultat de la validation
 */
export async function validateQuota(action, currentCount) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/validate-quota`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        currentCount
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Si l'endpoint n'existe pas encore, on retourne success pour fallback local
      if (response.status === 404) {
        return {
          success: true,
          fallbackToLocal: true
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Error validating quota:', error);

    // En cas d'erreur, fallback sur validation locale
    return {
      success: true,
      fallbackToLocal: true
    };
  }
}

/**
 * Vérifie si le backend est accessible
 * @returns {Promise<boolean>} True si accessible
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout plus court

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return response.ok;

  } catch (error) {
    return false;
  }
}
