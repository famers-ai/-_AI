/**
 * Location Utilities
 * Handles country detection and location persistence
 */

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
