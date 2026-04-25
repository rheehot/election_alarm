import { NextResponse } from 'next/server';
import { scrapeBoard, filterByKeyword } from '@/lib/scraper';
import { isProcessed, markAsProcessed, updateLastRun } from '@/lib/storage';
import { sendBatchAlerts, sendStatusReport, sendErrorAlert } from '@/lib/emailer';
import type { CheckBoardResponse } from '@/types';

/**
 * GET /api/check-board
 * Vercel Cron Job에서 매일 아침 8시 실행
 */
export async function GET(): Promise<NextResponse<CheckBoardResponse>> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    // 1. 게시판 스크래핑
    const allPosts = await scrapeBoard();

    // 2. 키워드 필터링
    const filteredPosts = filterByKeyword(allPosts);

    // 3. 중복 체크 및 신규 게시물 필터링
    const newPostsPromises = filteredPosts.map(async (post) => {
      const processed = await isProcessed(post.id);
      return processed ? null : post;
    });

    const newPostsResults = await Promise.all(newPostsPromises);
    const newPosts = newPostsResults.filter((post): post is NonNullable<typeof post> => post !== null);

    // 4. 이메일 발송
    let emailsSent = 0;
    let errors = 0;

    if (newPosts.length > 0) {
      // 신규 게시물 있음 → 알림 이메일
      const emailResults = await sendBatchAlerts(newPosts);

      for (const result of emailResults) {
        if (result.success) {
          await markAsProcessed(result.postId);
          emailsSent++;
        } else {
          errors++;
        }
      }
    } else {
      // 게시물 없음 → 상황 보고 이메일
      await sendStatusReport(filteredPosts.length, allPosts.length);
      emailsSent = 1; // 상태 보고 이메일 1건
    }

    // 5. 마지막 실행 시간 업데이트
    await updateLastRun();

    const duration = Date.now() - startTime;

    const response: CheckBoardResponse = {
      success: true,
      timestamp,
      summary: {
        totalPosts: allPosts.length,
        filteredPosts: filteredPosts.length,
        newPosts: newPosts.length,
        emailsSent,
        errors,
      },
      newPosts,
    };

    // 디버깅을 위해 로그 추가
    console.log(`[Check-Board] 완료: ${duration}ms`, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 에러 발생 시에도 알림
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
