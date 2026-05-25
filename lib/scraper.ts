import * as cheerio from 'cheerio';
import { BOARD_BASE_URL, TARGET_KEYWORD, USER_AGENT, MAX_PAGES, log } from './constants';
import type { BoardPost } from '@/types';

/**
 * 단일 페이지 스크래핑 (blog.naver.com 검색 결과)
 */
async function scrapePage(pageIndex: number): Promise<BoardPost[]> {
  const url = `${BOARD_BASE_URL}&pageNo=${pageIndex}`;

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

    // blog.naver.com 검색 결과 구조: .search_list > li
    $('.search_list li, .list_search_post li').each((_idx, element) => {
      try {
        const $el = $(element);

        // 제목과 링크 추출
        const titleEl = $el.find('a.title, .title a, h3 a, h4 a').first();
        const title = titleEl.text().trim();
        let href = titleEl.attr('href') || '';

        if (href && !href.startsWith('http')) {
          href = `https://blog.naver.com${href}`;
        }

        // ID 추출 (logNo 파라미터 또는 URL)
        const idMatch = href.match(/logNo=(\d+)/);
        const id = idMatch ? idMatch[1] : href;

        // 블로그 이름/작성자 추출
        const authorEl = $el.find('.author, .writer, .blog_name, .name').first();
        const author = authorEl.text().trim() || '블로그';

        // 작성일 추출
        const dateEl = $el.find('.date, .time, .publish').first();
        let date = dateEl.text().trim();

        // 날짜가 없으면 현재 날짜 사용
        if (!date) {
          date = new Date().toISOString().split('T')[0];
        }

        // 요약/설명 추출
        const descEl = $el.find('.desc, .summary, p').first();
        const desc = descEl.text().trim();

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
 * blog.naver.com 검색 결과 HTML을 파싱하여 게시물 목록 추출 (여러 페이지)
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
 * 키워드로 게시물 필터링 (검색 결과이므로 필터링 불필요, 그대로 반환)
 */
export function filterByKeyword(posts: BoardPost[], keyword: string = TARGET_KEYWORD): BoardPost[] {
  // blog.naver.com 검색 결과는 이미 키워드로 필터링됨
  log('INFO', `검색 결과 반환: ${posts.length}개 게시물`, { keyword });
  return posts;
}
