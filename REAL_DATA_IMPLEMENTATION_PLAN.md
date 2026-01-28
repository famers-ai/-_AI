# 🔄 Smart Farm AI - 실제 데이터 기반 시스템 전환 계획서

**작성일**: 2026-01-27  
**목표**: 시뮬레이션 데이터 → 실제 사용자 데이터 기반 시스템  
**우선순위**: 최고 (P0)

---

## 📋 현재 문제점 분석

### 1. **Weekly Report** ❌
**현재 상태**: 하드코딩된 시뮬레이션 데이터
```typescript
// frontend/app/reports/page.tsx
const [summary, setSummary] = useState<WeeklySummary>({
  avgVpd: 0.68,        // ❌ 고정값
  avgTemp: 67.2,       // ❌ 고정값
  avgHumidity: 68,     // ❌ 고정값
  pestRisk: 12,        // ❌ 고정값
  // ...
});

const [chartData, setChartData] = useState<ChartData>({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  vpd: [0.65, 0.68, 0.70, 0.67, 0.69, 0.68, 0.67],  // ❌ 고정값
  // ...
});
```

**문제점**:
- ✅ 사용자가 로그인해도 동일한 데이터 표시
- ✅ 실제 농장 데이터와 무관
- ✅ 시간이 지나도 데이터 변화 없음
- ✅ 사용자별 맞춤 데이터 없음

**올바른 방식**:
```typescript
// ✅ 실제 사용자의 지난 7일 데이터를 DB에서 조회
const fetchWeeklyReport = async () => {
  const response = await fetch(`/api/reports/weekly?userId=${userId}`);
  const data = await response.json();
  setSummary(data.summary);
  setChartData(data.chartData);
};
```

### 2. **Market Prices** ⚠️
**현재 상태**: 랜덤 시뮬레이션 데이터
```python
# backend/app/services/data_handler.py (Line 201-224)
def fetch_market_prices(crop_type):
    # Fallback Simulation
    base = 2.50 if crop_type == "Strawberries" else 1.50
    
    for i in range(7):
        noise = random.uniform(-0.1, 0.1)  # ❌ 랜덤 노이즈
        daily_price = max(0.5, current_price + noise)
        prices.append(round(daily_price, 2))
```

**문제점**:
- ✅ 실제 시장 가격과 무관
- ✅ 매번 새로고침 시 다른 값
- ✅ 사용자 의사결정에 도움 안 됨

**올바른 방식**:
```python
# ✅ 실제 USDA Mars API 호출
def fetch_real_market_prices(crop_type):
    api_key = os.getenv("USDA_API_KEY")
    url = f"https://marsapi.ams.usda.gov/services/v1.2/reports"
    # 실제 API 호출 및 파싱
    return real_price_data
```

### 3. **Pest Forecast** ⚠️
**현재 상태**: 룰 기반 시뮬레이션
```python
# backend/app/services/data_handler.py (Line 120-191)
def calculate_weekly_pest_risk(lat, lon, crop_type):
    # AI 분석 시도 (Gemini API 사용)
    ai_results = analyze_pest_risk_with_ai(weather_summary, crop_type)
    
    if ai_results:
        return df_ai  # ✅ AI 기반 (좋음)
    
    # Fallback: 룰 기반
    if crop_type == "Strawberries":
        if 55 <= avg_temp <= 75 and (rain > 0.05 or hum > 85):
            risk_score = 90  # ❌ 단순 룰
```

**문제점**:
- ⚠️ AI 분석은 좋으나, Fallback이 너무 단순
- ✅ 실제 병해충 발생 이력 미반영
- ✅ 사용자 농장 특성 미반영

**올바른 방식**:
```python
# ✅ 사용자 농장 이력 + AI 분석 결합
def calculate_pest_risk_with_history(user_id, lat, lon, crop_type):
    # 1. 사용자의 과거 병해충 발생 이력 조회
    history = get_user_pest_history(user_id, crop_type)
    
    # 2. 현재 날씨 데이터
    weather = fetch_7day_weather(lat, lon)
    
    # 3. AI 분석 (이력 + 날씨)
    ai_result = analyze_with_history(history, weather, crop_type)
    
    return ai_result
```

