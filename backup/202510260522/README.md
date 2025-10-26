# 아파트 가구배치 플래너 | Apartment Furniture Planner

실제 아파트 도면을 기반으로 가구 배치를 계획하고 시각화할 수 있는 웹 애플리케이션입니다.

Plan and visualize your apartment furniture layout with interactive drag-and-drop functionality.

## 🌟 주요 기능 | Features

### 핵심 기능 | Core Features
- ✅ **가구 드래그 & 드롭** | Drag & Drop furniture items
- ✅ **실제 도면 기반** | Based on actual floor plans (112㎡/34평)
- ✅ **10cm 스냅 그리드** | 10cm snap-to-grid functionality
- ✅ **90도 회전** | 90-degree rotation
- ✅ **실행 취소/다시 실행** | Undo/Redo history
- ✅ **JPEG 내보내기** | Export as JPEG

### 추가 기능 | Additional Features
- 🎨 **색상 변경** | Color customization (20 preset colors)
- 📏 **측정 도구** | Distance measurement tool
- 💾 **배치안 저장** | Save/load multiple layouts (localStorage)
- ✏️ **사용자 정의 가구** | Create custom furniture with any dimensions
- 🔄 **가구 복사** | Duplicate furniture items
- 🌓 **라이트/다크 모드** | Light/Dark theme
- 🌐 **한/영 지원** | Korean/English bilingual support
- 📱 **반응형 디자인** | Responsive design (Desktop/Mobile/Tablet)

### 키보드 단축키 | Keyboard Shortcuts
- `Delete` - 선택한 가구 삭제 | Delete selected furniture
- `R` - 선택한 가구 회전 | Rotate selected furniture
- `Ctrl+Z` - 실행 취소 | Undo
- `Ctrl+Y` - 다시 실행 | Redo
- `Ctrl+S` - JPEG로 저장 | Save as JPEG

## 🛠️ 기술 스택 | Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Image Export**: html2canvas
- **Icons**: Lucide React
- **Theme**: next-themes
- **Deployment**: Cloudflare Pages

## 🚀 시작하기 | Getting Started

### 필수 요구사항 | Prerequisites
- Node.js 18.17 이상
- npm 또는 yarn

### 설치 | Installation

```bash
# Clone the repository
git clone https://github.com/apart/apart.git
cd apart

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 환경 변수 | Environment Variables

`.env.example`을 `.env.local`로 복사하고 필요한 값을 입력하세요:

```bash
# Google Analytics (선택사항)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Production URL
NEXT_PUBLIC_BASE_URL=https://apart.pages.dev
```

## 📦 빌드 & 배포 | Build & Deployment

### 로컬 빌드 | Local Build

```bash
npm run build
npm run start
```

### Cloudflare Pages 배포 | Deployment

1. **GitHub 저장소 연결**
   - Cloudflare Dashboard → Pages → Create a project
   - Connect to Git → 저장소 선택

2. **빌드 설정**
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Node version: `18.17.0` 이상

3. **환경 변수 설정** (선택사항)
   - Settings → Environment variables
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` 추가

4. **배포 완료!**
   - 자동으로 `https://your-project.pages.dev`에 배포됩니다
   - 커스텀 도메인 설정 가능

## 📂 프로젝트 구조 | Project Structure

```
apart/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page
│   ├── globals.css          # Global styles
│   ├── sitemap.ts           # SEO sitemap
│   ├── robots.ts            # Robots.txt
│   └── manifest.ts          # PWA manifest
├── components/
│   ├── canvas/              # Canvas components
│   │   └── FloorPlanCanvas.tsx
│   ├── ui/                  # UI components
│   │   ├── FurniturePanel.tsx
│   │   ├── FurnitureItem.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── Toolbar.tsx
│   │   ├── CustomFurnitureDialog.tsx
│   │   ├── LayoutsDialog.tsx
│   │   └── MeasurementTool.tsx
│   └── ThemeProvider.tsx
├── lib/
│   ├── stores/              # Zustand stores
│   │   ├── furniture-store.ts
│   │   └── app-store.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useTranslation.ts
│   ├── utils/               # Utility functions
│   │   ├── canvas.ts
│   │   ├── snap.ts
│   │   └── export.ts
│   ├── i18n/                # Internationalization
│   │   └── translations.ts
│   └── analytics/           # Analytics
│       └── google-analytics.tsx
├── data/                    # Data files
│   ├── furniture-templates.ts
│   └── floor-plan-112.ts
└── public/
    └── floor-plans/         # Floor plan images
        └── 112_90_1_72_GA1_1283409035154.jpg
```

## 🎯 사용 방법 | How to Use

1. **가구 추가**: 왼쪽 패널에서 가구 선택 → 자동으로 도면에 추가
2. **가구 이동**: 마우스로 드래그
3. **가구 회전**: 가구 선택 후 오른쪽 패널에서 회전 버튼 클릭 또는 `R` 키
4. **색상 변경**: 가구 선택 후 오른쪽 패널에서 색상 선택
5. **측정**: 도구 모음에서 측정 도구 활성화 → 두 점 클릭
6. **저장**: 도구 모음에서 "배치안 저장" → 이름 입력
7. **내보내기**: `Ctrl+S` 또는 도구 모음에서 "JPEG로 저장"

## 🌐 SEO & AIO 최적화 | SEO & AIO Optimization

이 프로젝트는 검색 엔진 및 AI 검색 엔진 최적화가 되어 있습니다:

- ✅ 메타 태그 (제목, 설명, 키워드)
- ✅ Sitemap.xml
- ✅ Robots.txt (ChatGPT, Claude, Perplexity 등 AI 봇 허용)
- ✅ Open Graph tags
- ✅ Structured data
- ✅ 다국어 지원 (한국어/영어)

## 📊 Google Analytics

Google Analytics를 사용하려면:

1. [Google Analytics](https://analytics.google.com/)에서 Measurement ID 발급
2. `.env.local`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 추가
3. 재빌드 및 배포

## 🤝 기여하기 | Contributing

이슈 및 PR은 언제나 환영합니다!

## 📄 라이선스 | License

MIT License

## 📧 문의 | Contact

이슈를 통해 문의해주세요.

---

Made with ❤️ for better apartment planning
