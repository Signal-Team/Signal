# Signal - 개발 노트

---

## 브랜치 전략

**GitHub Flow** 방식으로 운영 (심플, 소규모 팀/개인 개발에 적합)

```
master (main)
  ├── feat/keyword-tracking
  ├── feat/ai-analysis
  ├── fix/auth-bug
  └── chore/setup-ci
```

### 규칙
- `master`는 항상 배포 가능한 상태 유지
- 작업 시 브랜치 생성 → 작업 → PR → merge

### 브랜치 네이밍
| 접두사 | 용도 |
|--------|------|
| `feat/` | 새 기능 |
| `fix/` | 버그 수정 |
| `chore/` | 설정, 의존성 등 |
| `refactor/` | 코드 개선 |
| `hotfix/` | 긴급 수정 |

---

## 작업 로그

### 2026-02-28

- `.claude` 폴더 Windows 숨김 처리 (`attrib +h`)
- `.vscode/settings.json` 생성 → VS Code 탐색기에서 `.claude` 폴더 숨김
- `.gitignore`에 `.claude/`, `.vscode/` 추가
- 브랜치 전략 정립 (GitHub Flow)

### 2026-03-11

#### 완료한 작업

**DB 마이그레이션 — `002_analysis_history.sql`**
- `keyword_sets` 테이블에 컬럼 3개 추가
  - `is_analyzing` (BOOLEAN) — 현재 분석 진행 중 여부, UI 로딩 상태 표시용
  - `next_analyze_at` (TIMESTAMPTZ) — 다음 자동 분석 예정 시각, Cron이 이 값으로 대상 조회
  - `last_analyzed_at` (TIMESTAMPTZ) — 마지막 분석 완료 시각, 상세 페이지 "N시간 전 분석됨" 표시용
- `keyword_analysis_history` 테이블 신규 생성
  - 분석 결과 스냅샷을 누적 저장 (keyword_sets는 덮어쓰기, 이력 테이블은 INSERT만)
  - `trigger_type` 컬럼으로 수동/자동 분석 구분 (`'manual'` | `'scheduled'`)
  - RLS 적용 — SELECT, INSERT만 허용 (이력은 불변 데이터로 관리)

**`/api/ai/analyze` 수정**
- Claude 분석 완료 후 `keyword_analysis_history` 에도 동시에 INSERT 추가
- `keyword_sets.last_analyzed_at`, `next_analyze_at`, `is_analyzing` 갱신 로직 추가
- `update_frequency`('6h'/'12h'/'24h')를 시간 단위로 변환하는 `freqToHours` 헬퍼 추가
- `trigger_type` 파라미터 추가 (기본값 `'manual'`) — 향후 Edge Function에서 `'scheduled'`로 호출

#### 다음 작업 (2주차 계속)

- [ ] **2단계** — Supabase Edge Function `auto-analyze` 작성
  - `next_analyze_at <= now()` 조건으로 분석 대상 조회
  - 각 세트에 대해 `/api/ai/analyze` 호출 (trigger_type: 'scheduled')
  - Supabase Cron으로 주기적 트리거 설정
- [ ] **3단계** — 상세 페이지 UI 업데이트
  - `last_analyzed_at` → "3시간 전 분석됨" 형식으로 표시
  - 분석 이력 목록 섹션 추가 (최근 5개)
