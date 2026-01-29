#!/usr/bin/env python3
"""
가상 데이터 삭제 스크립트
실제 사용자가 입력한 데이터(data_source='manual')는 보존하고
시뮬레이션/가상 데이터만 삭제합니다.
"""

import sqlite3
import os

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "farm_data.db")

def delete_virtual_data():
    """가상 데이터만 삭제, 실제 사용자 데이터는 보존"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        return False
    
    print(f"🔍 Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("\n" + "="*60)
        print("📊 현재 데이터 상태")
        print("="*60)
        
        # 현재 데이터 확인
        cursor.execute("SELECT COUNT(*) FROM sensor_readings WHERE data_source = 'manual'")
        manual_readings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sensor_readings WHERE data_source != 'manual' OR data_source IS NULL")
        virtual_readings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM pest_forecasts WHERE data_source = 'manual'")
        manual_forecasts = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM pest_forecasts WHERE data_source != 'manual' OR data_source IS NULL")
        virtual_forecasts = cursor.fetchone()[0]
        
        print(f"\n📈 센서 데이터:")
        print(f"   ✅ 실제 데이터 (보존): {manual_readings}개")
        print(f"   🎭 가상 데이터 (삭제 예정): {virtual_readings}개")
        
        print(f"\n🐛 병해충 예보:")
        print(f"   ✅ 실제 데이터 (보존): {manual_forecasts}개")
        print(f"   🎭 가상 데이터 (삭제 예정): {virtual_forecasts}개")
        
        if virtual_readings == 0 and virtual_forecasts == 0:
            print("\n✅ 가상 데이터가 없습니다! 모든 데이터가 실제 사용자 데이터입니다.")
            return True
        
        print("\n" + "="*60)
        print("🗑️  가상 데이터 삭제 시작")
        print("="*60)
        
        # 1. 가상 센서 데이터 삭제 (data_source가 'manual'이 아닌 것들)
        cursor.execute("""
            DELETE FROM sensor_readings 
            WHERE data_source != 'manual' OR data_source IS NULL
        """)
        deleted_readings = cursor.rowcount
        print(f"\n✅ 가상 센서 데이터 삭제: {deleted_readings}개")
        
        # 2. 가상 병해충 예보 삭제
        cursor.execute("""
            DELETE FROM pest_forecasts 
            WHERE data_source != 'manual' OR data_source IS NULL
        """)
        deleted_forecasts = cursor.rowcount
        print(f"✅ 가상 병해충 예보 삭제: {deleted_forecasts}개")
        
        # 3. 가상 병해충 사건 삭제
        cursor.execute("""
            DELETE FROM pest_incidents 
            WHERE data_source != 'manual' OR data_source IS NULL
        """)
        deleted_incidents = cursor.rowcount
        print(f"✅ 가상 병해충 사건 삭제: {deleted_incidents}개")
        
        # 4. 가상 작물 진단 삭제
        cursor.execute("""
            DELETE FROM crop_diagnoses 
            WHERE data_source != 'manual' OR data_source IS NULL
        """)
        deleted_diagnoses = cursor.rowcount
        print(f"✅ 가상 작물 진단 삭제: {deleted_diagnoses}개")
        
        # 5. 최종 확인
        print("\n" + "="*60)
        print("📊 삭제 후 데이터 상태")
        print("="*60)
        
        cursor.execute("SELECT COUNT(*) FROM sensor_readings")
        remaining_readings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM pest_forecasts")
        remaining_forecasts = cursor.fetchone()[0]
        
        print(f"\n✅ 남은 센서 데이터: {remaining_readings}개 (모두 실제 데이터)")
        print(f"✅ 남은 병해충 예보: {remaining_forecasts}개 (모두 실제 데이터)")
        
        # Commit changes
        conn.commit()
        print("\n" + "="*60)
        print("🎉 가상 데이터 삭제 완료!")
        print("="*60)
        print("\n✅ 실제 사용자 데이터는 모두 안전하게 보존되었습니다.")
        print("✅ 주간 보고서와 병해충 진단은 이제 실제 데이터만 표시합니다.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🧹 가상 데이터 삭제 (실제 데이터 보존)")
    print("=" * 60)
    print("\n이 스크립트는:")
    print("  ✅ 실제 사용자가 입력한 데이터 (data_source='manual') 보존")
    print("  🗑️  시뮬레이션/가상 데이터만 삭제")
    print("\n삭제 대상:")
    print("  - 가상 센서 측정값")
    print("  - 가상 병해충 예보")
    print("  - 가상 병해충 사건")
    print("  - 가상 작물 진단")
    print("\n" + "=" * 60)
    
    response = input("\n⚠️  계속하시겠습니까? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        import sys
        success = delete_virtual_data()
        sys.exit(0 if success else 1)
    else:
        print("❌ 작업 취소됨")
        import sys
        sys.exit(0)
