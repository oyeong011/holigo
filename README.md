# Threads Reader

@choi.openai Threads 포스트를 RSS 피드를 통해 편리하게 볼 수 있는 웹 애플리케이션입니다.

## 기능

- 🔍 **검색**: 제목/내용으로 포스트 검색
- 📅 **필터**: 최근 7일/30일/1년 필터링
- ⌨️ **키보드 단축키**: 빠른 네비게이션
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- 🎨 **다크 테마**: 눈에 편안한 다크 UI
- ♾️ **무한 스크롤**: 페이지네이션 지원

## 키보드 단축키

- `/` - 검색창 포커스
- `j` / `k` - 다음/이전 포스트로 이동
- `Enter` - 현재 포스트 열기
- `g` - 맨 위로 스크롤
- `Shift+g` - 맨 아래로 스크롤
- `Esc` - 검색창 포커스 해제

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 RSS 피드 URL을 설정하세요:

```env
PORT=3000
RSS_URL=https://YOUR_RSS_FEED_URL_HERE
```

**RSS 피드 URL 얻는 방법:**

1. [RSS.app](https://rss.app) 같은 서비스를 사용하여 Threads 프로필(`https://www.threads.com/@choi.openai?hl=ko`) 기반 RSS 피드를 생성
2. 생성된 RSS URL을 `.env` 파일의 `RSS_URL`에 입력

### 3. 서버 실행

```bash
npm run dev
```

또는

```bash
npm start
```

### 4. 브라우저에서 접속

```
http://localhost:3000
```

## 프로젝트 구조

```
threads-reader/
├── server.js          # Express 서버 (RSS → JSON 변환)
├── package.json       # 프로젝트 설정 및 의존성
├── .env              # 환경 변수 (직접 생성 필요)
└── public/           # 정적 파일
    ├── index.html    # 메인 HTML
    ├── app.js        # 프론트엔드 JavaScript
    └── style.css     # 스타일시트
```

## 사용 방법

1. RSS 피드 URL을 `.env`에 설정
2. 서버 실행 (`npm run dev`)
3. 브라우저에서 `http://localhost:3000` 접속
4. 검색창에 키워드 입력하여 포스트 검색
5. 날짜 필터로 특정 기간 포스트만 보기
6. 키보드 단축키로 빠르게 탐색

## 참고사항

- Threads는 공식 RSS 피드를 제공하지 않으므로, RSS.app 같은 서비스를 통해 피드를 생성해야 합니다
- RSS 피드가 업데이트되지 않으면 최신 포스트가 표시되지 않을 수 있습니다
- 브라우저 팝업 차단 설정에 따라 "링크 일괄 열기" 기능이 제한될 수 있습니다


## HoliGo(홀리고) 앱 배포 가이드

제작된 리액트 코드를 실제 인터넷 주소로 배포하여 누구나 접속할 수 있게 만드는 방법입니다.

### 1. 사전 준비 작업

배포 전 코드에서 다음 사항을 확인하세요.

- Gemini API 키: 코드 내 `apiKey`는 환경 변수(`VITE_GEMINI_API_KEY`)로 주입됩니다.
- 환경 변수: 현재 코드의 `__firebase_config` 등은 시스템에서 제공하는 변수입니다. 실제 배포 시에는 이를 직접 객체 형태로 입력하거나 환경 변수로 설정해야 합니다.

#### 로컬 실행을 위한 환경 변수 예시(Vite 기준)

```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
VITE_APP_ID=holigo-app-v5
```

`env.sample` 파일로도 제공하니 복사하여 `.env`로 사용하세요.

### 2. 배포 방법 (가장 권장하는 방식: Vercel)

Vercel은 리액트 앱 배포에 가장 최적화된 서비스입니다.

#### 단계 1: GitHub에 코드 올리기

- GitHub 계정을 만들고 새로운 저장소(Repository)를 생성합니다.
- 현재의 `wh_hub.jsx` 코드를 포함한 리액트 프로젝트 파일을 업로드합니다.
- (로컬 환경이라면 `npx create-react-app holigo` 명령어로 프로젝트를 만든 뒤 코드를 복사하세요.)

#### 단계 2: Vercel 연결

- Vercel에 가입하고 `Add New` -> `Project`를 선택합니다.
- 방금 만든 GitHub 저장소를 연결(Import)합니다.

#### 단계 3: 환경 변수 설정 (중요)

배포 설정 화면의 `Environment Variables` 항목에 다음 내용을 입력해야 합니다.

- 변수 이름: `REACT_APP_FIREBASE_CONFIG`
- 값: 파이어베이스 콘솔에서 받은 설정 JSON 문자열

#### 단계 4: 배포 실행

`Deploy` 버튼을 누르면 약 1~2분 안에 고유한 URL(예: `holigo.vercel.app`)이 생성됩니다.

### 3. 파이어베이스 호스팅(Firebase Hosting) 이용하기

이미 파이어베이스를 사용 중이므로 호스팅 기능을 함께 쓰면 관리가 편합니다.

1. 터미널에서 `npm install -g firebase-tools`를 설치합니다.
2. `firebase login`으로 로그인합니다.
3. `.firebaserc`의 `YOUR_FIREBASE_PROJECT_ID`를 실제 프로젝트 ID로 변경합니다.
4. `npm run build`로 빌드 파일을 만든 뒤 `firebase deploy`를 입력하면 배포가 완료됩니다.

> 참고: 현재 `firebase.json`은 Vite 기본 빌드 결과물(`dist`) 기준으로 설정되어 있습니다.

### 4. 보안 주의사항

- 도메인 승인: 파이어베이스 콘솔 -> 인증(Authentication) -> 설정 -> 승인된 도메인 리스트에 배포된 사이트 주소(예: `vercel.app` 주소)를 반드시 추가해야 로그인이 정상 작동합니다.
- API 키 노출: 깃허브에 코드를 올릴 때 API 키가 코드에 직접 노출되지 않도록 환경 변수(`.env` 파일)를 사용하는 것이 안전합니다.