### 4. **Dashboard** ⚠️
**현재 상태**: 외부 날씨 기반 추정
```python
# backend/app/api/dashboard.py (Line 20-24)
# Virtual Indoor Sensor Logic (Simulating Greenhouse)
estimated_temp = max(32.0, min(120.0, weather['temperature'] + 8.0))  # ❌ 추정
estimated_hum = max(10.0, min(100.0, weather['humidity'] + 10.0))    # ❌ 추정

indoor_vpd = calculate_vpd(estimated_temp, estimated_hum)
```

**문제점**:
- ✅ 실제 실내 센서 데이터 아님
- ✅ 외부 날씨 + 고정 오프셋으로 추정
- ✅ 사용자 농장의 실제 상태 반영 안 됨

**올바른 방식**:
```python
# ✅ 실제 센서 데이터 또는 사용자 입력
def get_dashboard_data(user_id):
    # 1. 실제 센서 데이터 조회 (IoT 연동 시)
    sensor_data = get_latest_sensor_data(user_id)
    
    if sensor_data:
        return sensor_data  # ✅ 실제 데이터
    
    # 2. 센서 없을 경우: 사용자 수동 입력 데이터
    manual_data = get_latest_manual_entry(user_id)
    
    if manual_data:
        return manual_data  # ✅ 사용자 입력
    
    # 3. 둘 다 없을 경우: 외부 날씨 기반 추정 (현재 방식)
    return estimate_from_weather(lat, lon)
```

---

## 🎯 해결 방안: 3단계 접근법

### Phase 1: 사용자 데이터 수집 시스템 구축 (1-2주)

#### 1.1 데이터베이스 스키마 설계

```sql
-- 사용자 프로필
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    farm_name TEXT,
    location_lat REAL,
    location_lon REAL,
    crop_type TEXT DEFAULT 'Strawberries',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 센서 데이터 (실제 또는 수동 입력)
CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    vpd REAL,
    soil_moisture REAL,
    light_level REAL,
    co2_level REAL,
    data_source TEXT DEFAULT 'manual',  -- 'manual', 'iot', 'estimated'
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 병해충 발생 이력
CREATE TABLE pest_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pest_type TEXT NOT NULL,
    severity TEXT,  -- 'low', 'medium', 'high'
    treatment TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 작물 진단 이력
CREATE TABLE crop_diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    diagnosis TEXT,
    confidence REAL,
    treatment TEXT,
    user_feedback TEXT,  -- 'correct', 'incorrect', 'partially_correct'
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 음성 로그 (서버 저장용)
CREATE TABLE voice_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    text TEXT NOT NULL,
    category TEXT,  -- 'observation', 'task', 'issue', 'note'
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 시장 가격 캐시 (실제 API 데이터 저장)
CREATE TABLE market_price_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT NOT NULL,
    date DATE NOT NULL,
    price REAL NOT NULL,
    source TEXT,  -- 'USDA', 'AI', 'Manual'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crop_type, date)
);
```

#### 1.2 사용자 인증 및 세션 관리

```typescript
// frontend/lib/auth.ts
import { getServerSession } from 'next-auth';

export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return null;
  }
  
  // DB에서 사용자 정보 조회
  const user = await fetch(`/api/users/me`).then(r => r.json());
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }
  return user;
}
```

#### 1.3 데이터 입력 UI 구현

**A. 대시보드에 "데이터 입력" 버튼 추가**

```typescript
// frontend/app/page.tsx
export default function Dashboard() {
  const [showDataInput, setShowDataInput] = useState(false);
  
  return (
    <div>
      {/* 기존 대시보드 */}
      
      {/* 데이터 입력 버튼 */}
      <button
        onClick={() => setShowDataInput(true)}
        className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700"
      >
        📊 Record Data
      </button>
      
      {/* 데이터 입력 모달 */}
      {showDataInput && (
        <DataInputModal
          onClose={() => setShowDataInput(false)}
          onSubmit={handleDataSubmit}
        />
      )}
    </div>
  );
}
```

**B. 데이터 입력 모달 컴포넌트**

