# 선거 알림 시스템

중앙선거관리위원회 게시판에서 "참관인" 키워드가 포함된 게시물을 자동으로 모니터링하고 이메일로 알림을 발�<tool_call>Write<arg_key>content</arg_key><arg_value># election_alarm

# 선거 알림 시스템

중앙선거관리위원회 게시판에서 "참관인" 키워드가 포함된 게시물을 자동으로 모니터링하고 이메일로 알림을 발송하는<tool_call>Write<arg_key>content</arg_key><arg_value># election_alarm

# 선거 알림 시스템

중앙선거관리위원회 게시판에서 "참관인" 키워드가 포함된 게시물을 자동으로 모니터링하고 이메일로 알림을 발송하는 시스템입니다.

## 🚀 기능

- 매일 아침 8시 자동 실행
- 중앙선거관리위원회 게시판 스크래핑 (5페이지)
- "참관인" 키워드 필터링
- 2024~2026년 게시물만 체크
- 이메일 알림 발송
- 게시물 없어도 상태 보고 이메일 발송
- 중복 알림 방지

## 🛠️ 기술 스택

- Next.js 15
- TypeScript
- Resend (이메일 발송)
- Upstash Redis (상태 저장)
- Vercel (호스팅 + Cron Jobs)

## 📦 설치

```bash
npm install
```

## 🔧 환경변수

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
ALERT_TO_EMAIL=your-email@example.com
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXX...
```

## 🚀 실행

```bash
# 개발 모드
npm run dev

# 빌드
npm run build

# 시작
npm start
```

## 📡 API

### GET /api/check-board
게시판을 확인하고 이메일을 발송합니다.

### GET /api/health
시스템 상태를 확인합니다.

## 🌐 배포

[https://electionalarm.vercel.app](https://electionalarm.vercel.app)

## 📄 라이선스

MIT
