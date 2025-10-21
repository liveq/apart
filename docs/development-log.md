# 아파트 가구배치 플래너 개발 기록

## 프로젝트 개요
- **프로젝트명**: Apartment Furniture Planner (아파트 가구배치 플래너)
- **기술스택**: Next.js 15.5.6, React, TypeScript, Zustand, TailwindCSS
- **배포**: Cloudflare Pages
- **저장소**: https://github.com/liveq/apart

## 주요 기능 구현

### 1. 회전된 가구 리사이즈 기능 (2025-10-20)

#### 문제
- 가구를 90°, 180°, 270° 회전한 후 리사이즈 핸들을 드래그하면 원하는 방향으로 크기가 조절되지 않음
- 마우스 드래그 방향과 실제 크기 변화 방향이 일치하지 않음
- 리사이즈 시 반대편이 고정되지 않고 양쪽이 늘어나는 현상

#### 시도한 방법들
1. **복잡한 회전 행렬 변환** - 실패
2. **Inverse rotation transformation** - 부분 성공, 위치 이동 문제
3. **명시적 90도 각도별 케이스 처리** - 너무 복잡
4. **Handle remapping** - 위치 이동 문제 지속
5. **transformOrigin 변경** ('center' ↔ '0 0') - 각각 장단점

#### 최종 해결 (World Coordinate Anchor 방식)
```typescript
// 핵심 개념:
// 1. 반대편 고정점(anchor)을 월드 좌표계에서 계산
// 2. 리사이즈 중에도 해당 고정점의 월드 좌표 유지
// 3. 새로운 크기로 중심점 재계산

// 역회전으로 마우스 델타를 논리 좌표계로 변환
const logicalDeltaX = deltaX * cos + deltaY * sin;
const logicalDeltaY = -deltaX * sin + deltaY * cos;

// 고정점을 월드 좌표로 변환
const anchorWorldX = centerX + (anchorLogicalX * cos_r - anchorLogicalY * sin_r);
const anchorWorldY = centerY + (anchorLogicalX * sin_r + anchorLogicalY * cos_r);

// 크기 변경 후 고정점 위치 유지하도록 새 중심 계산
const newCenterX = anchorWorldX - (newAnchorLogicalX * cos_r - newAnchorLogicalY * sin_r);
const newCenterY = anchorWorldY - (newAnchorLogicalX * sin_r + newAnchorLogicalY * cos_r);
```

**파일**: `components/ui/FurnitureItem.tsx:246-326`

#### 부가 기능
- **커서 스타일 자동 회전**: 회전 각도에 맞춰 리사이즈 커서(`ew-resize`, `ns-resize` 등) 자동 변경
- **성능 최적화**: `useRef`로 rotation 값 저장하여 무한 렌더링 방지

---

### 2. 가구 검색 기능 (2025-10-20)

#### 기능
- 가구 이름으로 검색
- **한글 초성 검색** 지원 (예: "ㅋㅊㄷ" → "킹침대")
- 카테고리 이름으로도 검색 가능

#### 구현
```typescript
// 초성 추출
const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const getChosung = (char: string) => {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return char;
  return CHOSUNG[Math.floor(code / 588)];
};
```

**파일**: `components/ui/FurniturePanel.tsx:107-149`

---

### 3. 가구 이름 편집 기능 (2025-10-20)

#### 기능
- 배치된 가구의 이름을 사용자가 직접 편집 가능
- `customName` 필드로 저장
- 빈 문자열 입력 시 기본 이름으로 복원

#### 구현
- **Zustand Store**: `customName?: string` 필드 추가
- **PropertiesPanel**: 입력 필드로 이름 편집
- **FurnitureItem**: 라벨 표시 시 `customName || name[language]` 사용

**파일**:
- `lib/stores/furniture-store.ts:11`
- `components/ui/PropertiesPanel.tsx:52-56`
- `components/ui/FurnitureItem.tsx:597`

---

### 4. 가구 추가

#### 에어드레서 (Air Dresser)
```typescript
{
  id: 'air-dresser',
  name: { ko: '에어드레서', en: 'Air Dresser' },
  width: 445,    // mm
  depth: 585,
  height: 1850,
  color: '#B0B0B0',
  category: 'appliance',
}
```

**파일**: `data/furniture-templates.ts:248-256`

---

### 5. UI/UX 개선

#### 토스트 메시지 표시 시간 연장
- 변경: 3초 → 5초
- 이유: 사용자가 메시지를 읽기 충분한 시간 제공
- **파일**: `app/layout.tsx:50`

