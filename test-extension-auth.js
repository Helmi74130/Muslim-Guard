/**
 * Script de test pour l'authentification de l'extension
 * À exécuter dans la console du service worker (chrome://extensions -> Inspect views: service worker)
 */

import { registerExtension, verifyExtensionToken, linkExtensionToAccount } from './utils/api.js';
import { getExtensionStatus, saveExtensionRegistration } from './utils/extensionAuth.js';
import { getValue } from './utils/storage.js';

// Test 1: Vérifier le statut actuel de l'extension
async function testGetStatus() {
  console.log('=== Test 1: Statut actuel de l\'extension ===');

  const status = await getExtensionStatus();
  console.log('Statut:', status);

  const token = await getValue('extensionToken');
  const tokenId = await getValue('extensionTokenId');
  const isAuth = await getValue('isAuthenticated');
  const teamId = await getValue('teamId');

  console.log({
    token: token ? `${token.substring(0, 20)}...` : null,
    tokenId,
    isAuthenticated: isAuth,
    teamId
  });
}

// Test 2: Enregistrer l'extension
async function testRegister() {
  console.log('\n=== Test 2: Enregistrement de l\'extension ===');

  try {
    const result = await registerExtension();
    console.log('✅ Enregistrement réussi:', result);

    // Vérifier que le token est sauvegardé
    const status = await getExtensionStatus();
    console.log('Nouveau statut:', status);

    return result;
  } catch (error) {
    console.error('❌ Erreur d\'enregistrement:', error);
    throw error;
  }
}

// Test 3: Vérifier le token
async function testVerify() {
  console.log('\n=== Test 3: Vérification du token ===');

  try {
    const result = await verifyExtensionToken();
    console.log('✅ Vérification réussie:', result);

    if (result.valid) {
      console.log('Token valide ✅');
      console.log('Lié:', result.linked);

      if (result.linked && result.team) {
        console.log('Team:', result.team);
        console.log('User:', result.user);
      }
    } else {
      console.log('Token invalide ❌');
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur de vérification:', error);
    throw error;
  }
}

// Test 4: Simuler la liaison de compte (nécessite d'être connecté sur muslim-guard.com)
async function testLink() {
  console.log('\n=== Test 4: Liaison du compte ===');
  console.log('⚠️ Assurez-vous d\'être connecté sur muslim-guard.com avant de lancer ce test');

  try {
    const token = await getValue('extensionToken');

    if (!token) {
      throw new Error('Extension non enregistrée. Lancez testRegister() d\'abord.');
    }

    const result = await linkExtensionToAccount(token);
    console.log('✅ Liaison réussie:', result);

    // Vérifier le nouveau statut
    const status = await getExtensionStatus();
    console.log('Nouveau statut:', status);

    return result;
  } catch (error) {
    console.error('❌ Erreur de liaison:', error);
    throw error;
  }
}

// Test 5: Flow complet
async function testFullFlow() {
  console.log('\n=== Test 5: Flow complet d\'authentification ===\n');

  try {
    // 1. Statut initial
    await testGetStatus();

    // 2. Vérifier si déjà enregistré
    const status = await getExtensionStatus();

    if (!status.registered) {
      console.log('\n➡️ Extension non enregistrée, enregistrement...');
      await testRegister();
    } else {
      console.log('\n✅ Extension déjà enregistrée');
    }

    // 3. Vérifier le token
    console.log('\n➡️ Vérification du token...');
    const verifyResult = await testVerify();

    // 4. Tester la liaison si pas déjà lié
    if (!verifyResult.linked) {
      console.log('\n➡️ Extension non liée à un compte');
      console.log('⚠️ Connectez-vous sur muslim-guard.com puis exécutez testLink()');
    } else {
      console.log('\n✅ Extension déjà liée au compte');
      console.log('Team:', verifyResult.team);
      console.log('User:', verifyResult.user);
    }

    console.log('\n=== ✅ Tests terminés ===');

  } catch (error) {
    console.error('\n=== ❌ Erreur durant les tests ===');
    console.error(error);
  }
}

// Exporter les fonctions de test
window.testExtensionAuth = {
  testGetStatus,
  testRegister,
  testVerify,
  testLink,
  testFullFlow
};

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🧪 Script de test de l'authentification extension chargé  ║
╚════════════════════════════════════════════════════════════╝

Commandes disponibles dans la console:

  testExtensionAuth.testGetStatus()   - Afficher le statut actuel
  testExtensionAuth.testRegister()    - Enregistrer l'extension
  testExtensionAuth.testVerify()      - Vérifier le token
  testExtensionAuth.testLink()        - Lier le compte (nécessite connexion)
  testExtensionAuth.testFullFlow()    - Exécuter tous les tests

Exemple d'utilisation:
  await testExtensionAuth.testFullFlow()
`);
