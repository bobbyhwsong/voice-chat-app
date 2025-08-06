# Voice Chat App

의료 진료 연습을 위한 AI 음성 채팅 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
./install_dependencies.sh
```

### 2. 환경변수 설정
```bash
cp env.example .env
# .env 파일에 API 키들을 설정하세요
```

### 3. 로컬 개발
```bash
# 백엔드만 실행 (ngrok 포함)
./run_backend_only.sh

# 또는 빠른 데모
./quick_demo.sh
```

### 4. 배포
```bash
# 프론트엔드 배포 (Netlify)
netlify deploy --prod

# 백엔드는 필요할 때만 실행
./run_backend_only.sh
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
├── quick_demo.sh         # 빠른 데모 스크립트
├── stop_backend.sh       # 백엔드 종료
├── install_dependencies.sh # 의존성 설치
├── setup_ngrok.sh        # ngrok 설치
└── DEPLOYMENT_GUIDE.md   # 배포 가이드
```

## 🛠️ 사용법

### 로컬 개발
1. 의존성 설치: `./install_dependencies.sh`
2. 환경변수 설정: `cp env.example .env`
3. 백엔드 실행: `./run_backend_only.sh`
4. 브라우저에서 접속: `http://localhost:8080`

### 원격 배포
1. 프론트엔드: Netlify에 배포
2. 백엔드: ngrok으로 필요할 때만 실행
3. 연결: URL 파라미터 또는 환경변수로 설정

## 🔧 스크립트 설명

| 스크립트 | 설명 |
|---------|------|
| `install_dependencies.sh` | Python 의존성 설치 |
| `setup_ngrok.sh` | ngrok 설치 및 설정 |
| `run_backend_only.sh` | 백엔드 서버 + ngrok 실행 |
| `quick_demo.sh` | 빠른 데모 시작 |
| `stop_backend.sh` | 백엔드 서버 종료 |

## 🌐 배포 아키텍처

```
프론트엔드 (Netlify) ←→ 백엔드 (ngrok)
```

- **프론트엔드**: Netlify에 24/7 배포
- **백엔드**: ngrok으로 필요할 때만 실행
- **연결**: URL 파라미터 또는 환경변수

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
2. **ngrok 제한**: 무료 계정의 제한사항 확인
3. **리소스 관리**: 백엔드는 필요할 때만 실행
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