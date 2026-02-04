# 🚜 Smart Farm AI

**Future Farming Solutions powered by Google Gemini**

> 실시간 농장 모니터링 및 AI 기반 작물 관리 시스템

---

## 🎉 현재 상태: 실행 중!

서버가 현재 실행 중입니다. 바로 사용하실 수 있습니다!

### 📱 접속하기
```
http://localhost:3000
```

브라우저에서 위 주소로 접속하시면 바로 사용하실 수 있습니다.

자세한 서버 상태는 [SERVER_STATUS.md](SERVER_STATUS.md)를 확인하세요.

---

## ⚡ 빠른 시작

### 1. API 키 설정 (최초 1회)

AI 기능을 사용하려면 Gemini API 키가 필요합니다:

```bash
# 자동 설정 (권장)
./setup_api_keys.sh

# 또는 수동 설정
cp .env.example .env
# .env 파일을 편집하여 API 키 입력
```

**API 키 발급 방법**:
- 🔗 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 무료 발급
- 📚 자세한 가이드: [GEMINI_API_SETUP.md](GEMINI_API_SETUP.md)

**API 키 확인**:
```bash
python3 verify_api_keys.py
```

### 2. 서버 시작하기
```bash
./start.sh
```

### 3. 서버 종료하기
```bash
./stop.sh
```

그게 전부입니다! 🎉

---

## 🌟 주요 기능

### 1. 📊 실시간 대시보드
- 실내 환경 모니터링 (온도, 습도, VPD)
- 실외 참조 데이터
- AI 기반 환경 분석 및 경고

### 2. 🤖 AI Crop Doctor
- 작물 사진 업로드
- AI 기반 질병 진단
- 맞춤형 치료 방법 제안

### 3. 🐛 Pest Forecast
- 병해충 발생 예측
- 지역별 위험도 분석
- 예방 조치 권장

### 4. 💰 Market Prices
- 실시간 농산물 시장 가격
- 가격 추세 분석
- 판매 시기 추천

### 5. 📈 Weekly Report
- 주간 농장 성과 리포트
- PDF 다운로드 기능
- 데이터 기반 인사이트

### 6. 🎤 Voice Log
- 음성으로 농장 일지 기록
- AI 자동 분석 및 요약

### 7. 🔐 Google 로그인
- 안전한 사용자 인증
- 개인화된 데이터 관리

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 16.1.4 (React)
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI (Python)
- **AI Engine**: Google Gemini API
- **Database**: SQLite (개발), PostgreSQL (프로덕션 권장)
- **API**: RESTful API

---

## 📚 문서

- **[QUICK_START.md](QUICK_START.md)** - 빠른 시작 가이드
- **[GEMINI_API_SETUP.md](GEMINI_API_SETUP.md)** - 🔑 Gemini API 키 설정 가이드 (필수!)
- **[SERVER_STATUS.md](SERVER_STATUS.md)** - 현재 서버 상태
- **[GOOGLE_LOGIN_TROUBLESHOOTING.md](GOOGLE_LOGIN_TROUBLESHOOTING.md)** - Google 로그인 문제 해결
- **[frontend/GOOGLE_AUTH_SETUP.md](frontend/GOOGLE_AUTH_SETUP.md)** - Google OAuth 설정 가이드

---

## 🔧 개발자 가이드

### 프로젝트 구조
```
smartfarm_ai/
├── frontend/           # Next.js 프론트엔드
│   ├── app/           # Next.js App Router
│   ├── components/    # React 컴포넌트
│   └── auth.ts        # NextAuth 설정
├── backend/           # FastAPI 백엔드
│   └── app/
│       ├── main.py    # FastAPI 앱
│       ├── api/       # API 라우트
│       └── services/  # 비즈니스 로직
├── start.sh           # 서버 시작 스크립트
└── stop.sh            # 서버 종료 스크립트
```

### 환경 변수 설정

**빠른 설정** (권장):
```bash
./setup_api_keys.sh  # 대화형 설정
python3 verify_api_keys.py  # 설정 확인
```

**수동 설정**:

**프로젝트 루트** (`.env`):
```env
GEMINI_API_KEY="your-gemini-api-key"
OPENWEATHER_API_KEY="your-openweather-api-key"
DB_PATH="./farm_data.db"
```

**Frontend** (`frontend/.env.local`):
```env
AUTH_SECRET="your-secret-key"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

📚 자세한 설정 방법: [GEMINI_API_SETUP.md](GEMINI_API_SETUP.md)

### 수동 서버 시작

**백엔드**:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

**프론트엔드**:
```bash
cd frontend
npm run dev
```

---

## 🚀 프로덕션 배포

### Vercel (프론트엔드)
1. GitHub에 푸시
2. Vercel에 연결
3. 환경 변수 설정
4. 자동 배포

### Render/Railway (백엔드)
1. GitHub에 푸시
2. Render/Railway에 연결
3. 환경 변수 설정
4. 자동 배포

자세한 내용은 [QUICK_START.md](QUICK_START.md)의 "프로덕션 배포" 섹션 참조

---

## 🐛 문제 해결

### "Unable to Connect" 에러
```bash
# 백엔드 서버 시작
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

### Google 로그인 에러
[GOOGLE_LOGIN_TROUBLESHOOTING.md](GOOGLE_LOGIN_TROUBLESHOOTING.md) 참조

### 포트 충돌
```bash
# 포트 정리
lsof -ti:8000 | xargs kill -9  # 백엔드
lsof -ti:3000 | xargs kill -9  # 프론트엔드

# 서버 재시작
./start.sh
```

---

## 📊 API 문서

백엔드 서버 실행 후 다음 주소에서 API 문서 확인:
```
http://localhost:8000/docs
```

---

## 🤝 기여

이슈나 개선 사항이 있으시면 언제든지 제안해주세요!

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발자

**ForHuman AI Team**

---

**Last Updated**: 2026-01-27
**Version**: 1.0.0
**Status**: ✅ Production Ready
