import { Redis } from '@upstash/redis';
import { KV_KEYS, log } from './constants';

// Upstash Redis 클라이언트 초기화
const getRedis = (): Redis => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash Redis credentials not found in environment variables');
  }

  return new Redis({
    url,
    token,
  });
};

/**
 * 이미 처리한 게시물인지 확인
 */
export async function isProcessed(postId: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = KV_KEYS.PROCESSED(postId);
    const exists = await redis.exists(key);
    return exists > 0;
  } catch (error) {
    log('ERROR', `Redis 확인 실패: ${postId}`, error);
    return false; // Redis 오류 시 계속 진행
  }
}

/**
 * 게시물을 처리 완료로 표시
 */
export async function markAsProcessed(postId: string): Promise<void> {
  try {
    const redis = getRedis();
    const key = KV_KEYS.PROCESSED(postId);
    // 30일 TTL 설정 (오래된 데이터 자동 정리)
    await redis.set(key, '1', { ex: 30 * 24 * 60 * 60 });
    log('INFO', `게시물 처리 완료 표시: ${postId}`);
  } catch (error) {
    log('ERROR', `Redis 저장 실패: ${postId}`, error);
  }
}

/**
 * 마지막 실행 시간 기록
 */
export async function updateLastRun(): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(KV_KEYS.LAST_RUN, new Date().toISOString());
  } catch (error) {
    log('ERROR', '마지막 실행 시간 저장 실패', error);
  }
}

/**
 * 마지막 실행 시간 조회
 */
export async function getLastRun(): Promise<string | null> {
  try {
    const redis = getRedis();
    return await redis.get<string>(KV_KEYS.LAST_RUN);
  } catch (error) {
    log('ERROR', '마지막 실행 시간 조회 실패', error);
    return null;
  }
}
