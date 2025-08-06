# Netlify + ngrok 배포 가이드

## 개요
이 가이드는 프론트엔드를 Netlify에, 백엔드를 ngrok으로 배포하는 방법을 설명합니다.

## 아키텍처
```
프론트엔드 (Netlify) ←→ 백엔드 (ngrok)
```

## 1단계: 백엔드 설정 (ngrok)

### 1.1 백엔드 서버 실행
```bash
# 백엔드 서버 + ngrok 실행
./run_backend_only.sh
```

### 1.2 ngrok URL 확인
- ngrok 대시보드: http://localhost:4040
- 백엔드 API URL: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`

## 2단계: 프론트엔드 설정 (Netlify)

### 2.1 Netlify CLI 설치
```bash
npm install -g netlify-cli
```

### 2.2 Netlify 로그인
```bash
netlify login
```

### 2.3 환경변수 설정
Netlify 대시보드에서 다음 환경변수를 설정:
- `REACT_APP_API_BASE_URL`: 백엔드 ngrok URL

### 2.4 배포
```bash
# 프로덕션 배포
netlify deploy --prod

# 또는 GitHub 연동으로 자동 배포
```

## 3단계: 연결 설정

### 3.1 방법 1: URL 파라미터 사용
```
https://your-netlify-app.netlify.app/index.html?backend=https://your-ngrok-url.ngrok-free.app
```

### 3.2 방법 2: 환경변수 사용
Netlify 환경변수에 백엔드 URL 설정 후 자동 연결

### 3.3 방법 3: 브라우저 콘솔에서 설정
```javascript
window.API_BASE_URL = "https://your-ngrok-url.ngrok-free.app";
```

## 4단계: 테스트

### 4.1 로컬 테스트
```bash
# 백엔드만 실행
./run_backend_only.sh

# 브라우저에서 테스트
http://localhost:8080/index.html?backend=https://your-ngrok-url.ngrok-free.app
```

### 4.2 원격 테스트
- Netlify URL로 접속
- API 연결 확인
- 음성 기능 테스트

## 5단계: 문제 해결

### 5.1 CORS 오류
- 백엔드에서 CORS 설정 확인
- ngrok URL이 허용 목록에 포함되어 있는지 확인

### 5.2 API 연결 실패
- ngrok URL이 올바른지 확인
- 백엔드 서버가 실행 중인지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 5.3 음성 기능 오류
- ElevenLabs API 키 설정 확인
- ngrok URL에서 HTTPS 사용 확인

## 6단계: 프로덕션 최적화

### 6.1 ngrok 고정 URL (유료)
- ngrok 유료 계정으로 고정 URL 사용
- URL 변경 없이 안정적인 서비스

### 6.2 자동 재시작 스크립트
```bash
# 백엔드 자동 재시작
while true; do
    ./run_backend_only.sh
    sleep 3600  # 1시간마다 재시작
done
```

### 6.3 모니터링
- ngrok 대시보드 모니터링
- Netlify 배포 상태 확인
- 로그 파일 확인

## 주의사항

1. **ngrok 무료 계정 제한**
   - 동시 터널 수 제한
   - URL 변경 가능성
   - 대역폭 제한

2. **보안 고려사항**
   - ngrok URL은 공개적으로 접근 가능
   - 민감한 데이터 처리 시 주의
   - API 키 보안 유지

3. **성능 고려사항**
   - ngrok을 통한 지연 시간
   - 음성 파일 전송 시간
   - 동시 사용자 수 제한

## 대안

### 1. Vercel + Railway
- Vercel: 프론트엔드 배포
- Railway: 백엔드 배포

### 2. Heroku + Netlify
- Heroku: 백엔드 배포
- Netlify: 프론트엔드 배포

### 3. AWS/GCP/Azure
- 클라우드 서비스 활용
- 더 안정적이고 확장 가능한 솔루션 