#!/bin/bash

# 빠른 데모용 스크립트

echo "🚀 빠른 데모 시작"
echo "=================="

# 1. 백엔드 시작
echo "📋 1단계: 백엔드 서버 시작"
./run_backend_only.sh

# 2. ngrok URL 가져오기
echo ""
echo "📋 2단계: ngrok URL 확인"
sleep 5
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$BACKEND_URL" ]; then
    echo "✅ 백엔드 URL: $BACKEND_URL"
    echo ""
    echo "🌐 데모 URL:"
    echo "   https://your-netlify-app.netlify.app/index.html?backend=$BACKEND_URL"
    echo ""
    echo "💡 위 URL을 복사해서 브라우저에서 열어보세요!"
    echo ""
    echo "⏹️  데모 끝나면 Ctrl+C를 누르거나 ./stop_backend.sh를 실행하세요"
    echo ""
    
    # ngrok 대시보드 열기
    echo "📊 ngrok 대시보드: http://localhost:4040"
    open http://localhost:4040 2>/dev/null || echo "ngrok 대시보드를 수동으로 열어주세요: http://localhost:4040"
    
    # 대기
    echo "🔄 백엔드 서버가 실행 중입니다. 종료하려면 Ctrl+C를 누르세요..."
    wait
else
    echo "❌ ngrok URL을 가져올 수 없습니다."
    echo "💡 수동으로 확인하세요: http://localhost:4040"
fi 