```typescript
// frontend/components/DataInputModal.tsx
'use client';

import { useState } from 'react';

interface DataInputModalProps {
  onClose: () => void;
  onSubmit: (data: SensorData) => void;
}

export default function DataInputModal({ onClose, onSubmit }: DataInputModalProps) {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      soil_moisture: soilMoisture ? parseFloat(soilMoisture) : null,
      data_source: 'manual',
    };
    
    const response = await fetch('/api/sensors/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      onSubmit(data);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Record Farm Data</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°F) *
            </label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 68.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Humidity (%) *
            </label>
            <input
              type="number"
              step="0.1"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              required
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 65"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil Moisture (%) <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(e.target.value)}
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 45"
            />
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Data
            </button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 mt-4">
          💡 Tip: Record data daily for accurate weekly reports and AI insights.
        </p>
      </div>
    </div>
  );
}
```

#### 1.4 백엔드 API 구현

```python
# backend/app/api/sensors.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.services.db_handler import get_db_connection
from app.services.auth import get_current_user

router = APIRouter()

class SensorReading(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float | None = None
    light_level: float | None = None
    co2_level: float | None = None
    data_source: str = 'manual'

@router.post("/record")
async def record_sensor_data(
    reading: SensorReading,
    user = Depends(get_current_user)
):
    """사용자의 센서 데이터 기록"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # VPD 계산
    from app.services.data_handler import calculate_vpd
    vpd = calculate_vpd(reading.temperature, reading.humidity)
    
    cursor.execute("""
        INSERT INTO sensor_readings 
        (user_id, temperature, humidity, vpd, soil_moisture, light_level, co2_level, data_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user['id'],
        reading.temperature,
        reading.humidity,
        vpd,
        reading.soil_moisture,
        reading.light_level,
        reading.co2_level,
        reading.data_source
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Data recorded successfully",
        "vpd": vpd
    }

@router.get("/latest")
async def get_latest_reading(user = Depends(get_current_user)):
    """사용자의 최신 센서 데이터 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM sensor_readings
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (user['id'],))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"error": "No data found"}
    
    return {
        "temperature": row['temperature'],
        "humidity": row['humidity'],
        "vpd": row['vpd'],
        "soil_moisture": row['soil_moisture'],
        "timestamp": row['timestamp'],
        "data_source": row['data_source']
    }

@router.get("/history")
async def get_sensor_history(
    days: int = 7,
    user = Depends(get_current_user)
):
    """사용자의 센서 데이터 이력 조회 (주간 리포트용)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            DATE(timestamp) as date,
            AVG(temperature) as avg_temp,
            AVG(humidity) as avg_humidity,
            AVG(vpd) as avg_vpd,
            COUNT(*) as readings_count
        FROM sensor_readings
        WHERE user_id = ?
        AND timestamp >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """, (user['id'], days))
    
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "data": [
            {
                "date": row['date'],
                "avg_temp": round(row['avg_temp'], 1),
                "avg_humidity": round(row['avg_humidity'], 1),
                "avg_vpd": round(row['avg_vpd'], 2),
                "readings_count": row['readings_count']
            }
            for row in rows
        ]
    }
```

### Phase 2: Weekly Report 실제 데이터 연동 (1주)

#### 2.1 백엔드 API 수정

