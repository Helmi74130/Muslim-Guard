// utils/analytics.js - Calculs et statistiques

import { getValue } from './storage.js';

/**
 * Récupère les statistiques du jour
 */
export async function getTodayStats() {
  try {
    const stats = await getValue('statsToday');
    const today = new Date().toDateString();

    // Reset si nouveau jour
    if (stats.date !== today) {
      return {
        date: today,
        blockedCount: 0,
        topBlockedSites: {},
        timeSpentByCategory: {}
      };
    }

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return null;
  }
}

/**
 * Récupère les logs des X derniers jours
 */
export async function getLogsForDays(days = 7) {
  try {
    const logs = await getValue('blockedLog');
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return logs.filter(log => log.timestamp > cutoff);
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }
}

/**
 * Calcule les statistiques des 7 derniers jours
 */
export async function getWeeklyStats() {
  try {
    const logs = await getLogsForDays(7);

    const stats = {
      totalBlocked: logs.length,
      byDay: {},
      byDomain: {},
      byReason: {},
      byHour: Array(24).fill(0)
    };

    for (const log of logs) {
      const date = new Date(log.timestamp);
      const day = date.toLocaleDateString('fr-FR');
      const hour = date.getHours();

      // Par jour
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;

      // Par heure
      stats.byHour[hour]++;

      // Par raison
      stats.byReason[log.reason] = (stats.byReason[log.reason] || 0) + 1;

      // Par domaine
      try {
        const domain = new URL(log.url).hostname;
        stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
      } catch (e) {
        // URL invalide
      }
    }

    return stats;
  } catch (error) {
    console.error('Erreur lors du calcul des stats hebdomadaires:', error);
    return null;
  }
}

/**
 * Récupère le top 10 des sites bloqués
 */
export async function getTopBlockedSites(limit = 10) {
  try {
    const logs = await getLogsForDays(7);
    const domains = {};

    for (const log of logs) {
      try {
        const domain = new URL(log.url).hostname;
        domains[domain] = (domains[domain] || 0) + 1;
      } catch (e) {
        // URL invalide
      }
    }

    // Trie par fréquence
    const sorted = Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([domain, count]) => ({ domain, count }));
  } catch (error) {
    console.error('Erreur lors du calcul du top sites:', error);
    return [];
  }
}

/**
 * Vérifie si le comportement est suspect (>10 tentatives/jour)
 */
export async function checkSuspiciousBehavior() {
  try {
    const todayStats = await getTodayStats();

    if (todayStats.blockedCount > 10) {
      return {
        suspicious: true,
        count: todayStats.blockedCount,
        message: `${todayStats.blockedCount} tentatives d'accès à des sites bloqués aujourd'hui`
      };
    }

    return { suspicious: false };
  } catch (error) {
    console.error('Erreur lors de la vérification du comportement:', error);
    return { suspicious: false };
  }
}

/**
 * Génère un rapport complet pour export CSV
 */
export async function generateReport(days = 7) {
  try {
    const logs = await getLogsForDays(days);

    // Format CSV
    const header = 'Date,Heure,URL,Domaine,Raison\n';
    const rows = logs.map(log => {
      const date = new Date(log.timestamp);
      const dateStr = date.toLocaleDateString('fr-FR');
      const timeStr = date.toLocaleTimeString('fr-FR');

      let domain = '';
      try {
        domain = new URL(log.url).hostname;
      } catch (e) {
        domain = 'N/A';
      }

      // Escape les virgules et guillemets pour CSV
      const url = log.url.replace(/"/g, '""');

      return `"${dateStr}","${timeStr}","${url}","${domain}","${log.reason}"`;
    });

    return header + rows.join('\n');
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    return null;
  }
}

/**
 * Calcule le streak (jours consécutifs sans blocage)
 */
export async function calculateStreak() {
  try {
    const logs = await getValue('blockedLog');

    if (logs.length === 0) {
      // Vérifie depuis quand l'extension est installée
      const installDate = await getValue('installDate');
      if (installDate) {
        const daysSince = Math.floor((Date.now() - installDate) / (24 * 60 * 60 * 1000));
        return daysSince;
      }
      return 0;
    }

    // Trouve le dernier blocage
    const lastBlock = logs[0].timestamp; // Le plus récent (car unshift)
    const daysSinceLastBlock = Math.floor((Date.now() - lastBlock) / (24 * 60 * 60 * 1000));

    return daysSinceLastBlock;
  } catch (error) {
    console.error('Erreur lors du calcul du streak:', error);
    return 0;
  }
}

/**
 * Génère des badges/achievements
 */
export async function getAchievements() {
  try {
    const streak = await calculateStreak();
    const weeklyStats = await getWeeklyStats();
    const achievements = [];

    // Badges basés sur le streak
    if (streak >= 1) {
      achievements.push({
        id: 'day1',
        name: '1 jour sans tentation',
        icon: '🌟',
        unlocked: true
      });
    }

    if (streak >= 7) {
      achievements.push({
        id: 'week1',
        name: '1 semaine MashAllah',
        icon: '✨',
        unlocked: true
      });
    }

    if (streak >= 30) {
      achievements.push({
        id: 'month1',
        name: '1 mois de protection',
        icon: '🏆',
        unlocked: true
      });
    }

    // Badge pour peu de tentatives
    if (weeklyStats.totalBlocked < 5) {
      achievements.push({
        id: 'clean',
        name: 'Cœur pur',
        icon: '💚',
        unlocked: true
      });
    }

    return achievements;
  } catch (error) {
    console.error('Erreur lors de la récupération des achievements:', error);
    return [];
  }
}

/**
 * Calcule le temps restant avant la prochaine prière
 */
export function getNextPrayer() {
  try {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Récupère les horaires depuis le storage (fait de manière synchrone dans le contexte approprié)
    // Cette fonction devrait être appelée après avoir récupéré les horaires

    return null; // Implémentation complète dans le contexte du background worker
  } catch (error) {
    console.error('Erreur lors du calcul de la prochaine prière:', error);
    return null;
  }
}

/**
 * Calcule les horaires de prières pour une date donnée
 * Note: Version simplifiée, idéalement utiliser API aladhan.com
 */
export async function calculatePrayerTimes(latitude, longitude, date = new Date()) {
  // Cette fonction nécessiterait une API externe ou un calcul complexe
  // Pour l'instant, on retourne les horaires par défaut stockés
  const prayerTimes = await getValue('prayerTimes');
  return prayerTimes || ['05:30', '13:00', '16:30', '19:00', '20:30'];
}

/**
 * Formate une durée en minutes vers un format lisible
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
