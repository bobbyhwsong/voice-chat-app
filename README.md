# Voice Chat App

의료 진료 연습을 위한 AI 음성 채팅 애플리케이션입니다.

## 📋 사전 준비사항

### 1. 필요한 프로그램 설치
- **Python 3.11 이상**: [Python 공식 사이트](https://www.python.org/downloads/)에서 다운로드
- **Anaconda**: [Anaconda 공식 사이트](https://www.anaconda.com/download)에서 다운로드
- **Git**: [Git 공식 사이트](https://git-scm.com/downloads)에서 다운로드

### 2. API 키 준비
- **OpenAI API 키**: [OpenAI 웹사이트](https://platform.openai.com/api-keys)에서 발급
- **ElevenLabs API 키**: [ElevenLabs 웹사이트](https://elevenlabs.io/)에서 발급

## 🚀 단계별 설치 및 실행

### 1단계: 프로젝트 다운로드

**터미널을 열고 다음 명령어를 실행하세요:**

```bash
# 1. 다운로드할 폴더로 이동 (예: Downloads 폴더)
cd ~/Downloads

# 2. 프로젝트 폴더 생성
mkdir voice-chat-app
cd voice-chat-app

# 3. 프로젝트 파일들을 이 폴더에 복사
# (Cursor에서 파일들을 이 폴더로 복사하거나 다운로드)
```

### 2단계: 의존성 설치

**터미널에서 다음 명령어를 실행하세요:**

```bash
# 1. 스크립트 실행 권한 부여
chmod +x install_dependencies.sh

# 2. 의존성 설치 스크립트 실행
./install_dependencies.sh
```

**만약 오류가 발생한다면:**
```bash
# 수동으로 conda 환경 생성
conda create -n voice-chat-app python=3.11 -y
conda activate voice-chat-app
pip install flask flask-cors openai python-dotenv requests
```

### 3단계: 환경변수 설정

**1. .env 파일 생성:**
```bash
# env.example을 .env로 복사
cp env.example .env
```

**2. .env 파일 편집:**
```bash
# 텍스트 에디터로 .env 파일 열기
nano .env
```

**3. API 키 입력:**
```env
# OpenAI API 키
OPENAI_API_KEY=sk-your-openai-api-key-here

# ElevenLabs API 키
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

**저장 후 종료:**
- nano 에디터: `Ctrl + X` → `Y` → `Enter`
- vim 에디터: `Esc` → `:wq` → `Enter`

### 4단계: ngrok 설치 (백엔드용)

**터미널에서 다음 명령어를 실행하세요:**

```bash
# 1. ngrok 설치 스크립트 실행 권한 부여
chmod +x setup_ngrok.sh

# 2. ngrok 설치
./setup_ngrok.sh
```

**또는 수동 설치:**
```bash
# macOS용 ngrok 다운로드
curl -O https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip

# 압축 해제
unzip ngrok-v3-stable-darwin-amd64.zip

# 실행 권한 부여
chmod +x ngrok

# PATH에 추가 (선택사항)
sudo mv ngrok /usr/local/bin/
```

### 5단계: 백엔드 서버 실행

**터미널에서 다음 명령어를 실행하세요:**

```bash
# 1. 스크립트 실행 권한 부여
chmod +x run_backend_only.sh

# 2. 백엔드 서버 실행
./run_backend_only.sh
```

**성공하면 다음과 같은 메시지가 나타납니다:**
```
🎉 백엔드 서버 + Ngrok 실행 완료!
=================================
🌐 로컬 접속:
   백엔드 API: http://localhost:5001/api/*
🌐 원격 접속:
   백엔드 API: https://xxxx-xxx-xxx-xxx.ngrok.io
```

### 6단계: 프론트엔드 서버 실행

**새로운 터미널 창을 열고 다음 명령어를 실행하세요:**

```bash
# 1. 프로젝트 폴더로 이동
cd ~/Downloads/voice-chat-app

# 2. 스크립트 실행 권한 부여
chmod +x run_local_frontend.sh

# 3. 프론트엔드 서버 실행
./run_local_frontend.sh
```

**성공하면 다음과 같은 메시지가 나타납니다:**
```
🎉 로컬 프론트엔드 실행 완료!
=============================
🌐 로컬 접속:
   메인 페이지: http://localhost:8000
   채팅 페이지: http://localhost:8000/chat.html
```

### 7단계: 브라우저에서 접속

**웹 브라우저를 열고 다음 URL로 접속하세요:**

- **메인 페이지**: `http://localhost:8000`
- **채팅 페이지**: `http://localhost:8000/chat.html`
- **피드백 페이지**: `http://localhost:8000/feedback.html`

## 🛠️ 문제 해결

### 자주 발생하는 오류

**1. "Permission denied" 오류:**
```bash
chmod +x *.sh
```

**2. "conda command not found" 오류:**
```bash
# Anaconda 설치 후 터미널 재시작
source ~/.zshrc
```

**3. "Python not found" 오류:**
```bash
# Python 설치 확인
python3 --version
# 또는
python --version
```

**4. "Port already in use" 오류:**
```bash
# 사용 중인 포트 확인
lsof -i :8000
lsof -i :5001

# 프로세스 종료
kill -9 [프로세스ID]
```

### 서버 종료

**백엔드 서버 종료:**
```bash
./stop_backend.sh
```

**프론트엔드 서버 종료:**
```bash
./stop_local_frontend.sh
```

## 📁 프로젝트 구조

```
voice-chat-app/
├── app.py                 # Flask 백엔드 서버
├── index.html            # 메인 페이지
├── chat.html             # 챗봇 페이지
├── feedback.html         # 피드백 페이지
├── cheatsheet.html       # 치트시트 페이지
├── script.js             # 메인 JavaScript
├── style.css             # 메인 스타일
├── requirements.txt      # Python 의존성
├── run_backend_only.sh   # 백엔드 실행 (ngrok 포함)
├── run_local_frontend.sh # 로컬 프론트엔드 실행
├── stop_backend.sh       # 백엔드 종료
├── stop_local_frontend.sh # 로컬 프론트엔드 종료
├── install_dependencies.sh # 의존성 설치
├── setup_ngrok.sh        # ngrok 설치
└── DEPLOYMENT_GUIDE.md   # 배포 가이드
```

## 🔧 스크립트 설명

| 스크립트 | 설명 |
|---------|------|
| `install_dependencies.sh` | Python 의존성 설치 |
| `setup_ngrok.sh` | ngrok 설치 및 설정 |
| `run_backend_only.sh` | 백엔드 서버 + ngrok 실행 |
| `run_local_frontend.sh` | 로컬 프론트엔드 실행 |
| `stop_backend.sh` | 백엔드 서버 종료 |
| `stop_local_frontend.sh` | 로컬 프론트엔드 종료 |

## 🌐 로컬 아키텍처

```
프론트엔드 (localhost:8000) ←→ 백엔드 (localhost:5001)
```

- **프론트엔드**: Python HTTP 서버 (포트 8000)
- **백엔드**: Flask 서버 (포트 5001)
- **연결**: 로컬 네트워크

## 📋 환경변수

`.env` 파일에 다음 변수들을 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## 🔗 API 엔드포인트

- `POST /api/chat` - 채팅 메시지 처리
- `POST /api/clear` - 대화 기록 초기화
- `GET /api/health` - 서버 상태 확인
- `POST /api/evaluate` - 대화 평가
- `GET /api/feedback` - 피드백 데이터
- `POST /api/generate-cheatsheet` - 치트시트 생성
- `POST /api/analyze-quest` - 퀘스트 분석
- `POST /api/tts` - 텍스트 음성 변환

## 🎯 주요 기능

- **AI 음성 채팅**: OpenAI GPT와 ElevenLabs TTS
- **의료 진료 연습**: 전문적인 시나리오
- **실시간 평가**: 대화 품질 분석
- **피드백 시스템**: 개선점 제안
- **치트시트 생성**: 핵심 포인트 정리
- **반응형 디자인**: 모바일 친화적

## 🚨 주의사항

1. **API 키 보안**: `.env` 파일을 Git에 커밋하지 마세요
2. **포트 충돌**: 8000, 5001 포트가 사용 중이면 다른 포트 사용
3. **리소스 관리**: 서버는 필요할 때만 실행
4. **CORS 설정**: 프론트엔드-백엔드 연결 확인

## 📚 추가 문서

- [배포 가이드](DEPLOYMENT_GUIDE.md) - Netlify + ngrok 배포
- [보안 체크리스트](SECURITY_CHECKLIST.md) - 보안 가이드라인

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 