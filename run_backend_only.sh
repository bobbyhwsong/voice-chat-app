#!/bin/bash

# 백엔드 서버만 ngrok으로 실행하는 스크립트

echo "🚀 백엔드 서버 + Ngrok 실행"
echo "=========================="

# 1. Ngrok 설치 확인
echo "📋 1단계: Ngrok 설치 확인"
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok이 설치되지 않았습니다."
    echo "💡 Ngrok을 설치하세요:"
    echo "   ./setup_ngrok.sh"
    exit 1
fi
echo "✅ Ngrok 설치 확인 완료"

# 2. 의존성 확인
echo ""
echo "📋 2단계: 의존성 확인"
if ! python -c "import flask" 2>/dev/null; then
    echo "❌ Flask가 설치되지 않았습니다."
    echo "💡 의존성을 설치하세요:"
    echo "   ./install_dependencies.sh"
    exit 1
fi
echo "✅ 의존성 확인 완료"

# 3. 환경변수 설정
echo ""
echo "📋 3단계: 환경변수 설정"
if [ -f ".env" ]; then
    echo "✅ .env 파일 발견 - 환경변수 로드"
    export $(cat .env | xargs)
else
    echo "❌ .env 파일이 없습니다."
    echo "💡 env.example을 .env로 복사하고 API 키를 설정하세요"
    exit 1
fi

# 4. 백엔드 서버 시작
echo ""
echo "📋 4단계: 백엔드 서버 시작"
echo "🔄 백엔드 서버를 시작합니다..."

# 포트 설정
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    export FLASK_PORT=5001
    echo "⚠️ 포트 5001 사용 중, 포트 5001 사용"
else
    export FLASK_PORT=5001
    echo "✅ 포트 5001 사용"
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

# 5. Ngrok 터널 시작
echo ""
echo "📋 5단계: Ngrok 터널 시작"
echo "🌐 Ngrok 터널을 시작합니다..."

# 백엔드 Ngrok 터널을 백그라운드에서 실행
ngrok http $FLASK_PORT > ngrok_backend.log 2>&1 &
BACKEND_NGROK_PID=$!

# 백엔드 터널 시작 대기
sleep 5

# Ngrok URL 가져오기
BACKEND_NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$BACKEND_NGROK_URL" ]; then
    echo "✅ Ngrok 터널 시작 완료"
    echo "🌐 백엔드 API URL: $BACKEND_NGROK_URL"
    echo ""
    echo "💡 Netlify 프론트엔드에서 사용할 URL:"
    echo "   $BACKEND_NGROK_URL"
    echo ""
    echo "💡 환경변수 설정:"
    echo "   REACT_APP_API_BASE_URL=$BACKEND_NGROK_URL"
else
    echo "⚠️ Ngrok URL을 가져올 수 없습니다. 수동으로 확인하세요:"
    echo "   http://localhost:4040"
fi

# 6. 접속 정보 출력
echo ""
echo "🎉 백엔드 서버 + Ngrok 실행 완료!"
echo "================================="
echo "🌐 로컬 접속:"
echo "   백엔드 API: http://localhost:$FLASK_PORT/api/*"
echo ""
echo "🌐 원격 접속:"
if [ ! -z "$BACKEND_NGROK_URL" ]; then
    echo "   백엔드 API: $BACKEND_NGROK_URL"
    echo ""
    echo "💡 프론트엔드에서 사용할 API URL:"
    echo "   $BACKEND_NGROK_URL"
else
    echo "   Ngrok 대시보드: http://localhost:4040"
    echo "   (URL을 수동으로 확인하세요)"
fi
echo ""
echo "⏹️  서버를 종료하려면: ./stop_backend.sh"
echo "📊 Ngrok 대시보드: http://localhost:4040"
echo ""

# 서버 프로세스 ID 저장
echo $BACKEND_PID > .backend.pid
echo $BACKEND_NGROK_PID > .backend_ngrok.pid

echo "백엔드 서버가 백그라운드에서 실행 중입니다."
echo "Netlify 프론트엔드에서 위의 ngrok URL을 사용하세요!" 