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

// ============================================
// EXTENSION TOKEN AUTHENTICATION SYSTEM
// ============================================

/**
 * Récupère le token d'extension depuis le storage
 * @returns {Promise<string|null>} Token ou null si absent
 */
async function getExtensionToken() {
  const { extensionToken } = await chrome.storage.local.get('extensionToken');
  return extensionToken || null;
}

/**
 * Génère les headers d'authentification avec le token d'extension
 * @returns {Promise<Object>} Headers avec token si disponible
 */
async function getAuthHeaders() {
  const token = await getExtensionToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['X-Extension-Token'] = token;
  }

  return headers;
}

/**
 * Enregistre une nouvelle extension et récupère son token
 * @returns {Promise<Object>} Résultat avec {success, token, tokenId} ou {success, error}
 */
export async function registerExtension() {
  try {
    const deviceName = `Chrome - ${navigator.platform}`;
    const extensionVersion = chrome.runtime.getManifest().version;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/extension/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceName,
        extensionVersion
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.error) {
          errorMessage += ` - ${errorData.message || errorData.error}`;
        }
      } catch (e) {
        // Impossible de parser la réponse JSON
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Accepter les deux formats de réponse :
    // 1. {success: true, token, tokenId} (format attendu)
    // 2. {token, tokenId} (format backend actuel)
    if (result.token) {
      console.log('🔑 Token reçu du backend:', result.token.substring(0, 30) + '...');
      console.log('🆔 Token ID:', result.tokenId);

      // Stocker le token dans chrome.storage.local
      await chrome.storage.local.set({
        extensionToken: result.token,
        extensionTokenId: result.tokenId,
        extensionRegisteredAt: Date.now()
      });

      console.log('💾 Token sauvegardé dans chrome.storage.local');

      // Vérifier que le token a bien été sauvegardé
      const verification = await chrome.storage.local.get(['extensionToken', 'extensionTokenId']);
      console.log('✅ Vérification storage:', {
        tokenSaved: !!verification.extensionToken,
        tokenIdSaved: !!verification.extensionTokenId,
        tokenMatch: verification.extensionToken === result.token
      });

      return {
        success: true,
        token: result.token,
        tokenId: result.tokenId
      };
    }

    throw new Error('Invalid response from backend: no token received');

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'extension:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'Timeout lors de l\'enregistrement'
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
 * Vérifie le token et récupère le statut de l'abonnement
 * @returns {Promise<Object>} Résultat avec données team/user si lié
 */
export async function verifyExtensionToken() {
  try {
    const headers = await getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/extension/verify`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Token invalide ou révoqué
      console.warn('Token invalide ou révoqué, réenregistrement nécessaire');
      return {
        success: false,
        error: 'INVALID_TOKEN',
        needsReregistration: true
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Adapter la réponse du backend au format attendu par l'extension
    if (result.valid && result.linked && result.team) {
      // Token lié à un compte avec team
      return {
        success: true,
        data: {
          teamId: result.team.id,
          userId: result.user?.id || null,
          userPlan: result.team.subscriptionStatus === 'active' ? 'premium' : 'free',
          subscriptionStatus: result.team.subscriptionStatus,
          planName: result.team.planName || 'Gratuit',
          isAuthenticated: true,
          email: result.user?.email || null,
          teamName: result.team.name
        }
      };
    } else if (result.valid && !result.linked) {
      // Token valide mais pas encore lié
      return {
        success: true,
        data: {
          userPlan: 'trial',
          isAuthenticated: false,
          linked: false
        }
      };
    }

    throw new Error('Unexpected response format');

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'Timeout lors de la vérification'
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
 * Lie l'extension au compte utilisateur connecté
 * Nécessite que l'utilisateur soit connecté sur muslim-guard.com (cookies de session)
 * @returns {Promise<Object>} Résultat de la liaison
 */
export async function linkExtensionToAccount() {
  try {
    const token = await getExtensionToken();

    if (!token) {
      return {
        success: false,
        error: 'NO_TOKEN',
        message: 'Aucun token d\'extension trouvé'
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/api/extension/link-account`, {
      method: 'POST',
      credentials: 'include', // Important pour envoyer les cookies de session
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'NOT_AUTHENTICATED',
          message: 'Utilisateur non connecté'
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Extension liée au compte:', result.message);
    }

    return result;

  } catch (error) {
    console.error('Erreur lors de la liaison de l\'extension:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'Timeout lors de la liaison'
      };
    }

    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error.message
    };
  }
}
