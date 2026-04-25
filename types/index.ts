// 게시물 엔티티
export interface BoardPost {
  id: string;
  title: string;
  url: string;
  author: string;
  date: string;
}

// 이메일 발송 결과
export interface EmailResult {
  success: boolean;
  postId: string;
  error?: string;
}

// API 응답 타입
export interface CheckBoardResponse {
  success: boolean;
  timestamp: string;
  summary: {
    totalPosts: number;
    filteredPosts: number;
    newPosts: number;
    emailsSent: number;
    errors: number;
  };
  newPosts?: BoardPost[];
  error?: string;
}

// 로그 레벨
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// 로그 엔트리
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}
