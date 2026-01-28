# 🚜 Smart Farm AI - Quick Start Guide

## 🎯 빠른 시작 (권장)

### 한 번의 명령으로 시작하기
```bash
./start.sh
```

이 스크립트는 자동으로:
- ✅ 백엔드 서버 시작 (Port 8000)
- ✅ 프론트엔드 서버 시작 (Port 3000)
- ✅ 포트 충돌 자동 해결
- ✅ 서버 상태 확인

### 서버 종료
```bash
./stop.sh
```

---

## 📱 접속 URL

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **헬스 체크**: http://localhost:8000/health

---

## 🔧 수동 시작 방법

### 1. 백엔드 서버 시작
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

### 2. 프론트엔드 서버 시작 (새 터미널)
```bash
cd frontend
npm run dev
```

---

## 🔐 Google 로그인 설정

### 환경 변수 확인
`frontend/.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
AUTH_SECRET="your-secret-key"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

### Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services → Credentials 이동
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs**에 추가:
   - `http://localhost:3000/api/auth/callback/google`

자세한 설정 가이드: [GOOGLE_AUTH_SETUP.md](frontend/GOOGLE_AUTH_SETUP.md)

---

## 🐛 문제 해결

### "Unable to Connect" 에러
**원인**: 백엔드 서버가 실행되지 않음

**해결**:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

### Google 로그인 에러
**원인**: 환경 변수 또는 Google Cloud Console 설정 문제

**해결**: [GOOGLE_LOGIN_TROUBLESHOOTING.md](GOOGLE_LOGIN_TROUBLESHOOTING.md) 참조

### 포트 충돌
**원인**: 다른 프로세스가 포트 사용 중

**해결**:
```bash
# 포트 8000 사용 프로세스 종료
lsof -ti:8000 | xargs kill -9

# 포트 3000 사용 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

또는 `./start.sh` 스크립트 사용 (자동 해결)

---

## 📊 로그 확인

### 백엔드 로그
```bash
tail -f backend.log
```

### 프론트엔드 로그
```bash
tail -f frontend.log
```

### 브라우저 콘솔
1. 브라우저에서 F12 키 누르기
2. Console 탭 확인
3. Network 탭에서 API 요청 확인

---

## 🚀 프로덕션 배포

### Vercel (프론트엔드)
1. Vercel에 프로젝트 연결
2. 환경 변수 설정:
   ```
   AUTH_SECRET=production-secret
   AUTH_GOOGLE_ID=your-client-id
   AUTH_GOOGLE_SECRET=your-client-secret
   NEXT_PUBLIC_API_URL=https://your-backend.com/api
   NEXTAUTH_URL=https://your-domain.com
   ```
3. Google Cloud Console에 프로덕션 redirect URI 추가

### Render/Railway (백엔드)
1. 백엔드 저장소 연결
2. 빌드 명령: `pip install -r requirements.txt`
3. 시작 명령: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. 환경 변수 설정 (Google API Key 등)

---

## 📚 추가 문서

- [Google 로그인 설정 가이드](frontend/GOOGLE_AUTH_SETUP.md)
- [Google 로그인 문제 해결](GOOGLE_LOGIN_TROUBLESHOOTING.md)
- [Next.js 마이그레이션 계획](MIGRATION_PLAN_NEXTJS.md)

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 16.1.4
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI
- **AI Engine**: Google Gemini API
- **Database**: SQLite (개발), PostgreSQL (프로덕션 권장)
- **Language**: Python 3.9+

---

## 📝 개발 팁

### 1. 항상 백엔드를 먼저 시작하세요
프론트엔드는 백엔드 API에 의존하므로 백엔드가 먼저 실행되어야 합니다.

### 2. 환경 변수 변경 후 서버 재시작
`.env.local` 파일을 수정한 후에는 반드시 서버를 재시작하세요.

### 3. 브라우저 캐시 삭제
로그인 문제 발생 시 브라우저 캐시와 쿠키를 삭제해보세요.

### 4. 로그 확인
문제 발생 시 백엔드 로그, 프론트엔드 로그, 브라우저 콘솔을 모두 확인하세요.

---

## 🤝 기여

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해주세요.

---

**Last Updated**: 2026-01-27
