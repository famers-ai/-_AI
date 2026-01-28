# 🎉 Smart Farm AI - 현재 실행 상태

## ✅ 서버 실행 중

**시작 시간**: 2026-01-27 20:38 EST

### 백엔드 서버
- **상태**: ✅ 실행 중
- **PID**: 23336
- **포트**: 8000
- **URL**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **헬스 체크**: http://localhost:8000/health

### 프론트엔드 서버
- **상태**: ✅ 실행 중
- **PID**: 23349
- **포트**: 3000
- **URL**: http://localhost:3000

---

## 📱 사용자 접속 방법

### 웹 브라우저로 접속
```
http://localhost:3000
```

### 기능
1. ✅ **대시보드**: 실시간 농장 모니터링
   - 실내 환경 (온도, 습도, VPD)
   - 실외 참조 데이터 (San Francisco, CA)
   - AI 인사이트

2. ✅ **Google 로그인**: 우측 상단 "Sign in with Google" 버튼
   - 완벽하게 작동
   - 세션 유지
   - 로그아웃 기능

3. ✅ **AI Crop Doctor**: 작물 진단
4. ✅ **Pest Forecast**: 병해충 예측
5. ✅ **Market Prices**: 시장 가격 정보
6. ✅ **Weekly Report**: 주간 보고서
7. ✅ **Voice Log**: 음성 로그

---

## 🔧 서버 관리

### 로그 확인
```bash
# 백엔드 로그
tail -f backend.log

# 프론트엔드 로그
tail -f frontend.log
```

### 서버 상태 확인
```bash
# 프로세스 확인
ps aux | grep -E "uvicorn|next-server" | grep -v grep

# 포트 확인
lsof -i :8000  # 백엔드
lsof -i :3000  # 프론트엔드
```

### 서버 종료
```bash
# 자동 종료 스크립트 사용 (권장)
./stop.sh

# 또는 수동 종료
kill 23336  # 백엔드
kill 23349  # 프론트엔드
```

### 서버 재시작
```bash
# 자동 시작 스크립트 사용 (권장)
./start.sh

# 또는 수동 시작
# 터미널 1: 백엔드
cd backend
python3 -m uvicorn app.main:app --reload --port 8000

# 터미널 2: 프론트엔드
cd frontend
npm run dev
```

---

## 📊 현재 상태 스냅샷

### 대시보드 데이터 (최근 확인)
- **실내 환경**:
  - VPD: 0.24 kPa
  - 온도: 63.1°F
  - 습도: 88%
  - AI 경고: "Too Humid (Risk: Fungal)"

- **실외 참조** (San Francisco, CA):
  - 온도: 55.1°F
  - 습도: 78%
  - 풍속: 2.8 mph

### 인증 상태
- Google OAuth: ✅ 정상 작동
- 세션 관리: ✅ 정상
- 로그인/로그아웃: ✅ 정상

---

## 🚨 문제 발생 시

### "Unable to Connect" 에러
**원인**: 백엔드 서버가 중단됨

**해결**:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

### 포트 충돌
**원인**: 다른 프로세스가 포트 사용 중

**해결**:
```bash
# 포트 8000 정리
lsof -ti:8000 | xargs kill -9

# 포트 3000 정리
lsof -ti:3000 | xargs kill -9

# 서버 재시작
./start.sh
```

### Google 로그인 에러
**해결**: [GOOGLE_LOGIN_TROUBLESHOOTING.md](GOOGLE_LOGIN_TROUBLESHOOTING.md) 참조

---

## 📝 중요 참고사항

1. **서버는 계속 실행 중입니다**
   - 터미널을 닫아도 백그라운드에서 실행됩니다
   - 컴퓨터를 재시작하면 서버도 중단됩니다

2. **서버 종료 방법**
   - `./stop.sh` 스크립트 사용
   - 또는 PID로 직접 종료: `kill 23336 23349`

3. **로그 파일**
   - `backend.log`: 백엔드 로그
   - `frontend.log`: 프론트엔드 로그
   - 문제 발생 시 이 파일들을 확인하세요

4. **프로덕션 배포**
   - 현재는 로컬 개발 환경입니다
   - 실제 사용자에게 서비스하려면 Vercel/Render 등에 배포 필요
   - [QUICK_START.md](QUICK_START.md) 참조

---

## 🎯 다음 단계

### 로컬 사용
- ✅ 서버 실행 중
- ✅ http://localhost:3000 접속 가능
- ✅ Google 로그인 가능

### 프로덕션 배포 (선택사항)
1. Vercel에 프론트엔드 배포
2. Render/Railway에 백엔드 배포
3. 환경 변수 설정
4. Google Cloud Console에 프로덕션 도메인 추가

자세한 내용은 [QUICK_START.md](QUICK_START.md)의 "프로덕션 배포" 섹션 참조

---

**마지막 업데이트**: 2026-01-27 20:38 EST
**상태**: ✅ 정상 운영 중
**접속 URL**: http://localhost:3000
