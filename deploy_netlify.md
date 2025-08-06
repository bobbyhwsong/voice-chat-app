# Netlify 배포 가이드

## 1. Netlify CLI 설치
```bash
npm install -g netlify-cli
```

## 2. Netlify 로그인
```bash
netlify login
```

## 3. 사이트 배포
```bash
# 현재 디렉토리에서 배포
netlify deploy --prod

# 또는 특정 폴더에서 배포
netlify deploy --prod --dir=.
```

## 4. 환경변수 설정 (Netlify 대시보드에서)
- `REACT_APP_API_BASE_URL`: 백엔드 ngrok URL

## 5. 자동 배포 설정
- GitHub 저장소와 연결
- `main` 브랜치에서 자동 배포
- 프리뷰 배포 활성화

## 6. 커스텀 도메인 설정 (선택사항)
- Netlify 대시보드에서 도메인 설정
- SSL 인증서 자동 발급 