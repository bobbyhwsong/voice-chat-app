#!/bin/bash

# Voice Chat App 의존성 설치 스크립트

echo "📦 Voice Chat App 의존성 설치"
echo "================================"

# 1. conda 환경 확인
echo "📋 1단계: conda 환경 확인"
source /opt/anaconda3/etc/profile.d/conda.sh

# voice-chat-app 환경이 있는지 확인
if conda env list | grep -q "voice-chat-app"; then
    echo "✅ voice-chat-app 환경이 존재합니다."
else
    echo "❌ voice-chat-app 환경이 없습니다."
    echo "💡 환경을 생성합니다..."
    conda create -n voice-chat-app python=3.11 -y
    if [ $? -ne 0 ]; then
        echo "❌ conda 환경 생성 실패"
        exit 1
    fi
fi

# 2. 환경 활성화
echo ""
echo "📋 2단계: 환경 활성화"
conda activate voice-chat-app

if [ $? -ne 0 ]; then
    echo "❌ conda 환경 활성화 실패"
    exit 1
fi

echo "✅ conda 환경 활성화 완료: voice-chat-app"

# 3. conda 환경의 Python 경로 확인
echo ""
echo "📋 3단계: Python 환경 확인"
CONDA_PYTHON="/opt/anaconda3/envs/voice-chat-app/bin/python"
CONDA_PIP="/opt/anaconda3/envs/voice-chat-app/bin/pip"

if [ -f "$CONDA_PYTHON" ]; then
    echo "✅ conda Python 경로: $CONDA_PYTHON"
else
    echo "❌ conda Python을 찾을 수 없습니다: $CONDA_PYTHON"
    exit 1
fi

if [ -f "$CONDA_PIP" ]; then
    echo "✅ conda pip 경로: $CONDA_PIP"
else
    echo "❌ conda pip을 찾을 수 없습니다: $CONDA_PIP"
    exit 1
fi

# 4. 패키지 설치
echo ""
echo "📋 4단계: 패키지 설치"
echo "💡 conda 환경의 pip을 사용하여 패키지를 설치합니다..."

$CONDA_PIP install flask flask-cors openai python-dotenv requests

if [ $? -eq 0 ]; then
    echo "✅ 패키지 설치 완료"
else
    echo "❌ 패키지 설치 실패"
    exit 1
fi

# 5. 설치 확인
echo ""
echo "📋 5단계: 설치 확인"
echo "설치된 패키지 확인:"
$CONDA_PIP list | grep -E "(flask|openai|requests|python-dotenv)"

# 6. 테스트
echo ""
echo "📋 6단계: Python 테스트"
echo "Python 버전 확인:"
$CONDA_PYTHON --version

echo ""
echo "Flask 임포트 테스트:"
$CONDA_PYTHON -c "import flask; print('✅ Flask 임포트 성공')"

echo ""
echo "🎉 의존성 설치 완료!"
echo "💡 이제 다음 명령어로 서버를 실행할 수 있습니다:"
echo "   ./start_backend.sh"
echo "   ./start_frontend.sh" 