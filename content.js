// content.js - Script injecté dans toutes les pages

/**
 * Détecte les contenus suspects dans la page
 */
function detectSuspiciousContent() {
  try {
    const bodyText = document.body?.innerText?.toLowerCase() || '';
    const title = document.title?.toLowerCase() || '';

    // Mots-clés suspects
    const suspiciousKeywords = [
      'porn', 'xxx', 'adult', 'sex', 'nude', 'nsfw',
      'casino', 'gambling', 'bet', 'poker',
      'dating', 'hookup', 'meet singles'
    ];

    for (const keyword of suspiciousKeywords) {
      if (bodyText.includes(keyword) || title.includes(keyword)) {
        return { suspicious: true, keyword };
      }
    }

    // Détecte les lecteurs audio/vidéo
    const hasAudio = document.querySelectorAll('audio, video').length > 0;
    const hasIframe = document.querySelectorAll('iframe').length > 0;

    return {
      suspicious: false,
      hasMedia: hasAudio,
      hasIframes: hasIframe
    };
  } catch (error) {
    console.error('Erreur lors de la détection de contenu:', error);
    return { suspicious: false };
  }
}

/**
 * Détecte les tentatives de bypass (VPN, proxies)
 */
function detectBypass() {
  try {
    // Détecte les extensions VPN courantes via leurs modifications DOM
    const vpnIndicators = [
      'vpn-extension',
      'proxy-badge',
      'nordvpn',
      'expressvpn',
      'surfshark'
    ];

    for (const indicator of vpnIndicators) {
      if (document.querySelector(`[class*="${indicator}"]`) ||
          document.querySelector(`[id*="${indicator}"]`)) {
        return { detected: true, type: 'vpn' };
      }
    }

    // Vérifie si on est en mode incognito (limité)
    // Note: C'est difficile à détecter de manière fiable

    return { detected: false };
  } catch (error) {
    console.error('Erreur lors de la détection de bypass:', error);
    return { detected: false };
  }
}

/**
 * Bloque les iframes suspectes
 */
function blockSuspiciousIframes() {
  try {
    const iframes = document.querySelectorAll('iframe');

    iframes.forEach(iframe => {
      const src = iframe.src?.toLowerCase() || '';

      // Liste de domaines suspects dans les iframes
      const suspiciousDomains = [
        'ads', 'advert', 'porn', 'xxx', 'casino', 'bet'
      ];

      for (const domain of suspiciousDomains) {
        if (src.includes(domain)) {
          iframe.style.display = 'none';
          iframe.src = 'about:blank';
          console.log('Iframe suspecte bloquée:', src);
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du blocage des iframes:', error);
  }
}

/**
 * Ajoute un overlay de warning si contenu suspect détecté
 */
function showWarningOverlay(reason) {
  // Vérifie si l'overlay existe déjà
  if (document.getElementById('muslimguard-warning')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'muslimguard-warning';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease-out;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
    </style>
    <div style="max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">⚠️</span>
        <span><strong>MuslimGuard:</strong> Contenu potentiellement inapproprié détecté sur cette page</span>
      </div>
      <button id="muslimguard-close" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
      ">Fermer</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Bouton fermer
  document.getElementById('muslimguard-close')?.addEventListener('click', () => {
    overlay.remove();
  });
}

/**
 * Initialisation au chargement de la page
 */
async function init() {
  try {
    // Demande la config au background script
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    const config = response?.config;

    if (!config || !config.protectionEnabled) {
      return; // Protection désactivée
    }

    // Détecte les contenus suspects
    const detection = detectSuspiciousContent();
    if (detection.suspicious) {
      console.log('⚠️ Contenu suspect détecté:', detection.keyword);

      // Affiche un warning
      if (config.alertsEnabled) {
        showWarningOverlay(detection.keyword);
      }
    }

    // Bloque les iframes suspectes
    blockSuspiciousIframes();

    // Détecte les tentatives de bypass
    if (config.bypassDetection) {
      const bypassDetection = detectBypass();
      if (bypassDetection.detected) {
        console.log('⚠️ Tentative de bypass détectée:', bypassDetection.type);

        // Envoie une alerte au background
        chrome.runtime.sendMessage({
          action: 'bypassDetected',
          type: bypassDetection.type,
          url: window.location.href
        });
      }
    }
  } catch (error) {
    console.error('Erreur dans content script:', error);
  }
}

// Observer pour détecter les changements dynamiques
const observer = new MutationObserver((mutations) => {
  // Revérifie les iframes suspectes si le DOM change
  blockSuspiciousIframes();
});

// Lance l'observation
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialise au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Empêche l'ouverture du devtools (protection avancée)
// Note: Ceci est optionnel et peut être désactivé
/*
document.addEventListener('keydown', (e) => {
  // F12 ou Ctrl+Shift+I ou Ctrl+Shift+J
  if (e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
    e.preventDefault();
    console.log('🔒 DevTools désactivé par MuslimGuard');
  }
});

// Détecte l'ouverture du devtools via resize
const threshold = 160;
window.addEventListener('resize', () => {
  if (window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold) {
    console.log('⚠️ DevTools potentiellement ouvert');
  }
});
*/

console.log('✅ MuslimGuard content script chargé sur:', window.location.hostname);
