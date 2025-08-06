# Voice Chat App

의료 진료 연습을 위한 AI 챗봇 애플리케이션입니다. OpenAI GPT와 ElevenLabs TTS를 사용하여 자연스러운 대화와 음성 합성을 제공합니다.

## 🔒 보안 주의사항

⚠️ **중요**: 이 프로젝트를 GitHub에 업로드하기 전에 다음 사항을 확인하세요:

1. **API 키가 코드에 직접 포함되지 않았는지 확인**
2. **.env 파일이 .gitignore에 포함되어 있는지 확인**
3. **실제 API 키는 .env 파일에만 저장하고, 이 파일은 절대 GitHub에 업로드하지 마세요**

## 🚀 빠른 시작

### 1. conda 환경 설정

```bash
# conda 환경 생성
conda create -n voice-chat-app python=3.11 -y

# 환경 활성화
conda activate voice-chat-app

# 필요한 패키지 설치
pip install -r requirements.txt
```

### 2. API 키 설정

#### 방법 1: .env 파일 사용 (권장)

```bash
# env.example을 .env로 복사
cp env.example .env

# .env 파일을 편집하여 실제 API 키 입력
# OPENAI_API_KEY=your_actual_openai_api_key
# ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key
```

#### 방법 2: 환경변수 직접 설정

```bash
# OpenAI API 키 설정
export OPENAI_API_KEY="your_openai_api_key_here"

# ElevenLabs API 키 설정
export ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"
```

### 3. 프로젝트 실행

#### 방법 1: 자동 실행 스크립트 사용 (권장)
```bash
./setup_and_run.sh
```

#### 방법 2: 수동 실행
```bash
# conda 환경 활성화
conda activate voice-chat-app

# 서버 실행
python app.py
```

### 4. 브라우저에서 접속

서버가 실행되면 브라우저에서 다음 주소로 접속하세요:
```
http://localhost:5000
```

## 📋 기능

- **AI 챗봇**: 50대 후반의 경험 많은 내과 의사 역할
- **음성 합성**: ElevenLabs TTS를 사용한 자연스러운 음성
- **대화 기록**: 사용자별 대화 로그 저장
- **평가 시스템**: LLM 기반 대화 평가 및 피드백
- **치트시트 생성**: 맞춤형 진료 스크립트 생성

## 🛠️ 기술 스택

- **Backend**: Flask (Python)
- **AI**: OpenAI GPT-3.5-turbo
- **TTS**: ElevenLabs
- **Frontend**: HTML, CSS, JavaScript
- **환경**: conda

## 📁 프로젝트 구조

```
voice-chat-app/
├── app.py                 # Flask 서버 메인 파일
├── requirements.txt       # Python 패키지 의존성
├── setup_and_run.sh      # 자동 실행 스크립트
├── env.example           # 환경변수 예시 파일
├── .gitignore           # Git 무시 파일 목록
├── index.html            # 메인 웹 페이지
├── chat.html             # 챗봇 인터페이스
├── feedback.html         # 피드백 페이지
├── cheatsheet.html       # 치트시트 페이지
└── README.md            # 프로젝트 문서
```

## 🔧 환경 설정

### conda 환경 관리

```bash
# 환경 목록 확인
conda info --envs

# 환경 활성화
conda activate voice-chat-app

# 환경 비활성화
conda deactivate

# 환경 삭제 (필요시)
conda env remove -n voice-chat-app
```

### API 키 설정

#### .env 파일 사용 (권장)

1. `env.example` 파일을 `.env`로 복사:
```bash
cp env.example .env
```

2. `.env` 파일을 편집하여 실제 API 키 입력:
```bash
# .env 파일 내용
OPENAI_API_KEY=your_actual_openai_api_key_here
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
```

#### 환경변수 직접 설정

```bash
# 현재 세션에만 적용
export OPENAI_API_KEY="your_key"
export ELEVENLABS_API_KEY="your_key"

# 영구 설정 (.zshrc에 추가)
echo 'export OPENAI_API_KEY="your_key"' >> ~/.zshrc
echo 'export ELEVENLABS_API_KEY="your_key"' >> ~/.zshrc
source ~/.zshrc
```

## 🧪 테스트

환경이 올바르게 설정되었는지 확인하려면:

```bash
# API 키 확인
echo $OPENAI_API_KEY
echo $ELEVENLABS_API_KEY

# 서버 실행 테스트
python app.py
```

## 📝 API 엔드포인트

- `POST /api/chat`: 챗봇 대화
- `POST /api/clear`: 대화 기록 초기화
- `GET /api/health`: 서버 상태 확인
- `POST /api/evaluate`: 대화 평가
- `POST /api/generate-cheatsheet`: 치트시트 생성
- `POST /api/tts`: 음성 합성

## 🚨 문제 해결

### 1. conda 환경 문제
```bash
# 환경 재생성
conda env remove -n voice-chat-app
conda create -n voice-chat-app python=3.11 -y
conda activate voice-chat-app
pip install -r requirements.txt
```

### 2. API 키 문제
```bash
# API 키 확인
echo $OPENAI_API_KEY
echo $ELEVENLABS_API_KEY

# .env 파일 확인
cat .env

# API 키 재설정
export OPENAI_API_KEY="your_key"
export ELEVENLABS_API_KEY="your_key"
```

### 3. 포트 충돌
기본 포트 5000이 사용 중인 경우 `app.py`에서 포트를 변경하세요.

### 4. 보안 관련 문제
- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- API 키가 코드에 직접 포함되지 않았는지 확인
- GitHub에 업로드하기 전에 민감한 정보가 제거되었는지 확인

## 🔒 보안 체크리스트

GitHub에 업로드하기 전에 다음을 확인하세요:

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있음
- [ ] 코드에 실제 API 키가 직접 포함되지 않음
- [ ] `env.example` 파일만 포함되어 있음
- [ ] 로그 파일이나 임시 파일이 제거됨
- [ ] 민감한 정보가 포함된 파일이 모두 제거됨

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요. 