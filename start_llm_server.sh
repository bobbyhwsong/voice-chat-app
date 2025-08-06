#!/bin/bash

echo "🤖 LLM 챗봇 서버 시작 중..."

# 가상환경 활성화 (선택사항)
# source venv/bin/activate

# 필요한 패키지 설치 확인
echo "패키지 설치 확인 중..."
/usr/bin/python3 -m pip install -r requirements.txt

# 기존 서버 프로세스 종료
pkill -f "python.*app.py"

# 3초 대기
sleep 3

# LLM 서버 시작
echo "LLM 서버를 5000번 포트에서 시작합니다..."
/usr/bin/python3 app.py &

# 서버 시작 확인
sleep 3
if netstat -tlnp | grep :5000 > /dev/null; then
    echo "✅ LLM 서버가 성공적으로 시작되었습니다!"
    echo "🌐 API 주소: http://192.168.0.11:5000"
    echo "🔗 웹 인터페이스: http://192.168.0.11:5090"
    echo ""
    echo "⚠️  OpenAI API 키를 설정해야 합니다:"
    echo "   export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "서버를 종료하려면: pkill -f 'python.*app.py'"
else
    echo "❌ LLM 서버 시작에 실패했습니다."
fi 