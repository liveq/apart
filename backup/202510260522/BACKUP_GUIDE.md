# 이중백업 시스템 가이드

## 개요
이 프로젝트는 **이중백업 시스템**을 사용하여 코드를 안전하게 보관합니다.

## 백업 방식

### 1. Git 백업 (원격)
- **목적**: 버전 관리, 변경 이력 추적, 협업
- **위치**: GitHub 원격 저장소
- **명령어**:
  ```bash
  git add .
  git commit -m "커밋 메시지"
  git push
  ```

### 2. 로컬 하드 백업
- **목적**: Git 문제 발생 시 즉시 복구, 타임스탬프 기반 스냅샷
- **위치**: `backup/` 폴더
- **형식**: `년월일시분` (예: `202510260830` = 2025년 10월 26일 08시 30분)

## 로컬 백업 구조

```
apart/
├── backup/
│   ├── 202510192330/     # 2025-10-19 23:30 백업
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ... (순수 소스코드만)
│   ├── 202510240400/     # 2025-10-24 04:00 백업
│   └── ...
├── app/
├── components/
├── lib/
└── ...
```

## 백업 대상

### ✅ 포함되는 파일/폴더
- `app/` - Next.js 앱 라우터
- `components/` - React 컴포넌트
- `lib/` - 유틸리티, 스토어, 훅
- `data/` - 정적 데이터
- `public/` - 정적 리소스 (이미지 제외)
- 설정 파일: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts` 등

### ❌ 제외되는 파일/폴더
- `node_modules/` - npm 패키지 (용량 큼, 재설치 가능)
- `.next/` - 빌드 출력 (재생성 가능)
- `.git/` - Git 내부 파일 (별도 관리)
- `backup/` - 백업 폴더 자체 (중복 방지)
- 대용량 이미지/바이너리 파일

## 백업 명령어

### 로컬 백업 생성
```bash
# 현재 시간으로 백업 폴더 생성
TIMESTAMP=$(date +%Y%m%d%H%M)
mkdir -p backup/$TIMESTAMP

# 소스 코드 복사 (node_modules, .next 제외)
cp -r app components lib data public backup/$TIMESTAMP/
cp package.json tsconfig.json next.config.ts tailwind.config.ts backup/$TIMESTAMP/
```

### Git 백업
```bash
# 변경사항 확인
git status

# 모든 변경사항 스테이징
git add .

# 커밋 (의미있는 메시지 작성)
git commit -m "feat: 새로운 기능 추가"

# 원격 저장소에 푸시
git push
```

## 복구 방법

### Git에서 복구
```bash
# 특정 커밋으로 되돌리기
git log                    # 커밋 이력 확인
git checkout [커밋해시]    # 특정 커밋으로 이동
git revert [커밋해시]      # 특정 커밋 되돌리기
```

### 로컬 백업에서 복구
```bash
# 백업 폴더 목록 확인
ls backup/

# 특정 백업에서 복구
cp -r backup/202510240400/* .

# npm 패키지 재설치
npm install
```

## 백업 주기 권장사항

| 상황 | 백업 시점 |
|------|----------|
| 새로운 기능 완성 | 즉시 백업 |
| 주요 버그 수정 | 즉시 백업 |
| 리팩토링 완료 | 즉시 백업 |
| 작업 세션 종료 | 백업 권장 |
| 큰 변경 전 | 반드시 백업 |

## 주의사항

1. **로컬 백업은 스냅샷**: 전체 코드를 복사하므로 용량 주의
2. **Git은 증분 저장**: 변경사항만 저장하여 효율적
3. **의미있는 커밋 메시지**: 나중에 찾기 쉽게
4. **백업 폴더 정리**: 오래된 백업은 주기적으로 삭제
5. **중요한 작업 전 반드시 백업**: 복구 불가능한 상황 방지

## 문제 해결

### Git push 실패 시
```bash
git pull --rebase  # 원격 변경사항 가져오기
git push           # 다시 푸시
```

### 로컬 백업 자동화
백업 스크립트를 만들어 자동화 가능:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d%H%M)
echo "백업 시작: $TIMESTAMP"
mkdir -p backup/$TIMESTAMP
cp -r app components lib data public backup/$TIMESTAMP/
cp *.json *.ts *.js backup/$TIMESTAMP/ 2>/dev/null
echo "백업 완료: backup/$TIMESTAMP"
```

## 백업 이력

최근 백업:
- `202510240400` - 2025-10-24 04:00
- `202510240232` - 2025-10-24 02:32
- `202510231301` - 2025-10-23 13:01
- `202510220831` - 2025-10-22 08:31
- `202510220400` - 2025-10-22 04:00

---

**마지막 업데이트**: 2025-10-26
**작성자**: Claude Code
