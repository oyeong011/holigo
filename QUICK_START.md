# 🚀 Git + Vercel 빠른 배포 가이드

## 1단계: Git 초기화 및 푸시

```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: HoliGo app"

# GitHub 저장소 생성 후 URL 연결
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 2단계: Vercel 배포

1. **Vercel 접속**: https://vercel.com
2. **GitHub 로그인** (GitHub 계정으로 로그인)
3. **"Add New" → "Project"** 클릭
4. **GitHub 저장소 선택** (방금 푸시한 저장소)
5. **프로젝트 설정**:
   - Framework Preset: **Vite**
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동 감지됨)
   - Output Directory: `dist` (자동 감지됨)
6. **환경 변수 추가**:
   - `VITE_GEMINI_API_KEY` = your_gemini_api_key
   - `VITE_FIREBASE_CONFIG` = {"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
   - `VITE_APP_ID` = holigo-app-v5
7. **"Deploy"** 클릭!

## 3단계: Firebase 도메인 승인

배포 완료 후:

1. Firebase Console → Authentication → Settings
2. "Authorized domains" 섹션
3. Vercel 도메인 추가 (예: `your-app.vercel.app`)

## 완료! 🎉

이제 `https://your-app.vercel.app`에서 앱에 접속할 수 있습니다!

## 문제 해결

### Git 푸시 오류
```bash
# 원격 저장소가 이미 있으면
git remote remove origin
git remote add origin YOUR_NEW_REPO_URL
```

### Vercel 빌드 실패
- 환경 변수가 올바르게 설정되었는지 확인
- `.env` 파일은 Git에 커밋하지 않았는지 확인 (`.gitignore` 확인)
