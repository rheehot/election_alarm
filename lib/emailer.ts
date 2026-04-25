import { Resend } from 'resend';
import { EMAIL_CONFIG, RETRY_CONFIG, log } from './constants';
import type { BoardPost, EmailResult } from '@/types';

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
export async function sendAlertEmail(post: BoardPost): Promise<EmailResult> {
  const maxRetries = RETRY_CONFIG.MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log('INFO', `이메일 발송 시도 (${attempt}/${maxRetries})`, { postId: post.id });

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
      lastError = error as Error;
      log('WARN', `이메일 발송 실패 (${attempt}/${maxRetries})`, { postId: post.id, error: lastError.message });

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY_MS));
      }
    }
  }

  log('ERROR', `이메일 발송 최종 실패: ${post.id}`, lastError);
  return { success: false, postId: post.id, error: lastError?.message };
}

/**
 * 여러 게시물 알림 이메일 발송
 */
export async function sendBatchAlerts(posts: BoardPost[]): Promise<EmailResult[]> {
  log('INFO', `${posts.length}개 게시물 이메일 발송 시작`);

  const results = await Promise.allSettled(
    posts.map(post => sendAlertEmail(post))
  );

  const emailResults: EmailResult[] = results.map(result =>
    result.status === 'fulfilled' ? result.value : { success: false, postId: 'unknown', error: 'Promise rejected' }
  );

  const successCount = emailResults.filter(r => r.success).length;
  log('INFO', `이메일 발송 완료: ${successCount}/${posts.length} 성공`);

  return emailResults;
}

/**
 * 상황 보고 이메일 발송 (게시물 없을 때)
 */
export async function sendStatusReport(filteredCount: number, totalCount: number): Promise<void> {
  try {
    const resend = getResend();

    const subject = `${EMAIL_CONFIG.SUBJECT_PREFIX} 오늘의 확인 결과`;
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const html = `
      <h2>선관위 게시판 확인 결과</h2>
      <p><strong>날짜:</strong> ${today}</p>

      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
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
          <td>없음 (이미 알림 처리됨)</td>
        </tr>
      </table>

      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        ✅ 시스템 정상 작동 중입니다.<br>
        📅 다음 확인: 내일 아침 8시
      </p>

      <p style="color: #999; font-size: 12px;">
        이메일 발송 시간: ${new Date().toLocaleString('ko-KR')}
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
