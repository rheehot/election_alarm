// blog.naver.com 검색 URL (기본 URL, 페이지 파라미터는 별도 추가)
export const BOARD_BASE_URL = 'https://section.blog.naver.com/Search/Post.naver?rangeType=ALL&orderBy=sim&keyword=이벤트';

// 검색 키워드
export const TARGET_KEYWORD = '이벤트';

// 체크할 최대 페이지 수
export const MAX_PAGES = 5;

// 체크할 연도 범위: 2024년 ~ 최신(2026년)
export const MIN_YEAR = 2024;
export const MAX_YEAR = 2026;

// KV 저장소 키 프리픽스
export const KV_KEYS = {
  PROCESSED: (postId: string) => `processed:${postId}`,
  LAST_RUN: 'last_run',
} as const;

// 이메일 설정
export const EMAIL_CONFIG = {
  FROM: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  TO: process.env.ALERT_TO_EMAIL || '',
  SUBJECT_PREFIX: '[선관위 알림]',
} as const;

// User-Agent (스크래핑 차단 방지)
export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 재시도 설정
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// 로그 출력 함수
export function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, data };

  if (level === 'ERROR') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(logEntry));
  } else if (level === 'DEBUG' && process.env.NODE_ENV === 'development') {
    console.debug(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * 날짜 문자열에서 연도 추출
 * @param dateString - "2025.01.15" 또는 "2025-01-15" 또는 "01.15" 형식
 * @returns 연도 (숫자), 파싱 실패 시 null
 */
export function extractYear(dateString: string): number | null {
  // "2025.01.15" 또는 "2025-01-15" 형식 (4자리 연도)
  const fullYearMatch = dateString.match(/(\d{4})[.\-]/);
  if (fullYearMatch) {
    return parseInt(fullYearMatch[1], 10);
  }

  // "25.01.15" 또는 "25-01-15" 형식 (2자리 연도)
  const shortYearMatch = dateString.match(/^(\d{2})[.\-]/);
  if (shortYearMatch) {
    const year = parseInt(shortYearMatch[1], 10);
    // 2000년대 기준 (25 -> 2025)
    return year + 2000;
  }

  // "01.15" 또는 "01-15" 형식 (연도 없음)
  // 이 경우 현재 연도 또는 최신 연도로 가정
  const monthDayMatch = dateString.match(/(\d{1,2})[.\-](\d{1,2})/);
  if (monthDayMatch) {
    // 기본적으로 2025년으로 가정 (2024~2026 범위 내)
    return 2025;
  }

  return null;
}

/**
 * 2024~2026년 범위인지 확인 (2024년 ~ 최신)
 */
export function isValidYear(dateString: string): boolean {
  const year = extractYear(dateString);
  if (year === null) return true; // 파싱 실패 시 포함
  return year >= MIN_YEAR && year <= MAX_YEAR;
}
