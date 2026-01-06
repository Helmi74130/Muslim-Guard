/**
 * Prayer Times API Module
 * Handles automatic prayer times retrieval via Aladhan API
 */

/**
 * Geocode a city name to get latitude and longitude using Nominatim (OpenStreetMap)
 * @param {string} cityName - The city name to geocode
 * @returns {Promise<{latitude: number, longitude: number, displayName: string}>}
 */
export async function geocodeCity(cityName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MuslimGuard-Extension/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Ville introuvable. Vérifiez le nom de la ville.');
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Get prayer times from Aladhan API for a specific address
 * @param {string} address - The address (city, country)
 * @param {number} method - Calculation method (default: 3 = Muslim World League)
 * @returns {Promise<{timings: Object, location: Object}>}
 */
export async function getPrayerTimesByAddress(address, method = 3) {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const url = `https://api.aladhan.com/v1/timingsByAddress/${dateStr}?address=${encodeURIComponent(address)}&method=${method}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error('API returned error status');
    }

    return {
      timings: {
        fajr: data.data.timings.Fajr,
        dhuhr: data.data.timings.Dhuhr,
        asr: data.data.timings.Asr,
        maghrib: data.data.timings.Maghrib,
        isha: data.data.timings.Isha
      },
      location: {
        latitude: data.data.meta.latitude,
        longitude: data.data.meta.longitude,
        timezone: data.data.meta.timezone
      },
      date: data.data.date.readable
    };
  } catch (error) {
    console.error('Prayer times API error:', error);
    throw error;
  }
}

/**
 * Update prayer times in storage using the saved city
 * @returns {Promise<boolean>} - True if successful
 */
export async function updatePrayerTimesFromCity() {
  try {
    const config = await chrome.storage.local.get(['prayerCity', 'prayerCalculationMethod']);

    if (!config.prayerCity) {
      console.warn('No city configured for prayer times');
      return false;
    }

    const method = config.prayerCalculationMethod || 3;
    const prayerData = await getPrayerTimesByAddress(config.prayerCity, method);

    // Save to storage
    await chrome.storage.local.set({
      prayerTimes: [
        prayerData.timings.fajr,
        prayerData.timings.dhuhr,
        prayerData.timings.asr,
        prayerData.timings.maghrib,
        prayerData.timings.isha
      ],
      prayerTimesLastUpdate: Date.now(),
      prayerTimesAutoUpdate: true
    });

    console.log('Prayer times updated successfully:', prayerData.timings);
    return true;
  } catch (error) {
    console.error('Failed to update prayer times:', error);
    return false;
  }
}

/**
 * Initialize prayer times for a city
 * @param {string} cityName - The city name
 * @param {number} method - Calculation method (default: 3)
 * @returns {Promise<Object>} - Prayer times and location data
 */
export async function initializePrayerTimes(cityName, method = 3) {
  try {
    // First, geocode to verify the city exists
    const location = await geocodeCity(cityName);

    // Then get prayer times
    const prayerData = await getPrayerTimesByAddress(cityName, method);

    // Save to storage
    await chrome.storage.local.set({
      prayerCity: cityName,
      prayerCityDisplayName: location.displayName,
      prayerCalculationMethod: method,
      prayerTimes: [
        prayerData.timings.fajr,
        prayerData.timings.dhuhr,
        prayerData.timings.asr,
        prayerData.timings.maghrib,
        prayerData.timings.isha
      ],
      prayerTimesLastUpdate: Date.now(),
      prayerTimesAutoUpdate: true
    });

    return {
      success: true,
      timings: prayerData.timings,
      location: location.displayName,
      date: prayerData.date
    };
  } catch (error) {
    console.error('Failed to initialize prayer times:', error);
    throw error;
  }
}

/**
 * Get available calculation methods
 * @returns {Array<{value: number, name: string, description: string}>}
 */
export function getCalculationMethods() {
  return [
    { value: 3, name: 'Muslim World League', description: 'Recommandé pour l\'Europe' },
    { value: 2, name: 'ISNA', description: 'Islamic Society of North America' },
    { value: 1, name: 'University of Karachi', description: 'Pakistan' },
    { value: 4, name: 'Umm Al-Qura', description: 'Arabie Saoudite' },
    { value: 5, name: 'Egyptian General Authority', description: 'Égypte' },
    { value: 12, name: 'UOIF', description: 'France' },
    { value: 13, name: 'Diyanet', description: 'Turquie' },
    { value: 18, name: 'Tunisia', description: 'Tunisie' },
    { value: 19, name: 'Algeria', description: 'Algérie' },
    { value: 21, name: 'Morocco', description: 'Maroc' }
  ];
}
