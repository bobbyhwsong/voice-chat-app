#!/bin/bash

# Ngrok 설치 및 설정 스크립트

echo "🚀 Ngrok 설치 및 설정"
echo "================================"

# 1. Ngrok 설치 확인
echo "📋 1단계: Ngrok 설치 확인"
if command -v ngrok &> /dev/null; then
    echo "✅ Ngrok이 이미 설치되어 있습니다."
else
    echo "📥 Ngrok을 설치합니다..."
    
    # macOS에서 Homebrew를 통한 설치
    if command -v brew &> /dev/null; then
        echo "🍺 Homebrew를 통해 Ngrok 설치"
        brew install ngrok/ngrok/ngrok
    else
        echo "📦 직접 다운로드하여 설치"
        # Ngrok 다운로드
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    fi
fi

# 2. Ngrok 인증 확인
echo ""
echo "📋 2단계: Ngrok 인증 확인"
if [ -f "$HOME/.ngrok2/ngrok.yml" ]; then
    echo "✅ Ngrok 인증이 설정되어 있습니다."
else
    echo "⚠️ Ngrok 인증이 필요합니다."
    echo ""
    echo "💡 Ngrok 인증 방법:"
    echo "1. https://ngrok.com 에서 무료 계정을 만드세요"
    echo "2. 대시보드에서 authtoken을 복사하세요"
    echo "3. 다음 명령어를 실행하세요:"
    echo "   ngrok config add-authtoken YOUR_AUTH_TOKEN"
    echo ""
    echo "🔑 인증 토큰을 입력하세요 (또는 Enter를 눌러 나중에 설정):"
    read -p "Authtoken: " authtoken
    
    if [ ! -z "$authtoken" ]; then
        ngrok config add-authtoken $authtoken
        echo "✅ Ngrok 인증 완료"
    else
        echo "⚠️ 인증을 나중에 설정하세요"
    fi
fi

echo ""
echo "✅ Ngrok 설정 완료!"
echo "💡 원격 접속을 시작하려면: ./run_app_with_ngrok.sh" 