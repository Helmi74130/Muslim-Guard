/**
 * Script de test pour les différents états du plan Freemium
 *
 * Utilisation:
 * 1. Ouvrir la console DevTools (F12) sur n'importe quelle page de l'extension
 * 2. Copier-coller l'une des fonctions ci-dessous
 * 3. Recharger l'extension pour voir les changements
 */

// ============================================
// ÉTAT 1 : Utilisateur GRATUIT (Free)
// ============================================
async function setFreePlan() {
  await chrome.storage.local.set({
    userPlan: 'free',
    subscriptionStatus: null,
    planName: 'free',
    trialStartDate: null,
    trialEndDate: null,
    stripeCustomerId: null
  });

  console.log('✅ Plan défini sur: GRATUIT');
  console.log('📊 Quotas: 10 domaines, 10 keywords URL, 10 keywords contenu, 10 whitelist, 3 catégories');

  // Appliquer immédiatement les quotas (tronquer si nécessaire)
  await chrome.runtime.sendMessage({ action: 'enforceQuotas' });

  console.log('🔄 Quotas appliqués !');
  console.log('📋 Si la page des paramètres est ouverte, elle va se rafraîchir automatiquement.');
  console.log('💡 Sinon, ouvrez-la pour voir les changements.');
}

// ============================================
// ÉTAT 2 : Utilisateur en ESSAI (Trial - 7 jours)
// ============================================
function setTrialPlan(daysRemaining = 7) {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  chrome.storage.local.set({
    userPlan: 'trial',
    subscriptionStatus: 'trialing',
    planName: 'free',
    trialStartDate: now,
    trialEndDate: now + (daysRemaining * msPerDay),
    stripeCustomerId: null
  }, () => {
    console.log(`✅ Plan défini sur: ESSAI (${daysRemaining} jours restants)`);
    console.log('📊 Accès illimité pendant l\'essai');
    console.log('🔄 Rechargez l\'extension pour voir les changements');
  });
}

// ============================================
// ÉTAT 3 : Utilisateur PREMIUM (Actif)
// ============================================
function setPremiumPlan() {
  chrome.storage.local.set({
    userPlan: 'premium',
    subscriptionStatus: 'active',
    planName: 'MuslimGuard Premium',
    trialStartDate: null,
    trialEndDate: null,
    stripeCustomerId: 'cus_test_123456'
  }, () => {
    console.log('✅ Plan défini sur: PREMIUM');
    console.log('📊 Accès illimité à tout');
    console.log('🔄 Rechargez l\'extension pour voir les changements');
  });
}

// ============================================
// ÉTAT 4 : Essai EXPIRÉ (Trial → Free)
// ============================================
async function setExpiredTrial() {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  await chrome.storage.local.set({
    userPlan: 'free',
    subscriptionStatus: null,
    planName: 'free',
    trialStartDate: now - (8 * msPerDay),  // Il y a 8 jours
    trialEndDate: now - (1 * msPerDay),    // Terminé depuis 1 jour
    stripeCustomerId: null
  });

  console.log('✅ Plan défini sur: GRATUIT (essai expiré)');
  console.log('📊 Quotas limités - Application en cours...');

  // Appliquer immédiatement les quotas (tronquer si nécessaire)
  await chrome.runtime.sendMessage({ action: 'enforceQuotas' });

  console.log('🔄 Quotas appliqués !');
  console.log('📋 Si la page des paramètres est ouverte, elle va se rafraîchir automatiquement.');
  console.log('💡 Sinon, ouvrez-la pour voir les changements.');
}

// ============================================
// ÉTAT 5 : Essai bientôt terminé (1 jour restant)
// ============================================
function setTrialExpiringSoon() {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  chrome.storage.local.set({
    userPlan: 'trial',
    subscriptionStatus: 'trialing',
    planName: 'free',
    trialStartDate: now - (6 * msPerDay),  // Il y a 6 jours
    trialEndDate: now + (1 * msPerDay),    // Expire dans 1 jour
    stripeCustomerId: null
  }, () => {
    console.log('✅ Plan défini sur: ESSAI (1 jour restant)');
    console.log('⚠️ Notification devrait apparaître');
    console.log('🔄 Rechargez l\'extension pour voir les changements');
  });
}

// ============================================
// FONCTION UTILITAIRE : Voir l'état actuel
// ============================================
function checkCurrentPlan() {
  chrome.storage.local.get([
    'userPlan',
    'subscriptionStatus',
    'planName',
    'trialStartDate',
    'trialEndDate',
    'stripeCustomerId'
  ], (data) => {
    console.log('📊 État actuel du plan:');
    console.table(data);

    if (data.userPlan === 'trial' && data.trialEndDate) {
      const daysRemaining = Math.ceil((data.trialEndDate - Date.now()) / (24 * 60 * 60 * 1000));
      console.log(`⏰ Jours restants d'essai: ${daysRemaining}`);
    }
  });
}

