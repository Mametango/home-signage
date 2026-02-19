// Vercel Serverless Function: NHK新潟県の最新ニュースをスクレイピング
// フロントエンドからは /api/nhk-area-news で呼び出す

import * as cheerio from 'cheerio';

const normalizeMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `https://news.web.nhk${url}`;
  return url;
};

const isValidMediaUrl = (url) => {
  return !!(url && !url.includes('data:') && !url.includes('placeholder') && url.length > 10);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const url = 'https://news.web.nhk/newsweb/area/150';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`NHK area news fetch error: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const newsItems = [];
    const seenLinks = new Set();

    // article要素からニュースを取得
    $('article').each((index, element) => {
      const $el = $(element);
      
      // リンクを探す
      const linkEl = $el.find('a[href*="/newsweb/"]').first();
      let link = linkEl.attr('href') || '';
      
      // 完全なURLでない場合は補完
      if (link && !link.startsWith('http')) {
        link = `https://news.web.nhk${link}`;
      }

      // タイトルを探す（リンクのテキストまたは親要素のテキスト）
      let title = linkEl.text().trim();
      if (!title || title.length < 5) {
        // 他の場所からタイトルを探す
        title = $el.find('h1, h2, h3, h4, [class*="title"], [class*="heading"]').first().text().trim();
      }

      // 日時を探す
      const dateEl = $el.find('time, [class*="date"], [class*="time"]').first();
      let pubDate = dateEl.attr('datetime') || dateEl.text().trim();

      // 画像を探す（複数の属性をチェック、より多くの画像を探す）
      let image = '';
      
      // まず、サイズが大きい画像を探す
      const largeImgs = $el.find('img').filter((i, el) => {
        const $img = $el.find(el);
        const width = parseInt($img.attr('width') || '0');
        const height = parseInt($img.attr('height') || '0');
        return (width > 200 || height > 200 || (!width && !height));
      });
      
      const imgEl = largeImgs.length > 0 ? largeImgs.first() : $el.find('img').first();
      
      if (imgEl.length > 0) {
        image = imgEl.attr('src') || 
                imgEl.attr('data-src') || 
                imgEl.attr('data-lazy-src') ||
                imgEl.attr('data-original') ||
                imgEl.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0] ||
                imgEl.attr('data-lazy') ||
                imgEl.attr('data-url') || '';
      }
      
      // 背景画像をチェック
      if (!image) {
        const bgImage = $el.css('background-image') || 
                       $el.find('[style*="background-image"]').first().attr('style') || '';
        const bgMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (bgMatch && bgMatch[1]) {
          image = bgMatch[1];
        }
      }
      
      // picture要素内のsource要素もチェック
      if (!image) {
        const pictureSource = $el.find('picture source').first();
        if (pictureSource.length > 0) {
          image = pictureSource.attr('srcset')?.split(',')[0]?.trim().split(' ')[0] || '';
        }
      }
      
      // 画像URLを正規化
      if (image && !image.startsWith('http')) {
        image = image.startsWith('//') ? `https:${image}` : `https://news.web.nhk${image}`;
      }
      
      // 空文字列や無効なURLを除外（条件を緩和：5文字以上で、data:やplaceholderでない場合は使用）
      if (image && (image.includes('data:') || image.toLowerCase().includes('placeholder') || image.length < 5)) {
        image = '';
      }

      // 動画を探す（複数の属性をチェック）
      let video = '';
      const videoEl = $el.find('video').first();
      if (videoEl.length > 0) {
        video = videoEl.attr('src') || 
                videoEl.find('source').first().attr('src') ||
                videoEl.attr('data-src') ||
                videoEl.find('source').first().attr('data-src') ||
                videoEl.attr('poster') || ''; // poster属性からも取得を試みる
      }
      
      // iframe内の動画もチェック
      if (!video) {
        const iframe = $el.find('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]').first();
        if (iframe.length > 0) {
          video = iframe.attr('src') || '';
        }
      }
      
      // 動画URLを正規化
      if (video && !video.startsWith('http')) {
        video = video.startsWith('//') ? `https:${video}` : `https://news.web.nhk${video}`;
      }
      
      // 空文字列や無効なURLを除外
      if (video && (video.includes('data:') || video.length < 10)) {
        video = '';
      }

      if (title && link && link.includes('/newsweb/') && !link.includes('/area/') && !link.includes('/genre/') && !link.includes('/pl/')) {
        // 重複チェック
        if (!seenLinks.has(link)) {
          seenLinks.add(link);
          newsItems.push({
            id: newsItems.length + 1,
            title: title,
            link: link,
            pubDate: pubDate || undefined,
            description: undefined,
            category: '新潟県ニュース',
            image: image || undefined,
            video: video || undefined
          });
        }
      }
    });

    // /newsweb/で始まるリンクからも取得（article要素で拾えなかった場合）
    $('a[href*="/newsweb/na/"]').each((index, element) => {
      if (newsItems.length >= 200) return false; // 最大200件に増加
      
      const $el = $(element);
      let link = $el.attr('href') || '';
      
      if (link && !link.startsWith('http')) {
        link = `https://news.web.nhk${link}`;
      }

      const title = $el.text().trim();
      
      // 画像を探す（親要素や兄弟要素から、複数の属性をチェック）
      let image = '';
      const parentArticle = $el.closest('article');
      const imgEl = parentArticle.find('img').first().length > 0 
        ? parentArticle.find('img').first()
        : $el.siblings('img').first();
      
      if (imgEl.length > 0) {
        image = imgEl.attr('src') || 
                imgEl.attr('data-src') || 
                imgEl.attr('data-lazy-src') ||
                imgEl.attr('data-original') ||
                imgEl.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0] || '';
      }
      
      // 背景画像をチェック
      if (!image) {
        const bgImage = parentArticle.css('background-image') || 
                       parentArticle.find('[style*="background-image"]').first().attr('style') || '';
        const bgMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (bgMatch && bgMatch[1]) {
          image = bgMatch[1];
        }
      }
      
      // 画像URLを正規化
      if (image && !image.startsWith('http')) {
        image = image.startsWith('//') ? `https:${image}` : `https://news.web.nhk${image}`;
      }
      
      // 空文字列や無効なURLを除外（条件を緩和：5文字以上で、data:やplaceholderでない場合は使用）
      if (image && (image.includes('data:') || image.toLowerCase().includes('placeholder') || image.length < 5)) {
        image = '';
      }

      // 動画を探す（複数の属性をチェック）
      let video = '';
      const videoEl = parentArticle.find('video').first();
      if (videoEl.length > 0) {
        video = videoEl.attr('src') || 
                videoEl.find('source').first().attr('src') ||
                videoEl.attr('data-src') ||
                videoEl.find('source').first().attr('data-src') || '';
      }
      
      // 動画URLを正規化
      if (video && !video.startsWith('http')) {
        video = video.startsWith('//') ? `https:${video}` : `https://news.web.nhk${video}`;
      }
      
      // 空文字列や無効なURLを除外
      if (video && (video.includes('data:') || video.length < 10)) {
        video = '';
      }
      
      if (title && link && title.length > 10 && !seenLinks.has(link) && newsItems.length < 200) {
        seenLinks.add(link);
        newsItems.push({
          id: newsItems.length + 1,
          title: title,
          link: link,
          pubDate: undefined,
          description: undefined,
          category: '新潟県ニュース',
          image: image || undefined,
          video: video || undefined
        });
      }
    });

    // 画像や動画が取得できていないニュースについて、個別ページから取得を試みる（最初の3件のみ、CPU時間削減のため）
    const itemsToFetch = newsItems.filter(item => !item.image && !item.video).slice(0, 20); // 画像がない記事の取得数を増加
    
    if (itemsToFetch.length > 0) {
      // バッチ処理：一度に2件ずつ処理（CPU時間削減のため）
      const batchSize = 2
      for (let i = 0; i < itemsToFetch.length; i += batchSize) {
        const batch = itemsToFetch.slice(i, i + batchSize)
        await Promise.all(batch.map(async (item) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト
            
            const articleResponse = await fetch(item.link, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (articleResponse.ok) {
              const articleHtml = await articleResponse.text();
              const $article = cheerio.load(articleHtml);
              
              // 記事ページから画像を取得（より多くの画像を探す）
              let articleImage = '';
              let articleVideo = '';
              
              const metaImage = normalizeMediaUrl(
                $article('meta[property="og:image"], meta[name="og:image"], meta[property="twitter:image"], meta[name="twitter:image"]').first().attr('content') || ''
              );
              const metaVideo = normalizeMediaUrl(
                $article('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"], meta[name="twitter:player"]').first().attr('content') || ''
              );
              
              if (isValidMediaUrl(metaImage)) {
                articleImage = metaImage;
              }
              if (isValidMediaUrl(metaVideo)) {
                articleVideo = metaVideo;
              }
              
              // まず、メイン画像を探す（classに"main"や"hero"を含むもの）
              let articleImgEl = $article('img[class*="main"], img[class*="hero"], img[class*="feature"], img[class*="article"]').first();
              
              // 見つからない場合は、サイズが大きい画像を探す（widthやheight属性があるもの）
              if (articleImgEl.length === 0) {
                articleImgEl = $article('img').filter((i, el) => {
                  const $img = $article(el);
                  const src = $img.attr('src') || $img.attr('data-src') || '';
                  const width = parseInt($img.attr('width') || '0');
                  const height = parseInt($img.attr('height') || '0');
                  return src && 
                         !src.includes('icon') && 
                         !src.includes('logo') && 
                         !src.includes('placeholder') &&
                         !src.includes('avatar') &&
                         (width > 200 || height > 200 || (!width && !height)); // サイズが大きいか、サイズ情報がないもの
                }).first();
              }
              
              // それでも見つからない場合は、最初の有効な画像を使用
              if (articleImgEl.length === 0) {
                articleImgEl = $article('img').filter((i, el) => {
                  const src = $article(el).attr('src') || $article(el).attr('data-src') || '';
                  return src && 
                         !src.includes('icon') && 
                         !src.includes('logo') && 
                         !src.includes('placeholder') &&
                         !src.includes('avatar');
                }).first();
              }
              
              if (articleImgEl.length > 0 && !articleImage) {
                articleImage = articleImgEl.attr('src') || 
                             articleImgEl.attr('data-src') || 
                             articleImgEl.attr('data-lazy-src') ||
                             articleImgEl.attr('data-original') ||
                             articleImgEl.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0] || '';
                
                articleImage = normalizeMediaUrl(articleImage);
                
                // 無効なURLを除外
                if (!isValidMediaUrl(articleImage)) {
                  articleImage = '';
                }
              }
              
              // 記事ページから動画を取得（より多くの動画を探す）
              // video要素を探す
              let articleVideoEl = $article('video').first();
              
              // video要素が見つからない場合は、iframe内の動画を探す（YouTubeなど）
              if (!articleVideo && articleVideoEl.length === 0) {
                const iframe = $article('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]').first();
                if (iframe.length > 0) {
                  articleVideo = iframe.attr('src') || '';
                }
              } else if (!articleVideo) {
                articleVideo = articleVideoEl.attr('src') || 
                              articleVideoEl.find('source').first().attr('src') ||
                              articleVideoEl.attr('data-src') ||
                              articleVideoEl.attr('poster') || ''; // poster属性からも取得を試みる
                
                articleVideo = normalizeMediaUrl(articleVideo);
                
                // 無効なURLを除外
                if (!isValidMediaUrl(articleVideo)) {
                  articleVideo = '';
                }
              }
              
              // 取得した画像・動画を設定
              if (articleImage) item.image = articleImage;
              if (articleVideo) item.video = articleVideo;
            }
          } catch (err) {
            console.error(`Failed to fetch article page for ${item.link}:`, err);
          }
        }))
        
        // バッチ間で少し待機（サーバー負荷軽減）
        if (i + batchSize < itemsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }

    // CORSを許可してJSONを返す
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600'); // 5分キャッシュ、10分間は古いデータでも返す
    res.status(200).json({ news: newsItems });
  } catch (error) {
    console.error('Unexpected error in /api/nhk-area-news:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

