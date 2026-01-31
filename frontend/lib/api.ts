const API_BASE_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface DashboardData {
    location: {
        name: string;
        lat: number;
        lon: number;
        country?: string;
    };
    weather: {
        temperature: number;
        humidity: number;
        rain: number;
        wind_speed: number;
    };
    indoor: {
        temperature: number;
        humidity: number;
        vpd: number;
        vpd_status: string;
    };
    crop: string;
    ai_analysis?: string;
    ai_meta?: {
        confidence_score: number;
        user_question?: {
            id: string;
            text: string;
            options: string[];
        };
    };

}

function getAuthHeaders() {
    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    };
    if (typeof window !== 'undefined') {
        const farmId = localStorage.getItem("farm_id");
        if (farmId) {
            headers["X-Farm-ID"] = farmId;
        }
    }
    return headers;
}

export async function fetchDashboardData(
    city: string = "San Francisco",
    lat?: number,
    lon?: number,
    country?: string
): Promise<DashboardData> {
    let url = `${API_BASE_url}/dashboard?crop_type=Strawberries`;

    if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
    } else {
        url += `&city=${encodeURIComponent(city)}`;
        if (country) url += `&country=${country}`;
    }

    const res = await fetch(url, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
    }
    return res.json();
}

export async function fetchAIAnalysis(
    crop: string,
    temp: number,
    humidity: number,
    rain: number,
    wind: number,
    feedback?: string
) {
    const params = new URLSearchParams({
        crop_type: crop,
        temp: temp.toString(),
        humidity: humidity.toString(),
        rain: rain.toString(),
        wind: wind.toString()
    });

    if (feedback) {
        params.append("user_feedback", feedback);
    }

    const res = await fetch(`${API_BASE_url}/ai/analyze?${params}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) {
        throw new Error("AI Analysis failed");
    }
    return res.json();
}

export async function calibrateSensors(actualTemp: number, weatherData: any) {
    const res = await fetch(`${API_BASE_url}/sensors/calibrate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            actual_temp: actualTemp,
            weather: weatherData
        }),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Calibration failed");
    return res.json();
}

export async function uploadImageForDiagnosis(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    // FormData headers are special, let browser handle Content-Type boundary
    const headers: any = getAuthHeaders();
    delete headers["Content-Type"]; // Remove application/json

    const res = await fetch(`${API_BASE_url}/ai/diagnose`, {
        method: "POST",
        headers: headers,
        body: formData,
        cache: "no-store"
    });

    if (!res.ok) {
        throw new Error("Image diagnosis failed");
    }
    return res.json();
}

export async function fetchPestForecast(crop: string, lat: number, lon: number) {
    const params = new URLSearchParams({
        crop_type: crop,
        lat: lat.toString(),
        lon: lon.toString()
    });
    const res = await fetch(`${API_BASE_url}/pest/forecast?${params}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
}

export async function fetchMarketPrices(crop: string) {
    const res = await fetch(`${API_BASE_url}/market/prices?crop_type=${crop}`, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch market prices");
    return res.json();
}

export async function fetchUserProfile() {
    const res = await fetch(`${API_BASE_url}/users/me`, {
        headers: getAuthHeaders(),
        cache: "no-store"
    });
    if (res.status === 404) return null; // Benign case: User not logged in
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
}

export async function updateUserTerms(agreed: boolean) {
    const res = await fetch(`${API_BASE_url}/users/me/terms`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ agreed }),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to update terms status");
    return res.json();
}

export async function recordSensorData(data: any) {
    const res = await fetch(`${API_BASE_url}/sensors/record`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to record sensor data");
    return res.json();
}

export async function fetchWeeklyReport() {
    const res = await fetch(`${API_BASE_url}/reports/weekly`, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch weekly report");
    return res.json();
}

// Voice Logs API
export async function fetchVoiceLogs() {
    const res = await fetch(`${API_BASE_url}/voice-logs`, {
        headers: getAuthHeaders(),
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch voice logs");
    return res.json();
}

export async function createVoiceLog(logData: any) {
    const res = await fetch(`${API_BASE_url}/voice-logs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(logData),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to create voice log");
    return res.json();
}

export async function deleteVoiceLog(id: number) {
    const res = await fetch(`${API_BASE_url}/voice-logs/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to delete voice log");
    return res.json();
}
