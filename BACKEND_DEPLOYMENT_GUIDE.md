# 🚀 백엔드 배포 가이드 (Render.com)

## 📋 준비 완료

다음 파일들이 생성되었습니다:
- ✅ `backend/Procfile` - Render 시작 명령어
- ✅ `backend/runtime.txt` - Python 버전 지정
- ✅ `render.yaml` - Render 설정 파일

## 🔧 배포 단계

### 1단계: 코드 커밋 및 푸시

```bash
cd /Users/ijeong-u/Desktop/smartfarm_ai
git add -A
git commit -m "feat: add Render deployment configuration"
git push origin main
```

### 2단계: Render.com 계정 생성 및 배포

#### A. Render 계정 생성
1. https://render.com 접속
2. **"Get Started"** 클릭
3. **GitHub 계정으로 로그인**

#### B. 새 Web Service 생성
1. Dashboard에서 **"New +"** 클릭
2. **"Web Service"** 선택
3. **"Connect a repository"** 선택
4. GitHub에서 **`famers-ai/Mars_AI`** (또는 `-_AI`) 저장소 선택
5. **"Connect"** 클릭

#### C. 서비스 설정
다음 정보를 입력하세요:

**Name**: `smartfarm-backend` (또는 원하는 이름)

**Region**: `Oregon (US West)` (가장 가까운 지역 선택)

**Branch**: `main`

**Root Directory**: `backend`

**Runtime**: `Python 3`

**Build Command**: 
```
pip install -r requirements.txt
```

**Start Command**:
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Instance Type**: `Free` (무료 티어)

#### D. 환경 변수 설정

**"Advanced"** 섹션에서 **"Add Environment Variable"** 클릭:

1. **GEMINI_API_KEY**
   - Value: `[여기에 Gemini API 키 입력]`

2. **OPENWEATHER_API_KEY**
   - Value: `[여기에 OpenWeather API 키 입력]`

3. **PYTHON_VERSION**
   - Value: `3.11.0`

#### E. 배포 시작
1. **"Create Web Service"** 클릭
2. 배포 진행 상황 확인 (약 5-10분 소요)
3. 배포 완료 후 URL 확인 (예: `https://smartfarm-backend.onrender.com`)

---

## 3단계: Vercel 환경 변수 업데이트

배포가 완료되면:

1. **Vercel Dashboard** 접속 (https://vercel.com)
2. **smartfarm-ai 프로젝트** 선택
3. **Settings** → **Environment Variables**
4. **NEXT_PUBLIC_API_URL** 편집:
   - Production: `https://smartfarm-backend.onrender.com/api`
   - Preview: `https://smartfarm-backend.onrender.com/api`
   - Development: `http://localhost:8000/api`
5. **Save** 클릭
6. **Deployments** 탭에서 **"Redeploy"** 클릭

---

## 4단계: 배포 확인

### API 테스트
```bash
# 헬스 체크
curl https://smartfarm-backend.onrender.com/

# API 문서 확인
# 브라우저에서 열기: https://smartfarm-backend.onrender.com/docs
```

### 가상 데이터 삭제
```bash
curl -X DELETE "https://smartfarm-backend.onrender.com/api/admin/reset-data?confirm=true"
```

---

## 📊 배포 후 체크리스트

- [ ] Render 배포 성공 확인
- [ ] API 엔드포인트 접근 가능 확인
- [ ] Vercel 환경 변수 업데이트
- [ ] 프론트엔드 재배포
- [ ] forhumanai.net에서 대시보드 로딩 확인
- [ ] 가상 데이터 삭제 실행
- [ ] Google 로그인 테스트

---

## 🔑 필요한 API 키

### Gemini API Key
1. https://makersuite.google.com/app/apikey 접속
2. **"Create API Key"** 클릭
3. 키 복사

### OpenWeather API Key
1. https://openweathermap.org/api 접속
2. **"Sign Up"** (무료)
3. API Keys 섹션에서 키 복사

---

## ⚠️ 중요 사항

### Render 무료 티어 제한사항
- ✅ 무료로 사용 가능
- ⚠️ 15분 동안 요청이 없으면 서버가 sleep 모드로 전환
- ⚠️ Sleep 후 첫 요청은 30-60초 소요 (cold start)
- ✅ 월 750시간 무료 (충분함)

### 데이터베이스
- 현재: SQLite (파일 기반)
- ⚠️ Render 무료 티어는 재시작 시 파일 시스템 초기화됨
- 💡 해결책: PostgreSQL 사용 권장 (추후 마이그레이션)

---

## 🎉 완료!

배포가 완료되면:
1. `https://forhumanai.net` 접속
2. Google 로그인
3. 대시보드에서 데이터 입력
4. 모든 기능 정상 작동 확인!

---

**작성일**: 2026-01-28  
**상태**: 배포 준비 완료
