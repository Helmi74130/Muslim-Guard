// content.js - Script injecté dans toutes les pages

/**
 * Détecte les mots-clés suspects dans la page
 */
function detectSuspiciousContent(customKeywords = []) {
  try {
    const bodyText = document.body?.innerText?.toLowerCase() || '';
    const title = document.title?.toLowerCase() || '';
    const fullText = title + ' ' + bodyText;

    // Utilise uniquement les mots-clés personnalisés de la config
    // Si la liste est vide, aucun contenu ne sera détecté
    const keywords = customKeywords;

    // Si aucun mot-clé n'est configuré, on ne bloque rien
    if (keywords.length === 0) {
      return { suspicious: false };
    }

    // Trouve tous les mots-clés présents et leur position
    let foundKeywords = [];
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const position = fullText.indexOf(keywordLower);
      if (position !== -1) {
        foundKeywords.push({ keyword, position });
      }
    }

    // Si on a trouvé des mots-clés, retourne celui qui apparaît en PREMIER dans le texte
    if (foundKeywords.length > 0) {
      foundKeywords.sort((a, b) => a.position - b.position);
      return { suspicious: true, keyword: foundKeywords[0].keyword };
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
    background: #00305A;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>

    <div style="
      max-width: 480px;
      width: 90%;
      text-align: center;
      padding: 48px 32px;
      background: white;
      border-radius: 16px;
      animation: fadeIn 0.2s ease-out;
    ">
      <!-- Titre -->
      <h1 style="
        color: #111827;
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 12px 0;
        letter-spacing: -0.01em;
      ">Contenu bloqué</h1>

      <!-- Message principal -->
      <p style="
        color: #6b7280;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 32px 0;
      ">
        Cette page contient du contenu inapproprié détecté par MuslimGuard.
      </p>

      <!-- Mot détecté -->
      <div style="
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 32px;
      ">
        <p style="
          margin: 0 0 8px 0;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        ">
          Mot-clé détecté
        </p>
        <span style="
          background: #111827;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 14px;
          font-weight: 500;
        ">${keyword}</span>
      </div>

      <!-- Bouton retour -->
      <button id="muslimguard-back-btn" style="
        background: #00305A;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        width: 100%;
      ">
        Revenir en arrière
      </button>

      <!-- Info supplémentaire -->
      <p style="
        color: #9ca3af;
        font-size: 12px;
        margin-top: 24px;
        line-height: 1.5;
      ">
        Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur.
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

    // Hover effect
    backBtn.addEventListener('mouseenter', () => {
      backBtn.style.background = '#004179';
    });
    backBtn.addEventListener('mouseleave', () => {
      backBtn.style.background = '#00305A';
    });
  }

  // Empêche les interactions avec la page en dessous
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

/**
 * Initialisation au chargement de la page
 */
async function init() {
  try {
    // Récupère la config complète depuis le background
    let customKeywords = [];
    let protectionEnabled = true; // Par défaut activé

    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      const config = response?.config;

      if (config) {
        // Vérifie si la protection est activée
        protectionEnabled = config.protectionEnabled !== false;

        // Si la protection est désactivée, on ne fait rien
        if (!protectionEnabled) {
          return;
        }

        if (config.contentDetectionKeywords && Array.isArray(config.contentDetectionKeywords)) {
          customKeywords = config.contentDetectionKeywords;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la config:', error);
    }

    // Détecte les contenus suspects avec les mots-clés personnalisés
    const detection = detectSuspiciousContent(customKeywords);

    if (detection.suspicious) {
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
