const API_BASE_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface DashboardData {
    location: {
        name: string;
        lat: number;
        lon: number;
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
}

export async function fetchDashboardData(city: string = "San Francisco"): Promise<DashboardData> {
    const res = await fetch(`${API_BASE_url}/dashboard?crop_type=Strawberries&city=${encodeURIComponent(city)}`, {
        cache: "no-store",
        next: { revalidate: 0 } // Additional guarantee: Next.js 15+ compatible
    });
    if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
    }
    return res.json();
}

export async function fetchAIAnalysis(crop: string, temp: number, humidity: number, rain: number, wind: number) {
    const params = new URLSearchParams({
        crop_type: crop,
        temp: temp.toString(),
        humidity: humidity.toString(),
        rain: rain.toString(),
        wind: wind.toString()
    });

    const res = await fetch(`${API_BASE_url}/ai/analyze?${params}`, {
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) {
        throw new Error("AI Analysis failed");
    }
    return res.json();
}

export async function uploadImageForDiagnosis(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_url}/ai/diagnose`, {
        method: "POST",
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
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
}

export async function fetchMarketPrices(crop: string) {
    const res = await fetch(`${API_BASE_url}/market/prices?crop_type=${crop}`, {
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch market prices");
    return res.json();
}

export async function fetchUserProfile() {
    const res = await fetch(`${API_BASE_url}/users/me`, {
        cache: "no-store"
    });
    if (res.status === 404) return null; // Benign case: User not logged in
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
}

export async function updateUserTerms(agreed: boolean) {
    const res = await fetch(`${API_BASE_url}/users/me/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed }),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to update terms status");
    return res.json();
}

export async function recordSensorData(data: any) {
    const res = await fetch(`${API_BASE_url}/sensors/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to record sensor data");
    return res.json();
}

export async function fetchWeeklyReport() {
    const res = await fetch(`${API_BASE_url}/reports/weekly`, {
        cache: "no-store",
        next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error("Failed to fetch weekly report");
    return res.json();
}
