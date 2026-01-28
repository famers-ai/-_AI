"""
Weekly Report API for Smart Farm AI
Generates weekly reports based on real user data
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
import sqlite3
import os

router = APIRouter()

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# TODO: Implement proper authentication
def get_current_user_id(user_id: str = "test_user_001"):
    """Get current user ID (placeholder for auth)"""
    return user_id

@router.get("/weekly")
async def get_weekly_report(user_id: str = Depends(get_current_user_id)):
    """
    Generate weekly report based on user's actual sensor data
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 0. Get User Crop Info (NEW)
        cursor.execute("SELECT crop_type FROM users WHERE id = ?", (user_id,))
        user_row = cursor.fetchone()
        crop_type = user_row['crop_type'] if user_row and user_row['crop_type'] else "Crops"

        # 1. Get current week data (last 7 days)
        cursor.execute("""
            SELECT 
                DATE(timestamp) as date,
                AVG(temperature) as avg_temp,
                AVG(humidity) as avg_humidity,
                AVG(vpd) as avg_vpd,
                COUNT(*) as readings_count
            FROM sensor_readings
            WHERE user_id = ?
            AND data_source = 'manual'
            AND timestamp >= datetime('now', '-7 days')
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        """, (user_id,))
        
        current_week = cursor.fetchall()
        
        # Check if user has data
        if not current_week:
            conn.close()
            return {
                "has_data": False,
                "message": "No data available. Please record your farm data daily to see weekly reports.",
                "suggestion": "Go to Dashboard and click 'Record Data' to start tracking your farm's performance."
            }
        
        # 2. Get previous week data (8-14 days ago)
        cursor.execute("""
            SELECT 
                AVG(temperature) as prev_avg_temp,
                AVG(humidity) as prev_avg_humidity,
                AVG(vpd) as prev_avg_vpd
            FROM sensor_readings
            WHERE user_id = ?
            AND data_source = 'manual'
            AND timestamp >= datetime('now', '-14 days')
            AND timestamp < datetime('now', '-7 days')
        """, (user_id,))
        
        prev_week = cursor.fetchone()
        
        # 3. Get pest risk data (if available) - Assuming table exists, if not handle gracefully
        try:
            cursor.execute("""
                SELECT AVG(risk_score) as avg_risk
                FROM pest_forecasts
                WHERE user_id = ?
                AND date >= date('now', '-7 days')
            """, (user_id,))
            pest_risk_row = cursor.fetchone()
        except sqlite3.OperationalError:
            pest_risk_row = None
        
        conn.close()
        
        # 4. Calculate summary statistics
        total_temp = sum(row['avg_temp'] for row in current_week if row['avg_temp'])
        total_humidity = sum(row['avg_humidity'] for row in current_week if row['avg_humidity'])
        total_vpd = sum(row['avg_vpd'] for row in current_week if row['avg_vpd'])
        count = len(current_week)
        
        avg_temp = total_temp / count if count > 0 else 0
        avg_humidity = total_humidity / count if count > 0 else 0
        avg_vpd = total_vpd / count if count > 0 else 0
        
        # 5. Calculate change percentages
        temp_change = 0
        humidity_change = 0
        vpd_change = 0
        
        if prev_week and prev_week['prev_avg_temp']:
            temp_change = ((avg_temp - prev_week['prev_avg_temp']) / prev_week['prev_avg_temp']) * 100
            humidity_change = ((avg_humidity - prev_week['prev_avg_humidity']) / prev_week['prev_avg_humidity']) * 100
            vpd_change = ((avg_vpd - prev_week['prev_avg_vpd']) / prev_week['prev_avg_vpd']) * 100
        
        # 6. Determine pest risk
        pest_risk = 10  # Default low risk
        if pest_risk_row and pest_risk_row['avg_risk']:
            pest_risk = round(pest_risk_row['avg_risk'])
        else:
            # Calculate based on VPD if no forecast data
            if avg_vpd < 0.4:
                pest_risk = 75  # High risk of fungal diseases
            elif avg_vpd > 1.6:
                pest_risk = 65  # High risk of spider mites
            elif 0.4 <= avg_vpd <= 1.2:
                pest_risk = 15  # Optimal range
        
        # 7. Prepare chart data
        chart_labels = []
        chart_vpd = []
        chart_temp = []
        chart_humidity = []
        
        # Fill in missing days with None
        start_date = datetime.now() - timedelta(days=6)
        for i in range(7):
            target_date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            # Short day name
            chart_labels.append(datetime.strptime(target_date, '%Y-%m-%d').strftime('%a'))
            
            # Find matching data
            matching_row = next((row for row in current_week if row['date'] == target_date), None)
            
            if matching_row:
                chart_vpd.append(round(matching_row['avg_vpd'], 2) if matching_row['avg_vpd'] else None)
                chart_temp.append(round(matching_row['avg_temp'], 1) if matching_row['avg_temp'] else None)
                chart_humidity.append(round(matching_row['avg_humidity'], 1) if matching_row['avg_humidity'] else None)
            else:
                chart_vpd.append(None)
                chart_temp.append(None)
                chart_humidity.append(None)
        
        # 8. Generate AI insights
        insights = generate_insights(avg_vpd, avg_temp, avg_humidity, pest_risk)
        
        # 9. Identify best and worst days
        # Helper to safely get vpd
        def get_vpd(row): return row['avg_vpd'] if row['avg_vpd'] is not None else 0

        best_day = max(current_week, key=lambda x: get_vpd(x) if 0.4 <= get_vpd(x) <= 1.2 else -1, default=current_week[0])
        worst_day = min(current_week, key=lambda x: abs(get_vpd(x) - 0.8) if get_vpd(x) else 999, default=current_week[0])
        
        return {
            "has_data": True,
            "summary": {
                "avgVpd": round(avg_vpd, 2),
                "avgTemp": round(avg_temp, 1),
                "avgHumidity": round(avg_humidity, 0),
                "pestRisk": pest_risk,
                "vpdChange": round(vpd_change, 1),
                "tempChange": round(temp_change, 1),
                "humidityChange": round(humidity_change, 1),
                "pestChange": 0, 
                "vpdStatus": get_vpd_status(avg_vpd),
                "optimalVpdRange": "0.4-1.2 kPa"
            },
            "chartData": {
                "labels": chart_labels,
                "vpd": chart_vpd,
                "temperature": chart_temp,
                "humidity": chart_humidity
            },
            "insights": insights,
            "highlights": {
                "bestDay": {
                    "date": best_day['date'],
                    "vpd": round(best_day['avg_vpd'], 2) if best_day['avg_vpd'] else None,
                    "reason": "Optimal VPD conditions"
                },
                "attentionDay": {
                    "date": worst_day['date'],
                    "vpd": round(worst_day['avg_vpd'], 2) if worst_day['avg_vpd'] else None,
                    "reason": "VPD outside optimal range"
                }
            },
            "dataQuality": {
                "totalDays": count,
                "totalReadings": sum(row['readings_count'] for row in current_week),
                "completeness": f"{(count/7)*100:.0f}%"
            },
            "period": {
                "start": current_week[0]['date'],
                "end": current_week[-1]['date']
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate weekly report: {str(e)}")

def get_vpd_status(vpd: float) -> str:
    """Determine VPD status"""
    if vpd < 0.4:
        return "Too Humid (Risk: Fungal Diseases)"
    elif vpd > 1.6:
        return "Too Dry (Risk: Spider Mites)"
    elif 0.4 <= vpd <= 1.2:
        return "Optimal"
    else:
        return "Acceptable"

def generate_insights(avg_vpd: float, avg_temp: float, avg_humidity: float, pest_risk: int) -> list:
    """Generate AI insights based on data"""
    insights = []
    
    # VPD insights
    if avg_vpd < 0.4:
        insights.append({
            "type": "warning",
            "title": "Low VPD Detected",
            "message": f"Your average VPD of {avg_vpd:.2f} kPa is below optimal range. This increases risk of fungal diseases.",
            "recommendation": "Increase ventilation or reduce humidity to raise VPD to 0.4-1.2 kPa range."
        })
    elif avg_vpd > 1.6:
        insights.append({
            "type": "warning",
            "title": "High VPD Detected",
            "message": f"Your average VPD of {avg_vpd:.2f} kPa is above optimal range. This can stress plants and attract spider mites.",
            "recommendation": "Increase humidity or lower temperature to bring VPD into 0.4-1.2 kPa range."
        })
    else:
        insights.append({
            "type": "success",
            "title": "Excellent VPD Control",
            "message": f"Your average VPD of {avg_vpd:.2f} kPa is in the optimal range!",
            "recommendation": "Maintain current environmental conditions."
        })
    
    # Temperature insights
    if avg_temp < 60:
        insights.append({
            "type": "info",
            "title": "Cool Temperature",
            "message": f"Average temperature of {avg_temp:.1f}°F is on the cool side.",
            "recommendation": "Consider increasing temperature to 65-75°F for optimal growth."
        })
    elif avg_temp > 85:
        insights.append({
            "type": "warning",
            "title": "High Temperature",
            "message": f"Average temperature of {avg_temp:.1f}°F may stress plants.",
            "recommendation": "Improve cooling or ventilation to lower temperature."
        })
    
    # Pest risk insights
    if pest_risk > 50:
        insights.append({
            "type": "alert",
            "title": "High Pest Risk",
            "message": f"Pest risk is at {pest_risk}%. Monitor plants closely for signs of disease or pests.",
            "recommendation": "Inspect plants daily. Do NOT use chemical pesticides without consulting an expert."
        })

    # LEGAL DISCLAIMER (MANDATORY)
    insights.append({
        "type": "info",
        "title": "Legal Disclaimer",
        "message": "This report is generated based on sensor data and general agricultural guidelines.",
        "recommendation": "Always consult with local agricultural extension services before applying any treatments. Smart Farm AI is not liable for crop loss."
    })
    
    return insights
