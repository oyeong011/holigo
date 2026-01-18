# HoliGo 배포 가이드

`wh_hub.jsx` (HoliGo 앱)를 배포하는 방법입니다.

## 🚀 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
VITE_APP_ID=holigo-app-v5
```

**중요**: `VITE_FIREBASE_CONFIG`는 JSON 문자열 형태로 입력해야 합니다. 예시:

```env
VITE_FIREBASE_CONFIG={"apiKey":"AIzaSy...","authDomain":"your-project.firebaseapp.com","projectId":"your-project","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abc123"}
```

### 2. 로컬 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 📦 배포 방법

### 방법 1: Vercel (권장)

1. **GitHub에 코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Vercel 연결**
   - [Vercel](https://vercel.com)에 가입/로그인
   - "Add New" → "Project" 선택
   - GitHub 저장소 연결

3. **환경 변수 설정**
   - Vercel 대시보드 → 프로젝트 설정 → Environment Variables
   - 다음 변수 추가:
     - `VITE_GEMINI_API_KEY`
     - `VITE_FIREBASE_CONFIG`
     - `VITE_APP_ID`

4. **배포**
   - "Deploy" 버튼 클릭
   - 약 1-2분 후 배포 완료
   - 고유 URL 생성 (예: `holigo.vercel.app`)

### 방법 2: Firebase Hosting

1. **Firebase CLI 설치**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase 로그인**
   ```bash
   firebase login
   ```

3. **프로젝트 초기화** (이미 `firebase.json`이 있으면 생략)
   ```bash
   firebase init hosting
   ```
   - Public directory: `dist`
   - Single-page app: Yes

4. **빌드 및 배포**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### 방법 3: Netlify

1. **GitHub에 코드 푸시** (Vercel과 동일)

2. **Netlify 연결**
   - [Netlify](https://netlify.com)에 가입/로그인
   - "Add new site" → "Import an existing project"
   - GitHub 저장소 선택

3. **빌드 설정**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **환경 변수 설정**
   - Site settings → Environment variables
   - 필요한 변수 추가

5. **배포**
   - "Deploy site" 클릭

## 🔐 보안 설정

### Firebase 인증 도메인 추가

배포 후 Firebase 콘솔에서 승인된 도메인을 추가해야 합니다:

1. Firebase Console → Authentication → Settings
2. "Authorized domains" 섹션
3. 배포된 도메인 추가 (예: `holigo.vercel.app`)

### 환경 변수 보안

- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인
- 배포 플랫폼의 환경 변수 설정 사용

## 🐛 문제 해결

### Firebase 초기화 오류

```
Firebase configuration is required
```

**해결**: `.env` 파일에 `VITE_FIREBASE_CONFIG`가 올바르게 설정되었는지 확인하세요.

### CORS 오류

Firebase 콘솔에서 승인된 도메인을 추가했는지 확인하세요.

### 빌드 실패

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 체크리스트

배포 전 확인사항:

- [ ] `.env` 파일에 모든 환경 변수 설정 완료
- [ ] 로컬에서 `npm run dev` 정상 작동 확인
- [ ] `npm run build` 성공 확인
- [ ] Firebase 콘솔에서 승인된 도메인 추가
- [ ] 배포 플랫폼에 환경 변수 설정 완료
- [ ] 배포 후 앱 정상 작동 확인

## 🎉 완료!

배포가 완료되면 누구나 인터넷을 통해 HoliGo 앱에 접속할 수 있습니다!
