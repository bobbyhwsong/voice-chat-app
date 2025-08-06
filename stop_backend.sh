#!/bin/bash

# 백엔드 서버와 ngrok 종료 스크립트

echo "🛑 백엔드 서버와 ngrok 종료"
echo "=========================="

# 함수: 포트를 사용하는 프로세스 종료
kill_process_on_port() {
    local port=$1
    local process_name=$2
    
    echo "🔍 포트 $port에서 $process_name 프로세스 검색 중..."
    
    # 포트를 사용하는 모든 프로세스 찾기
    local pids=$(lsof -ti :$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "📋 포트 $port에서 실행 중인 프로세스들:"
        lsof -i :$port
        
        for pid in $pids; do
            echo "🔄 PID $pid 종료 중..."
            kill $pid 2>/dev/null
            sleep 1
            
            # 여전히 실행 중이면 강제 종료
            if ps -p $pid > /dev/null 2>&1; then
                echo "⚠️ PID $pid 강제 종료 중..."
                kill -9 $pid 2>/dev/null
                sleep 1
            fi
        done
        
        # 다시 확인
        if lsof -ti :$port >/dev/null 2>&1; then
            echo "⚠️ 포트 $port가 여전히 사용 중입니다."
            return 1
        else
            echo "✅ 포트 $port가 해제되었습니다."
            return 0
        fi
    else
        echo "ℹ️ 포트 $port에서 실행 중인 프로세스가 없습니다."
        return 0
    fi
}

# 함수: 특정 이름의 프로세스 종료
kill_process_by_name() {
    local process_name=$1
    local display_name=$2
    
    echo "🔍 $display_name 프로세스 검색 중..."
    
    # 프로세스 이름으로 PID 찾기
    local pids=$(pgrep -f "$process_name" 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "📋 발견된 $display_name 프로세스들:"
        ps -p $pids -o pid,ppid,cmd
        
        for pid in $pids; do
            echo "🔄 PID $pid 종료 중..."
            kill $pid 2>/dev/null
            sleep 1
            
            # 여전히 실행 중이면 강제 종료
            if ps -p $pid > /dev/null 2>&1; then
                echo "⚠️ PID $pid 강제 종료 중..."
                kill -9 $pid 2>/dev/null
                sleep 1
            fi
        done
        
        # 다시 확인
        if pgrep -f "$process_name" >/dev/null 2>&1; then
            echo "⚠️ $display_name 프로세스가 여전히 실행 중입니다."
            return 1
        else
            echo "✅ $display_name 프로세스가 모두 종료되었습니다."
            return 0
        fi
    else
        echo "ℹ️ 실행 중인 $display_name 프로세스가 없습니다."
        return 0
    fi
}

# 백엔드 서버 종료 (PID 파일 기반)
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔄 백엔드 서버 종료 중... (PID: $BACKEND_PID)"
        kill $BACKEND_PID
        sleep 2
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "⚠️ 강제 종료 중..."
            kill -9 $BACKEND_PID
        fi
        echo "✅ 백엔드 서버 종료 완료"
    else
        echo "ℹ️ 백엔드 서버가 이미 종료되었습니다."
    fi
    rm -f .backend.pid
else
    echo "ℹ️ 백엔드 서버 PID 파일이 없습니다."
fi

# ngrok 프로세스 종료 (PID 파일 기반)
if [ -f ".backend_ngrok.pid" ]; then
    NGROK_PID=$(cat .backend_ngrok.pid)
    if ps -p $NGROK_PID > /dev/null 2>&1; then
        echo "🔄 ngrok 터널 종료 중... (PID: $NGROK_PID)"
        kill $NGROK_PID
        sleep 2
        if ps -p $NGROK_PID > /dev/null 2>&1; then
            echo "⚠️ 강제 종료 중..."
            kill -9 $NGROK_PID
        fi
        echo "✅ ngrok 터널 종료 완료"
    else
        echo "ℹ️ ngrok 터널이 이미 종료되었습니다."
    fi
    rm -f .backend_ngrok.pid
else
    echo "ℹ️ ngrok PID 파일이 없습니다."
fi

# 포트 기반 종료 (추가 안전장치)
echo ""
echo "🔧 포트 기반 프로세스 종료:"

# Flask/Python 서버 종료 (포트 5000, 5001, 8000 등)
for port in 5000 5001 8000 8080; do
    kill_process_on_port $port "Flask/Python 서버"
done

# ngrok 프로세스 종료
kill_process_by_name "ngrok" "ngrok"

# Python 프로세스 중 Flask 관련 프로세스 종료
echo "🔍 Flask 관련 Python 프로세스 검색 중..."
python_pids=$(pgrep -f "python.*app.py\|python.*flask\|python.*run" 2>/dev/null)

if [ -n "$python_pids" ]; then
    echo "📋 발견된 Flask 관련 Python 프로세스들:"
    ps -p $python_pids -o pid,ppid,cmd
    
    for pid in $python_pids; do
        echo "🔄 Flask 프로세스 PID $pid 종료 중..."
        kill $pid 2>/dev/null
        sleep 1
        
        if ps -p $pid > /dev/null 2>&1; then
            echo "⚠️ Flask 프로세스 PID $pid 강제 종료 중..."
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
    done
else
    echo "ℹ️ Flask 관련 Python 프로세스가 없습니다."
fi

# 최종 정리
echo ""
echo "🧹 최종 정리 중..."

# 남은 ngrok 프로세스 정리
pkill -f "ngrok" 2>/dev/null || true

# 남은 Python 웹 서버 프로세스 정리
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "python.*flask" 2>/dev/null || true

# 포트 상태 최종 확인
echo ""
echo "📋 최종 포트 상태 확인:"
for port in 5000 5001 8000 8080; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️ 포트 $port가 여전히 사용 중입니다:"
        lsof -i :$port
    else
        echo "✅ 포트 $port가 해제되었습니다."
    fi
done

# 프로세스 상태 확인
echo ""
echo "📋 프로세스 상태 확인:"
if pgrep -f "ngrok" >/dev/null 2>&1; then
    echo "⚠️ ngrok 프로세스가 여전히 실행 중입니다:"
    pgrep -f "ngrok" | xargs ps -o pid,ppid,cmd
else
    echo "✅ ngrok 프로세스가 모두 종료되었습니다."
fi

if pgrep -f "python.*app.py\|python.*flask" >/dev/null 2>&1; then
    echo "⚠️ Flask 프로세스가 여전히 실행 중입니다:"
    pgrep -f "python.*app.py\|python.*flask" | xargs ps -o pid,ppid,cmd
else
    echo "✅ Flask 프로세스가 모두 종료되었습니다."
fi

echo ""
echo "🎉 백엔드 서버와 ngrok 종료 작업이 완료되었습니다!" 