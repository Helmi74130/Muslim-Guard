# 🔧 Guide de Diagnostic - Paramètres Ne Fonctionnent Pas

## Étape 1 : Vérifier la Console

1. **Ouvrez Chrome** et rechargez l'extension : `chrome://extensions/` → 🔄
2. **Cliquez sur l'icône MuslimGuard** dans la toolbar
3. **Ouvrez la console** : Clic droit sur le popup → "Inspecter"
4. **Cliquez sur "⚙️ Paramètres"**

### Que voyez-vous dans la console ?

**Si vous voyez :** `"Aucun PIN défini"` ou erreur similaire
→ **Problème :** Le setup n'a pas été complété
→ **Solution :** Complétez d'abord le setup (voir Étape 2)

**Si vous voyez :** Erreur avec `verifyPin` ou `import`
→ **Problème :** Erreur dans le code
→ **Solution :** Voir Étape 3

**Si rien ne se passe** (pas de modal PIN, pas d'erreur)
→ **Problème :** Event listener ne fonctionne pas
→ **Solution :** Voir Étape 4

---

## Étape 2 : Compléter le Setup Initial

Le setup DOIT être complété avant d'accéder aux paramètres.

```bash
1. Cliquez sur l'icône MuslimGuard
2. Si une page "Configuration MuslimGuard" s'ouvre → Suivez les étapes
3. Créez un PIN : 1234
4. Terminez le setup
5. Réessayez d'accéder aux Paramètres
```

---

## Étape 3 : Tester Manuellement

Testez directement la page options sans passer par le popup :

```bash
1. Ouvrez un nouvel onglet
2. Tapez dans la barre d'adresse :
   chrome-extension://[VOTRE_ID]/options/options.html

   Pour trouver votre ID :
   chrome://extensions/ → MuslimGuard → Copier "ID"

3. La page options devrait s'afficher
```

**Si la page ne s'affiche pas ou est blanche :**
→ Ouvrez la console (F12) et regardez les erreurs

---

## Étape 4 : Réinstaller l'Extension

Si rien ne fonctionne :

```bash
1. chrome://extensions/
2. MuslimGuard → "Retirer"
3. "Charger l'extension non empaquetée"
4. Sélectionnez : /home/user/Muslim-Guard/muslimguard/
5. Complétez le setup
6. Réessayez
```

---

## Problèmes Courants

### ❌ "Code PIN incorrect" alors que c'est le bon

**Cause :** Le PIN n'est pas encore créé ou corrompu

**Solution :**
```javascript
// Ouvrez la console du background worker
// chrome://extensions/ → MuslimGuard → "service worker"
// Tapez :
chrome.storage.local.get(null, console.log)
// Vérifiez si 'parentPinHash' existe
```

Si `parentPinHash` est `null` → Refaites le setup

### ❌ Modal PIN ne s'affiche pas

**Cause :** CSS ou JavaScript ne charge pas

**Solution :**
1. Vérifiez console : erreurs de chargement ?
2. Rechargez l'extension complètement
3. Vérifiez que styles.css existe

### ❌ Bouton "Paramètres" ne fait rien

**Cause :** Event listener non attaché

**Solution :** Rechargez le popup
- Fermez le popup
- Rechargez l'extension (🔄)
- Rouvrez le popup

---

## Test Rapide

Copiez ce code dans la console du popup pour tester :

```javascript
// Test si le bouton existe
console.log('Bouton Options:', document.getElementById('optionsBtn'));

// Test si l'event listener est attaché
document.getElementById('optionsBtn').click();
// Devrait afficher le modal PIN
```
