# 🔐 Guide d'Authentification Extension - Muslim Guard

## 📋 Résumé des Changements

Ce document explique le nouveau système d'authentification de l'extension Muslim Guard qui permet de lier automatiquement l'extension au compte utilisateur payant.

---

## 🎯 Objectif

**Problème résolu :** Auparavant, les utilisateurs payants devaient manuellement configurer leur extension. Maintenant, l'extension se lie automatiquement à leur compte premium lorsqu'ils visitent muslim-guard.com.

**Flow utilisateur :**
1. Utilisateur installe l'extension
2. Extension s'enregistre automatiquement et obtient un token
3. Utilisateur se connecte sur muslim-guard.com (compte payant)
4. Lorsqu'il visite son dashboard, l'extension détecte la connexion et se lie automatiquement
5. L'extension passe en mode Premium automatiquement

---

## 🏗️ Architecture

### Fichiers Modifiés

#### 1. **utils/api.js** (nouvelles fonctions ajoutées)
- `registerExtension()` - Enregistre l'extension au backend
- `verifyExtensionToken()` - Vérifie le token et récupère l'état de liaison
- `linkExtensionToAccount()` - Lie l'extension au compte utilisateur

#### 2. **background.js**
- **Ligne 55-64:** Enregistrement automatique lors de l'installation
- **Ligne 622-677:** Listener pour détecter muslim-guard.com et lier automatiquement

#### 3. **utils/quotaManager.js**
- **syncUserSubscription()** utilise maintenant `verifyExtensionToken()` en priorité
- Fallback vers `fetchTeamData()` pour compatibilité

#### 4. **utils/extensionAuth.js** (nouveau fichier)
- Fonctions utilitaires pour gérer l'état d'authentification
- `getExtensionToken()`, `isExtensionLinked()`, `getExtensionStatus()`, etc.

#### 5. **popup/popup.js**
- Affiche le bouton "Se connecter" uniquement si extension enregistrée mais non liée

#### 6. **test-extension-auth.js** (nouveau fichier de test)
- Script pour tester le flow d'authentification dans la console du service worker

---

## 🔄 Flow d'Authentification Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INSTALLATION DE L'EXTENSION                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
      background.js: chrome.runtime.onInstalled
                           │
                           ▼
              registerExtension() appelé
                           │
                           ▼
      POST /api/extension/register
      {deviceName, extensionVersion}
                           │
                           ▼
      Backend retourne: {token, tokenId}
                           │
                           ▼
      Sauvegarde dans chrome.storage.local:
      - extensionToken
      - extensionTokenId
      - extensionRegisteredAt

┌─────────────────────────────────────────────────────────────┐
│ 2. UTILISATEUR VISITE MUSLIM-GUARD.COM                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
      chrome.webNavigation.onCompleted
      Détecte: muslim-guard.com/dashboard
                           │
                           ▼
      Récupère le token de chrome.storage
                           │
                           ▼
      POST /api/extension/link-account
      Body: {token}
      Headers: Cookie avec JWT session
                           │
                           ▼
      Backend associe le token à l'utilisateur connecté
                           │
                           ▼
      Sauvegarde dans chrome.storage.local:
      - isAuthenticated = true
                           │
                           ▼
      Notification: "Extension liée à votre compte!"

┌─────────────────────────────────────────────────────────────┐
│ 3. SYNC AUTOMATIQUE (toutes les heures)                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
      quotaManager.syncUserSubscription()
                           │
                           ▼
      verifyExtensionToken() appelé
                           │
                           ▼
      GET /api/extension/verify
      Headers: X-Extension-Token
                           │
                           ▼
      Backend retourne:
      {
        valid: true,
        linked: true,
        team: {...},
        user: {...}
      }
                           │
                           ▼
      Mise à jour du plan utilisateur:
      - userPlan = 'premium' (si abonné)
      - subscriptionStatus
      - teamId, userId
