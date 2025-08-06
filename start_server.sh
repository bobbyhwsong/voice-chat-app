#!/bin/bash

echo "🎤 음성 채팅 인터페이스 서버 시작 중..."

# 프로젝트 디렉토리로 이동
cd /home/hyungwoo/nk

# 기존 서버 프로세스 종료
pkill -f "http.server"

# 3초 대기
sleep 3

# 웹 서버 시작
echo "서버를 5090번 포트에서 시작합니다..."
/usr/bin/python3 -m http.server 5090 --bind 0.0.0.0 &

# 서버 시작 확인
sleep 2
if netstat -tlnp | grep :5090 > /dev/null; then
    echo "✅ 서버가 성공적으로 시작되었습니다!"
    echo "🌐 접속 주소: http://192.168.0.11:5090"
    echo "🔗 SSH 포트 포워딩: ssh -L 5090:localhost:5090 -p 2211 hyungwoo@147.47.123.184"
    echo ""
    echo "서버를 종료하려면: Ctrl+C"
else
    echo "❌ 서버 시작에 실패했습니다."
fi 