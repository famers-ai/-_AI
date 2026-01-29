#!/bin/bash

echo "🔍 Smart Farm AI - 백엔드 서버 탐색 및 테스트 데이터 삭제"
echo "================================================================"
echo ""

# 가능한 모든 백엔드 URL 패턴
URLS=(
    # Vercel 프록시 경로
    "https://forhumanai.net/api/admin/reset-data?confirm=true"
    "https://www.forhumanai.net/api/admin/reset-data?confirm=true"
    
    # Render.com 패턴
    "https://smartfarm-ai.onrender.com/api/admin/reset-data?confirm=true"
    "https://smartfarm-backend.onrender.com/api/admin/reset-data?confirm=true"
    "https://mars-ai.onrender.com/api/admin/reset-data?confirm=true"
    "https://mars-ai-backend.onrender.com/api/admin/reset-data?confirm=true"
    
    # Railway 패턴
    "https://smartfarm-ai.up.railway.app/api/admin/reset-data?confirm=true"
    "https://mars-ai.up.railway.app/api/admin/reset-data?confirm=true"
    
    # Fly.io 패턴
    "https://smartfarm-ai.fly.dev/api/admin/reset-data?confirm=true"
    "https://mars-ai.fly.dev/api/admin/reset-data?confirm=true"
    
    # Heroku 패턴
    "https://smartfarm-ai.herokuapp.com/api/admin/reset-data?confirm=true"
    "https://mars-ai.herokuapp.com/api/admin/reset-data?confirm=true"
)

echo "📋 시도할 URL 개수: ${#URLS[@]}"
echo ""

SUCCESS=0
FAILED=0

for URL in "${URLS[@]}"; do
    echo "🔄 시도 중: $URL"
    
    # HTTP 상태 코드와 응답 본문 가져오기
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$URL" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ 성공! (HTTP $HTTP_CODE)"
        echo "📄 응답: $BODY"
        echo ""
        echo "🎉 테스트 데이터 삭제 완료!"
        SUCCESS=1
        break
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ 404 Not Found - 서버 존재하지 않음"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "❌ 연결 실패 - 서버 응답 없음"
    else
        echo "⚠️  HTTP $HTTP_CODE - $BODY"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "================================================================"
if [ $SUCCESS -eq 1 ]; then
    echo "✅ 작업 완료: 테스트 데이터가 성공적으로 삭제되었습니다!"
else
    echo "❌ 모든 URL 시도 실패"
    echo "💡 다음 단계:"
    echo "   1. Vercel 환경 변수에서 NEXT_PUBLIC_API_URL 확인"
    echo "   2. 백엔드 서버가 실행 중인지 확인"
    echo "   3. /test-admin 페이지 사용"
fi
