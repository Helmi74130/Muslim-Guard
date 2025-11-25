# 🚀 Guide d'Installation et Test de MuslimGuard

## Installation Rapide

### Étape 1 : Préparer les Icônes (Important !)

Les icônes actuelles sont des **placeholders**. Pour une meilleure expérience :

1. Ouvrez `muslimguard/assets/`
2. Créez ou téléchargez 3 vraies icônes :
   - `icon-16.png` (16x16 pixels)
   - `icon-48.png` (48x48 pixels)
   - `icon-128.png` (128x128 pixels)

**Suggestions de design :**
- Fond vert (#059669)
- Icône de mosquée 🕌 ou croissant ☪️
- Style moderne et épuré

**Outils gratuits :**
- [Canva](https://canva.com) - Facile et gratuit
- [Favicon.io](https://favicon.io) - Générateur rapide
- [Icon Kitchen](https://icon.kitchen) - Spécialisé extensions

Ou gardez les placeholders pour tester !

### Étape 2 : Charger l'Extension dans Chrome

1. **Ouvrez Chrome** et tapez dans la barre d'adresse :
   ```
   chrome://extensions/
   ```

2. **Activez le Mode Développeur**
   - En haut à droite, activez le toggle "Mode développeur"

3. **Chargez l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `muslimguard/`
   - L'extension apparaît dans la liste !

4. **Épinglez l'icône** (optionnel)
   - Cliquez sur l'icône puzzle 🧩 dans la toolbar
   - Trouvez "MuslimGuard"
   - Cliquez sur l'épingle 📌

### Étape 3 : Configuration Initiale

Au premier lancement, un onglet s'ouvre automatiquement pour la configuration :

1. **Bienvenue** → Cliquez "Commencer"

2. **Code PIN Parental**
   - Créez un PIN de 4-6 chiffres (ex: 1234)
   - Confirmez-le
   - (Optionnel) Ajoutez un email de récupération
   - ⚠️ **Notez bien ce PIN !**

3. **Mode de Protection**
   - Choisissez "Mode Modéré" (recommandé pour test)

4. **Horaires de Prière**
   - Gardez les horaires par défaut ou personnalisez
   - Activez ou désactivez la pause prière

5. **Terminé !**
   - Cliquez "Terminer et activer"
   - L'extension est maintenant active ✅

## 🧪 Tests Recommandés

### Test 1 : Blocage Basique

1. **Activez le blocage des réseaux sociaux**
   - Cliquez sur l'icône MuslimGuard
   - "Paramètres" (entrez votre PIN)
   - Onglet "Général" → Cochez "📱 Réseaux Sociaux"
   - Cliquez "💾 Sauvegarder"

2. **Testez un site bloqué**
   - Essayez d'aller sur facebook.com ou instagram.com
   - Vous devriez voir la page de blocage avec un verset du Coran ! 🕌

3. **Vérifiez les stats**
   - Cliquez sur l'icône MuslimGuard
   - "📈 Dashboard Parent"
   - Vous devriez voir 1 site bloqué dans les stats

### Test 2 : Whitelist

1. **Ajoutez un site à la whitelist**
   - Paramètres → Onglet "Listes de Blocage"
   - Dans "Sites Toujours Autorisés", ajoutez : `google.com`
   - Sauvegardez

2. **Testez**
   - Allez sur google.com → devrait fonctionner
   - Même si vous avez des filtres actifs !

### Test 3 : Mode Strict

1. **Activez le mode strict**
   - Paramètres → Onglet "Général"
   - Sélectionnez "Mode Strict"
   - Sauvegardez

2. **Testez**
   - Essayez d'aller sur n'importe quel site (même YouTube)
   - Tout devrait être bloqué sauf :
     - quran.com
     - islamqa.info
     - Sites dans votre whitelist

3. **Repassez en Mode Modéré** pour continuer les tests

### Test 4 : Horaires de Prière

1. **Configurez une prière dans 2 minutes**
   - Paramètres → Onglet "Horaires"
   - Dans "Fajr", mettez l'heure actuelle + 2 minutes
   - Activez "Pause pour les Prières"
   - Sauvegardez

2. **Attendez 2 minutes**
   - Vous devriez recevoir une notification 🕌
   - Essayez d'aller sur un site non-islamique → bloqué !
   - Essayez quran.com → accessible !

3. **Attendez 15 minutes** pour que la pause se termine

### Test 5 : Dashboard Parent

1. **Générez quelques blocages**
   - Essayez d'accéder à 5-10 sites différents bloqués

2. **Consultez le Dashboard**
   - Cliquez sur "📈 Dashboard Parent"
   - Vérifiez :
     - ✅ Nombre total de blocages
     - ✅ Top 10 sites bloqués
     - ✅ Graphique par jour
     - ✅ Logs détaillés avec timestamps

3. **Exportez les données**
   - Cliquez "📥 Exporter CSV"
   - Ouvrez le fichier → vous voyez tous les logs !

### Test 6 : Liste Recommandée

1. **Chargez la liste de 500+ sites**
   - Paramètres → Onglet "Listes"
   - Cliquez "📥 Charger 500+ sites recommandés"
   - Sauvegardez

2. **Testez des sites populaires**
   - YouTube → bloqué
   - Spotify → bloqué
   - Netflix → bloqué (si catégorie activée)
   - TikTok → bloqué

### Test 7 : Demande d'Accès

1. **Sur une page bloquée**
   - Scrollez vers le bas
   - Dans "Demander un accès exceptionnel", écrivez : "J'ai besoin pour un devoir"
   - Cliquez "Envoyer la demande"

2. **Vérifiez la notification**
   - Vous devriez recevoir une notification Chrome avec la demande

### Test 8 : Toggle Protection

1. **Désactivez la protection**
   - Cliquez sur l'icône MuslimGuard
   - Décochez le toggle "Protection"
   - Entrez votre PIN

2. **Testez**
   - Allez sur un site normalement bloqué
   - Il devrait s'afficher normalement maintenant

3. **Réactivez** (cochez à nouveau le toggle)

## 🐛 Résolution de Problèmes

### L'extension ne se charge pas

**Erreur : "Manifest file is invalid"**
- Vérifiez que `manifest.json` est bien formaté
- Vérifiez que tous les fichiers référencés existent

**Erreur : "Could not load icon"**
- Les icônes manquent ou sont mal nommées
- Créez des icônes PNG valides (voir Étape 1)

### Les sites ne sont pas bloqués

1. **Vérifiez que la protection est active**
   - Icône MuslimGuard → devrait afficher 🟢 Actif

2. **Vérifiez la console**
   - F12 → Console
   - Regardez les erreurs éventuelles

3. **Rechargez l'extension**
   - `chrome://extensions/` → 🔄 sur MuslimGuard

4. **Vérifiez les permissions**
   - Dans chrome://extensions/, cliquez sur "Détails"
   - Vérifiez que toutes les permissions sont accordées

### Le PIN ne fonctionne pas

**J'ai oublié mon PIN**
- Si vous avez configuré un email de récupération : utilisez-le
- Sinon : désinstallez et réinstallez l'extension (⚠️ perd toute la config)

**Le PIN est refusé alors qu'il est correct**
- Réessayez en tapant lentement
- Vérifiez qu'il n'y a pas d'espaces
- Réinstallez en dernier recours

### Les horaires de prière ne fonctionnent pas

1. **Vérifiez l'activation**
   - Paramètres → Horaires → Case "Activer la pause" cochée ?

2. **Vérifiez les horaires**
   - Sont-ils au bon format HH:MM ?
   - Correspondent-ils à l'heure actuelle ?

3. **Testez avec une heure proche**
   - Mettez Fajr dans 2 minutes
   - Attendez et vérifiez la notification

## 📝 Checklist Complète

Avant de considérer l'extension prête :

- [ ] Extension se charge sans erreur
- [ ] Setup initial complété avec PIN
- [ ] Blocage d'un domaine fonctionne
- [ ] Blocage par catégorie fonctionne
- [ ] Blocage par mot-clé fonctionne
- [ ] Whitelist fonctionne
- [ ] Mode Strict fonctionne
- [ ] Horaires de prière fonctionnent
- [ ] Dashboard affiche les stats
- [ ] Export CSV fonctionne
- [ ] Changement de PIN fonctionne
- [ ] Toggle protection ON/OFF fonctionne
- [ ] Demande d'accès envoie notification
- [ ] Liste recommandée charge 500+ sites
- [ ] Pas d'erreurs dans la console

## 🎨 Personnalisation Avancée

### Ajouter vos propres versets

1. Ouvrez `muslimguard/assets/verses.json`
2. Ajoutez un nouvel objet dans le tableau :
```json
{
  "text": "Votre verset en français",
  "ref": "Sourate XX (YY:ZZ)",
  "arabic": "النص العربي"
}
```

### Modifier les sites islamiques (whitelist par défaut)

1. Ouvrez `muslimguard/utils/lists.js`
2. Trouvez `ISLAMIC_SITES`
3. Ajoutez vos sites préférés

### Ajouter des catégories

1. Ouvrez `muslimguard/utils/lists.js`
2. Dans `CATEGORIES`, ajoutez une nouvelle catégorie :
```javascript
maNouvelleCat: {
  name: 'Ma Catégorie',
  domains: ['site1.com', 'site2.com']
}
```

## 🚀 Prochaines Étapes

Une fois que tout fonctionne :

1. **Personnalisez l'apparence**
   - Message de blocage personnalisé
   - Vraies icônes professionnelles

2. **Configurez pour votre famille**
   - Ajoutez les domaines spécifiques à bloquer
   - Réglez les horaires de prière précis pour votre ville
   - Configurez les plages horaires

3. **Testez sur la durée**
   - Utilisez l'extension pendant quelques jours
   - Vérifiez les stats
   - Ajustez les paramètres

4. **Partagez avec votre famille**
   - Expliquez comment ça marche
   - Montrez la page de blocage
   - Donnez des alternatives (quran.com, etc.)

## 💡 Conseils d'Utilisation

### Pour les Parents

- **Vérifiez le Dashboard régulièrement** (1x par semaine)
- **Soyez attentif aux pics de tentatives** (comportement suspect)
- **Communiquez avec vos enfants** sur pourquoi certains sites sont bloqués
- **Soyez flexible** avec les demandes d'accès légitimes (devoirs, travail)

### Pour les Jeunes

- **Respectez les règles** mises en place par vos parents
- **Profitez du temps libre** pour apprendre (quran.com, islamqa.info)
- **Demandez l'accès** si vous avez vraiment besoin (avec une bonne raison)
- **Voyez ça comme une protection**, pas une punition

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes non listés ici :

1. **Consultez le README.md** (documentation complète)
2. **Vérifiez la console** (F12) pour les erreurs
3. **Réinstallez** en dernier recours
4. **Ouvrez une issue** sur GitHub avec les détails

---

**Qu'Allah facilite votre utilisation et protège vos familles ! 💚**

*BarakAllahu fik pour avoir choisi MuslimGuard*