```

---

## 📦 Storage Keys

### Nouvelles Clés Ajoutées

| Clé | Type | Description | Exemple |
|-----|------|-------------|---------|
| `extensionToken` | string | Token unique de l'extension | `"ext_abc123..."` |
| `extensionTokenId` | string | ID du token dans la DB | `"507f1f77bcf86cd799439011"` |
| `extensionRegisteredAt` | number | Timestamp d'enregistrement | `1737379200000` |
| `isAuthenticated` | boolean | Extension liée à un compte | `true` |

### Clés Existantes Modifiées

| Clé | Modification |
|-----|--------------|
| `userPlan` | Maintenant mis à jour via `verifyExtensionToken()` |
| `teamId` | Sauvegardé lors de la liaison |
| `userId` | Sauvegardé lors de la liaison |

---

## 🧪 Guide de Test

### Prérequis
1. Backend Muslim-Guard en cours d'exécution
2. Extension chargée en mode développeur dans Chrome
3. Compte utilisateur sur muslim-guard.com (gratuit et premium pour les tests)

### Test 1: Enregistrement Initial

**Objectif:** Vérifier que l'extension s'enregistre automatiquement à l'installation

**Étapes:**
1. Ouvrir `chrome://extensions/`
2. Charger l'extension en mode développeur
3. Cliquer sur "Inspect views: service worker"
4. Dans la console, exécuter:
   ```javascript
   chrome.storage.local.get(['extensionToken', 'extensionTokenId'], console.log)
   ```

**Résultat attendu:**
```javascript
{
  extensionToken: "ext_abc123...",
  extensionTokenId: "507f1f77bcf86cd799439011"
}
```

**✅ Succès:** Les deux clés sont présentes et non null
**❌ Échec:** L'une des clés est null → Vérifier les logs du backend

---

### Test 2: Vérification du Token

**Objectif:** Vérifier que le token est valide côté backend

**Étapes:**
1. Ouvrir la console du service worker
2. Exécuter:
   ```javascript
   (async () => {
     const { verifyExtensionToken } = await import('./utils/api.js');
     const result = await verifyExtensionToken();
     console.log(result);
   })()
   ```

**Résultat attendu:**
```javascript
{
  valid: true,
  linked: false  // Pas encore lié à un compte
}
```

**✅ Succès:** `valid: true`
**❌ Échec:** `valid: false` ou erreur → Vérifier le token dans la DB

---

### Test 3: Liaison Automatique (Utilisateur Gratuit)

**Objectif:** Vérifier que l'extension détecte et se lie automatiquement

**Étapes:**
1. Se connecter sur muslim-guard.com avec un compte GRATUIT
2. Visiter `/dashboard`
3. Observer la console du service worker
4. Vérifier le storage:
   ```javascript
   chrome.storage.local.get(['isAuthenticated', 'teamId', 'userId'], console.log)
   ```

**Résultat attendu:**
- Log dans console: `Extension liée au compte utilisateur`
- Notification Chrome affichée
- Storage:
  ```javascript
  {
    isAuthenticated: true,
    teamId: "507f...",
    userId: "507f..."
  }
  ```

**✅ Succès:** Extension liée automatiquement
**❌ Échec:** Pas de liaison → Vérifier que le cookie JWT est présent

---

### Test 4: Liaison Automatique (Utilisateur Premium)

**Objectif:** Vérifier que le plan Premium est bien appliqué

**Étapes:**
1. Se connecter sur muslim-guard.com avec un compte PREMIUM
2. Visiter `/dashboard`
3. Attendre 2-3 secondes (sync automatique)
4. Vérifier le plan:
   ```javascript
   chrome.storage.local.get(['userPlan', 'subscriptionStatus'], console.log)
   ```
5. Ouvrir le popup de l'extension

**Résultat attendu:**
- Storage:
  ```javascript
  {
    userPlan: "premium",
    subscriptionStatus: "active"
  }
  ```
- Popup: Pas de bandeau "Version Gratuite"
- Popup: Pas de bouton "Se connecter"

