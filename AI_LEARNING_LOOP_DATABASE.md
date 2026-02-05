# 🧠 AI Learning Loop: Database Architecture

**작성일**: 2026-02-04  
**상태**: ✅ 구현 완료  
**목적**: 센서 없는 스마트팜에서 AI가 사용자 피드백을 통해 정확도를 향상시키는 시스템

---

## 🎯 핵심 개념

### 문제 정의
**"센서가 없는데 어떻게 AI가 센서보다 정확해질 수 있는가?"**

### 해결 방법
**"사용자의 피드백(Ground Truth)"**과 **"작물의 상태(Biological Indicator)"**를 데이터베이스에 체계적으로 쌓아, **시간이 지날수록 그 농장에 특화된 '개인화된 물리 모델'**을 구축합니다.

---

## 📊 데이터베이스 구조 (ERD)

### 1. `external_weather_logs` (외부 환경 - Input)
**목적**: AI 예측의 기초 자료

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary Key |
| location | String | 농장 위치 |
| timestamp | DateTime | 기록 시간 |
| temp_out | Float | 외부 온도 (°C) |
| humi_out | Float | 외부 습도 (%) |
| condition | String | 날씨 상태 (Clear, Rain 등) |
| wind_speed | Float | 풍속 (m/s) |

**데이터 소스**: OpenWeatherMap API  
**저장 주기**: 1시간마다 자동 저장 (예정)

---

### 2. `virtual_environment_logs` (AI 예측 - Hypothesis)
**목적**: AI의 추정값 저장 (초기엔 부정확함)

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary Key |
| user_id | String | 사용자 ID |
| timestamp | DateTime | 예측 시간 |
| predicted_temp | Float | AI 예측 내부 온도 |
| predicted_humi | Float | AI 예측 내부 습도 |
| predicted_vpd | Float | AI 예측 VPD |
| model_version | String | 모델 버전 (v1.0) |

**데이터 소스**: `physics_engine.py` + AI 모델  
**저장 시점**: 사용자가 대시보드 접속 시

---

### 3. `reality_feedback_logs` (사용자 피드백 - **Ground Truth**) ⭐
**목적**: AI가 정답을 맞췄는지 채점하는 답안지

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary Key |
| user_id | String | 사용자 ID |
| timestamp | DateTime | 피드백 시간 |
| feedback_type | String | EXACT / SENSORY / OBSERVATION |
| feedback_value | String | 실제 값 (예: "24.5C", "HOT", "WILTING") |
| ai_prediction_ref_id | Integer | 연결된 AI 예측 ID (Optional) |

**피드백 타입**:
- **EXACT**: 사용자가 측정한 정확한 값 (예: "온도계 보니 24도야")
- **SENSORY**: 사용자의 체감 (예: "덥고 습해", "건조해")
- **OBSERVATION**: 식물/흙 관찰 (예: "잎이 시들어", "흙이 말라")

**데이터 소스**: 
- Voice Log 자동 분석 (Gemini AI)
- Calibration Modal 수동 입력 (예정)

---

### 4. `farm_physics_profiles` (농장 특성 - Weight) ⭐
**목적**: AI가 학습하는 파라미터 (개인화 모델)

| Column | Type | Description |
|--------|------|-------------|
| user_id | String | Primary Key (사용자당 1개) |
| insulation_score | Float | 단열 점수 (0.0~1.0) |
| moisture_retention | Float | 수분 유지력 (0.0~1.0) |
| thermal_lag | Float | 열 지연 시간 (시간 단위) |
| last_updated | DateTime | 마지막 업데이트 |

**초기값**: 모든 사용자 0.5 (중간값)  
**학습 방법**: `RealityFeedbackLog`와 `VirtualEnvironmentLog` 비교하여 자동 조정 (향후 구현)

---

## 🔄 AI 학습 루프 (Learning Loop)

### Phase 1: 초기 보정 (Calibration) - "오프셋 찾기"
```
[상황]
외부: 10°C
AI 예측: 15°C

[사용자 피드백]
"지금 온도계 보니 18도야"

[AI 학습]
"이 농장은 단열이 잘 되네? +3도 보정 필요"
→ insulation_score: 0.5 → 0.7

[결과]
다음 날부터 +3도 보정된 값 표시
```

### Phase 2: 패턴 학습 (Pattern Recognition) - "경향성 찾기"
```
[상황]
낮: AI 정확함
밤: AI가 실제보다 춥게 예측

[사용자 피드백]
며칠 연속 밤에 "생각보다 안 추워"

[AI 학습]
"이 농장은 열 관성이 높구나"
→ thermal_lag: 1.0 → 2.5 (시간)

[결과]
밤 시간대 온도 감소 그래프 완만하게 수정
```

### Phase 3: 생물학적 지표 역추적 (Biological Indicator)
```
[상황]
AI 예측: 습도 60% (적당함)

[사용자 피드백]
"잎 끝이 타고 흙이 너무 빨리 말라" (사진 첨부)

[AI 학습]
"식물 상태를 보니 실제 습도는 40% 미만이다"
→ moisture_retention: 0.5 → 0.3

[결과]
식물을 '살아있는 센서'로 활용
```

---

## 🛠 구현 상태

### ✅ 완료된 작업

