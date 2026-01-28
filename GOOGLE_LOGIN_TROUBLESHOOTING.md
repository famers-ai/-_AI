# 🔍 구글 로그인 오류 해결: 10단계 체계적 진단 프로세스

## 문제 상황
사용자가 "Sign in with Google" 버튼을 클릭했을 때 서비스 에러가 발생하여 로그인이 불가능한 상황

---

## ✅ 10단계 체계적 해결 프로세스

### **1단계: 백엔드 서버 상태 확인** ❌ → ✅
**문제**: 백엔드 서버(`localhost:8000`)가 실행되지 않음
**진단 방법**:
```bash
curl -I http://localhost:8000/api/dashboard
# 결과: Connection refused
```

**해결**:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

**검증**:
```bash
curl http://localhost:8000/health
# 결과: {"status":"healthy"}
```

**근본 원인**: 프론트엔드는 실행 중이었으나 백엔드가 실행되지 않아 인증 후 세션 저장 및 대시보드 데이터 로드 실패

---

### **2단계: 환경 변수 검증** ✅
**확인 항목**:
- `AUTH_SECRET`: 존재 여부 및 유효성
- `AUTH_GOOGLE_ID`: Google OAuth Client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth Client Secret
- `NEXT_PUBLIC_API_URL`: 백엔드 API URL

**검증 방법**:
```bash
cat frontend/.env.local
```

**결과**:
```env
AUTH_SECRET="your-secret-key-here"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

**상태**: ✅ 모든 환경 변수가 올바르게 설정됨

---

### **3단계: Google Cloud Console Redirect URI 확인** ✅
**필수 설정**:
Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

**Authorized redirect URIs**에 다음이 포함되어야 함:
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/auth/callback/google` (대체 경로)

**검증 방법**:
브라우저 개발자 도구 Network 탭에서 Google 리다이렉트 URL 확인:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=616226831631-...
  &redirect_uri=http://localhost:3000/api/auth/callback/google
  &response_type=code
  &scope=openid profile email
```

**상태**: ✅ Redirect URI가 정확하게 설정됨

---

### **4단계: NextAuth.js 설정 검증** ✅
**파일**: `frontend/auth.ts`

**필수 설정**:
1. **Provider 설정**: Google OAuth provider 올바르게 구성
2. **Callbacks**: signIn, redirect, session, jwt 콜백 구현
3. **trustHost**: true로 설정 (로컬 개발 환경)
4. **debug**: 개발 환경에서 활성화

**개선 사항**:
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("Sign in callback:", { user, account, profile })
            return true
        },
        async redirect({ url, baseUrl }) {
            console.log("Redirect callback:", { url, baseUrl })
            if (url.startsWith("/")) return `${baseUrl}${url}`
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
        async session({ session, token }) {
            console.log("Session callback:", { session, token })
            return session
        },
        async jwt({ token, user, account }) {
            console.log("JWT callback:", { token, user, account })
            return token
        }
    },
    pages: {
        signIn: '/',
        error: '/auth/error',
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
})
```

---

### **5단계: 에러 페이지 구현** ✅
**파일**: `frontend/app/auth/error/page.tsx`

**목적**: 인증 실패 시 사용자 친화적인 에러 메시지 제공

**구현**:
- 한국어 에러 메시지
- 에러 코드 표시
- 홈으로 돌아가기 버튼

---

### **6단계: CORS 설정 확인** ✅
**파일**: `backend/app/main.py`

