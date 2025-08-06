#!/bin/bash

# Voice Chat App 실행 스크립트
# 이 스크립트는 conda 환경을 설정하고 프로젝트를 실행합니다.

echo "🚀 Voice Chat App 실행 스크립트"
echo "================================"

# 1. conda 환경 활성화
echo "📋 1단계: conda 환경 활성화"
source ~/anaconda3/etc/profile.d/conda.sh
conda activate voice-chat-app

if [ $? -ne 0 ]; then
    echo "❌ conda 환경 활성화 실패"
    echo "💡 다음 명령어로 환경을 생성하세요:"
    echo "   conda create -n voice-chat-app python=3.11 -y"
    exit 1
fi

echo "✅ conda 환경 활성화 완료: voice-chat-app"

# 2. 필요한 패키지 설치 확인
echo ""
echo "📋 2단계: 패키지 설치 확인"
pip install -r requirements.txt

# 3. 환경변수 파일 확인
echo ""
echo "📋 3단계: 환경변수 설정"

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

# 4. 서버 실행
echo ""
echo "📋 4단계: Flask 서버 실행"
echo "🌐 서버가 시작되면 브라우저에서 http://localhost:5000 으로 접속하세요"
echo "⏹️  서버를 중지하려면 Ctrl+C를 누르세요"
echo ""

python app.py 