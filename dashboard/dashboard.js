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
      container.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun site bloqué cette semaine</p>';
      return;
    }

    const maxCount = topSites[0].count;

    container.innerHTML = topSites.map((site, index) => {
      const percentage = (site.count / maxCount) * 100;
      return `
        <div class="flex items-center gap-3">
          <div class="text-lg font-bold text-gray-400 w-6">${index + 1}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold text-gray-800">${site.domain}</span>
              <span class="text-sm text-gray-600">${site.count} fois</span>
            </div>
            <div class="bg-gray-200 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                style="width: ${percentage}%"></div>
            </div>
          </div>
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
        <div class="flex items-center gap-3">
          <div class="w-24 text-sm text-gray-600">${day}</div>
          <div class="flex-1 bg-gray-200 h-8 rounded-lg overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-8 rounded-lg flex items-center px-3 text-white font-semibold text-sm transition-all"
              style="width: ${percentage}%">
              ${count > 0 ? count : ''}
            </div>
          </div>
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
      const color = percentage > 75 ? 'bg-red-500' :
                    percentage > 50 ? 'bg-orange-500' :
                    percentage > 25 ? 'bg-yellow-500' :
                    'bg-green-500';

      return `
        <div class="relative group cursor-pointer">
          <div class="h-20 bg-gray-200 rounded flex items-end overflow-hidden">
            <div class="${color} w-full rounded transition-all" style="height: ${percentage}%"></div>
          </div>
          <div class="text-xs text-center text-gray-600 mt-1">${hour}h</div>
          <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            ${count} blocages
          </div>
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
        'keyword': 'Mot-clé',
        'category': 'Catégorie',
        'strict': 'Mode strict',
        'schedule': 'Hors horaires',
        'prayer': 'Heure de prière'
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
        <div class="font-semibold">${achievement.name}</div>
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
}