**✅ Succès:** Plan Premium appliqué
**❌ Échec:** Toujours en Free → Vérifier la réponse de `/api/extension/verify`

---

### Test 5: Popup - Bouton "Se connecter"

**Objectif:** Vérifier que le bouton apparaît uniquement quand nécessaire

**Scénario A - Extension non liée (compte Free):**
1. Réinitialiser `isAuthenticated`:
   ```javascript
   chrome.storage.local.set({isAuthenticated: false})
   ```
2. Ouvrir le popup de l'extension

**Résultat attendu:** Bouton "Se connecter" visible en bleu

**Scénario B - Extension liée (compte Premium):**
1. Se connecter et lier l'extension
2. Ouvrir le popup

**Résultat attendu:** Bouton "Se connecter" caché

**✅ Succès:** Comportement correct
**❌ Échec:** Bouton toujours visible/caché → Vérifier `checkLoginStatus()`

---

### Test 6: Sync Automatique Horaire

**Objectif:** Vérifier que le sync fonctionne automatiquement

**Étapes:**
1. Extension liée à un compte Premium
2. Dans le backend, downgrader l'utilisateur vers Free
3. Attendre 1 heure OU forcer le sync:
   ```javascript
   chrome.alarms.create('sync-subscription', {delayInMinutes: 0.1})
   ```
4. Vérifier le plan après 1 minute:
   ```javascript
   chrome.storage.local.get(['userPlan'], console.log)
   ```

**Résultat attendu:**
- `userPlan: "free"`
- Popup affiche le bandeau "Version Gratuite"

**✅ Succès:** Sync détecte le changement de plan
**❌ Échec:** Plan non mis à jour → Vérifier les logs de `syncUserSubscription()`

---

### Test 7: Script de Test Intégré

**Objectif:** Utiliser le script de test automatisé

**Étapes:**
1. Ouvrir la console du service worker
2. Charger le script de test (déjà importé dans background.js si module)
3. Exécuter le flow complet:
   ```javascript
   // Charger le script
   await import('./test-extension-auth.js')

   // Exécuter tous les tests
   await testExtensionAuth.testFullFlow()
   ```

**Résultat attendu:**
```
=== Test 1: Statut actuel de l'extension ===
✅ Extension enregistrée
Token: ext_abc123...
TokenId: 507f...

=== Test 2: Enregistrement de l'extension ===
✅ Déjà enregistré

=== Test 3: Vérification du token ===
✅ Token valide
Lié: true
Team: {...}
User: {...}

=== ✅ Tests terminés ===
```

**✅ Succès:** Tous les tests passent
**❌ Échec:** Suivre les instructions du script

---

## 🐛 Débogage

### Problème: Extension non enregistrée

**Symptômes:**
- `extensionToken` est `null`
- Erreur dans la console du service worker

**Solutions:**
1. Vérifier que le backend est accessible
2. Vérifier les logs du backend pour `/api/extension/register`
3. Réinstaller l'extension:
   ```javascript
   chrome.management.uninstallSelf()
   // Puis recharger l'extension
   ```

---

### Problème: Extension ne se lie pas automatiquement

**Symptômes:**
- `isAuthenticated` reste `false`
- Pas de notification lors de la visite de muslim-guard.com

**Solutions:**
1. Vérifier que vous êtes bien connecté sur muslim-guard.com:
   ```javascript
   // Dans la console du site
   document.cookie
   // Doit contenir "jwt=..."
   ```
2. Vérifier les logs du listener dans background.js
3. Forcer la liaison manuellement:
   ```javascript
   const { linkExtensionToAccount } = await import('./utils/api.js');
   const token = (await chrome.storage.local.get('extensionToken')).extensionToken;
   await linkExtensionToAccount(token);
   ```

---

### Problème: Plan Premium non appliqué

**Symptômes:**
- Extension liée mais `userPlan` reste `"free"`
- Bandeau "Version Gratuite" visible

**Solutions:**
1. Vérifier la réponse de `/api/extension/verify`:
   ```javascript
   const { verifyExtensionToken } = await import('./utils/api.js');
   const result = await verifyExtensionToken();
   console.log(result.team, result.user);
   ```
