// content.js - Script injecté dans toutes les pages

/**
 * Détecte les mots-clés suspects dans la page
 */
function detectSuspiciousContent(customKeywords = []) {
  try {
    const bodyText = document.body?.innerText?.toLowerCase() || '';
    const title = document.title?.toLowerCase() || '';

    // Utilise les mots-clés personnalisés de la config
    const keywords = customKeywords.length > 0 ? customKeywords : [
      // Liste par défaut au cas où
      'porn', 'xxx', 'adult', 'sex', 'nude', 'nsfw',
      'casino', 'gambling', 'bet', 'poker',
      'dating', 'hookup', 'meet singles',
      'music', 'spotify', 'deezer', 'soundcloud'
    ];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (bodyText.includes(keywordLower) || title.includes(keywordLower)) {
        return { suspicious: true, keyword };
      }
    }

    return { suspicious: false };
  } catch (error) {
    console.error('Erreur lors de la détection de contenu:', error);
    return { suspicious: false };
  }
}

/**
 * Affiche un overlay plein écran bloquant avec le mot détecté
 */
function showBlockOverlay(keyword) {
  // Vérifie si l'overlay existe déjà
  if (document.getElementById('muslimguard-block-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'muslimguard-block-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    animation: fadeIn 0.3s ease-out;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>

    <div style="
      max-width: 600px;
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.5s ease-out;
    ">
      <!-- Icône d'alerte -->
      <div style="
        font-size: 80px;
        margin-bottom: 20px;
        animation: pulse 2s infinite;
      ">🚫</div>

      <!-- Titre -->
      <h1 style="
        color: #e74c3c;
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 15px 0;
      ">Contenu Bloqué</h1>

      <!-- Message principal -->
      <p style="
        color: #34495e;
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 25px 0;
      ">
        Cette page contient du contenu inapproprié détecté par <strong>MuslimGuard</strong>.
      </p>

      <!-- Mot détecté -->
      <div style="
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border-left: 4px solid #e74c3c;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 30px;
      ">
        <p style="
          margin: 0;
          color: #991b1b;
          font-size: 14px;
          font-weight: 600;
        ">
          ⚠️ Mot-clé détecté : <span style="
            background: #dc2626;
            color: white;
            padding: 3px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 13px;
          ">${keyword}</span>
        </p>
      </div>

      <!-- Bouton retour -->
      <button id="muslimguard-back-btn" style="
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        color: white;
        border: none;
        padding: 15px 40px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
        transition: all 0.3s ease;
        margin-right: 10px;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(52, 152, 219, 0.6)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(52, 152, 219, 0.4)';">
        ← Revenir en arrière
      </button>

      <!-- Info supplémentaire -->
      <p style="
        color: #7f8c8d;
        font-size: 12px;
        margin-top: 25px;
        line-height: 1.5;
      ">
        Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur.<br>
        🛡️ <strong>MuslimGuard</strong> - Protection parentale islamique
      </p>
    </div>
  `;

  // Ajoute l'overlay au body
  document.body.appendChild(overlay);

  // Empêche le scroll du body
  document.body.style.overflow = 'hidden';

  // Événement du bouton retour
  const backBtn = document.getElementById('muslimguard-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }

  // Empêche les interactions avec la page en dessous
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  console.log('🚫 Page bloquée par MuslimGuard - Mot détecté:', keyword);
}

/**
 * Initialisation au chargement de la page
 */
async function init() {
  try {
    // Récupère les mots-clés personnalisés depuis la config
    let customKeywords = [];
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      const config = response?.config;

      if (config && config.blockedKeywords && Array.isArray(config.blockedKeywords)) {
        customKeywords = config.blockedKeywords;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la config:', error);
    }

    // Détecte les contenus suspects avec les mots-clés personnalisés
    const detection = detectSuspiciousContent(customKeywords);

    if (detection.suspicious) {
      console.log('⚠️ Contenu suspect détecté:', detection.keyword);

      // Affiche l'overlay de blocage
      showBlockOverlay(detection.keyword);

      // Envoie une notification au background (optionnel)
      try {
        chrome.runtime.sendMessage({
          action: 'contentBlocked',
          keyword: detection.keyword,
          url: window.location.href,
          title: document.title
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message au background:', error);
      }
    }
  } catch (error) {
    console.error('Erreur dans content script:', error);
  }
}

// Initialise au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ MuslimGuard content script chargé sur:', window.location.hostname);
