#!/bin/bash

# 로컬에서 프론트엔드만 실행하는 스크립트

echo "🚀 로컬 프론트엔드 실행"
echo "======================="

# 1. Python 설치 확인
echo "📋 1단계: Python 설치 확인"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3가 설치되지 않았습니다."
    echo "💡 Python3를 설치하세요"
    exit 1
fi
echo "✅ Python3 설치 확인 완료"

# 2. 포트 확인 및 설정
echo ""
echo "📋 2단계: 포트 확인"
FRONTEND_PORT=8000

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ 포트 $FRONTEND_PORT가 사용 중입니다."
    echo "💡 다른 포트를 사용하거나 기존 프로세스를 종료하세요"
    echo "   현재 포트 $FRONTEND_PORT 사용 중인 프로세스:"
    lsof -i :$FRONTEND_PORT
    echo ""
    read -p "계속하시겠습니까? (y/N): " continue_choice
    if [[ ! $continue_choice =~ ^[Yy]$ ]]; then
        echo "❌ 실행을 취소합니다."
        exit 1
    fi
else
    echo "✅ 포트 $FRONTEND_PORT 사용 가능"
fi

# 3. 프론트엔드 파일 확인
echo ""
echo "📋 3단계: 프론트엔드 파일 확인"
if [ ! -f "index.html" ]; then
    echo "❌ index.html 파일을 찾을 수 없습니다."
    exit 1
fi
echo "✅ 프론트엔드 파일 확인 완료"

# 4. 로컬 HTTP 서버 시작
echo ""
echo "📋 4단계: 로컬 HTTP 서버 시작"
echo "🌐 프론트엔드를 포트 $FRONTEND_PORT에서 시작합니다..."

# Python HTTP 서버를 백그라운드에서 실행
python3 -m http.server $FRONTEND_PORT &
FRONTEND_PID=$!

# 서버 시작 대기
sleep 2

# 서버 확인
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 로컬 프론트엔드 서버 시작 완료"
else
    echo "❌ 서버 시작 실패"
    exit 1
fi

# 5. 접속 정보 출력
echo ""
echo "🎉 로컬 프론트엔드 실행 완료!"
echo "============================="
echo "🌐 로컬 접속:"
echo "   메인 페이지: http://localhost:$FRONTEND_PORT"
echo "   채팅 페이지: http://localhost:$FRONTEND_PORT/chat.html"
echo "   피드백 페이지: http://localhost:$FRONTEND_PORT/feedback.html"
echo "   디버그 페이지: http://localhost:$FRONTEND_PORT/debug.html"
echo "   가이드라인 페이지: http://localhost:$FRONTEND_PORT/guideline.html"
echo "   치트시트 페이지: http://localhost:$FRONTEND_PORT/cheatsheet.html"
echo "   재시도 페이지: http://localhost:$FRONTEND_PORT/retry.html"
echo ""
echo "💡 백엔드 API가 필요하면 별도로 실행하세요:"
echo "   ./run_backend_only.sh"
echo ""
echo "⏹️  서버를 종료하려면: ./stop_local_frontend.sh"
echo ""

# 서버 프로세스 ID 저장
echo $FRONTEND_PID > .local_frontend.pid

echo "로컬 프론트엔드 서버가 백그라운드에서 실행 중입니다."
echo "브라우저에서 위의 URL로 접속하세요!" 