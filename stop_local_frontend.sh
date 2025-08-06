#!/bin/bash

# 로컬 프론트엔드 서버 종료 스크립트

echo "⏹️  로컬 프론트엔드 서버 종료"
echo "============================="

# 1. PID 파일 확인
echo "📋 1단계: 프로세스 확인"
if [ -f ".local_frontend.pid" ]; then
    FRONTEND_PID=$(cat .local_frontend.pid)
    echo "📄 PID 파일에서 프로세스 ID 확인: $FRONTEND_PID"
else
    echo "⚠️ PID 파일을 찾을 수 없습니다."
    FRONTEND_PID=""
fi

# 2. 포트 8000에서 실행 중인 프로세스 확인
echo ""
echo "📋 2단계: 포트 8000 프로세스 확인"
PORT_8000_PIDS=$(lsof -ti :8000 2>/dev/null)

if [ ! -z "$PORT_8000_PIDS" ]; then
    echo "🔍 포트 8000에서 실행 중인 프로세스:"
    lsof -i :8000
    echo ""
else
    echo "✅ 포트 8000에서 실행 중인 프로세스가 없습니다."
fi

# 3. 프로세스 종료
echo ""
echo "📋 3단계: 프로세스 종료"

# PID 파일에서 가져온 프로세스 종료
if [ ! -z "$FRONTEND_PID" ]; then
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🔄 PID $FRONTEND_PID 프로세스 종료 중..."
        kill $FRONTEND_PID
        sleep 2
        
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "⚠️ 프로세스가 종료되지 않았습니다. 강제 종료합니다..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ PID $FRONTEND_PID 프로세스 종료 완료"
    else
        echo "⚠️ PID $FRONTEND_PID 프로세스가 이미 종료되었습니다."
    fi
fi

# 포트 8000의 모든 프로세스 종료
if [ ! -z "$PORT_8000_PIDS" ]; then
    echo "🔄 포트 8000의 모든 프로세스 종료 중..."
    for pid in $PORT_8000_PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "   프로세스 $pid 종료 중..."
            kill $pid
            sleep 1
            
            if ps -p $pid > /dev/null 2>&1; then
                echo "   프로세스 $pid 강제 종료 중..."
                kill -9 $pid
            fi
        fi
    done
    echo "✅ 포트 8000의 모든 프로세스 종료 완료"
fi

# 4. 정리 작업
echo ""
echo "📋 4단계: 정리 작업"

# PID 파일 삭제
if [ -f ".local_frontend.pid" ]; then
    rm .local_frontend.pid
    echo "✅ PID 파일 삭제 완료"
fi

# 5. 최종 확인
echo ""
echo "📋 5단계: 최종 확인"
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ 포트 8000에서 여전히 프로세스가 실행 중입니다:"
    lsof -i :8000
    echo ""
    echo "💡 수동으로 종료하려면:"
    echo "   sudo lsof -ti :8000 | xargs kill -9"
else
    echo "✅ 포트 8000이 완전히 비워졌습니다."
fi

echo ""
echo "🎉 로컬 프론트엔드 서버 종료 완료!"
echo "================================"
echo "💡 다시 시작하려면: ./run_local_frontend.sh" 