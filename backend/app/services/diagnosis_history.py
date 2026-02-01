"""
AI Diagnosis History Service
Manages user-specific diagnosis records for context-aware AI analysis
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.config import DB_NAME


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_diagnosis_table():
    """Initialize diagnosis_history table with user isolation"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnosis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            crop_type TEXT,
            diagnosis_text TEXT NOT NULL,
            confidence_score REAL,
            image_path TEXT,
            symptoms TEXT,
            recommendations TEXT,
            severity TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_diagnosis_user_time 
        ON diagnosis_history(user_id, timestamp DESC)
    """)
    
    conn.commit()
    conn.close()


def save_diagnosis(
    user_id: str,
    diagnosis_text: str,
    crop_type: Optional[str] = None,
    confidence_score: Optional[float] = None,
    image_path: Optional[str] = None,
    symptoms: Optional[str] = None,
    recommendations: Optional[str] = None,
    severity: Optional[str] = None
) -> int:
    """
    Save a new diagnosis record
    
    Args:
        user_id: User identifier
        diagnosis_text: Full AI diagnosis text
        crop_type: Type of crop diagnosed
        confidence_score: AI confidence (0-1)
        image_path: Path to uploaded image (if any)
        symptoms: Extracted symptoms
        recommendations: Extracted recommendations
        severity: Severity level (Normal/Warning/Critical)
    
    Returns:
        diagnosis_id: ID of the saved record
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO diagnosis_history 
        (user_id, crop_type, diagnosis_text, confidence_score, image_path, 
         symptoms, recommendations, severity, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        crop_type,
        diagnosis_text,
        confidence_score,
        image_path,
        symptoms,
        recommendations,
        severity,
        datetime.now()
    ))
    
    diagnosis_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return diagnosis_id


def get_user_diagnosis_history(
    user_id: str,
    limit: int = 10,
    crop_type: Optional[str] = None,
    days_back: Optional[int] = None
) -> List[Dict]:
    """
    Retrieve user's diagnosis history
    
    Args:
        user_id: User identifier
        limit: Maximum number of records to return
        crop_type: Filter by specific crop type
        days_back: Only return diagnoses from last N days
    
    Returns:
        List of diagnosis records
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT id, crop_type, diagnosis_text, confidence_score, 
               symptoms, recommendations, severity, timestamp
        FROM diagnosis_history
        WHERE user_id = ?
    """
    params = [user_id]
    
    if crop_type:
        query += " AND crop_type = ?"
        params.append(crop_type)
    
    if days_back:
        cutoff_date = datetime.now() - timedelta(days=days_back)
        query += " AND timestamp >= ?"
        params.append(cutoff_date)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_diagnosis_context_for_ai(user_id: str, crop_type: Optional[str] = None) -> str:
    """
    Generate context string from past diagnoses for AI analysis
    
    Args:
        user_id: User identifier
        crop_type: Filter by crop type
    
    Returns:
        Formatted context string for AI prompt
    """
    history = get_user_diagnosis_history(
        user_id=user_id,
        limit=5,
        crop_type=crop_type,
        days_back=30  # Last 30 days
    )
    
    if not history:
        return ""
    
    context = "\n\n[DIAGNOSIS HISTORY - Last 30 Days]\n"
    context += "The user has the following recent diagnosis history:\n\n"
    
    for i, record in enumerate(history, 1):
        timestamp = record.get('timestamp', 'Unknown')
        severity = record.get('severity', 'Unknown')
        symptoms = record.get('symptoms', 'Not recorded')
        
        context += f"{i}. Date: {timestamp}\n"
        context += f"   Severity: {severity}\n"
        context += f"   Symptoms: {symptoms}\n"
        
        if i < len(history):
            context += "\n"
    
    context += "\nConsider this history when making your diagnosis. "
    context += "Look for recurring patterns or worsening conditions.\n"
    
    return context


def get_diagnosis_stats(user_id: str, days: int = 30) -> Dict:
    """
    Get diagnosis statistics for a user
    
    Args:
        user_id: User identifier
        days: Number of days to analyze
    
    Returns:
        Dictionary with statistics
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Total diagnoses
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM diagnosis_history
        WHERE user_id = ? AND timestamp >= ?
    """, (user_id, cutoff_date))
    total = cursor.fetchone()['total']
    
    # Severity breakdown
    cursor.execute("""
        SELECT severity, COUNT(*) as count
        FROM diagnosis_history
        WHERE user_id = ? AND timestamp >= ?
        GROUP BY severity
    """, (user_id, cutoff_date))
    severity_counts = {row['severity']: row['count'] for row in cursor.fetchall()}
    
    # Most common crop
    cursor.execute("""
        SELECT crop_type, COUNT(*) as count
        FROM diagnosis_history
        WHERE user_id = ? AND timestamp >= ? AND crop_type IS NOT NULL
        GROUP BY crop_type
        ORDER BY count DESC
        LIMIT 1
    """, (user_id, cutoff_date))
    most_common_crop_row = cursor.fetchone()
    most_common_crop = most_common_crop_row['crop_type'] if most_common_crop_row else None
    
    conn.close()
    
    return {
        'total_diagnoses': total,
        'severity_breakdown': severity_counts,
        'most_common_crop': most_common_crop,
        'period_days': days
    }


def delete_old_diagnoses(user_id: str, days_to_keep: int = 90):
    """
    Delete diagnoses older than specified days
    
    Args:
        user_id: User identifier
        days_to_keep: Keep diagnoses from last N days
    
    Returns:
        Number of deleted records
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    
    cursor.execute("""
        DELETE FROM diagnosis_history
        WHERE user_id = ? AND timestamp < ?
    """, (user_id, cutoff_date))
    
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    return deleted_count


# Initialize table on module import
try:
    init_diagnosis_table()
except Exception as e:
    print(f"Warning: Could not initialize diagnosis_history table: {e}")
