# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**election_alarm** - 선거 알림 및 알림 기능을 위한 풀스택 애플리케이션

이 프로젝트는 AI 네이티브 개발을 위한 **bkit 프레임워크**와 **PDCA (Plan-Do-Check-Act)** 방법론을 사용합니다. 프로젝트는 **Dynamic 레벨**로 설정되어 있으며, 이는 다음을 의미합니다:
- 프론트엔드와 백엔드가 포함된 풀스택 아키텍처
- bkend.ai BaaS 플랫폼을 사용한 인증, 데이터베이스, API 통합
- 사용자 로그인, 데이터 저장, 실시간 기능이 필요한 애플리케이션에 적합

## 개발 방법론

### PDCA 워크플로우
이 프로젝트는 구조화된 4단계 PDCA 사이클을 따릅니다:

1. **Plan** (`/pdca plan`) - 기능 사양과 요구사항 작성
2. **Design** (`/pdca design`) - 아키텍처 및 API 사양 설계
3. **Do** (`/pdca do`) - 설계 문서에 따른 기능 구현
4. **Check** (`/pdca analyze`) - 설계와 구현 간의 갭 분석

갭 분석 후:
- **일치율 < 90%**: `/pdca iterate`로 자동 개선
- **일치율 ≥ 90%**: `/pdca report`로 완료 보고서 생성

### 개발 파이프라인
프로젝트는 9단계 파이프라인을 따릅니다 (현재 1단계):
1. 스키마 (Phase 1) - 용어 정의 및 데이터 구조 정의
2. 컨벤션 (Phase 2) - 코딩 표준 수립
3. 목업 (Phase 3) - UI/UX 프로토타입 생성
4. API (Phase 4) - 백엔드 API 설계 및 구현
5. 디자인 시스템 (Phase 5) - 컴포넌트 라이브러리 구축
6. UI 통합 (Phase 6) - 프론트엔드 구현 및 API 연결
7. SEO & 보안 (Phase 7) - 검색 최적화 및 보안 강화
8. 리뷰 (Phase 8) - 품질 검증 및 갭 분석
9. 배포 (Phase 9) - 프로덕션 배포

## 필수 명령어

### PDCA 관리
- `/pdca plan {기능}` - 기능 계획 단계 시작
- `/pdca design {기능}` - 설계 문서 작성
- `/pdca do {기능}` - 구현 시작
- `/pdca analyze {기능}` - 갭 분석 실행
- `/pdca iterate {기능}` - 갭 기반 자동 개선
- `/pdca report {기능}` - 완료 보고서 생성
- `/pdca status` - 현재 PDCA 상태 확인
- `/pdca next` - 다음 작업 추천 받기

### 프로젝트 명령어
- `/development-pipeline` - 9단계 개발 파이프라인 가이드 확인
- `/dynamic` - Dynamic 레벨 (풀스택) 개발 가이드
- `/starter` - 정적 사이트 기능 (필요시)
- `/zero-script-qa` - 테스트 스크립트 없는 테스트 방법론

### 에이전트 협업
- **bkend-expert** - 백엔드/BaaS 플랫폼 전문가 (인증, 데이터베이스, API)
- **frontend-architect** - 프론트엔드 아키텍처 및 컴포넌트 설계
- **gap-detector** - 설계와 구현 간의 갭 분석
- **pdca-iterator** - 자동 개선 사이클

## 프로젝트 현황

- **현재 단계**: Phase 1 - 스키마 정의
- **레벨**: Dynamic (풀스택)
- **BaaS 플랫폼**: bkend.ai
- **활성 기능**: 없음 (신규 프로젝트)

## 개발 워크플로우

새로운 기능 시작 시:
1. 항상 `/pdca plan {기능이름}`으로 사양 작성부터 시작
2. `/pdca design {기능이름}`으로 아키텍처 및 API 설계
3. `/pdca do {기능이름}`으로 구현
4. `/pdca analyze {기능이름}`으로 갭 분석 실행
5. 갭 < 90%인 경우 `/pdca iterate {기능이름}`으로 자동 개선
6. 갭 ≥ 90%인 경우 `/pdca report {기능이름}`으로 완료 보고

## 코드 품질 표준

- 모든 코드 변경은 관련 PDCA 문서를 참조해야 함
- 기능 완료 전 갭 분석이 필수
- Zero Script QA 방법론은 테스트 스크립트 대신 Docker 로그 모니터링 사용
- `docs/02-design/`의 설계 문서는 구현과 일치해야 함
- 90% 이상 일치율 달성 시까지 자반복 개선 진행

## 문서 구조

```
docs/
├── 01-plan/          # 기능 사양 및 요구사항
├── 02-design/        # 아키텍처, API, UI/UX 설계
├── 03-implementation/ # 구현 진행 상황 추적
└── 04-analysis/      # 갭 분석 및 개선 보고서
```

## 자동 트리거 키워드

다음 키워드는 전문 에이전트를 자동으로 활성화합니다:
- "검증", "verify", "確認" → bkit:gap-detector
- "개선", "improve", "改善" → bkit:pdca-iterator
- "분석", "analyze", "分析" → bkit:code-analyzer
- "보고서", "report", "報告" → bkit:report-generator
- "로그인", "인증", "backend", "authentication" → bkit:bkend-expert
