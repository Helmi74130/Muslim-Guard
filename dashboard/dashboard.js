// dashboard/dashboard.js - Dashboard parent avec statistiques

import {
  getTodayStats,
  getWeeklyStats,
  getTopBlockedSites,
  calculateStreak,
  checkSuspiciousBehavior,
  getAchievements,
  generateReport
} from '../utils/analytics.js';


// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboard();
  setupEventListeners();
  setupTabNavigation();
});

// Charge toutes les données du dashboard
async function loadDashboard() {
  try {
    await Promise.all([
      loadOverviewStats(),
      loadTopSites(),
      loadDailyChart(),
      loadHourlyChart(),
      loadRecentLogs(),
      loadAchievements()
    ]);
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error);
  }
}

// Charge les stats globales
async function loadOverviewStats() {
  try {
    const todayStats = await getTodayStats();
    const weeklyStats = await getWeeklyStats();
    const streak = await calculateStreak();
    const suspicious = await checkSuspiciousBehavior();

    document.getElementById('totalBlocked').textContent = weeklyStats.totalBlocked;
    document.getElementById('streak').textContent = streak;
    document.getElementById('todayBlocked').textContent = todayStats.blockedCount;
    document.getElementById('suspiciousCount').textContent = suspicious.suspicious ? '!' : '0';

    // Change la couleur si comportement suspect
    if (suspicious.suspicious) {
      const suspiciousEl = document.getElementById('suspiciousCount');
      suspiciousEl.parentElement.classList.add('bg-red-50', 'border', 'border-red-200');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
  }
}

// Charge le top 10 des sites bloqués
async function loadTopSites() {
  try {
    const topSites = await getTopBlockedSites(10);
    const container = document.getElementById('topSites');

    if (topSites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
          <img src="/assets/chart-pie.png" style="height: 50px;">
          </div>
          <div>Aucun site bloqué cette semaine</div>
        </div>
      `;
      return;
    }

    const maxCount = topSites[0].count;

    container.innerHTML = topSites.map((site, index) => {
      const percentage = (site.count / maxCount) * 100;
      const rank = index + 1;

      // Classes spéciales pour le top 3
      let rankClass = 'site-rank';
      if (rank === 1) rankClass += ' top-1';
      else if (rank === 2) rankClass += ' top-2';
      else if (rank === 3) rankClass += ' top-3';

      return `
        <div class="site-item">
          <div class="${rankClass}">${rank}</div>
          <div class="site-info">
            <div class="site-domain">${site.domain}</div>
            <div class="site-bar">
              <div class="site-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
          <div class="site-count">${site.count}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erreur lors du chargement du top sites:', error);
  }
}

// Charge le graphique par jour
async function loadDailyChart() {
  try {
    const weeklyStats = await getWeeklyStats();
    const container = document.getElementById('dailyChart');

    const days = Object.keys(weeklyStats.byDay).slice(0, 7);
    const counts = days.map(day => weeklyStats.byDay[day] || 0);
    const maxCount = Math.max(...counts, 1);

    if (days.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center px-4 py-4">Aucune donnée disponible</p>';
      return;
    }

    container.innerHTML = days.map((day, index) => {
      const count = counts[index];
      const percentage = (count / maxCount) * 100;

      return `
        <div class="chart-row">
          <div class="chart-bar">
            <div class="chart-bar-fill" style="height: ${percentage}%">
              <span class="chart-count">${count} blocage${count > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="chart-label">${day}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erreur lors du chargement du graphique journalier:', error);
  }
}

// Charge le graphique par heure
async function loadHourlyChart() {
  try {
    const weeklyStats = await getWeeklyStats();
    const container = document.getElementById('hourlyChart');

    const maxCount = Math.max(...weeklyStats.byHour, 1);

    container.innerHTML = weeklyStats.byHour.map((count, hour) => {
      const percentage = (count / maxCount) * 100;

      return `
        <div class="hourly-bar">
          <div class="hourly-column">
            <div class="hourly-fill" style="height: ${percentage}%">
              <span class="hourly-tooltip">${count} blocage${count > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="hourly-label">${hour}h</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Erreur lors du chargement du graphique horaire:', error);
  }
}

// Charge les logs récents
async function loadRecentLogs(filter = 'all') {
  try {
    const { getLogsForDays } = await import('../utils/analytics.js');
    const days = filter === 'today' ? 1 : filter === 'week' ? 7 : 30;
    const logs = await getLogsForDays(days);

    const tbody = document.getElementById('logsTable');

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-500">Aucun blocage enregistré</td></tr>';
      return;
    }

    // Prend les 50 derniers
    const recentLogs = logs.slice(0, 50);

    tbody.innerHTML = recentLogs.map(log => {
      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString('fr-FR');
      const timeStr = date.toLocaleTimeString('fr-FR');

      let domain = '';
      try {
        domain = new URL(log.url).hostname;
      } catch (e) {
        domain = log.url;
      }

      const reasonLabels = {
        'domain': 'Domaine bloqué',
        'blocked_domain': 'Domaine bloqué',
        'keyword': 'Mot-clé',
        'category': 'Catégorie bloquée',
        'strict': 'Mode strict',
        'strict_mode': 'Mode strict',
        'schedule': 'En dehors des heures autorisées',
        'outside_schedule': 'En dehors des heures autorisées',
        'prayer': 'Heure de prière',
        'prayer_time': 'Heure de prière'
      };

      let reason = log.reason;
      if (log.reason.startsWith('keyword:')) {
        reason = `Mot-clé: ${log.reason.split(':')[1]}`;
      } else {
        reason = reasonLabels[log.reason] || log.reason;
      }

      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm">
            <div class="font-semibold">${dateStr}</div>
            <div class="text-gray-500 text-xs">${timeStr}</div>
          </td>
          <td class="px-4 py-3 text-sm font-mono text-blue-600">${domain}</td>
          <td class="px-4 py-3 text-sm">
            <span class="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
              ${reason}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Erreur lors du chargement des logs:', error);
  }
}

// Charge les achievements
async function loadAchievements() {
  try {
    const achievements = await getAchievements();
    const container = document.getElementById('achievements');

    if (achievements.length === 0) {
      container.innerHTML = '<p class="text-center col-span-4 opacity-75">Continuez comme ça pour débloquer des achievements!</p>';
      return;
    }

    container.innerHTML = achievements.map(achievement => `
      <div class="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 text-center">
        <div class="text-4xl mb-2">${achievement.icon}</div>
        <div class="font-semibold text-black">${achievement.name}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur lors du chargement des achievements:', error);
  }
}

// Configuration des event listeners
function setupEventListeners() {
  // Bouton Refresh
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadDashboard();
  });

  // Bouton Export CSV
  document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
      const csv = await generateReport(7);
      if (!csv) {
        alert('Erreur lors de la génération du rapport');
        return;
      }

      // Télécharge le fichier CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `muslimguard-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export CSV');
    }
  });

  // Filtre des logs
  document.getElementById('logFilter').addEventListener('change', (e) => {
    loadRecentLogs(e.target.value);
  });

  // Bouton Paramètres
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Configuration de la navigation entre tabs
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Retire la classe active de tous les boutons et contenus
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Ajoute la classe active au bouton et contenu ciblés
      button.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}
