// utils/auth.js - Gestion de l'authentification PIN

import { getValue, setValue } from './storage.js';

/**
 * Génère un salt aléatoire pour le hash
 */
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash un PIN avec SHA-256 et un salt
 */
async function hashPin(pin, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Définit le PIN parental (première fois)
 */
export async function setParentPin(pin) {
  try {
    // Validation
    if (!pin || pin.length < 4 || pin.length > 6) {
      throw new Error('Le PIN doit contenir entre 4 et 6 chiffres');
    }

    if (!/^\d+$/.test(pin)) {
      throw new Error('Le PIN ne doit contenir que des chiffres');
    }

    const salt = generateSalt();
    const hash = await hashPin(pin, salt);

    await setValue({
      parentPinHash: hash,
      parentPinSalt: salt
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la définition du PIN:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie si le PIN fourni est correct
 */
export async function verifyPin(pin) {
  try {
    const hash = await getValue('parentPinHash');
    const salt = await getValue('parentPinSalt');

    if (!hash || !salt) {
      throw new Error('Aucun PIN défini');
    }

    const inputHash = await hashPin(pin, salt);
    return inputHash === hash;
  } catch (error) {
    console.error('Erreur lors de la vérification du PIN:', error);
    return false;
  }
}

/**
 * Change le PIN (nécessite l'ancien PIN)
 */
export async function changePin(oldPin, newPin) {
  try {
    // Vérifie l'ancien PIN
    const isValid = await verifyPin(oldPin);
    if (!isValid) {
      return { success: false, error: 'PIN actuel incorrect' };
    }

    // Définit le nouveau PIN
    return await setParentPin(newPin);
  } catch (error) {
    console.error('Erreur lors du changement de PIN:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Réinitialise le PIN avec l'email de récupération
 * Note: Dans une vraie app, on enverrait un email. Ici c'est simulé.
 */
export async function resetPinWithEmail(email, newPin) {
  try {
    const storedEmail = await getValue('recoveryEmail');

    if (!storedEmail) {
      return { success: false, error: 'Aucun email de récupération configuré' };
    }

    if (email.toLowerCase() !== storedEmail.toLowerCase()) {
      return { success: false, error: 'Email de récupération incorrect' };
    }

    // Définit le nouveau PIN
    return await setParentPin(newPin);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du PIN:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie si le setup initial est terminé
 */
export async function isSetupComplete() {
  try {
    const isComplete = await getValue('isSetupComplete');
    const hasPin = await getValue('parentPinHash');
    return isComplete && hasPin;
  } catch (error) {
    console.error('Erreur lors de la vérification du setup:', error);
    return false;
  }
}

/**
 * Marque le setup comme terminé
 */
export async function completeSetup() {
  try {
    await setValue('isSetupComplete', true);
    return true;
  } catch (error) {
    console.error('Erreur lors de la finalisation du setup:', error);
    return false;
  }
}

/**
 * Génère un token de session temporaire (valide 1 heure)
 * Utilisé pour ne pas redemander le PIN à chaque action
 */
export async function generateSessionToken() {
  try {
    const token = generateSalt(); // Réutilise la fonction de génération aléatoire
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 heure

    await setValue('sessionToken', { token, expiresAt });
    return token;
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    return null;
  }
}

/**
 * Vérifie si un token de session est valide
 */
export async function verifySessionToken(token) {
  try {
    const session = await getValue('sessionToken');

    if (!session || !session.token || !session.expiresAt) {
      return false;
    }

    if (Date.now() > session.expiresAt) {
      // Token expiré
      await setValue('sessionToken', null);
      return false;
    }

    return session.token === token;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
}

/**
 * Invalide le token de session (déconnexion)
 */
export async function invalidateSession() {
  try {
    await setValue('sessionToken', null);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'invalidation de session:', error);
    return false;
  }
}
