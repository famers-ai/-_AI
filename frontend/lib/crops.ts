// Crop configuration for multi-crop support
export interface Crop {
    id: string;
    name: string;
    scientificName: string;
    icon: string;
    optimalVPD: { min: number; max: number };
    optimalTemp: { min: number; max: number };
    optimalHumidity: { min: number; max: number };
    usdaCommodityCode?: string; // For USDA Mars API
}

export const CROPS: Record<string, Crop> = {
    strawberries: {
        id: 'strawberries',
        name: 'Strawberries',
        scientificName: 'Fragaria × ananassa',
        icon: '🍓',
        optimalVPD: { min: 0.8, max: 1.2 },
        optimalTemp: { min: 60, max: 75 },
        optimalHumidity: { min: 60, max: 70 },
        usdaCommodityCode: 'STRAWBERRIES'
    },
    tomatoes: {
        id: 'tomatoes',
        name: 'Tomatoes',
        scientificName: 'Solanum lycopersicum',
        icon: '🍅',
        optimalVPD: { min: 0.8, max: 1.2 },
        optimalTemp: { min: 65, max: 85 },
        optimalHumidity: { min: 60, max: 70 },
        usdaCommodityCode: 'TOMATOES'
    },
    peppers: {
        id: 'peppers',
        name: 'Peppers',
        scientificName: 'Capsicum annuum',
        icon: '🌶️',
        optimalVPD: { min: 0.8, max: 1.2 },
        optimalTemp: { min: 70, max: 85 },
        optimalHumidity: { min: 50, max: 70 },
        usdaCommodityCode: 'PEPPERS, BELL'
    },
    lettuce: {
        id: 'lettuce',
        name: 'Lettuce',
        scientificName: 'Lactuca sativa',
        icon: '🥬',
        optimalVPD: { min: 0.6, max: 1.0 },
        optimalTemp: { min: 60, max: 70 },
        optimalHumidity: { min: 50, max: 70 },
        usdaCommodityCode: 'LETTUCE'
    },
    cucumbers: {
        id: 'cucumbers',
        name: 'Cucumbers',
        scientificName: 'Cucumis sativus',
        icon: '🥒',
        optimalVPD: { min: 0.8, max: 1.2 },
        optimalTemp: { min: 70, max: 85 },
        optimalHumidity: { min: 60, max: 80 },
        usdaCommodityCode: 'CUCUMBERS'
    },
    spinach: {
        id: 'spinach',
        name: 'Spinach',
        scientificName: 'Spinacia oleracea',
        icon: '🥬',
        optimalVPD: { min: 0.6, max: 1.0 },
        optimalTemp: { min: 50, max: 70 },
        optimalHumidity: { min: 50, max: 70 },
        usdaCommodityCode: 'SPINACH'
    },
    carrots: {
        id: 'carrots',
        name: 'Carrots',
        scientificName: 'Daucus carota',
        icon: '🥕',
        optimalVPD: { min: 0.6, max: 1.0 },
        optimalTemp: { min: 60, max: 75 },
        optimalHumidity: { min: 50, max: 70 },
        usdaCommodityCode: 'CARROTS'
    },
    broccoli: {
        id: 'broccoli',
        name: 'Broccoli',
        scientificName: 'Brassica oleracea',
        icon: '🥦',
        optimalVPD: { min: 0.6, max: 1.0 },
        optimalTemp: { min: 60, max: 70 },
        optimalHumidity: { min: 50, max: 70 },
        usdaCommodityCode: 'BROCCOLI'
    }
};

export const DEFAULT_CROP = 'strawberries';

export function getCropById(id: string): Crop {
    return CROPS[id] || CROPS[DEFAULT_CROP];
}

export function getAllCrops(): Crop[] {
    return Object.values(CROPS);
}
