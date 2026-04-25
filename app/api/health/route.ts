import { NextResponse } from 'next/server';
import { getLastRun } from '@/lib/storage';

/**
 * GET /api/health
 * 시스템 건강 상태 확인 엔드포인트
 */
export async function GET(): Promise<NextResponse> {
  try {
    const lastRun = await getLastRun();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      lastCheck: lastRun,
      kvConnected: lastRun !== null,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      lastCheck: null,
      kvConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
