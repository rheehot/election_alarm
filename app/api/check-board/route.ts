import { NextResponse } from 'next/server';
import { scrapeBoard } from '@/lib/scraper';
import { isProcessed, markAsProcessed, updateLastRun } from '@/lib/storage';
import { sendStatusReport, sendErrorAlert } from '@/lib/emailer';
import type { CheckBoardResponse } from '@/types';

/**
 * GET /api/check-board
 * Vercel Cron Job에서 매일 아침 9시 실행
 * 키워드 유무와 상관없이 항상 이메일 발송
 */
export async function GET(): Promise<NextResponse<CheckBoardResponse>> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // 1. 게시판 스크래핑
    const allPosts = await scrapeBoard();

    // 2. "참관인" 키워드 필터링 (상황 파악용)
    const keywordPosts = allPosts.filter(post => post.title.includes('참관인'));

    // 3. 중복 체크
    const newPostsPromises = keywordPosts.map(async (post) => {
      const processed = await isProcessed(post.id);
      return processed ? null : post;
    });

    const newPostsResults = await Promise.all(newPostsPromises);
    const newPosts = newPostsResults.filter((post): post is NonNullable<typeof post> => post !== null);

    // 4. 항상 상태 보고 이메일 발송
    let emailsSent = 0;
    let errors = 0;

    // 키워드 포함 게시물 유무에 관계없이 항상 이메일 발송
    await sendStatusReport(keywordPosts.length, allPosts.length, newPosts.length);
    emailsSent = 1;

    // 신규 게시물이 있으면 처리 완료 표시
    if (newPosts.length > 0) {
      for (const post of newPosts) {
        await markAsProcessed(post.id);
      }
    }

    // 5. 마지막 실행 시간 업데이트
    await updateLastRun();

    const duration = Date.now() - startTime;

    const response: CheckBoardResponse = {
      success: true,
      timestamp,
      summary: {
        totalPosts: allPosts.length,
        filteredPosts: keywordPosts.length,
        newPosts: newPosts.length,
        emailsSent,
        errors,
      },
      newPosts,
    };

    console.log(`[Check-Board] 완료: ${duration}ms`, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 에러 발생 시 알림
    if (error instanceof Error) {
      sendErrorAlert(error, '게시판 확인').catch(err =>
        console.error('에러 알림 발송 실패:', err)
      );
    }

    const response: CheckBoardResponse = {
      success: false,
      timestamp,
      summary: {
        totalPosts: 0,
        filteredPosts: 0,
        newPosts: 0,
        emailsSent: 0,
        errors: 1,
      },
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * OPTIONS 헤더 처리 (CORS preflight)
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
