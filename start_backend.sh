#!/bin/bash

# Voice Chat App 백엔드 서버 실행 스크립트

echo "🚀 Voice Chat App 백엔드 서버 시작"
echo "================================"

# 1. conda 환경 활성화
echo "📋 1단계: conda 환경 활성화"
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate voice-chat-app

if [ $? -ne 0 ]; then
    echo "❌ conda 환경 활성화 실패"
    echo "💡 다음 명령어로 환경을 생성하세요:"
    echo "   conda create -n voice-chat-app python=3.11 -y"
    exit 1
fi

echo "✅ conda 환경 활성화 완료: voice-chat-app"

# 2. 환경변수 설정
echo ""
echo "📋 2단계: 환경변수 설정"

# .env 파일이 있는지 확인
if [ -f ".env" ]; then
    echo "✅ .env 파일 발견 - 환경변수 로드"
    export $(cat .env | xargs)
else
    echo "⚠️ .env 파일이 없습니다."
    echo "💡 env.example 파일을 .env로 복사하고 API 키를 설정하세요:"
    echo "   cp env.example .env"
    echo "   # .env 파일을 편집하여 API 키를 입력하세요"
    exit 1
fi

# API 키 확인
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY가 설정되지 않았습니다."
    echo "💡 .env 파일에 OPENAI_API_KEY를 설정하세요"
    exit 1
fi

if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ ELEVENLABS_API_KEY가 설정되지 않았습니다."
    echo "💡 .env 파일에 ELEVENLABS_API_KEY를 설정하세요"
    exit 1
fi

echo "✅ API 키 설정 완료"

# 3. 포트 확인 및 설정
echo ""
echo "📋 3단계: 포트 확인 및 설정"

# 포트 5000이 사용 중이면 5001 사용
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ 포트 5000이 사용 중입니다. 포트 5001을 사용합니다."
    export FLASK_PORT=5001
    echo "✅ 포트 5001 사용"
else
    echo "✅ 포트 5000 사용 가능"
    export FLASK_PORT=5000
fi

# 4. 백엔드 서버 실행
echo ""
echo "📋 4단계: Flask 백엔드 서버 실행"
echo "🌐 백엔드 서버: http://localhost:$FLASK_PORT"
echo "📊 API 엔드포인트: http://localhost:$FLASK_PORT/api/*"
echo "⏹️  서버를 중지하려면 Ctrl+C를 누르세요"
echo ""

# 이제 python 명령어가 conda 환경의 Python을 가리킴
python app.py 