import * as cheerio from 'cheerio';
import { BOARD_BASE_URL, USER_AGENT } from './constants';

export async function testScrape(): Promise<void> {
  const url = `${BOARD_BASE_URL}&pageIndex=1`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  console.log('=== 게시물 테스트 ===');

  let count = 0;
  $('.sd_list_box ul li, .board_list ul li').each((idx, el) => {
    const $el = $(el);
    const titleEl = $el.find('a[href*="nttId"]').first();
    const title = titleEl.text().trim();

    if (title) {
      count++;
      console.log(`${count}. ${title.substring(0, 50)}...`);
    }
  });

  console.log(`총 ${count}개 게시물 발견`);
}