```python
# backend/app/api/reports.py
from fastapi import APIRouter, Depends
from app.services.auth import get_current_user
from app.services.db_handler import get_db_connection
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/weekly")
async def get_weekly_report(user = Depends(get_current_user)):
    """사용자의 주간 리포트 생성"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. 지난 7일 데이터 조회
    cursor.execute("""
        SELECT 
            DATE(timestamp) as date,
            AVG(temperature) as avg_temp,
            AVG(humidity) as avg_humidity,
            AVG(vpd) as avg_vpd,
            COUNT(*) as readings_count
        FROM sensor_readings
        WHERE user_id = ?
        AND timestamp >= datetime('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """, (user['id'],))
    
    daily_data = cursor.fetchall()
    
    # 2. 전주 데이터 조회 (변화율 계산용)
    cursor.execute("""
        SELECT 
            AVG(temperature) as prev_avg_temp,
            AVG(humidity) as prev_avg_humidity,
            AVG(vpd) as prev_avg_vpd
        FROM sensor_readings
        WHERE user_id = ?
        AND timestamp >= datetime('now', '-14 days')
        AND timestamp < datetime('now', '-7 days')
    """, (user['id'],))
    
    prev_week = cursor.fetchone()
    
    # 3. 병해충 위험도 조회
    cursor.execute("""
        SELECT AVG(risk_score) as avg_risk
        FROM pest_forecasts
        WHERE user_id = ?
        AND date >= date('now', '-7 days')
    """, (user['id'],))
    
    pest_risk = cursor.fetchone()
    
    conn.close()
    
    # 데이터 없을 경우 처리
    if not daily_data:
        return {
            "error": "No data available",
            "message": "Please record your farm data daily to see weekly reports.",
            "has_data": False
        }
    
    # 4. 요약 통계 계산
    total_temp = sum(row['avg_temp'] for row in daily_data)
    total_humidity = sum(row['avg_humidity'] for row in daily_data)
    total_vpd = sum(row['avg_vpd'] for row in daily_data)
    count = len(daily_data)
    
    avg_temp = total_temp / count
    avg_humidity = total_humidity / count
    avg_vpd = total_vpd / count
    
    # 5. 변화율 계산
    temp_change = 0
    humidity_change = 0
    vpd_change = 0
    
    if prev_week and prev_week['prev_avg_temp']:
        temp_change = ((avg_temp - prev_week['prev_avg_temp']) / prev_week['prev_avg_temp']) * 100
        humidity_change = ((avg_humidity - prev_week['prev_avg_humidity']) / prev_week['prev_avg_humidity']) * 100
        vpd_change = ((avg_vpd - prev_week['prev_avg_vpd']) / prev_week['prev_avg_vpd']) * 100
    
    # 6. 차트 데이터 준비
    chart_data = {
        "labels": [row['date'] for row in daily_data],
        "vpd": [round(row['avg_vpd'], 2) for row in daily_data],
        "temperature": [round(row['avg_temp'], 1) for row in daily_data],
        "humidity": [round(row['avg_humidity'], 1) for row in daily_data]
    }
    
    return {
        "has_data": True,
        "summary": {
            "avgVpd": round(avg_vpd, 2),
            "avgTemp": round(avg_temp, 1),
            "avgHumidity": round(avg_humidity, 0),
            "pestRisk": round(pest_risk['avg_risk'], 0) if pest_risk else 10,
            "vpdChange": round(vpd_change, 1),
            "tempChange": round(temp_change, 1),
            "humidityChange": round(humidity_change, 1),
            "pestChange": 0  # TODO: 계산 로직 추가
        },
        "chartData": chart_data,
        "dataPoints": count,
        "period": {
            "start": daily_data[0]['date'],
            "end": daily_data[-1]['date']
        }
    }
```

#### 2.2 프론트엔드 수정

```typescript
// frontend/app/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function WeeklyReportPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (session?.user) {
      fetchWeeklyReport();
    }
  }, [session]);
  
  const fetchWeeklyReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/weekly');
      const data = await response.json();
      
      if (data.has_data) {
        setHasData(true);
        setSummary(data.summary);
        setChartData(data.chartData);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!hasData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-yellow-900 mb-4">
            No Data Available
          </h2>
          <p className="text-yellow-700 mb-6">
            You need to record your farm data daily to see weekly reports.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Go to Dashboard to Record Data
          </Link>
        </div>
      </div>
    );
  }
  
  // 기존 Weekly Report UI (실제 데이터로 채워짐)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ... 기존 UI ... */}
    </div>
  );
}
```

### Phase 3: 실제 시장 가격 API 연동 (1주)

#### 3.1 USDA Mars API 연동

