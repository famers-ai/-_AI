"""
Weekly Report API for Smart Farm AI
Generates weekly reports based on real user data
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db, User, SensorReading, PestForecast

router = APIRouter()

# Authentication via X-Farm-ID header
def get_current_user_id(x_farm_id: str = Header(..., alias="X-Farm-ID")):
    """
    Get current user ID from X-Farm-ID header.
    This ensures all user data is isolated per user.
    """
    if not x_farm_id:
        raise HTTPException(status_code=400, detail="Missing X-Farm-ID header")
    return x_farm_id

@router.get("/weekly")
async def get_weekly_report(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate weekly report based on user's actual sensor data
    """
    try:
        # 0. Get User Crop Info
        user = db.query(User).filter(User.id == user_id).first()
        crop_type = user.crop_type if user and user.crop_type else "Crops"

        # 1. Get current week data (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        current_week_data = db.query(
            func.date(SensorReading.timestamp).label('date'),
            func.avg(SensorReading.temperature).label('avg_temp'),
            func.avg(SensorReading.humidity).label('avg_humidity'),
            # Note: VPD calculation - you may need to add vpd column or calculate it
            # For now, using a placeholder calculation
            func.count(SensorReading.id).label('readings_count')
        ).filter(
            and_(
                SensorReading.user_id == user_id,
                SensorReading.timestamp >= seven_days_ago
            )
        ).group_by(
            func.date(SensorReading.timestamp)
        ).order_by(
            func.date(SensorReading.timestamp).asc()
        ).all()
        
        # Check if user has data
        if not current_week_data:
            return {
                "has_data": False,
                "message": "No data available. Please record your farm data daily to see weekly reports.",
                "suggestion": "Go to Dashboard and click 'Record Data' to start tracking your farm's performance."
            }
        
        # 2. Get previous week data (8-14 days ago)
        fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
        
        prev_week_data = db.query(
            func.avg(SensorReading.temperature).label('prev_avg_temp'),
            func.avg(SensorReading.humidity).label('prev_avg_humidity')
        ).filter(
            and_(
                SensorReading.user_id == user_id,
                SensorReading.timestamp >= fourteen_days_ago,
                SensorReading.timestamp < seven_days_ago
            )
        ).first()
        
        # 3. Get pest risk data (if available)
        try:
            pest_risk_data = db.query(
                func.avg(PestForecast.risk_level).label('avg_risk')
            ).filter(
                and_(
                    PestForecast.location == user.location if user else None,
                    PestForecast.timestamp >= seven_days_ago
                )
            ).first()
        except Exception:
            pest_risk_data = None

        
        # 4. Calculate summary statistics
        # Convert SQLAlchemy results to dict-like objects for easier processing
        current_week = []
        for row in current_week_data:
            # Calculate VPD from temperature and humidity
            # VPD (kPa) = (1 - RH/100) * SVP
            # SVP = 0.6108 * exp(17.27 * T / (T + 237.3))
            temp_c = (row.avg_temp - 32) * 5/9 if row.avg_temp else 0
            svp = 0.6108 * (2.71828 ** (17.27 * temp_c / (temp_c + 237.3))) if temp_c else 0
            vpd = (1 - (row.avg_humidity / 100)) * svp if row.avg_humidity else 0
            
            current_week.append({
                'date': str(row.date),
                'avg_temp': float(row.avg_temp) if row.avg_temp else None,
                'avg_humidity': float(row.avg_humidity) if row.avg_humidity else None,
                'avg_vpd': vpd,
                'readings_count': row.readings_count
            })
        
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
        
        if prev_week_data and prev_week_data.prev_avg_temp:
            # Calculate previous week VPD
            prev_temp_c = (prev_week_data.prev_avg_temp - 32) * 5/9
            prev_svp = 0.6108 * (2.71828 ** (17.27 * prev_temp_c / (prev_temp_c + 237.3)))
            prev_avg_vpd = (1 - (prev_week_data.prev_avg_humidity / 100)) * prev_svp if prev_week_data.prev_avg_humidity else 0
            
            temp_change = ((avg_temp - prev_week_data.prev_avg_temp) / prev_week_data.prev_avg_temp) * 100
            humidity_change = ((avg_humidity - prev_week_data.prev_avg_humidity) / prev_week_data.prev_avg_humidity) * 100 if prev_week_data.prev_avg_humidity else 0
            vpd_change = ((avg_vpd - prev_avg_vpd) / prev_avg_vpd) * 100 if prev_avg_vpd else 0
        
        # 6. Determine pest risk
        pest_risk = 10  # Default low risk
        if pest_risk_data and pest_risk_data.avg_risk:
            pest_risk = round(float(pest_risk_data.avg_risk))
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
