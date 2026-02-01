# 데이터 혼합 가능성 분석 및 해결 방안

## 🚨 발견된 잠재적 문제점

### 1. ❌ **CRITICAL**: `calibrate_sensors` 엔드포인트에 user_id 누락
**위치**: `backend/app/api/dashboard.py:229-257`
**문제**: 캘리브레이션 데이터가 사용자별로 분리되지 않음
**영향**: 모든 사용자가 같은 물리 엔진 캘리브레이션 공유 → 데이터 혼합

### 2. ❌ **CRITICAL**: `control_farm` 엔드포인트에 user_id 누락
**위치**: `backend/app/api/dashboard.py:259-278`
**문제**: 가상 컨트롤러 상태가 사용자별로 분리되지 않음
**영향**: 사용자 간 제어 상태 혼합 가능

### 3. ⚠️ **HIGH**: Physics Engine 글로벌 상태
**위치**: `backend/app/services/physics_engine.py`
**문제**: 물리 엔진이 글로벌 캘리브레이션 사용
**영향**: 한 사용자의 캘리브레이션이 다른 사용자에게 영향

### 4. ⚠️ **MEDIUM**: AI Engine 사용자 컨텍스트
**위치**: `backend/app/services/ai_engine.py`
**문제**: AI 분석 시 사용자별 히스토리 미사용 가능성
**영향**: 개인화된 AI 추천 부족

### 5. ⚠️ **MEDIUM**: 레거시 테이블 존재
**위치**: Database
**문제**: `sensor_logs`, `safety_logs`, `training_data` 등 user_id 없는 테이블
**영향**: 레거시 데이터 혼합 가능성

### 6. ⚠️ **LOW**: 세션 타임아웃 후 localStorage 잔존
**위치**: Frontend
**문제**: 세션 만료 후에도 farm_id가 localStorage에 남음
**영향**: 잘못된 사용자로 API 호출 가능

## 🔧 해결 방안

### 1. 모든 엔드포인트에 user_id 강제
- calibrate_sensors에 X-Farm-ID 헤더 추가
- control_farm에 X-Farm-ID 헤더 추가
- 모든 POST/PUT/DELETE 엔드포인트 검증

### 2. Physics Engine 사용자별 캘리브레이션
- 캘리브레이션 데이터를 DB에 저장 (user_id 포함)
- 사용자별 캘리브레이션 로드
- 기본값으로 폴백

### 3. 레거시 테이블 마이그레이션
- user_id 컬럼 추가
- 기존 데이터 삭제 또는 마이그레이션
- 외래 키 제약조건 추가

### 4. Frontend 세션 동기화
- 세션 만료 시 localStorage 자동 정리
- API 401 응답 시 강제 로그아웃
- 세션 검증 미들웨어

### 5. 데이터베이스 제약조건 강화
- NOT NULL 제약조건 추가
- CHECK 제약조건으로 유효성 검증
- 트리거로 데이터 무결성 보장

## 📊 모든 경우의 수

### Case 1: 정상 로그인 사용자
✅ user_id = session.user.email
✅ 모든 API 호출에 X-Farm-ID 포함
✅ 데이터 분리 보장

### Case 2: 세션 만료 사용자
❌ localStorage에 farm_id 잔존
❌ API 호출 시 401 에러
🔧 해결: 401 시 자동 로그아웃 + localStorage 정리

### Case 3: 동시 로그인 (다른 탭)
❌ 한 탭에서 로그아웃 시 다른 탭 영향
🔧 해결: Storage Event Listener로 동기화

### Case 4: 캘리브레이션 데이터
❌ 현재: 글로벌 상태 공유
🔧 해결: DB에 user_id와 함께 저장

### Case 5: 가상 컨트롤러
❌ 현재: 상태 분리 없음
🔧 해결: 세션 기반 상태 관리

### Case 6: AI 분석
✅ user_id 전달됨
⚠️ 사용자별 히스토리 활용 확인 필요

### Case 7: 레거시 데이터
❌ user_id 없는 테이블 존재
🔧 해결: 마이그레이션 스크립트

### Case 8: 직접 DB 접근
❌ 외래 키 제약조건만으로는 불충분
🔧 해결: Row Level Security (RLS) 고려

## 🎯 우선순위

### P0 (즉시 수정 필요)
1. calibrate_sensors에 user_id 추가
2. control_farm에 user_id 추가
3. Frontend 401 핸들링

### P1 (24시간 내)
4. Physics Engine 사용자별 캘리브레이션
5. 레거시 테이블 정리
6. 세션 동기화

### P2 (1주일 내)
7. AI Engine 개인화 강화
8. 데이터베이스 제약조건 추가
9. 모니터링 시스템 구축