```python
# backend/app/services/usda_api.py
import requests
import os
from datetime import datetime, timedelta
from app.services.db_handler import get_db_connection

USDA_API_KEY = os.getenv("USDA_API_KEY")
USDA_BASE_URL = "https://marsapi.ams.usda.gov/services/v1.2"

def fetch_usda_market_prices(crop_type: str):
    """실제 USDA Mars API에서 시장 가격 조회"""
    
    # 1. 캐시 확인 (24시간 이내 데이터)
    cached_data = get_cached_prices(crop_type)
    if cached_data:
        return cached_data
    
    # 2. API 호출
    try:
        # 작물별 USDA 리포트 코드 매핑
        report_codes = {
            "Strawberries": "FV_GR310",  # Strawberry Market News
            "Tomatoes": "FV_GR320",
            "Peppers": "FV_GR330"
        }
        
        report_code = report_codes.get(crop_type, "FV_GR310")
        
        url = f"{USDA_BASE_URL}/reports/{report_code}"
        headers = {"API_KEY": USDA_API_KEY}
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # 3. 데이터 파싱
        prices = parse_usda_response(data, crop_type)
        
        # 4. 캐시 저장
        save_prices_to_cache(crop_type, prices)
        
        return prices
        
    except Exception as e:
        print(f"USDA API Error: {e}")
        # Fallback: AI 분석 또는 시뮬레이션
        return None

def parse_usda_response(data, crop_type):
    """USDA API 응답 파싱"""
    # USDA API 구조에 맞게 파싱
    # 실제 구조는 API 문서 참조 필요
    prices = []
    
    # 예시 파싱 로직
    for item in data.get('results', []):
        prices.append({
            "date": item['date'],
            "price": item['price'],
            "unit": item['unit'],
            "market": item['market']
        })
    
    return prices

def get_cached_prices(crop_type):
    """캐시된 가격 데이터 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT date, price, source
        FROM market_price_cache
        WHERE crop_type = ?
        AND updated_at >= datetime('now', '-1 day')
        ORDER BY date DESC
        LIMIT 7
    """, (crop_type,))
    
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) >= 7:
        return [
            {
                "date": row['date'],
                "price": row['price'],
                "source": row['source']
            }
            for row in rows
        ]
    
    return None

def save_prices_to_cache(crop_type, prices):
    """가격 데이터 캐시 저장"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for price_data in prices:
        cursor.execute("""
            INSERT OR REPLACE INTO market_price_cache
            (crop_type, date, price, source, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        """, (
            crop_type,
            price_data['date'],
            price_data['price'],
            'USDA'
        ))
    
    conn.commit()
    conn.close()
```

---

## 📋 구현 우선순위

### P0: 즉시 구현 (1-2주)

1. ✅ **데이터베이스 스키마 생성**
   - 사용자, 센서 데이터, 병해충 이력 테이블
   - 예상 시간: 4시간

2. ✅ **사용자 인증 연동**
   - NextAuth.js 세션 → DB 사용자 매핑
   - 예상 시간: 6시간

3. ✅ **데이터 입력 UI**
   - 대시보드에 "Record Data" 버튼
   - 데이터 입력 모달
   - 예상 시간: 8시간

4. ✅ **센서 데이터 API**
   - POST /api/sensors/record
   - GET /api/sensors/latest
   - GET /api/sensors/history
   - 예상 시간: 6시간

5. ✅ **Weekly Report 실제 데이터 연동**
   - GET /api/reports/weekly
   - 프론트엔드 수정
   - "No Data" 상태 처리
   - 예상 시간: 8시간

**총 예상 시간**: 32시간 (약 1주)

### P1: 단기 구현 (2-4주)

1. ✅ **USDA API 연동**
   - 실제 시장 가격 조회
   - 캐싱 시스템
   - 예상 시간: 12시간

2. ✅ **병해충 이력 기반 예측**
   - 사용자 이력 + AI 분석
   - 예상 시간: 16시간

3. ✅ **Voice Log 서버 동기화**
   - 로컬 스토리지 → 서버 저장
   - 예상 시간: 8시간

### P2: 중기 구현 (1-2개월)

1. ✅ **IoT 센서 연동**
   - MQTT 브로커 설정
   - WebSocket 실시간 업데이트
   - 예상 시간: 40시간

2. ✅ **자동 데이터 수집**
   - 외부 날씨 API 자동 저장
   - 예상 시간: 8시간

---

## 🎯 사용자 경험 개선

### 신규 사용자 온보딩

