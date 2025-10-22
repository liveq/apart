# 백업 202510220400 (2025-10-22 04:00)

## 주요 변경사항

### 1. 펜 툴 Ctrl 모드 개선
- ✅ Ctrl 떼면 자동으로 path 생성 및 완료
- ✅ 각도 스냅 15도 → 5도로 변경 (더 정밀)
- ✅ 기존 점에 가까워지면 녹색 스냅 마커 표시
- ✅ 스냅 마커 클릭 시 정확히 그 점으로 연결 (삼각형/사각형 닫기)

### 2. 텍스트 입력 개선
- ✅ 다른 영역 클릭 시 자동 저장 (onBlur 추가)
- ✅ Enter 키로 저장
- ✅ Esc 키로 취소
- ✅ autoFocus race condition 해결 (setTimeout 사용)

### 3. 디버그 로그 제거
- ✅ 모든 console.log 제거 (13개)
- ✅ 브라우저 콘솔 폭주 문제 해결
- ✅ 무한 렌더링 루프 방지

### 4. SEO & 메타데이터 대폭 강화
#### 메타데이터 (app/layout.tsx)
- ✅ Title: "아파트 가구배치 & 평면도 그리기 플래너"
- ✅ Description: 주요 기능 포함한 상세 설명
- ✅ Keywords: 40+ 키워드 추가
  - 한국어: 가구배치, 평면도, 도면 그리기, 거리 측정, 치수 측정 등
  - 영어: furniture planner, floor plan, drawing tool, measurement 등
- ✅ Open Graph: 카카오톡, 페이스북 공유 미리보기
- ✅ Twitter Card: 트위터 공유 최적화
- ✅ Robots: 검색엔진 크롤링 최적화

#### 구조화된 데이터 (JSON-LD)
- ✅ WebApplication 스키마 추가
- ✅ 주요 기능 10개 명시
- ✅ 무료 앱 표시 (price: 0)
- ✅ 다국어 지원 (ko, en)

#### robots.txt (app/robots.ts)
- ✅ 도메인: apart.liveq.kr
- ✅ AI 크롤러 허용 (GPT, Claude, Perplexity 등)
- ✅ 백업/테스트 폴더 제외

#### sitemap.xml (app/sitemap.ts)
- ✅ 도메인: apart.liveq.kr
- ✅ 업데이트 빈도: weekly
- ✅ 다국어 설정

#### PWA Manifest (app/manifest.ts)
- ✅ 앱 이름: "아파트 가구배치 & 평면도 그리기 플래너"
- ✅ 카테고리: productivity, design, utilities
- ✅ 아이콘: maskable 지원
- ✅ Screenshots 추가

## 파일 변경 목록

### 수정된 파일
- `app/layout.tsx` - SEO 메타데이터 대폭 강화, JSON-LD 추가
- `app/manifest.ts` - PWA manifest 개선
- `app/robots.ts` - 도메인 및 disallow 규칙 업데이트
- `app/sitemap.ts` - 도메인 및 빈도 업데이트
- `components/canvas/DrawingLayer.tsx` - 펜 툴 개선, 텍스트 입력 개선, 디버그 로그 제거

### 백업 크기
- 총 용량: ~677KB
- app: 53KB
- components: 329KB
- lib: 74KB
- 기타 설정 파일: ~221KB

## 다음 배포 시 확인사항
- [ ] SEO 메타 태그가 정상적으로 렌더링되는지 확인
- [ ] Open Graph 이미지가 소셜 미디어에서 제대로 표시되는지 확인
- [ ] 구글 Search Console에서 sitemap 제출
- [ ] 펜 툴 Ctrl 모드 동작 확인
- [ ] 텍스트 입력 onBlur 동작 확인
