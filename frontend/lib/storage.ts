
export interface SensorData {
    temperature: number;
    humidity: number;
    soil_moisture?: number;
    notes?: string;
    timestamp?: string;
}

const LOCAL_STORAGE_KEY = 'smartfarm_local_readings';

export function saveLocalSensorData(data: SensorData) {
    if (typeof window === 'undefined') return;

    const reading = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'local'
    };

    // Save to local storage (append to list or just keep latest? Dashboard shows single latest)
    // We will keep a history locally as well for potential graph usage later
    const existing = getLocalSensorHistory();
    const updated = [reading, ...existing].slice(0, 50); // Keep last 50

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return reading;
}

export function getLocalSensorHistory(): any[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

export function getLatestLocalReading() {
    const history = getLocalSensorHistory();
    return history.length > 0 ? history[0] : null;
}

export function calculateVPD(T: number, RH: number): number {
    // Es = 0.6108 * exp(17.27 * T / (T + 237.3))
    // VPD = Es * (1 - RH / 100)
    // T in Celsius

    // If T is likely Fahrenheit (> 50), convert to Celsius for calculation
    let tempC = T;
    if (T > 50) {
        tempC = (T - 32) * 5 / 9;
    }

    const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const vpd = es * (1 - RH / 100);
    return parseFloat(vpd.toFixed(2));
}