#### 번역 추가
- `search`: '검색' / 'Search'
- `fuzzySearchSupported`: '초성 검색 가능' / 'Fuzzy search supported'
- `defaultName`: '기본 이름' / 'Default Name'
- **파일**: `lib/i18n/translations.ts:132-134, 266-268`

---

## 발생한 주요 버그와 해결

### 1. `target.closest is not a function`
**원인**: `relatedTarget`이 HTMLElement가 아닐 수 있음
**해결**: `instanceof HTMLElement` 체크 추가
```typescript
if (target && target instanceof HTMLElement && target.closest('[data-delete-button]')) {
  return;
}
```

### 2. 무한 렌더링 / 끊김 현상
**원인**: `useEffect` dependency에 `item.rotation` 포함
**해결**: `useRef`로 rotation 값 저장
```typescript
const rotationRef = useRef(item.rotation);
rotationRef.current = item.rotation;
```

### 3. 파비콘이 localhost에서 안 보임
**원인**: `.next` 빌드 캐시 문제
**해결**:
```bash
rm -rf .next
npm run dev  # 재시작
```

---

## 개발 환경 설정

### 기술 스택
- **프레임워크**: Next.js 15.5.6 (App Router)
- **언어**: TypeScript
- **상태관리**: Zustand (devtools middleware)
- **스타일**: TailwindCSS + CSS-in-JS
- **폰트**: Geist Sans, Geist Mono
- **분석**: Google Analytics
- **알림**: react-hot-toast

### 프로젝트 구조
```
apart/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout, metadata
│   └── page.tsx           # Main page
├── components/
│   ├── ui/
│   │   ├── FurnitureItem.tsx      # 가구 렌더링 & 상호작용
│   │   ├── FurniturePanel.tsx     # 가구 목록 & 추가
│   │   └── PropertiesPanel.tsx    # 선택된 가구 속성 편집
│   └── layouts/
├── data/
│   └── furniture-templates.ts     # 가구 템플릿 정의
├── lib/
│   ├── stores/
│   │   ├── furniture-store.ts     # 가구 상태 관리
│   │   └── app-store.ts           # 앱 전역 상태
│   ├── i18n/
│   │   └── translations.ts        # 다국어 번역
│   └── hooks/
│       └── useTranslation.ts      # 번역 훅
└── docs/
    └── development-log.md         # 이 문서
```

---

## 배포 및 백업 전략

### Git 버전 관리
```bash
# 로컬 커밋
git add -A
git commit -m "메시지"

# 원격 푸시 (배포 트리거)
git push
```

### 이중 백업 전략
1. **Git 로컬 커밋**: 버전 히스토리 관리
2. **백업 폴더 복사**: `backup/YYYYMMDDHHmm/` 형식으로 스냅샷

### 자동 배포
- GitHub push → Cloudflare Pages 자동 빌드 & 배포
- 빌드 명령: `npm run build`
- 출력 디렉토리: `.next`

---

## 향후 개선 예정

### 1. 배율 적용 경고 토스트 개선
**현재 문제**:
- 토스트가 0.1초만에 사라짐
- 사용자가 메시지를 읽을 시간 부족

**개선 방향**:
- 토스트 지속 시간 증가
- 빈 공간 클릭 시 수동으로 닫을 수 있도록 개선
- ID 기반 중복 방지 강화

### 2. 가능한 추가 기능
- 가구 그룹화 기능
- 레이어 관리
- 3D 뷰 추가
- 실제 사진에 AR 오버레이

---

## 학습한 핵심 개념

### 1. 회전 변환 (Rotation Transformation)
- **순회전**: `(x', y') = (x*cos - y*sin, x*sin + y*cos)`
- **역회전**: `(x, y) = (x'*cos + y'*sin, -x'*sin + y'*cos)`
- **월드 좌표계 vs 로컬 좌표계**

### 2. CSS Transform Origin
- `transform-origin: center`: 중심 기준 회전 (자연스러움)
- `transform-origin: 0 0`: 좌상단 기준 회전 (계산 단순)

### 3. React Performance
- `useRef`: 렌더링 없이 값 저장
- `useEffect` dependency 최소화

### 4. 한글 처리
- 유니코드 범위: `0xAC00` ~ `0xD7A3`
- 초성 추출: `Math.floor((code - 0xAC00) / 588)`

---

## 참고 자료
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

---

**마지막 업데이트**: 2025-10-20
**커밋**: `8b3b8c5` - feat: 가구 회전 리사이즈 수정 및 검색/이름편집 기능 추가
