// content.js - Script injecté dans toutes les pages

/**
 * Détecte les mots-clés suspects dans la page
 * @param {Array} customKeywords - Liste des mots-clés à détecter
 * @returns {Object} { suspicious: boolean, keywords: Array<{keyword, position}> }
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
      return { suspicious: false, keywords: [] };
    }

    // Trouve TOUS les mots-clés présents et leur position
    let foundKeywords = [];
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const position = fullText.indexOf(keywordLower);
      if (position !== -1) {
        foundKeywords.push({ keyword, position });
      }
    }

    // Trie par position (premier dans le texte = premier dans le tableau)
    if (foundKeywords.length > 0) {
      foundKeywords.sort((a, b) => a.position - b.position);
      return { suspicious: true, keywords: foundKeywords };
    }

    return { suspicious: false, keywords: [] };
  } catch (error) {
    console.error('Erreur lors de la détection de contenu:', error);
    return { suspicious: false, keywords: [] };
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
 * Vérifie si un élément est de type bloc
 */
function isBlockElement(element) {
  const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'LI', 'TD', 'TH', 'BLOCKQUOTE', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  return blockTags.includes(element.tagName);
}

/**
 * Floute les éléments contenant des mots-clés suspects
 * @param {Array} detectedKeywords - Liste des mots détectés avec positions
 */
function blurSuspiciousContent(detectedKeywords) {
  // Vérifie si déjà appliqué
  if (document.body.dataset.muslimguardBlurred === 'true') {
    return;
  }

  const keywordSet = new Set(detectedKeywords.map(k => k.keyword.toLowerCase()));

  // Parcourt tous les nœuds de texte du body
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const elementsToBlur = new Set();

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const text = textNode.textContent.toLowerCase();

    // Vérifie si le texte contient un mot-clé
    for (const keyword of keywordSet) {
      if (text.includes(keyword)) {
        // Trouve l'élément parent à flouter (paragraphe, div, span, etc.)
        let parentElement = textNode.parentElement;

        // Remonte jusqu'à trouver un élément de bloc (p, div, section, article, li, etc.)
        while (parentElement && !isBlockElement(parentElement)) {
          parentElement = parentElement.parentElement;
        }

        if (parentElement && parentElement !== document.body) {
          elementsToBlur.add(parentElement);
        }
        break;
      }
    }
  }

  // Applique le floutage
  elementsToBlur.forEach(element => {
    element.style.filter = 'blur(12px)';
    element.style.userSelect = 'none';
    element.style.pointerEvents = 'none';
    element.dataset.muslimguardBlurred = 'true';
  });

  document.body.dataset.muslimguardBlurred = 'true';
}

/**
 * Affiche une bannière d'avertissement en haut de page
 * @param {Array} detectedKeywords - Liste des mots détectés
 * @param {string} mode - 'moderate' ou 'surveillance'
 */
function showWarningBanner(detectedKeywords, mode) {
  // Vérifie si la bannière existe déjà
  if (document.getElementById('muslimguard-warning-banner')) {
    return;
  }

  const keywordCount = detectedKeywords.length;
  const firstKeyword = detectedKeywords[0]?.keyword || '';

  const banner = document.createElement('div');
  banner.id = 'muslimguard-warning-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 98%;
    background: #DC2626 !important;
    color: white;
    padding: 12px 20px;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.3s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      #muslimguard-warning-banner:hover {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      }
    </style>

    <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
      <!-- Icône d'avertissement -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>

      <!-- Message -->
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">
          Contenu suspect détecté par MuslimGuard
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          ${keywordCount} mot${keywordCount > 1 ? 's' : ''}-clé${keywordCount > 1 ? 's' : ''} détecté${keywordCount > 1 ? 's' : ''} : "${firstKeyword}"${keywordCount > 1 ? ` et ${keywordCount - 1} autre${keywordCount > 1 ? 's' : ''}` : ''}
        </div>
      </div>

      <!-- Compteur -->
      <div style="
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 14px;
        backdrop-filter: blur(10px);
      ">
        ${keywordCount} détection${keywordCount > 1 ? 's' : ''}
      </div>

      <!-- Bouton retour (seulement en mode surveillance) -->
      ${mode === 'surveillance' ? `
        <button id="muslimguard-banner-back-btn" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        ">
          Quitter cette page
        </button>
      ` : ''}
    </div>
  `;

  document.body.appendChild(banner);

  // Ajuste le body pour ne pas être caché par la bannière
  document.body.style.paddingTop = '60px';

  // Événement du bouton retour (mode surveillance uniquement)
  if (mode === 'surveillance') {
    const backBtn = document.getElementById('muslimguard-banner-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });

      backBtn.addEventListener('mouseenter', () => {
        backBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      });
      backBtn.addEventListener('mouseleave', () => {
        backBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      });
    }
  }
}

/**
 * Initialisation au chargement de la page
 */
async function init() {
  try {
    // Récupère la config complète depuis le background
    let customKeywords = [];
    let protectionEnabled = true;
    let contentBlockingMode = 'strict'; // Par défaut

    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      const config = response?.config;

      if (config) {
        protectionEnabled = config.protectionEnabled !== false;

        if (!protectionEnabled) {
          return; // Protection désactivée
        }

        // Récupère le mode de blocage de contenu
        contentBlockingMode = config.contentBlockingMode || config.protectionMode || 'strict';

        // Récupère les mots-clés
        if (config.blockedKeywordsContent && Array.isArray(config.blockedKeywordsContent)) {
          customKeywords = config.blockedKeywordsContent;
        } else if (config.contentDetectionKeywords && Array.isArray(config.contentDetectionKeywords)) {
          customKeywords = config.contentDetectionKeywords; // Fallback
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la config:', error);
    }

    // Détecte les contenus suspects avec les mots-clés personnalisés
    const detection = detectSuspiciousContent(customKeywords);

    if (detection.suspicious) {
      const firstKeyword = detection.keywords[0].keyword;
      const allKeywords = detection.keywords;

      // DÉCISION BASÉE SUR LE MODE
      switch (contentBlockingMode) {
        case 'strict':
          // Mode 1 : Overlay complet bloquant (comportement actuel)
          showBlockOverlay(firstKeyword);

          // Log simple
          try {
            chrome.runtime.sendMessage({
              action: 'contentBlocked',
              keyword: firstKeyword,
              url: window.location.href,
              title: document.title
            });
          } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
          }
          break;

        case 'moderate':
        case 'modéré':
          // Mode 2 : Floutage + Bannière
          blurSuspiciousContent(allKeywords);
          showWarningBanner(allKeywords, 'moderate');

          // Log simple
          try {
            chrome.runtime.sendMessage({
              action: 'contentBlurred',
              keyword: firstKeyword,
              keywordCount: allKeywords.length,
              url: window.location.href,
              title: document.title
            });
          } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
          }
          break;

        case 'surveillance':
        case 'permissive':
          // Mode 3 : Bannière seule + logging détaillé
          showWarningBanner(allKeywords, 'surveillance');

          // Log DÉTAILLÉ avec tous les mots détectés
          try {
            chrome.runtime.sendMessage({
              action: 'contentDetected',
              keywords: allKeywords.map(k => k.keyword), // TOUS les mots
              keywordCount: allKeywords.length,
              url: window.location.href,
              title: document.title,
              detailedLog: true // Flag pour logging renforcé
            });
          } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
          }
          break;

        default:
          // Fallback sur strict
          showBlockOverlay(firstKeyword);
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
