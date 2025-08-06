#!/bin/bash

# Voice Chat App 프론트엔드 서버 실행 스크립트

echo "🎨 Voice Chat App 프론트엔드 서버 시작"
echo "================================"

# 1. 포트 확인
echo "📋 1단계: 포트 확인"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ 포트 8080이 이미 사용 중입니다."
    echo "💡 다른 프로세스를 종료하거나 포트를 변경하세요"
    exit 1
else
    echo "✅ 포트 8080 사용 가능"
fi

# 2. 백엔드 서버 확인
echo ""
echo "📋 2단계: 백엔드 서버 확인"
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 백엔드 서버가 실행 중입니다 (포트 5000)"
    export BACKEND_PORT=5000
elif lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 백엔드 서버가 실행 중입니다 (포트 5001)"
    export BACKEND_PORT=5001
else
    echo "⚠️ 백엔드 서버가 실행되지 않았습니다."
    echo "💡 먼저 백엔드 서버를 실행하세요:"
    echo "   ./start_backend.sh"
    exit 1
fi

# 3. 프론트엔드 서버 실행
echo ""
echo "📋 3단계: 프론트엔드 서버 실행"
echo "🌐 프론트엔드 서버: http://localhost:8080"
echo "📱 메인 페이지: http://localhost:8080/index.html"
echo "💬 챗봇 페이지: http://localhost:8080/chat.html"
echo "📊 피드백 페이지: http://localhost:8080/feedback.html"
echo "📋 치트시트 페이지: http://localhost:8080/cheatsheet.html"
echo "⏹️  서버를 중지하려면 Ctrl+C를 누르세요"
echo ""

# 이제 python 명령어가 conda 환경의 Python을 가리킴
python -m http.server 8080 