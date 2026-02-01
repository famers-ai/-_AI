/**
 * Location Utilities
 * Handles country detection and location persistence
 */

// Geocoding cache to prevent redundant API calls
interface GeocodeCache {
    [key: string]: {
        city: string;
        region: string;
        country: string;
        timestamp: number;
    };
}

const GEOCODE_CACHE_KEY = 'smartfarm_geocode_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached geocoding result
 */
function getCachedGeocode(lat: number, lon: number): { city: string; region: string; country: string } | null {
    try {
        const cacheStr = localStorage.getItem(GEOCODE_CACHE_KEY);
        if (!cacheStr) return null;

        const cache: GeocodeCache = JSON.parse(cacheStr);
        const key = `${lat.toFixed(2)},${lon.toFixed(2)}`; // Round to 2 decimals for cache key
        const cached = cache[key];

        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
            console.log('📍 Using cached geocode result for', key);
            return { city: cached.city, region: cached.region, country: cached.country };
        }

        return null;
    } catch (error) {
        console.error('Error reading geocode cache:', error);
        return null;
    }
}

/**
 * Save geocoding result to cache
 */
function setCachedGeocode(lat: number, lon: number, city: string, region: string, country: string): void {
    try {
        const cacheStr = localStorage.getItem(GEOCODE_CACHE_KEY);
        const cache: GeocodeCache = cacheStr ? JSON.parse(cacheStr) : {};

        const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        cache[key] = { city, region, country, timestamp: Date.now() };

        // Clean up old entries (keep only last 10)
        const entries = Object.entries(cache);
        if (entries.length > 10) {
            const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const newCache: GeocodeCache = {};
            sorted.slice(0, 10).forEach(([k, v]) => newCache[k] = v);
            localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(newCache));
        } else {
            localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
        }

        console.log('📍 Cached geocode result for', key);
    } catch (error) {
        console.error('Error saving geocode cache:', error);
    }
}

export { getCachedGeocode, setCachedGeocode };

/**
 * Detect user's country from browser language
 * Returns ISO country code (e.g., 'US', 'GB', 'KR')
 */
export function detectUserCountry(): string | null {
    try {
        const language = navigator.language || (navigator as any).userLanguage;

        // Map common language codes to country codes
        const languageToCountry: { [key: string]: string } = {
            'en-US': 'US',
            'en-GB': 'GB',
            'en-CA': 'CA',
            'en-AU': 'AU',
            'ko-KR': 'KR',
            'ko': 'KR',
            'ja-JP': 'JP',
            'ja': 'JP',
            'zh-CN': 'CN',
            'zh-TW': 'TW',
            'es-ES': 'ES',
            'es-MX': 'MX',
            'fr-FR': 'FR',
            'de-DE': 'DE',
            'it-IT': 'IT',
            'pt-BR': 'BR',
            'ru-RU': 'RU',
            'ar-SA': 'SA',
            'hi-IN': 'IN',
        };

        // Try exact match first
        if (languageToCountry[language]) {
            return languageToCountry[language];
        }

        // Try base language (e.g., 'en' from 'en-US')
        const baseLanguage = language.split('-')[0];
        if (languageToCountry[baseLanguage]) {
            return languageToCountry[baseLanguage];
        }

        // Default to US for English speakers
        if (baseLanguage === 'en') {
            return 'US';
        }

        return null;
    } catch (error) {
        console.error('Error detecting country:', error);
        return null;
    }
}

/**
 * Save user's location to localStorage
 */
export interface SavedLocation {
    city?: string;
    lat?: number;
    lon?: number;
    name: string;
    country?: string; // Added to persist country context
    timestamp: number;
}

export function saveLocation(location: SavedLocation): void {
    try {
        localStorage.setItem('smartfarm_location', JSON.stringify(location));
        console.log('📍 Location saved:', location.name);
    } catch (error) {
        console.error('Error saving location:', error);
    }
}

/**
 * Load saved location from localStorage
 */
export function loadSavedLocation(): SavedLocation | null {
    try {
        const saved = localStorage.getItem('smartfarm_location');
        if (!saved) return null;

        const location = JSON.parse(saved) as SavedLocation;

        // Check if location is older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (location.timestamp < thirtyDaysAgo) {
            console.log('📍 Saved location expired, clearing...');
            clearSavedLocation();
            return null;
        }

        console.log('📍 Loaded saved location:', location.name);
        return location;
    } catch (error) {
        console.error('Error loading location:', error);
        return null;
    }
}

/**
 * Clear saved location
 */
export function clearSavedLocation(): void {
    try {
        localStorage.removeItem('smartfarm_location');
        console.log('📍 Location cleared');
    } catch (error) {
        console.error('Error clearing location:', error);
    }
}

/**
 * Check if this is user's first visit
 */
export function isFirstVisit(): boolean {
    try {
        const hasVisited = localStorage.getItem('smartfarm_visited');
        if (!hasVisited) {
            localStorage.setItem('smartfarm_visited', 'true');
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}
