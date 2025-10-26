# Cloudflare Pages 배포 가이드 | Deployment Guide

## Cloudflare Pages 배포하기

### 1. GitHub 저장소 준비

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Apartment Furniture Planner"

# GitHub에 저장소 생성 후 연결
git remote add origin https://github.com/YOUR_USERNAME/apart.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Pages 설정

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/ 로그인
   - Pages → Create a project 클릭

2. **Git 연결**
   - "Connect to Git" 선택
   - GitHub 계정 연결
   - 저장소 선택: `apart`

3. **빌드 설정**
   ```
   Project name: apart (또는 원하는 이름)
   Production branch: main
   Framework preset: Next.js (Static HTML Export)
   Build command: npm run build
   Build output directory: .next
   ```

4. **환경 변수 추가** (선택사항)
   - Settings → Environment variables
   - 변수 추가:
     ```
     NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
     NEXT_PUBLIC_BASE_URL=https://apart.pages.dev
     ```

5. **Deploy** 클릭!

### 3. 배포 완료

- 자동으로 빌드 및 배포 시작
- 3-5분 후 `https://apart.pages.dev` (또는 설정한 이름)에서 확인 가능
- 이후 `main` 브랜치에 push하면 자동으로 재배포됨

### 4. 커스텀 도메인 설정 (선택사항)

1. Cloudflare Pages → 프로젝트 선택
2. Custom domains → Set up a custom domain
3. 도메인 입력 (예: apart.yourdomain.com)
4. DNS 레코드 자동 생성됨
5. HTTPS 자동 적용

## Next.js Static Export 설정

Cloudflare Pages는 Next.js SSG (Static Site Generation)를 지원합니다.

`next.config.js` (또는 `next.config.mjs`) 파일 확인:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static HTML Export
  images: {
    unoptimized: true, // Cloudflare Pages용
  },
};

export default nextConfig;
```

## 빌드 테스트

로컬에서 프로덕션 빌드 테스트:

```bash
# 빌드
npm run build

# 로컬에서 확인
npm run start
```

## 자동 배포 워크플로우

```
코드 수정 → Git commit → Git push → Cloudflare Pages 자동 빌드 → 배포 완료!
```

매번 자동으로 배포되므로 별도 작업 불필요합니다.

## Google Analytics 설정

1. [Google Analytics](https://analytics.google.com/) 접속
2. 계정 만들기 → 속성 만들기
3. Measurement ID 복사 (G-XXXXXXXXXX 형식)
4. Cloudflare Pages → Settings → Environment variables에 추가:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
5. 재배포 (또는 자동 배포 대기)

## 문제 해결 | Troubleshooting

### 빌드 실패

**증상**: Cloudflare Pages에서 빌드 실패
**해결책**:
1. 로컬에서 `npm run build` 테스트
2. Node 버전 확인 (18.17.0 이상 권장)
3. Cloudflare Pages → Settings → Build configurations → Node version 변경

### 이미지 로딩 안 됨

**증상**: 도면 이미지가 표시되지 않음
**해결책**:
1. `next.config.js`에 `images.unoptimized: true` 설정 확인
2. 이미지 파일이 `public/` 폴더에 있는지 확인
3. 이미지 경로가 `/floor-plans/...` 형식인지 확인

### 환경 변수 적용 안 됨

**증상**: Google Analytics가 작동하지 않음
**해결책**:
1. Cloudflare Pages → Settings → Environment variables 확인
2. `NEXT_PUBLIC_` 접두사가 있는지 확인
3. 재배포 (환경 변수 변경 후 재빌드 필요)

## 성능 최적화

Cloudflare Pages는 자동으로:
- ✅ 전 세계 CDN 배포
- ✅ HTTP/3 지원
- ✅ Brotli 압축
- ✅ 무제한 대역폭 (무료 플랜도!)
- ✅ HTTPS 자동 적용

추가 최적화 불필요합니다!

## 비용

- **무료 플랜**:
  - 무제한 사이트
  - 무제한 트래픽
  - 500 빌드/월
  - 상업적 사용 가능 ✅

- **Pro 플랜**: $20/월 (대부분 불필요)

## 도움말

- Cloudflare Pages 문서: https://developers.cloudflare.com/pages/
- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- 문제 발생 시: GitHub Issues에 문의

---

Happy Deploying! 🚀