1. **데이터베이스 모델 생성**
   - `backend/app/core/database.py`에 4개 테이블 추가
   - SQLAlchemy ORM 모델 정의

2. **AI 피드백 분석 엔진**
   - `backend/app/services/ai_engine.py`에 `analyze_environment_feedback()` 함수 추가
   - Gemini AI를 사용하여 비정형 텍스트 → 구조화된 피드백 변환

3. **Voice Log 자동 분석**
   - `backend/app/api/voice_logs.py` 수정
   - Voice Log 저장 시 자동으로 피드백 분석 및 `RealityFeedbackLog`에 저장

4. **마이그레이션 스크립트**
   - `backend/scripts/migrate_ai_learning_loop.py` 생성
   - 새 테이블 자동 생성 스크립트

### 🔄 진행 예정

1. **Virtual Environment Log 자동 저장**
   - 대시보드 접속 시 AI 예측값을 `VirtualEnvironmentLog`에 저장
   - 1시간마다 백그라운드에서 자동 저장

2. **External Weather Log 자동 수집**
   - OpenWeatherMap API 연동
   - 1시간마다 자동으로 날씨 데이터 저장

3. **Farm Physics Profile 자동 학습**
   - `RealityFeedbackLog`와 `VirtualEnvironmentLog` 비교
   - 오차를 줄이는 방향으로 `FarmPhysicsProfile` 파라미터 자동 조정

4. **Calibration Modal UI**
   - 사용자가 수동으로 "지금 온도/습도" 입력할 수 있는 UI
   - "덥다/춥다", "습하다/건조하다" 버튼 추가

---

## 🚀 배포 방법

### 1. 데이터베이스 마이그레이션
```bash
cd /Users/ijeong-u/Desktop/smartfarm_ai/backend
python scripts/migrate_ai_learning_loop.py
```

### 2. 서버 재시작
```bash
# 로컬 개발
cd /Users/ijeong-u/Desktop/smartfarm_ai
./stop.sh
./start.sh

# 프로덕션 (Render)
# 자동 재배포됨 (git push 시)
```

### 3. 테스트
```bash
# Voice Log 테스트
curl -X POST https://forhumanai.net/api/voice-logs \
  -H "Content-Type: application/json" \
  -H "X-Farm-ID: test-user-123" \
  -d '{"text": "지금 좀 덥네", "category": "general"}'

# 피드백 확인
# 서버 로그에서 "✅ Feedback saved: SENSORY - HOT" 확인
```

---

## 📈 예상 효과

### 정확도 향상 타임라인

| 기간 | 피드백 수 | 예상 정확도 | 비고 |
|------|-----------|-------------|------|
| 1주차 | 0-5개 | 60% | 기본 물리 모델만 사용 |
| 2주차 | 10-20개 | 75% | 초기 보정 완료 |
| 1개월 | 50-100개 | 85% | 패턴 학습 시작 |
| 3개월 | 200-500개 | 90%+ | 개인화 모델 완성 |

### 센서 대비 장점

| 항목 | 센서 | AI (학습 후) |
|------|------|--------------|
| **초기 비용** | $100-800 | $0 |
| **설치 시간** | 1-2시간 | 즉시 |
| **정확도** | 95% | 90%+ (3개월 후) |
| **확장성** | 제한적 | 무한대 |
| **맥락 이해** | 불가능 | 가능 (식물 상태 고려) |

---

## 🔐 보안 및 프라이버시

### 데이터 격리
- 모든 테이블에 `user_id` 컬럼 포함
- `X-Farm-ID` 헤더로 사용자 인증
- 다른 사용자의 데이터 접근 불가

### 데이터 소유권
- 사용자의 피드백 데이터는 사용자 소유
- 삭제 요청 시 모든 관련 데이터 삭제 (GDPR 준수)

---

## 💡 핵심 인사이트

### "센서 없이 어떻게 정확해지는가?"

1. **초기엔 부정확하다** - 이건 인정해야 합니다.
2. **하지만 사용자가 "덥다"고 한 마디만 해도** - AI는 그 농장의 특성을 학습합니다.
3. **식물이 시들면** - 그것 자체가 "습도가 낮다"는 센서 데이터입니다.
4. **시간이 지날수록** - 그 농장만의 "디지털 트윈"이 완성됩니다.

### "이것이 우리의 차별점"

- **경쟁사**: 센서 필수 → 진입 장벽 높음
- **우리**: 센서 없이 시작 → 누구나 사용 가능
- **결과**: 더 많은 사용자 → 더 많은 데이터 → 더 정확한 AI

---

## 📝 다음 단계

### 즉시 (이번 주)
1. ✅ 데이터베이스 마이그레이션 실행
2. ✅ Voice Log 자동 분석 테스트
3. 🔄 Virtual Environment Log 자동 저장 구현

### 단기 (2주 내)
1. External Weather Log 자동 수집
2. Calibration Modal UI 추가
3. 피드백 데이터 시각화 (관리자 대시보드)

### 중기 (1개월 내)
1. Farm Physics Profile 자동 학습 알고리즘
2. 정확도 개선 리포트 (사용자에게 보여주기)
3. A/B 테스트 (학습 전 vs 학습 후)

---

**작성자**: Antigravity AI  
**최종 수정**: 2026-02-04 21:15  
**상태**: ✅ 구현 완료 - 배포 준비됨