// ============================================
// FONCTION UTILITAIRE : Réinitialiser tout
// ============================================
async function resetAllPlanData() {
  await chrome.storage.local.remove([
    'userPlan',
    'subscriptionStatus',
    'planName',
    'trialStartDate',
    'trialEndDate',
    'stripeCustomerId',
    'lastSyncTimestamp',
    'quotaMigrationDone',
    'keywordsMigrationDone'
  ]);

  console.log('✅ Toutes les données de plan supprimées');
  console.log('🔄 Rechargez l\'extension - elle sera en mode Free par défaut');
}

// ============================================
// FONCTION UTILITAIRE : Forcer l'application des quotas
// ============================================
async function forceEnforceQuotas() {
  console.log('🔄 Application forcée des quotas...');

  await chrome.runtime.sendMessage({ action: 'enforceQuotas' });

  console.log('✅ Quotas appliqués !');
  console.log('📋 Si la page des paramètres est ouverte, elle va se rafraîchir automatiquement.');
  console.log('💡 Sinon, ouvrez-la pour voir les changements.');
}

// ============================================
// FONCTION DEBUG : Vérifier l'état des mots-clés
// ============================================
async function checkKeywordsState() {
  const data = await chrome.storage.local.get([
    'blockedKeywords',
    'blockedKeywordsUrl',
    'blockedKeywordsContent',
    'keywordsMigrationDone',
    'userPlan'
  ]);

  console.log('📊 État actuel des mots-clés:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Plan:', data.userPlan || 'free');
  console.log('Migration effectuée:', data.keywordsMigrationDone ? '✅' : '❌');
  console.log('');
  console.log('Ancienne liste (blockedKeywords):', data.blockedKeywords ? `${data.blockedKeywords.length} items` : 'N/A');
  console.log('Mots-clés URL:', data.blockedKeywordsUrl ? `${data.blockedKeywordsUrl.length} items` : '0');
  console.log('Mots-clés Contenu:', data.blockedKeywordsContent ? `${data.blockedKeywordsContent.length} items` : '0');
  console.log('');

  if (data.blockedKeywordsUrl && data.blockedKeywordsUrl.length > 10) {
    console.warn('⚠️ PROBLÈME: Mots-clés URL dépassent la limite Free (10)');
  }
  if (data.blockedKeywordsContent && data.blockedKeywordsContent.length > 10) {
    console.warn('⚠️ PROBLÈME: Mots-clés Contenu dépassent la limite Free (10)');
  }

  return data;
}

// ============================================
// FONCTION FIX : Forcer migration + enforcement
// ============================================
async function forceMigrationAndEnforcement() {
  console.log('🔧 Forçage migration + enforcement...');
  console.log('');

  // 1. Vérifier l'état actuel
  const before = await checkKeywordsState();

  // 2. Forcer la migration
  console.log('');
  console.log('📦 Envoi du message de migration...');
  await chrome.runtime.sendMessage({ action: 'migrateKeywords' });

  // 3. Forcer l'enforcement
  console.log('⚖️ Envoi du message d\'enforcement...');
  await chrome.runtime.sendMessage({ action: 'enforceQuotas' });

  // 4. Vérifier le résultat
  console.log('');
  console.log('✅ Opération terminée ! Vérification...');
  setTimeout(async () => {
    await checkKeywordsState();
  }, 500);
}

// ============================================
// EXEMPLES D'UTILISATION
// ============================================
console.log(`
╔════════════════════════════════════════════════════════╗
║       SCRIPT DE TEST - États du Plan Freemium         ║
╚════════════════════════════════════════════════════════╝

📋 Fonctions disponibles:

1️⃣  setFreePlan()           → Utilisateur Gratuit
2️⃣  setTrialPlan(7)         → Essai 7 jours
3️⃣  setPremiumPlan()        → Premium actif
4️⃣  setExpiredTrial()       → Essai expiré
5️⃣  setTrialExpiringSoon()  → Essai expire dans 1 jour

🔍 checkCurrentPlan()              → Voir l'état actuel
♻️  resetAllPlanData()             → Tout réinitialiser
⚡ forceEnforceQuotas()            → Forcer l'application immédiate des quotas
🔧 checkKeywordsState()            → Vérifier l'état des mots-clés (debug)
🛠️  forceMigrationAndEnforcement() → Forcer migration + enforcement (FIX)

💡 Exemple: Tapez "setTrialPlan(3)" pour 3 jours d'essai restants
💡 Après avoir changé le plan, utilisez "forceEnforceQuotas()" pour tronquer immédiatement les données
💡 Si les mots-clés ne sont pas tronqués, utilisez "forceMigrationAndEnforcement()" pour tout corriger
`);
