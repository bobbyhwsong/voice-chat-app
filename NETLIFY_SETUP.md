# Netlify에서 ngrok URL 설정 가이드

## 문제점
Netlify는 인터넷에서 실행되므로 로컬 서버(`localhost:5001`)에 접근할 수 없습니다.

## 해결 방법

### 방법 1: Netlify 환경변수 설정 (권장)

1. **Netlify 대시보드 접속**
   - https://app.netlify.com 에서 프로젝트 선택

2. **환경변수 설정**
   - Site settings → Environment variables
   - 새 환경변수 추가:
     - Key: `REACT_APP_API_BASE_URL`
     - Value: `https://your-ngrok-url.ngrok-free.app`

3. **배포 재시작**
   - Deploys → Trigger deploy → Deploy site

### 방법 2: URL 파라미터 사용

```
https://your-netlify-app.netlify.app/chat.html?backend=https://your-ngrok-url.ngrok-free.app
```

### 방법 3: 브라우저 콘솔에서 설정

개발자 도구 콘솔에서:
```javascript
window.API_BASE_URL = "https://your-ngrok-url.ngrok-free.app";
location.reload();
```

## 현재 ngrok URL 확인

터미널에서:
```bash
curl -s http://localhost:5001/api/ngrok-url
```

## 자동화 스크립트

ngrok URL이 변경될 때마다 Netlify 환경변수를 자동으로 업데이트하는 스크립트:

```bash
#!/bin/bash
# ngrok URL을 Netlify 환경변수로 업데이트

# 현재 ngrok URL 가져오기
NGROK_URL=$(curl -s http://localhost:5001/api/ngrok-url | grep -o '"ngrok_url":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$NGROK_URL" ]; then
    echo "현재 ngrok URL: $NGROK_URL"
    echo "Netlify 환경변수를 업데이트하세요:"
    echo "REACT_APP_API_BASE_URL=$NGROK_URL"
else
    echo "ngrok URL을 가져올 수 없습니다."
fi
```

## 테스트

설정 후 다음 URL로 테스트:
```
https://your-netlify-app.netlify.app/chat.html
```

## 주의사항

- ngrok URL은 재시작 시마다 변경됩니다
- 무료 ngrok 계정은 세션 시간이 제한됩니다
- 프로덕션 환경에서는 고정 도메인 사용을 권장합니다
