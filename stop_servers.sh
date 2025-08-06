#!/bin/bash

# Voice Chat App 서버 종료 스크립트

echo "🛑 Voice Chat App 서버 종료"
echo "================================"

# 1. 백엔드 서버 종료
echo "📋 1단계: 백엔드 서버 종료"
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 포트 5001에서 실행 중인 프로세스 종료 중..."
    pkill -f "python.*app.py"
    sleep 2
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ 백엔드 서버 종료 실패"
    else
        echo "✅ 백엔드 서버 종료 완료"
    fi
else
    echo "ℹ️ 백엔드 서버가 실행되지 않았습니다"
fi

# 2. 프론트엔드 서버 종료
echo ""
echo "📋 2단계: 프론트엔드 서버 종료"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 포트 8080에서 실행 중인 프로세스 종료 중..."
    pkill -f "http.server"
    sleep 2
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ 프론트엔드 서버 종료 실패"
    else
        echo "✅ 프론트엔드 서버 종료 완료"
    fi
else
    echo "ℹ️ 프론트엔드 서버가 실행되지 않았습니다"
fi

# 3. 포트 확인
echo ""
echo "📋 3단계: 포트 상태 확인"
echo "포트 5001 상태:"
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ 포트 5001이 여전히 사용 중입니다"
else
    echo "✅ 포트 5001이 비어있습니다"
fi

echo "포트 8080 상태:"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ 포트 8080이 여전히 사용 중입니다"
else
    echo "✅ 포트 8080이 비어있습니다"
fi

echo ""
echo "🎉 서버 종료 완료!" 