2. Vérifier le statut Stripe dans le backend:
   - User.stripeSubscriptionStatus doit être "active"
   - Team.plan doit être "premium"
3. Forcer un sync:
   ```javascript
   const { syncUserSubscription } = await import('./utils/quotaManager.js');
   await syncUserSubscription();
   ```

---

## 📊 API Endpoints Utilisés

### POST /api/extension/register

**Request:**
```json
{
  "deviceName": "Windows 10 - Chrome",
  "extensionVersion": "2.0.0"
}
```

**Response:**
```json
{
  "token": "ext_abc123...",
  "tokenId": "507f1f77bcf86cd799439011"
}
```

---

### POST /api/extension/link-account

**Headers:**
```
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:**
```json
{
  "token": "ext_abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Extension linked successfully"
}
```

---

### GET /api/extension/verify

**Headers:**
```
X-Extension-Token: ext_abc123...
```

**Response (Non lié):**
```json
{
  "valid": true,
  "linked": false
}
```

**Response (Lié - Free):**
```json
{
  "valid": true,
  "linked": true,
  "team": {
    "_id": "507f...",
    "name": "Famille Dupont",
    "plan": "free"
  },
  "user": {
    "_id": "507f...",
    "email": "user@example.com",
    "role": "parent"
  }
}
```

**Response (Lié - Premium):**
```json
{
  "valid": true,
  "linked": true,
  "team": {
    "_id": "507f...",
    "name": "Famille Dupont",
    "plan": "premium",
    "stripeSubscriptionStatus": "active"
  },
  "user": {
    "_id": "507f...",
    "email": "user@example.com",
    "role": "parent"
  }
}
```

---

## 🎓 Cas d'Usage

### Cas 1: Nouvel Utilisateur Gratuit

1. ✅ Installe l'extension → Enregistrement auto
2. ✅ Ouvre le popup → Voit "Version Gratuite" + bouton "Se connecter"
3. ✅ Clique sur "Se connecter" → Redirigé vers muslim-guard.com
4. ✅ Crée un compte gratuit et se connecte
5. ✅ Visite le dashboard → Extension se lie automatiquement
6. ✅ Popup mis à jour → Bouton "Se connecter" disparaît

---

### Cas 2: Utilisateur Premium (déjà abonné)

1. ✅ Installe l'extension → Enregistrement auto
2. ✅ Ouvre le popup → Voit "Version Gratuite" + bouton "Se connecter"
3. ✅ Clique sur "Se connecter" → Redirigé vers muslim-guard.com
4. ✅ Se connecte avec son compte premium existant
5. ✅ Visite le dashboard → Extension se lie automatiquement
6. ✅ Sync automatique → Plan passe en "premium"
7. ✅ Popup mis à jour → Bandeau disparaît, fonctionnalités premium activées

---

### Cas 3: Utilisateur passe de Free à Premium

1. ✅ Extension déjà installée et liée (Free)
2. ✅ Utilisateur s'abonne sur muslim-guard.com
3. ✅ Attend 1h (ou force le sync)
4. ✅ Extension passe automatiquement en Premium
5. ✅ Quotas illimités activés

---

## ✅ Checklist de Déploiement

Avant de déployer en production:

- [ ] Tous les tests passent (Test 1-7)
- [ ] Backend en production testé
- [ ] Variables d'environnement configurées
- [ ] Logs de débogage désactivés
- [ ] Version dans manifest.json mise à jour
- [ ] Documentation utilisateur créée
- [ ] Support client informé du nouveau flow

---

## 📞 Support

En cas de problème, vérifier:
1. Logs du service worker: `chrome://extensions/` → Inspect views
2. Logs du backend: `/api/extension/*`
3. State du storage: `chrome.storage.local.get(null, console.log)`

**Contacts:**
- Backend: Vérifier les logs Vercel/Heroku
- Extension: Console du service worker
