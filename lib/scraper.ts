import * as cheerio from 'cheerio';
import { BOARD_BASE_URL, TARGET_KEYWORD, USER_AGENT, MAX_PAGES, log, isValidYear, extractYear } from './constants';
import type { BoardPost } from '@/types';

/**
 * 단일 페이지 스크래핑
 */
async function scrapePage(pageIndex: number): Promise<BoardPost[]> {
  const url = `${BOARD_BASE_URL}&pageIndex=${pageIndex}`;

  try {
    log('INFO', `페이지 스크래핑 시작: ${pageIndex}`, { url });

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const posts: BoardPost[] = [];

    // 실제 게시판 구조: sd_list_box 내의 ul > li
    $('.sd_list_box ul li, .board_list ul li').each((_idx, element) => {
      try {
        const $el = $(element);

        // 제목과 링크 추출
        const titleEl = $el.find('a[href*="nttId"]').first();
        const title = titleEl.text().trim();
        let href = titleEl.attr('href') || '';

        if (href && !href.startsWith('http')) {
          // jsessionid 제거 (불필요한 세션 ID)
          href = href.split(';')[0];

          // 상대 경로를 절대 경로로 변환
          if (href.startsWith('/')) {
            href = `https://su.nec.go.kr${href}`;
          } else {
            href = new URL(href, BOARD_BASE_URL).href;
          }
        }

        // ID 추출 (nttId 파라미터)
        const idMatch = href.match(/nttId=(\d+)/);
        const id = idMatch ? idMatch[1] : href;

        // 작성자 추출 (링크 근처의 텍스트)
        // 보통 [지역명] 형식으로 되어 있음
        const regionMatch = title.match(/^\[([^\]]+)\]/);
        const author = regionMatch ? regionMatch[1] : '관리자';

        // 작성일 추출 - li 내의 span.date 또는 별도 날짜 요소
        const dateEl = $el.find('.date, span.date, time').first();
        let date = dateEl.text().trim();

        // 날짜가 없으면 li 전체 텍스트에서 찾기
        if (!date) {
          const textContent = $el.text();
          const dateMatch = textContent.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
          date = dateMatch ? dateMatch[1] : '';
        }

        // 날짜가 비어있으면 스킵
        if (!date) {
          // 날짜가 없으면 최신 것으로 간주하고 기본값 사용
          date = new Date().toISOString().split('T')[0];
        }

        // 2024~2026년 범위만 체크
        if (!isValidYear(date)) {
          return; // 범위 밖이면 스킵
        }

        if (title && href && id) {
          posts.push({ id, title, url: href, author, date });
        }
      } catch (err) {
        log('WARN', '게시물 파싱 중 오류', err);
      }
    });

    log('INFO', `페이지 ${pageIndex} 스크래핑 완료: ${posts.length}개 게시물`);
    return posts;
  } catch (error) {
    log('ERROR', `페이지 ${pageIndex} 스크래핑 실패`, error);
    return []; // 실패 시 빈 배열 반환 (계속 진행)
  }
}

/**
 * 게시판 HTML을 파싱하여 게시물 목록 추출 (여러 페이지)
 */
export async function scrapeBoard(): Promise<BoardPost[]> {
  const allPosts: BoardPost[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const posts = await scrapePage(page);
    allPosts.push(...posts);

    // 페이지가 비어있으면 더 이상 진행하지 않음
    if (posts.length === 0) {
      log('INFO', `페이지 ${page}에 게시물 없음. 스크래핑 중단.`);
      break;
    }

    // 요청 간격 (서버 부하 방지)
    if (page < MAX_PAGES) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  log('INFO', `전체 스크래핑 완료: ${allPosts.length}개 게시물 (${MAX_PAGES}페이지)`);
  return allPosts;
}

/**
 * 키워드로 게시물 필터링
 */
export function filterByKeyword(posts: BoardPost[], keyword: string = TARGET_KEYWORD): BoardPost[] {
  const filtered = posts.filter(post =>
    post.title.includes(keyword)
  );

  log('INFO', `키워드 필터링: ${posts.length}개 → ${filtered.length}개`, { keyword });
  return filtered;
}

/**
 * 날짜 포맷 정규화
 */
export function normalizeDate(dateString: string): string {
  const year = extractYear(dateString);
  if (year === null) return dateString;

  // 연도가 포함되어 있지 않으면 추가
  if (!dateString.match(/^\d{4}/)) {
    return `${year}.${dateString}`;
  }

  return dateString;
}
