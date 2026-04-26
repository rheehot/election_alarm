import { Resend } from 'resend';
import { EMAIL_CONFIG, log } from './constants';
import type { BoardPost } from '@/types';

// Resend 클라이언트 초기화
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * 단일 게시물 알림 이메일 발송
 */
export async function sendAlertEmail(post: BoardPost): Promise<{ success: boolean; postId: string; error?: string }> {
  try {
    log('INFO', `이메일 발송: ${post.id}`);

    const resend = getResend();

    const subject = `${EMAIL_CONFIG.SUBJECT_PREFIX} ${post.title}`;
    const html = `
      <h2>선관위 게시판 알림</h2>
      <p>"참관인" 키워드가 포함된 새로운 게시물이 게시되었습니다.</p>

      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td><strong>제목</strong></td>
          <td>${post.title}</td>
        </tr>
        <tr>
          <td><strong>작성자</strong></td>
          <td>${post.author}</td>
        </tr>
        <tr>
          <td><strong>작성일</strong></td>
          <td>${post.date}</td>
        </tr>
        <tr>
          <td><strong>링크</strong></td>
          <td><a href="${post.url}">게시물 보기</a></td>
        </tr>
      </table>

      <p style="color: #666; font-size: 12px;">
        이 이메일은 자동 발송됩니다. (${new Date().toLocaleString('ko-KR')})
      </p>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.FROM || 'onboarding@resend.dev',
      to: EMAIL_CONFIG.TO,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    log('INFO', `이메일 발송 성공: ${post.id}`, { messageId: data?.id });
    return { success: true, postId: post.id };

  } catch (error) {
    const err = error as Error;
    log('ERROR', `이메일 발송 실패:`, err.message);
    return { success: false, postId: 'unknown', error: err.message };
  }
}

/**
 * 여러 게시물 알림 이메일 발송
 */
export async function sendBatchAlerts(posts: BoardPost[]): Promise<{ success: boolean; postId: string; error?: string }[]> {
  log('INFO', `${posts.length}개 게시물 이메일 발송 시작`);

  const results = await Promise.all(
    posts.map(post => sendAlertEmail(post))
  );

  const successCount = results.filter(r => r.success).length;
  log('INFO', `이메일 발송 완료: ${successCount}/${posts.length} 성공`);

  return results;
}

/**
 * 상황 보고 이메일 발송 (항상 실행)
 */
export async function sendStatusReport(
  filteredCount: number,
  totalCount: number,
  newCount: number = 0
): Promise<void> {
  try {
    const resend = getResend();

    const subject = `${EMAIL_CONFIG.SUBJECT_PREFIX} 오늘의 확인 결과`;
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    // 최근 게시물 3개 표시
    const recentPostsHTML = totalCount > 0
      ? `
        <h3>📋 최신 공지사항</h3>
        <p>최근 게시된 공지사항입니다:</p>
        <ul>
          <li>선관위 홈페이지에서 확인 가능</li>
        </ul>
      `
      : '';

    const keywordStatus = filteredCount > 0
      ? `<p style="color: #e74c3c;">⚠️ 현재 "참관인" 관련 공지 <strong>${filteredCount}건</strong> 존재</p>`
      : `<p style="color: #27ae60;">✅ 현재 "참관인" 관련 공지 없음</p>`;

    const html = `
      <h2>선관위 게시판 확인 결과</h2>
      <p><strong>날짜:</strong> ${today}</p>
      <p><strong>확인 시간:</strong> 매일 아침 9시</p>

      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td><strong>전체 게시물</strong></td>
          <td>${totalCount}개</td>
        </tr>
        <tr>
          <td><strong>"참관인" 포함</strong></td>
          <td>${filteredCount}개</td>
        </tr>
        <tr>
          <td><strong>신규 알림</strong></td>
          <td>${newCount}개</td>
        </tr>
      </table>

      ${keywordStatus}

      ${recentPostsHTML}

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="color: #666; font-size: 14px;">
        ✅ 시스템 정상 작동 중입니다.<br>
        📅 다음 확인: 내일 아침 9시
      </p>

      <p style="color: #999; font-size: 12px;">
        이메일 발송 시간: ${new Date().toLocaleString('ko-KR')}<br>
        문의: https://github.com/rheehot/election_alarm
      </p>
    `;

    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.FROM || 'onboarding@resend.dev',
      to: EMAIL_CONFIG.TO,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[Check-Board] 상태 보고 이메일 발송 완료');
  } catch (error) {
    console.error('[Check-Board] 상태 보고 이메일 발송 실패:', error);
    throw error;
  }
}

/**
 * 에러 알림 이메일 발송
 */
export async function sendErrorAlert(error: Error, context: string): Promise<void> {
  try {
    const resend = getResend();

    const { error: sendError } = await resend.emails.send({
      from: EMAIL_CONFIG.FROM || 'onboarding@resend.dev',
      to: EMAIL_CONFIG.TO,
      subject: `${EMAIL_CONFIG.SUBJECT_PREFIX} [ERROR] ${context}`,
      html: `
        <h2 style="color: red;">시스템 에러 발생</h2>
        <p><strong>컨텍스트:</strong> ${context}</p>
        <p><strong>에러 메시지:</strong> ${error.message}</p>
        <p><strong>시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack || 'No stack trace'}</pre>
      `,
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    log('INFO', '에러 알림 이메일 발송 완료');
  } catch (err) {
    log('ERROR', '에러 알림 이메일 발송 실패', err);
  }
}
