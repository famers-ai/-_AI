# 🔑 Gemini API 키 연동 가이드

## 📌 개요
Smart Farm AI는 Google의 Gemini AI를 사용하여 작물 분석, 병해충 진단, 시장 가격 예측 등의 기능을 제공합니다.

## 🚀 빠른 시작

### 1. Gemini API 키 발급

1. **Google AI Studio 접속**
   - 🔗 https://makersuite.google.com/app/apikey
   - Google 계정으로 로그인

2. **API 키 생성**
   - "Create API Key" 버튼 클릭
   - 프로젝트 선택 또는 새 프로젝트 생성
   - API 키 복사 (안전한 곳에 보관!)

3. **API 사용 설정 확인**
   - Google Cloud Console에서 "Generative Language API" 활성화 확인
   - 🔗 https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

### 2. 로컬 개발 환경 설정

#### 방법 1: .env 파일 사용 (권장)

```bash
# 1. .env.example 파일을 .env로 복사
cp .env.example .env

# 2. .env 파일 편집
# GEMINI_API_KEY=your_gemini_api_key_here 부분을 실제 키로 변경
```

`.env` 파일 예시:
```env
GEMINI_API_KEY=AIzaSyAbc123...your_actual_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
DB_PATH=./farm_data.db
ENVIRONMENT=development
DEBUG=true
```

#### 방법 2: 환경 변수 직접 설정

```bash
# macOS/Linux
export GEMINI_API_KEY="your_gemini_api_key_here"

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Streamlit Secrets 설정 (Streamlit 앱용)

Streamlit 프론트엔드를 사용하는 경우:

```bash
# 1. .streamlit 디렉토리 생성 (없는 경우)
mkdir -p .streamlit

# 2. secrets.toml 파일 생성
cat > .streamlit/secrets.toml << EOF
GEMINI_API_KEY = "your_gemini_api_key_here"
OPENWEATHER_API_KEY = "your_openweather_key_here"
EOF
```

### 4. 연동 테스트

```bash
# 백엔드 서버 시작
cd backend
python -m uvicorn app.main:app --reload

# 또는 전체 시스템 시작
./start.sh
```

테스트 방법:
1. 브라우저에서 `http://localhost:8501` 접속
2. "AI 작물 진단" 탭으로 이동
3. 작물 이미지 업로드 또는 센서 데이터 분석 실행
4. AI 응답이 정상적으로 표시되는지 확인

## 🌐 프로덕션 배포 (Render)

### Render 환경 변수 설정

1. **Render Dashboard 접속**
   - 🔗 https://dashboard.render.com
   - 프로젝트 선택

2. **Environment Variables 설정**
   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   OPENWEATHER_API_KEY = your_openweather_key_here
   DB_PATH = /var/data/farm_data.db
   ENVIRONMENT = production
   DEBUG = false
   ```

3. **배포 확인**
   - "Manual Deploy" 또는 자동 배포 대기
   - 로그에서 "API Key configured successfully" 메시지 확인

### render.yaml 확인

`render.yaml` 파일에 이미 환경 변수가 정의되어 있습니다:

```yaml
envVars:
  - key: GEMINI_API_KEY
    sync: false  # Render Dashboard에서 수동 설정
  - key: OPENWEATHER_API_KEY
    sync: false
```

## 🔍 문제 해결

### API 키가 인식되지 않는 경우

1. **환경 변수 확인**
   ```bash
   # 터미널에서 확인
   echo $GEMINI_API_KEY
   
   # Python에서 확인
   python -c "import os; print(os.getenv('GEMINI_API_KEY'))"
   ```

2. **서버 재시작**
   ```bash
   ./stop.sh
   ./start.sh
   ```

3. **로그 확인**
   ```bash
   tail -f backend.log
   ```

### API 호출 오류

**증상**: "Error: API Key not found" 메시지

**해결 방법**:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. API 키에 따옴표가 없는지 확인 (따옴표 제거)
3. API 키 앞뒤 공백 제거
4. Google Cloud Console에서 API 활성화 확인

**증상**: "API quota exceeded" 또는 429 에러

**해결 방법**:
1. Google AI Studio에서 할당량 확인
2. 무료 티어 제한 확인 (분당 60회 요청)
3. 필요시 유료 플랜 업그레이드

**증상**: "Invalid API key" 또는 403 에러

**해결 방법**:
1. API 키 재생성
2. API 키 제한 설정 확인 (IP 제한 등)
3. Generative Language API 활성화 확인

## 📊 API 사용량 모니터링

### Google Cloud Console에서 확인

1. 🔗 https://console.cloud.google.com/apis/dashboard
2. "Generative Language API" 선택
3. "Metrics" 탭에서 사용량 확인

### 코드에서 확인

백엔드 로그에서 API 호출 기록 확인:
```bash
grep "Gemini API" backend.log
```

## 🔐 보안 모범 사례

### ✅ DO (해야 할 것)

- ✅ `.env` 파일을 `.gitignore`에 추가 (이미 설정됨)
- ✅ API 키를 환경 변수로 관리
- ✅ 프로덕션과 개발 환경에서 다른 키 사용
- ✅ API 키 정기적으로 교체
- ✅ Google Cloud Console에서 API 키 제한 설정

### ❌ DON'T (하지 말아야 할 것)

- ❌ API 키를 코드에 직접 하드코딩
- ❌ API 키를 Git에 커밋
- ❌ API 키를 공개 저장소에 업로드
- ❌ API 키를 이메일이나 메신저로 전송
- ❌ 여러 프로젝트에서 같은 키 공유

## 🎯 다음 단계

API 키 연동이 완료되면 다음 기능들을 사용할 수 있습니다:

1. **🌱 AI 작물 진단**
   - 실시간 센서 데이터 분석
   - 작물 상태 평가 및 처방

2. **📸 이미지 기반 병해충 진단**
   - Gemini Vision API 활용
   - 병해충 식별 및 대응 방안 제시

3. **📈 병해충 예측**
   - 7일 날씨 예보 기반 위험도 분석
   - 예방 조치 권장

4. **💰 시장 가격 예측**
   - AI 기반 작물 가격 추정
   - 판매 시기 최적화

## 📞 지원

문제가 계속되면:
1. GitHub Issues에 문제 보고
2. 로그 파일 첨부 (`backend.log`)
3. 에러 메시지 스크린샷 포함

---

**마지막 업데이트**: 2026-02-03
**작성자**: Smart Farm AI Team
