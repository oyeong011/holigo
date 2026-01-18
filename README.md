# HoliGo 🚀

워킹홀리데이 준비를 자동화하는 AI 기반 플랫폼입니다.

## ✨ 주요 기능

- 🌍 **국가/도시 선택**: 호주, 캐나다, 독일 지원
- 📝 **AI 스마트 이력서**: Gemini AI로 현지 맞춤 이력서 자동 생성
- 🛂 **비자 자동 신청**: 시뮬레이션 기반 비자 신청 프로세스
- ✈️ **항공권 매칭**: AI 기반 최저가 항공권 추천
- 🏠 **숙소 예약**: 현지 쉐어하우스 매칭
- 💼 **일자리 매칭**: AI 이력서 기반 채용 오퍼

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
VITE_APP_ID=holigo-app-v5
```

**중요**: `VITE_FIREBASE_CONFIG`는 JSON 문자열 형태로 입력해야 합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 📦 배포

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

### Vercel 배포 (권장)

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 저장소 연결
3. 환경 변수 설정
4. 배포 완료!

## 🛠️ 기술 스택

- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Firebase** - 인증 및 데이터베이스
- **Gemini AI** - AI 이력서 생성
- **Lucide React** - 아이콘

## 📝 라이선스

Private
