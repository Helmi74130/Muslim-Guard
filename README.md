# 🕌 MuslimGuard - Contrôle Parental Islamique

Extension Chrome de contrôle parental conçue pour les familles musulmanes. Protégez votre famille des contenus inappropriés tout en respectant les valeurs islamiques.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Configuration Initiale](#configuration-initiale)
- [Guide d'Utilisation](#guide-dutilisation)
- [Architecture Technique](#architecture-technique)
- [Développement](#développement)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Support](#support)

## ✨ Fonctionnalités

### 🔒 Système d'Authentification
- Code PIN parental (4-6 chiffres) avec hash SHA-256
- Email de récupération (stocké localement)
- Session temporaire pour ne pas redemander le PIN à chaque action
- Changement de PIN sécurisé

### 🛡️ Gestion des Blocages

#### Modes de Protection
- **Mode Strict** : Bloque tout sauf sites éducatifs et islamiques
- **Mode Modéré** (recommandé) : Bloque contenus inappropriés selon catégories
- **Mode Permissif** : Bloque uniquement contenus explicites

#### Catégories de Blocage
- 📱 Réseaux Sociaux (Facebook, Instagram, TikTok, Snapchat, Twitter)
- 🎵 Streaming Musical (Spotify, Deezer, SoundCloud, Apple Music)
- 📺 Streaming Vidéo (Netflix, Prime Video, Disney+, Hulu)
- 💕 Sites de Rencontre (Tinder, Bumble, Match)
- 🎮 Jeux en Ligne (Steam, Epic Games, Roblox)
- 🔞 Contenu Adulte (liste extensive)
- 💬 Reddit & Forums

#### Listes Personnalisables
- **Liste noire** : Domaines à bloquer (supporte wildcards: *.youtube.com)
- **Mots-clés** : Bloque URLs contenant certains mots
- **Whitelist** : Sites toujours autorisés (sites islamiques inclus par défaut)
- **Liste recommandée** : 500+ sites pré-définis chargeable en un clic

### ⏰ Horaires & Scheduling

#### Pause pour les Prières
- Définissez les 5 horaires de prière (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Internet en pause ±15 minutes autour de chaque prière
- Sites islamiques toujours accessibles
- Notification avec countdown

#### Plages Horaires
- Limitez l'accès internet à certaines heures (ex: 14h-22h)
- Parfait pour gérer le temps d'écran des enfants

### 📊 Monitoring & Statistiques

#### Dashboard Parent
- Nombre total de sites bloqués (7 derniers jours)
- Top 10 des sites bloqués
- Graphiques par jour et par heure
- Détection de comportements suspects (>10 tentatives/jour)
- Streak : jours consécutifs sans tentative de blocage

#### Logs Détaillés
- URL complète tentée
- Timestamp précis
- Raison du blocage (domaine, mot-clé, catégorie, etc.)
- Historique des 1000 dernières entrées (FIFO)
- Export CSV pour analyse

#### Alertes
- Notification si comportement suspect détecté
- Demandes d'accès exceptionnel avec raison

### 🚫 Page de Blocage Personnalisée

Quand un site est bloqué, l'utilisateur voit :
- Message personnalisable par le parent
- Verset du Coran aléatoire (en arabe et français)
- Suggestions d'alternatives halal :
  - 📖 Lire le Coran (quran.com)
  - 🎓 Apprendre l'Islam (islamqa.info)
  - 📺 Cours vidéo (bayyinah.tv)
  - 🌙 Éducation islamique (seekersguidance.org)
- Countdown jusqu'à la prochaine prière
- Option "Demander accès exceptionnel" (envoie notification au parent)

### 🎯 Détection Intelligente

- Scan de mots-clés suspects dans le contenu HTML
- Détection de lecteurs audio/vidéo (musique potentielle)
- Blocage automatique des iframes suspectes
- Warning visuel si contenu douteux détecté
- Détection de tentatives de bypass (VPN, proxies)

### 🎨 Interface Utilisateur

#### Popup Extension
- Toggle rapide protection ON/OFF (nécessite PIN si désactivation)
- Statut en temps réel (🟢 Actif / 🔴 Désactivé)
- Stats du jour : sites bloqués, streak
- Prochaine prière avec countdown
- Accès rapide Dashboard et Paramètres

#### Page Options Complète
- Tabs : Général, Listes, Horaires, Apparence
- Design moderne avec Tailwind CSS
- Interface intuitive et accessible

## 📥 Installation

### Mode Développement (pour tester)

1. **Clonez ou téléchargez le repository**
   ```bash
   git clone https://github.com/votre-username/muslimguard.git
   cd muslimguard
   ```

2. **Ouvrez Chrome et allez dans les extensions**
   - Tapez `chrome://extensions/` dans la barre d'adresse
   - Activez le "Mode développeur" (coin supérieur droit)

3. **Chargez l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `muslimguard/`
   - L'extension devrait apparaître dans votre toolbar

4. **Configuration initiale**
   - Au premier lancement, la page de setup s'ouvre automatiquement
   - Suivez les étapes pour créer votre PIN et configurer l'extension

### Installation depuis Chrome Web Store (à venir)

L'extension sera bientôt disponible sur le Chrome Web Store pour une installation en un clic.

## ⚙️ Configuration Initiale

### Étape 1 : Bienvenue
Présentation des fonctionnalités principales.

### Étape 2 : Code PIN Parental
- Créez un code PIN de 4 à 6 chiffres
- Confirmez le PIN
- (Optionnel) Ajoutez un email de récupération

⚠️ **Important** : Notez bien votre PIN ! Il sera nécessaire pour toute modification de paramètres.

### Étape 3 : Mode de Protection
Choisissez parmi :
- Mode Strict (jeunes enfants)
- Mode Modéré (recommandé pour ados)
- Mode Permissif (adultes responsables)

### Étape 4 : Horaires de Prière
- Activez/désactivez la pause pour les prières
- Configurez les horaires des 5 prières quotidiennes
- Internet sera en pause ±15 minutes autour de chaque prière

### Étape 5 : Terminé !
L'extension est maintenant active et protège votre navigation.

## 📖 Guide d'Utilisation

### Pour les Parents

#### Accéder aux Paramètres
1. Cliquez sur l'icône MuslimGuard dans la toolbar
2. Cliquez sur "⚙️ Paramètres"
3. Entrez votre code PIN

#### Personnaliser les Listes de Blocage
1. Dans les Paramètres, onglet "Listes de Blocage"
2. Ajoutez des domaines (un par ligne) dans "Domaines Bloqués"
3. Wildcards supportés : `*.youtube.com`, `*.tiktok.*`
4. Cliquez sur "📥 Charger 500+ sites recommandés" pour une liste complète
5. N'oubliez pas de cliquer "💾 Sauvegarder"

#### Consulter les Statistiques
1. Cliquez sur l'icône MuslimGuard
2. Cliquez sur "📈 Dashboard Parent"
3. Consultez :
   - Nombre de sites bloqués
   - Top 10 des sites tentés
   - Graphiques par jour/heure
   - Logs détaillés des tentatives

#### Exporter les Données
1. Dans le Dashboard, cliquez "📥 Exporter CSV"
2. Le fichier contient tous les logs des 7 derniers jours
3. Ouvrez avec Excel/LibreOffice pour analyse

#### Gérer les Demandes d'Accès
Quand un enfant demande un accès exceptionnel :
1. Vous recevez une notification Chrome
2. Cliquez sur "Autoriser 30 min" ou "Refuser"
3. Si autorisé, le site sera accessible pendant 30 minutes

#### Changer le Code PIN
1. Paramètres → Onglet "Apparence"
2. Section "Changer le Code PIN"
3. Entrez l'ancien PIN, puis le nouveau (2 fois)
4. Cliquez "Changer le PIN"

### Pour les Enfants/Utilisateurs

#### Quand un Site est Bloqué
Vous verrez une page avec :
- Un verset du Coran
- Des suggestions de sites islamiques
- Le temps avant la prochaine prière
- Une option pour demander un accès exceptionnel

#### Demander un Accès Exceptionnel
1. Sur la page de blocage, scrollez vers le bas
2. Dans "Demander un accès exceptionnel", expliquez pourquoi vous avez besoin d'accéder au site
3. Cliquez "Envoyer la demande"
4. Attendez qu'un parent approuve (il recevra une notification)

#### Voir vos Statistiques
- Cliquez sur l'icône MuslimGuard
- Consultez votre streak (jours sans tentative)
- Voyez combien de sites ont été bloqués aujourd'hui

## 🏗️ Architecture Technique

### Structure des Fichiers

```
muslimguard/
├── manifest.json           # Configuration Manifest V3
├── rules.json              # Règles declarativeNetRequest
├── background.js           # Service Worker principal
├── content.js              # Script injecté dans les pages
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css (via Tailwind CDN)
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css (via Tailwind CDN)
├── blocked/
│   ├── blocked.html
│   ├── blocked.js
│   └── blocked.css (via Tailwind CDN)
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.js
│   └── dashboard.css (via Tailwind CDN)
├── setup/
│   ├── setup.html
│   └── setup.js
├── utils/
│   ├── storage.js          # Helpers chrome.storage
│   ├── auth.js             # Gestion PIN/authentification
│   ├── lists.js            # Listes de sites par défaut
│   └── analytics.js        # Calculs statistiques
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    ├── icon-128.png
    └── verses.json         # Versets du Coran
```

### Technologies Utilisées

- **Manifest V3** (dernière version Chrome)
- **JavaScript ES6+** (modules, async/await)
- **chrome.storage.local** (stockage local, pas de serveur)
- **chrome.webRequest** (interception requêtes)
- **chrome.alarms** (tâches périodiques)
- **chrome.notifications** (alertes)
- **Tailwind CSS** (styling via CDN)
- **Crypto Web API** (hash SHA-256 pour PIN)

### Permissions Utilisées

```json
{
  "permissions": [
    "storage",           // Stockage local
    "tabs",              // Accès aux onglets
    "alarms",            // Tâches périodiques
    "notifications",     // Notifications système
    "declarativeNetRequest",        // Blocage déclaratif
    "declarativeNetRequestFeedback", // Feedback sur blocages
    "scripting"          // Injection scripts
  ],
  "host_permissions": [
    "<all_urls>"         // Nécessaire pour bloquer n'importe quel site
  ]
}
```

### Stockage des Données

Toutes les données sont stockées localement dans `chrome.storage.local` :

```javascript
{
  // Authentification
  parentPinHash: "sha256hash...",
  parentPinSalt: "randomsalt...",
  recoveryEmail: "parent@email.com",
  isSetupComplete: true,

  // Configuration
  protectionEnabled: true,
  protectionMode: "moderate",

  // Listes
  blockedDomains: ["youtube.com", ...],
  blockedKeywords: ["music", ...],
  whitelistedSites: ["quran.com", ...],

  // Catégories
  blockSocialMedia: true,
  blockMusicStreaming: true,
  // ...

  // Horaires
  prayerTimes: ["05:30", "13:00", ...],
  prayerPauseEnabled: true,
  scheduleEnabled: false,
  allowedHoursStart: "00:00",
  allowedHoursEnd: "23:59",

  // Logs & Stats
  blockedLog: [
    {url: "...", timestamp: 123456, reason: "domain"},
    // ... (max 1000 entrées)
  ],
  statsToday: {
    date: "...",
    blockedCount: 45,
    topBlockedSites: {...}
  }
}
```

### Flux de Blocage

1. L'utilisateur tente d'accéder à une URL
2. `background.js` intercepte via `chrome.webRequest.onBeforeRequest`
3. Vérifications dans l'ordre :
   - Protection activée ?
   - Heure de prière ?
   - Mode invité actif ?
   - Site dans la whitelist ?
   - Mode strict ?
   - Domaine bloqué ?
   - Catégorie bloquée ?
   - Mot-clé suspect ?
   - Horaire autorisé ?
4. Si bloqué : redirection vers `blocked/blocked.html?reason=...`
5. Log enregistré dans `chrome.storage.local`
6. Stats mises à jour

### Sécurité

#### Hashage du PIN
```javascript
// Génération salt aléatoire
const salt = crypto.getRandomValues(new Uint8Array(16));

// Hash SHA-256
const data = new TextEncoder().encode(pin + salt);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hash = Array.from(new Uint8Array(hashBuffer))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
```

#### Protection contre la Manipulation
- PIN hashé, jamais stocké en clair
- Pas de backdoor / master password
- Extension non désinstallable sans PIN (à implémenter via Enterprise Policy)
- Détection de tentatives de modification du `chrome.storage`

## 🛠️ Développement

### Prérequis
- Google Chrome (version 88+)
- Éditeur de code (VS Code recommandé)
- Connaissances en JavaScript ES6+

### Setup Environnement de Dev

1. **Clone le repo**
   ```bash
   git clone https://github.com/votre-username/muslimguard.git
   cd muslimguard
   ```

2. **Charge l'extension en mode dev**
   - `chrome://extensions/`
   - Mode développeur ON
   - "Charger l'extension non empaquetée" → sélectionner le dossier

3. **Modifications**
   - Éditez les fichiers
   - Cliquez sur 🔄 dans `chrome://extensions/` pour recharger
   - Ou utilisez l'extension "Extensions Reloader"

### Structure du Code

#### Modules ES6
Tous les fichiers utils utilisent `export` / `import` :
```javascript
// utils/storage.js
export async function getConfig() { ... }

// popup/popup.js
import { getConfig } from '../utils/storage.js';
```

#### Style de Code
- **Async/await** plutôt que callbacks
- **Try/catch** pour toutes les opérations async
- **Commentaires** en français
- **Nommage** : camelCase pour variables, PascalCase pour classes
- **Indentation** : 2 espaces

#### Exemple
```javascript
// ✅ Bon
async function loadData() {
  try {
    const config = await getConfig();
    return config;
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}

// ❌ Mauvais
function loadData(callback) {
  chrome.storage.local.get(null, function(result) {
    callback(result);
  });
}
```

### Tests

#### Tests Manuels
1. Installez l'extension en mode dev
2. Testez chaque fonctionnalité :
   - [ ] Création PIN
   - [ ] Blocage domaine
   - [ ] Blocage mot-clé
   - [ ] Blocage catégorie
   - [ ] Mode strict
   - [ ] Pause prière
   - [ ] Horaires
   - [ ] Whitelist
   - [ ] Stats dashboard
   - [ ] Export CSV
   - [ ] Changement PIN
   - [ ] Reset config

#### Console Logs
- `console.log()` dans les fichiers pour debug
- Ouvrez DevTools sur chaque page (F12)
- Service Worker logs : `chrome://extensions/` → "Inspecter les vues" → background.html

### Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## ❓ FAQ

### Questions Générales

**Q : L'extension est-elle gratuite ?**
R : Oui, MuslimGuard est 100% gratuit et open source.

**Q : Mes données sont-elles envoyées sur un serveur ?**
R : Non ! Toutes les données sont stockées localement dans votre navigateur. Aucune donnée n'est envoyée nulle part.

**Q : Puis-je utiliser l'extension sur plusieurs ordinateurs ?**
R : Oui, mais vous devrez installer et configurer l'extension séparément sur chaque appareil. L'export/import de config peut vous aider à synchroniser manuellement.

**Q : L'extension fonctionne-t-elle en mode incognito ?**
R : Par défaut, non. Vous pouvez l'activer dans `chrome://extensions/` → Détails de MuslimGuard → "Autoriser en mode navigation privée".

### Problèmes Techniques

**Q : L'extension ne bloque pas certains sites**
R : Vérifiez que :
- La protection est activée (🟢 dans le popup)
- Le site n'est pas dans la whitelist
- Le mode de protection correspond à vos attentes (Strict/Modéré/Permissif)
- Les listes sont à jour (sauvegardées)

**Q : J'ai oublié mon PIN, que faire ?**
R : Si vous avez configuré un email de récupération lors du setup, vous pouvez l'utiliser. Sinon, vous devrez malheureusement réinstaller l'extension (ce qui effacera toute la config).

**Q : Les horaires de prière ne sont pas corrects**
R : Les horaires doivent être configurés manuellement dans les Paramètres → Horaires. Vous pouvez utiliser des sites comme islamicfinder.org pour obtenir les horaires précis de votre ville.

**Q : L'extension ralentit mon navigateur**
R : L'extension est optimisée pour être légère. Si vous constatez des ralentissements :
- Réduisez le nombre de domaines dans la liste noire (gardez l'essentiel)
- Désactivez les logs si vous n'en avez pas besoin
- Nettoyez les vieux logs (automatique tous les 30 jours)

### Personnalisation

**Q : Puis-je changer le message de la page de blocage ?**
R : Oui ! Paramètres → Apparence → "Message de Blocage"

**Q : Puis-je ajouter mes propres versets ?**
R : Oui, éditez le fichier `assets/verses.json` et ajoutez vos versets préférés au format JSON.

**Q : Puis-je utiliser l'extension en anglais/arabe ?**
R : Pour l'instant, l'interface est en français. Le support multilingue est prévu dans une future version.

## 🗺️ Roadmap

### Version 1.1 (Prochainement)
- [ ] Support multilingue (FR, EN, AR)
- [ ] Mode sombre
- [ ] Profils multiples enfants (switch facile)
- [ ] API automatique horaires prières (aladhan.com)
- [ ] Export/Import config JSON
- [ ] Statistiques avancées (graphiques plus détaillés)

### Version 1.2
- [ ] Extension Firefox
- [ ] Sync cloud optionnel (chiffré)
- [ ] Application mobile companion (Android)
- [ ] Whitelist temporaire avec minuteur visible
- [ ] Blocage intelligent par IA (détection contenu)

### Version 2.0
- [ ] Support Safari
- [ ] Application desktop (Windows/Mac/Linux)
- [ ] Gestion centralisée multi-devices
- [ ] Rapports hebdomadaires par email
- [ ] Intégration Google Family Link

### Idées Futures
- Partenariat avec sites islamiques pour contenu éducatif
- Gamification (plus d'achievements, récompenses)
- Cours islamiques intégrés
- Assistant de lecture du Coran
- Rappels de dhikr

## 📞 Support

### Besoin d'Aide ?

- **Documentation** : Lisez ce README en entier
- **Issues GitHub** : [github.com/votre-username/muslimguard/issues](https://github.com/votre-username/muslimguard/issues)
- **Email** : support@muslimguard.com (si disponible)
- **Discord** : [Serveur communautaire](https://discord.gg/muslimguard) (si disponible)

### Signaler un Bug

1. Allez dans [Issues GitHub](https://github.com/votre-username/muslimguard/issues)
2. Cliquez "New Issue"
3. Décrivez le bug en détail :
   - Étapes pour reproduire
   - Comportement attendu
   - Comportement observé
   - Captures d'écran si possible
   - Version de Chrome
   - Version de l'extension

### Proposer une Fonctionnalité

Même processus que pour les bugs, mais utilisez le label "enhancement".

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Remerciements

- Communauté musulmane pour les suggestions
- Contributeurs open source
- Familles qui testent et utilisent l'extension

## 💚 Dua

Qu'Allah facilite votre chemin vers la piété et protège vos familles. Ameen.

---

**Fait avec 💚 pour les familles musulmanes**

*"Ô vous qui avez cru! Préservez vos personnes et vos familles, d'un Feu dont le combustible sera les gens et les pierres." - Sourate At-Tahrim (66:6)*