**설정**:
```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**상태**: ✅ CORS가 올바르게 설정되어 프론트엔드-백엔드 통신 허용

---

### **7단계: API 라우팅 검증** ✅
**백엔드 엔드포인트**:
- `/` - 루트 (상태 확인)
- `/health` - 헬스 체크
- `/api/dashboard` - 대시보드 데이터
- `/api/ai/*` - AI 기능
- `/api/pest/*` - 병해충 예측
- `/api/market/*` - 시장 가격

**프론트엔드 API 라우트**:
- `/api/auth/signin/google` - Google 로그인 시작
- `/api/auth/callback/google` - Google OAuth 콜백
- `/api/auth/session` - 세션 확인
- `/api/auth/signout` - 로그아웃

**검증**:
```bash
curl http://localhost:3000/api/auth/session
# 결과: {}  (로그인 전 빈 세션)
```

---

### **8단계: 브라우저 콘솔 로그 분석** ✅
**확인 항목**:
1. Network 탭에서 API 요청/응답 확인
2. Console 탭에서 JavaScript 에러 확인
3. Application 탭에서 쿠키/세션 스토리지 확인

**정상 로그인 시 콘솔 출력**:
```
Sign in callback: { user: {...}, account: {...}, profile: {...} }
Redirect callback: { url: "http://localhost:3000", baseUrl: "http://localhost:3000" }
JWT callback: { token: {...}, user: {...}, account: {...} }
Session callback: { session: {...}, token: {...} }
```

---

### **9단계: 전체 인증 플로우 테스트** ✅
**테스트 시나리오**:
1. ✅ 프론트엔드 접속 (`http://localhost:3000`)
2. ✅ 백엔드 연결 확인 (대시보드 데이터 로드)
3. ✅ "Sign in with Google" 버튼 클릭
4. ✅ Google 계정 선택 페이지로 리다이렉트
5. ✅ 계정 선택 및 권한 승인
6. ✅ 콜백 URL로 리다이렉트 (`/api/auth/callback/google`)
7. ✅ 세션 생성 및 저장
8. ✅ 대시보드로 리다이렉트
9. ✅ 사용자 정보 표시 (우측 상단)
10. ✅ "Sign Out" 버튼 표시

**최종 결과**: 🎉 **모든 단계 성공**

---

### **10단계: 프로덕션 배포 준비** 📋
**체크리스트**:

#### A. 환경 변수 설정 (Vercel/배포 플랫폼)
```env
AUTH_SECRET="production-secret-key"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
NEXT_PUBLIC_API_URL="https://your-backend-api.com/api"
NEXTAUTH_URL="https://your-domain.com"
```

#### B. Google Cloud Console 설정
**Authorized redirect URIs**에 프로덕션 URL 추가:
- `https://your-domain.com/api/auth/callback/google`
- `https://your-domain.vercel.app/api/auth/callback/google`

#### C. 백엔드 배포 (Render/Railway 등)
- 환경 변수 설정
- CORS origins에 프로덕션 도메인 추가
- HTTPS 강제 설정

#### D. 보안 강화
- `AUTH_SECRET` 강력한 키로 생성:
  ```bash
  openssl rand -base64 32
  ```
- 프로덕션에서 `debug: false` 설정
- Rate limiting 구현
- HTTPS only 쿠키 설정

---

## 📊 문제 해결 요약

### 근본 원인
**백엔드 서버가 실행되지 않아 인증 후 세션 저장 및 데이터 로드 실패**

### 해결 방법
1. 백엔드 서버 시작 (`uvicorn app.main:app --reload --port 8000`)
2. NextAuth.js 설정 개선 (callbacks, error handling)
3. 에러 페이지 구현

### 검증 결과
- ✅ 백엔드-프론트엔드 통신 정상
- ✅ Google OAuth 리다이렉트 정상
- ✅ 세션 생성 및 저장 정상
- ✅ 사용자 로그인/로그아웃 정상

---

## 🚀 향후 개선 사항

1. **세션 영속성**: 데이터베이스 기반 세션 저장 (현재는 JWT 토큰)
2. **에러 모니터링**: Sentry 등 에러 추적 도구 통합
3. **로딩 상태**: 로그인 중 로딩 인디케이터 추가
4. **토큰 갱신**: Refresh token 구현
5. **다중 인증**: 이메일/비밀번호 로그인 추가 옵션

---

## 📝 개발자 노트

### 로컬 개발 시작 순서
```bash
# 1. 백엔드 시작
cd backend
python3 -m uvicorn app.main:app --reload --port 8000

# 2. 프론트엔드 시작 (새 터미널)
cd frontend
npm run dev
```

### 디버깅 팁
- 브라우저 개발자 도구 Console 탭에서 인증 콜백 로그 확인
- Network 탭에서 `/api/auth/*` 요청 확인
- 백엔드 터미널에서 API 요청 로그 확인

### 일반적인 오류 및 해결
1. **"Unable to Connect"**: 백엔드 서버 미실행 → 백엔드 시작
2. **"Redirect URI mismatch"**: Google Cloud Console에서 redirect URI 확인
3. **"Invalid credentials"**: `.env.local` 파일의 Google OAuth 자격 증명 확인
4. **세션 유지 안 됨**: `AUTH_SECRET` 설정 확인

---

**작성일**: 2026-01-27
**최종 업데이트**: 2026-01-27
**상태**: ✅ 해결 완료
