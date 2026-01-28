# Google OAuth 설정 가이드

## 문제 해결을 위한 체크리스트

### 1. Google Cloud Console 설정 확인

Google Cloud Console (https://console.cloud.google.com/)에 접속하여 다음을 확인하세요:

#### Authorized redirect URIs에 다음 URL들이 모두 추가되어 있어야 합니다:

**로컬 개발 환경:**
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/auth/callback/google`

**프로덕션 환경 (배포 후):**
- `https://yourdomain.com/api/auth/callback/google`
- `https://yourdomain.com/auth/callback/google`

**Vercel 배포 시:**
- `https://your-app.vercel.app/api/auth/callback/google`
- `https://your-app.vercel.app/auth/callback/google`

### 2. 환경 변수 확인

`.env.local` 파일에 다음 변수들이 올바르게 설정되어 있는지 확인:

```bash
AUTH_SECRET="your-secret-key-here"
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

### 3. AUTH_SECRET 생성

AUTH_SECRET이 제대로 설정되지 않았다면 새로 생성:

```bash
openssl rand -base64 32
```

### 4. 개발 서버 재시작

환경 변수를 변경한 후에는 반드시 개발 서버를 재시작:

```bash
cd frontend
npm run dev
```

### 5. 일반적인 오류 원인

1. **Redirect URI mismatch**: Google Cloud Console의 Authorized redirect URIs와 실제 콜백 URL이 일치하지 않음
2. **AUTH_SECRET 누락**: AUTH_SECRET 환경 변수가 설정되지 않음
3. **Client ID/Secret 오류**: 잘못된 Google OAuth 자격 증명
4. **HTTPS 요구사항**: 프로덕션에서는 반드시 HTTPS 사용
5. **도메인 불일치**: trustHost 설정 문제

### 6. 디버깅 방법

개발 서버 콘솔에서 다음 로그를 확인:
- "Sign in callback:" - 로그인 시도 확인
- "Redirect callback:" - 리다이렉트 URL 확인
- "Session callback:" - 세션 생성 확인
- "JWT callback:" - JWT 토큰 생성 확인

브라우저 개발자 도구의 Network 탭에서:
- `/api/auth/signin/google` 요청 확인
- `/api/auth/callback/google` 응답 확인
- 에러 메시지 확인

### 7. 테스트 순서

1. Google Cloud Console에서 Redirect URI 추가
2. 환경 변수 확인 및 수정
3. 개발 서버 재시작
4. 브라우저 캐시 및 쿠키 삭제
5. 로그인 재시도
6. 콘솔 로그 확인

## 현재 적용된 수정 사항

1. **auth.ts**: 
   - Google OAuth authorization params 추가
   - Callbacks 추가 (signIn, redirect, session, jwt)
   - Error page 경로 설정
   - 디버그 로깅 추가

2. **app/auth/error/page.tsx**:
   - 사용자 친화적인 에러 페이지 생성
   - 한국어 에러 메시지
   - 에러 코드 표시

## 다음 단계

1. Google Cloud Console에서 Redirect URI 확인/추가
2. 개발 서버 재시작
3. 로그인 테스트
4. 에러 발생 시 콘솔 로그 확인