```typescript
// frontend/app/onboarding/page.tsx
export default function OnboardingPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to ForHuman AI!</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 How It Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Record your farm data daily (temperature, humidity)</li>
            <li>Get AI-powered insights and recommendations</li>
            <li>View weekly reports and trends</li>
            <li>Make data-driven decisions for your farm</li>
          </ol>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Quick Start</h2>
          <p className="mb-4">Let's set up your farm profile:</p>
          <FarmProfileForm />
        </div>
      </div>
    </div>
  );
}
```

### 데이터 입력 리마인더

```typescript
// frontend/components/DataReminderBanner.tsx
export default function DataReminderBanner() {
  const [lastRecorded, setLastRecorded] = useState<Date | null>(null);
  
  useEffect(() => {
    // 마지막 데이터 입력 시간 조회
    fetch('/api/sensors/latest')
      .then(r => r.json())
      .then(data => setLastRecorded(new Date(data.timestamp)));
  }, []);
  
  const hoursSinceLastRecord = lastRecorded
    ? (Date.now() - lastRecorded.getTime()) / (1000 * 60 * 60)
    : 999;
  
  if (hoursSinceLastRecord < 24) {
    return null; // 24시간 이내 기록 있으면 표시 안 함
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          ⏰
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Reminder:</strong> You haven't recorded data in{' '}
            {Math.floor(hoursSinceLastRecord)} hours. Record now for accurate insights!
          </p>
        </div>
        <div className="ml-auto">
          <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
            Record Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 성공 지표

### 데이터 수집률
- **목표**: 사용자의 80% 이상이 주 3회 이상 데이터 입력
- **측정**: `SELECT COUNT(DISTINCT user_id) FROM sensor_readings WHERE timestamp >= datetime('now', '-7 days')`

### 주간 리포트 활성화율
- **목표**: 주간 리포트 조회 시 70% 이상 실제 데이터 표시
- **측정**: "No Data" 메시지 표시 비율

### 사용자 만족도
- **목표**: 실제 데이터 기반 인사이트에 대한 긍정적 피드백
- **측정**: 사용자 설문조사

---

## 🔄 마이그레이션 계획

### 기존 사용자 처리

```python
# backend/scripts/migrate_users.py
"""
기존 사용자를 새로운 DB 스키마로 마이그레이션
"""

def migrate_existing_users():
    # 1. NextAuth.js users 테이블에서 사용자 조회
    # 2. 새로운 users 테이블로 복사
    # 3. 기본 농장 설정 생성
    pass
```

### 점진적 롤아웃

1. **Week 1**: 신규 사용자에게만 적용
2. **Week 2**: 기존 사용자 10%에게 베타 테스트
3. **Week 3**: 기존 사용자 50%에게 확대
4. **Week 4**: 전체 사용자에게 배포

---

## 🎓 사용자 교육

### 튜토리얼 비디오
- "How to Record Daily Data"
- "Understanding Your Weekly Report"
- "Connecting IoT Sensors"

### 도움말 섹션
```typescript
// frontend/app/help/page.tsx
export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>
      
      <div className="space-y-6">
        <HelpSection
          title="Recording Data"
          content="Learn how to record your farm data daily..."
        />
        <HelpSection
          title="Weekly Reports"
          content="Understand your weekly performance metrics..."
        />
        <HelpSection
          title="AI Insights"
          content="How our AI analyzes your farm data..."
        />
      </div>
    </div>
  );
}
```

---

## 🏁 결론

이 계획서는 **시뮬레이션 데이터에서 실제 사용자 데이터 기반 시스템**으로의 전환을 위한 종합 로드맵입니다.

**핵심 원칙**:
1. ✅ **사용자 데이터 우선**: 실제 데이터가 없으면 명확히 표시
2. ✅ **점진적 구현**: Phase별로 단계적 개발
3. ✅ **사용자 교육**: 데이터 입력의 중요성 강조
4. ✅ **Fallback 전략**: 데이터 없을 때 대안 제시

**예상 타임라인**:
- **P0 (1-2주)**: 기본 데이터 수집 시스템
- **P1 (2-4주)**: 실제 API 연동
- **P2 (1-2개월)**: IoT 센서 연동

**최종 목표**: 사용자에게 **정직하고 가치 있는 데이터 기반 인사이트** 제공

---

**작성자**: Antigravity AI  
**최종 업데이트**: 2026-01-27  
**다음 리뷰**: 구현 시작 후 1주
