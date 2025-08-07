#!/bin/bash

# ngrok URL을 Netlify 환경변수로 업데이트하는 스크립트

echo "🌐 ngrok URL을 Netlify 환경변수로 업데이트"
echo "=========================================="

# 1. 현재 ngrok URL 가져오기
echo "📋 1단계: 현재 ngrok URL 확인"
RESPONSE=$(curl -s http://localhost:5001/api/ngrok-url)
NGROK_URL=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('ngrok_url', ''))" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    # fallback 방법
    NGROK_URL=$(echo "$RESPONSE" | grep -o '"ngrok_url":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrok URL을 가져올 수 없습니다."
    echo "💡 백엔드 서버가 실행 중인지 확인하세요: ./run_backend_only.sh"
    exit 1
fi

echo "✅ 현재 ngrok URL: $NGROK_URL"

# 2. Netlify CLI 확인
echo ""
echo "📋 2단계: Netlify CLI 확인"
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI가 설치되지 않았습니다."
    echo "💡 설치 방법: npm install -g netlify-cli"
    echo ""
    echo "📋 수동 설정 방법:"
    echo "1. Netlify 대시보드 접속: https://app.netlify.com"
    echo "2. 프로젝트 선택 → Site settings → Environment variables"
    echo "3. 새 환경변수 추가:"
    echo "   - Key: API_BASE_URL"
    echo "   - Value: $NGROK_URL"
    echo "4. 배포 재시작"
    exit 1
fi

echo "✅ Netlify CLI 설치 확인 완료"

# 3. Netlify 로그인 확인
echo ""
echo "📋 3단계: Netlify 로그인 확인"
if ! netlify status &> /dev/null; then
    echo "⚠️ Netlify에 로그인되지 않았습니다."
    echo "💡 로그인: netlify login"
    echo ""
    echo "📋 수동 설정 방법:"
    echo "1. Netlify 대시보드 접속: https://app.netlify.com"
    echo "2. 프로젝트 선택 → Site settings → Environment variables"
    echo "3. 새 환경변수 추가:"
    echo "   - Key: API_BASE_URL"
    echo "   - Value: $NGROK_URL"
    echo "4. 배포 재시작"
    exit 1
fi

echo "✅ Netlify 로그인 확인 완료"

# 4. 환경변수 업데이트
echo ""
echo "📋 4단계: 환경변수 업데이트"
echo "🔄 Netlify 환경변수를 업데이트합니다..."

# 현재 사이트 정보 가져오기
SITE_ID=$(netlify status --json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('siteData', {}).get('site-id', ''))" 2>/dev/null)

if [ -z "$SITE_ID" ]; then
    # fallback 방법
    SITE_ID=$(netlify status --json | grep -o '"site-id":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$SITE_ID" ]; then
    echo "❌ 사이트 ID를 찾을 수 없습니다."
    echo "💡 netlify status 명령어로 확인하세요"
    exit 1
fi

echo "📋 사이트 ID: $SITE_ID"

# 환경변수 설정
netlify env:set API_BASE_URL "$NGROK_URL"

if [ $? -eq 0 ]; then
    echo "✅ 환경변수 업데이트 완료"
    echo ""
    echo "🎉 Netlify 환경변수가 성공적으로 업데이트되었습니다!"
    echo "📋 설정된 값:"
    echo "   API_BASE_URL=$NGROK_URL"
    echo ""
    echo "💡 배포가 자동으로 시작됩니다. 잠시 후 확인하세요."
else
    echo "❌ 환경변수 업데이트 실패"
    echo ""
    echo "📋 수동 설정 방법:"
    echo "1. Netlify 대시보드 접속: https://app.netlify.com"
    echo "2. 프로젝트 선택 → Site settings → Environment variables"
    echo "3. 새 환경변수 추가:"
    echo "   - Key: API_BASE_URL"
    echo "   - Value: $NGROK_URL"
    echo "4. 배포 재시작"
fi

echo ""
echo "🔗 테스트 URL:"
echo "   https://your-netlify-app.netlify.app/chat.html"
