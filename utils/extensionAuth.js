/**
 * Extension Authentication Helper
 * Gère l'authentification de l'extension avec le backend Muslim-Guard
 */

import { getValue, setValue } from './storage.js';

/**
 * Récupère le token de l'extension
 * @returns {Promise<string|null>} Le token ou null si non enregistré
 */
export async function getExtensionToken() {
  return await getValue('extensionToken');
}

/**
 * Récupère le tokenId de l'extension
 * @returns {Promise<string|null>} Le tokenId ou null si non enregistré
 */
export async function getExtensionTokenId() {
  return await getValue('extensionTokenId');
}

/**
 * Vérifie si l'extension est enregistrée
 * @returns {Promise<boolean>}
 */
export async function isExtensionRegistered() {
  const token = await getExtensionToken();
  return !!token;
}

/**
 * Vérifie si l'extension est liée à un compte utilisateur
 * @returns {Promise<boolean>}
 */
export async function isExtensionLinked() {
  return await getValue('isAuthenticated') || false;
}

/**
 * Récupère le statut complet de l'extension
 * @returns {Promise<{registered: boolean, linked: boolean, token: string|null, tokenId: string|null}>}
 */
export async function getExtensionStatus() {
  const token = await getExtensionToken();
  const tokenId = await getExtensionTokenId();
  const linked = await isExtensionLinked();

  return {
    registered: !!token,
    linked,
    token,
    tokenId
  };
}

/**
 * Sauvegarde les informations d'enregistrement de l'extension
 * @param {string} token - Le token de l'extension
 * @param {string} tokenId - L'ID du token
 * @returns {Promise<void>}
 */
export async function saveExtensionRegistration(token, tokenId) {
  await setValue('extensionToken', token);
  await setValue('extensionTokenId', tokenId);
  await setValue('extensionRegisteredAt', Date.now());
}

/**
 * Marque l'extension comme liée à un compte utilisateur
 * @param {Object} userData - Les données utilisateur (teamId, userId, etc.)
 * @returns {Promise<void>}
 */
export async function markExtensionAsLinked(userData) {
  await setValue('isAuthenticated', true);

  // Sauvegarder les données utilisateur si fournies
  if (userData) {
    if (userData.teamId) await setValue('teamId', userData.teamId);
    if (userData.userId) await setValue('userId', userData.userId);
    if (userData.userPlan) await setValue('userPlan', userData.userPlan);
    if (userData.subscriptionStatus) await setValue('subscriptionStatus', userData.subscriptionStatus);
  }
}

/**
 * Réinitialise l'authentification de l'extension
 * (Garde le token mais supprime le lien utilisateur)
 * @returns {Promise<void>}
 */
export async function unlinkExtension() {
  await setValue('isAuthenticated', false);
  await setValue('teamId', null);
  await setValue('userId', null);
  // Note: On garde le token pour pouvoir re-lier plus tard
}

/**
 * Réinitialise complètement l'enregistrement de l'extension
 * @returns {Promise<void>}
 */
export async function resetExtensionRegistration() {
  await setValue('extensionToken', null);
  await setValue('extensionTokenId', null);
  await setValue('extensionRegisteredAt', null);
  await setValue('isAuthenticated', false);
  await setValue('teamId', null);
  await setValue('userId', null);
}
