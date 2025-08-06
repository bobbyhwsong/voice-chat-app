#!/bin/bash

# Voice Chat App 전체 실행 스크립트

echo "🚀 Voice Chat App 실행"
echo "================================"

# 1. 의존성 확인
echo "📋 1단계: 의존성 확인"
if ! python -c "import flask" 2>/dev/null; then
    echo "❌ Flask가 설치되지 않았습니다."
    echo "💡 의존성을 설치하세요:"
    echo "   ./install_dependencies.sh"
    exit 1
fi

echo "✅ 의존성 확인 완료"

# 2. 환경변수 설정
echo ""
echo "📋 2단계: 환경변수 설정"
if [ -f ".env" ]; then
    echo "✅ .env 파일 발견 - 환경변수 로드"
    export $(cat .env | xargs)
else
    echo "❌ .env 파일이 없습니다."
    echo "💡 env.example을 .env로 복사하고 API 키를 설정하세요"
    exit 1
fi

# 3. 백엔드 서버 시작
echo ""
echo "📋 3단계: 백엔드 서버 시작"
echo "🔄 백엔드 서버를 시작합니다..."

# 포트 설정
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    export FLASK_PORT=5001
    echo "⚠️ 포트 5000 사용 중, 포트 5001 사용"
else
    export FLASK_PORT=5000
    echo "✅ 포트 5000 사용"
fi

# 백엔드 서버를 백그라운드에서 실행
python app.py &
BACKEND_PID=$!

# 서버 시작 대기
sleep 3

# 백엔드 서버 확인
if lsof -Pi :$FLASK_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 백엔드 서버 시작 완료 (포트 $FLASK_PORT)"
else
    echo "❌ 백엔드 서버 시작 실패"
    exit 1
fi

# 4. 프론트엔드 서버 시작
echo ""
echo "📋 4단계: 프론트엔드 서버 시작"
echo "🔄 프론트엔드 서버를 시작합니다..."

# 프론트엔드 서버를 백그라운드에서 실행
python -m http.server 8080 &
FRONTEND_PID=$!

# 서버 시작 대기
sleep 2

# 프론트엔드 서버 확인
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 프론트엔드 서버 시작 완료 (포트 8080)"
else
    echo "❌ 프론트엔드 서버 시작 실패"
    exit 1
fi

# 5. 접속 정보 출력
echo ""
echo "🎉 Voice Chat App 실행 완료!"
echo "================================"
echo "🌐 메인 페이지: http://localhost:8080/index.html"
echo "💬 챗봇 페이지: http://localhost:8080/chat.html"
echo "📊 피드백 페이지: http://localhost:8080/feedback.html"
echo "📋 치트시트 페이지: http://localhost:8080/cheatsheet.html"
echo "🔧 백엔드 API: http://localhost:$FLASK_PORT/api/*"
echo ""
echo "⏹️  서버를 종료하려면: ./stop_servers.sh"
echo ""

# 서버 프로세스 ID 저장
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "서버가 백그라운드에서 실행 중입니다."
echo "브라우저에서 http://localhost:8080/index.html 로 접속하세요!" 