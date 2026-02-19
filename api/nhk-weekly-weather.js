// Vercel Serverless Function: tenki.jpから新潟市の週間（10日間）天気をスクレイピング（優先）
// フロントエンドからは /api/nhk-weekly-weather で呼び出す

import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const weeklyWeather = [];
    const seenDates = new Set();
    
    // クエリパラメータから都道府県と市町村を取得（デフォルトは新潟市）
    const prefecture = req.query.prefecture || '新潟県';
    const city = req.query.city || '新潟市';
    
    // tenki.jpのURLを決定（現在は新潟県の主要都市に対応）
    // 新潟県の主要都市のURLマッピング
    const cityUrlMap = {
      '新潟市': 'https://tenki.jp/forecast/4/18/5410/15100/',
      '新発田市': 'https://tenki.jp/forecast/4/18/5410/15206/',
      '長岡市': 'https://tenki.jp/forecast/4/18/5410/15202/',
      '三条市': 'https://tenki.jp/forecast/4/18/5410/15203/',
      '柏崎市': 'https://tenki.jp/forecast/4/18/5410/15204/',
      '小千谷市': 'https://tenki.jp/forecast/4/18/5410/15205/',
      '加茂市': 'https://tenki.jp/forecast/4/18/5410/15207/',
      '十日町市': 'https://tenki.jp/forecast/4/18/5410/15208/'
    };
    
    // デフォルトは新潟市（新潟県以外、またはマッピングにない市町村の場合）
    const url = (prefecture === '新潟県' && cityUrlMap[city]) ? cityUrlMap[city] : cityUrlMap['新潟市'];
    
    console.log(`[tenki.jp] 天気取得: 都道府県=${prefecture}, 市町村=${city}, URL=${url}`);
    
    // まずtenki.jpからスクレイピング（優先、より正確なデータのため）
    try {
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
          }
        });

        if (!response.ok) {
          throw new Error(`tenki.jp fetch error: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const formatDateLabel = (month, day) => {
          try {
            const date = new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day));
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const weekday = weekdays[date.getDay()];
            return `${month}/${day}(${weekday})`;
          } catch (e) {
            return `${month}/${day}`;
          }
        };

        // tenki.jpの10日間天気テーブルを探す
        // 「新潟市の10日間天気」という見出しの後のテーブルを探す
        let forecastTable = null;
        
        // 「10日間天気」を含む見出しの後のテーブルを探す
        $('h2, h3, h4').each((index, heading) => {
          const $heading = $(heading);
          if ($heading.text().includes('10日間天気')) {
            let nextEl = $heading.next();
            for (let i = 0; i < 10; i++) {
              if (nextEl.is('table')) {
                forecastTable = nextEl;
                return false;
              }
              nextEl = nextEl.next();
            }
          }
        });
        
        // 見つからない場合は、すべてのテーブルをチェック
        if (!forecastTable || forecastTable.length === 0) {
          $('table').each((index, table) => {
            const $table = $(table);
            const text = $table.text();
            // 「気温(℃)」を含むテーブルを探す
            if (text.includes('気温') && text.includes('降水確率')) {
              forecastTable = $table;
              return false;
            }
          });
        }
        
        if (forecastTable && forecastTable.length > 0) {
          const rows = forecastTable.find('tr');
          console.log(`[tenki.jp] テーブル検出: 行数=${rows.length}`);
          
          // テーブルの構造を確認（デバッグ用）
          rows.each((ri, row) => {
            const rowText = $(row).text().trim();
            const cells = $(row).find('td, th');
            console.log(`[tenki.jp] 行${ri}: "${rowText.substring(0, 50)}", セル数=${cells.length}`);
          });
          
          // tenki.jpのテーブルは列ベース（横方向）
          // 1行目: 日付
          // 2行目: 天気
          // 3行目: 気温(℃) - "9 5" のような形式（最高 最低）
          // 4行目: 降水確率
          
          // 各行を特定する：ヘッダー行と各データ行を探す
          let headerRowIndex = -1;
          let dateRowIndex = -1;
          let weatherRowIndex = -1;
          let tempRowIndex = -1;
          let rainRowIndex = -1;
          
          rows.each((ri, row) => {
            const rowText = $(row).text();
            const firstCell = $(row).find('td, th').first().text().trim();
            
            // 各行の最初のセルで判定
            // ヘッダー行を探す（最初のセルが「日付」で、行全体に「気温」と「降水確率」の両方が含まれる）
            if (firstCell.includes('日付') && rowText.includes('気温') && rowText.includes('降水確率')) {
              headerRowIndex = ri;
              console.log(`[tenki.jp] ヘッダー行を検出: 行${ri}`);
            }
            // 日付行を探す（最初のセルが「日付」を含む、かつ2番目のセルに月日が含まれる）
            else if (firstCell.includes('日付')) {
              const secondCell = $(row).find('td, th').eq(1).text().trim();
              if (secondCell.match(/\d+月\d+日/)) {
                dateRowIndex = ri;
                console.log(`[tenki.jp] 日付行を検出: 行${ri}, 2番目のセル="${secondCell.substring(0, 20)}"`);
              }
            }
            // 天気行を探す（最初のセルが「天気」を含む）
            else if (firstCell.includes('天気')) {
              weatherRowIndex = ri;
              console.log(`[tenki.jp] 天気行を検出: 行${ri}`);
            }
            // 気温行を探す（最初のセルが「気温」を含む）
            else if (firstCell.includes('気温')) {
              tempRowIndex = ri;
              console.log(`[tenki.jp] 気温行を検出: 行${ri}`);
            }
            // 降水確率行を探す（最初のセルが「降水確率」を含む）
            else if (firstCell.includes('降水確率')) {
              rainRowIndex = ri;
              console.log(`[tenki.jp] 降水確率行を検出: 行${ri}`);
            }
          });
          
          // 日付行が見つからない場合は、最初の行を日付行とする（「日付」を含む場合）
          if (dateRowIndex < 0 && rows.length > 0) {
            const firstRowFirstCell = $(rows[0]).find('td, th').first().text().trim();
            const secondCell = $(rows[0]).find('td, th').eq(1).text().trim();
            // 最初のセルが「日付」を含む、または2番目のセルに月日が含まれる
            if (firstRowFirstCell.includes('日付') || secondCell.match(/\d+月\d+日/)) {
              dateRowIndex = 0;
              console.log(`[tenki.jp] 日付行を最初の行として設定: 行0, 2番目のセル="${secondCell.substring(0, 20)}"`);
            }
          }
          
          // 天気行を探す（日付行と気温行の間）
          if (weatherRowIndex < 0 && dateRowIndex >= 0 && tempRowIndex >= 0) {
            for (let ri = dateRowIndex + 1; ri < tempRowIndex; ri++) {
              const row = $(rows[ri]);
              const hasImg = row.find('img').length > 0;
              const text = row.text().trim();
              const firstCell = row.find('td, th').first().text().trim();
              // 天気行の判定：画像がある、または天気の文字列が含まれている、または最初のセルが「天気」を含む
              if (hasImg || text.match(/(晴|曇|雨|雪|雷)/) || firstCell.includes('天気')) {
                weatherRowIndex = ri;
                console.log(`[tenki.jp] 天気行を検出: 行${ri}`);
                break;
              }
            }
          }
          
          // 天気行が見つからない場合は、日付行の次の行を天気行とする
          if (weatherRowIndex < 0 && dateRowIndex >= 0 && dateRowIndex + 1 < rows.length) {
            weatherRowIndex = dateRowIndex + 1;
            console.log(`[tenki.jp] 天気行を日付行の次の行として設定: 行${weatherRowIndex}`);
          }
          
          // 天気行が見つからない場合は、行1を天気行とする（フォールバック）
          if (weatherRowIndex < 0 && rows.length > 1) {
            const row1FirstCell = $(rows[1]).find('td, th').first().text().trim();
            if (row1FirstCell.includes('天気') || $(rows[1]).find('img').length > 0) {
              weatherRowIndex = 1;
              console.log(`[tenki.jp] 天気行を行1として設定（フォールバック）`);
            }
          }
          
          console.log(`[tenki.jp] 行インデックス: ヘッダー=${headerRowIndex}, 日付=${dateRowIndex}, 天気=${weatherRowIndex}, 気温=${tempRowIndex}, 降水確率=${rainRowIndex}`);
          
          if (dateRowIndex >= 0 && weatherRowIndex >= 0 && tempRowIndex >= 0) {
            const dateRow = $(rows[dateRowIndex]);
            const weatherRow = $(rows[weatherRowIndex]);
            const tempRow = $(rows[tempRowIndex]);
            const rainRow = rainRowIndex >= 0 ? $(rows[rainRowIndex]) : null;
            
            const dateCells = dateRow.find('td, th');
            const weatherCells = weatherRow.find('td, th');
            const tempCells = tempRow.find('td, th');
            const rainCells = rainRow ? rainRow.find('td, th') : null;
            
            console.log(`[tenki.jp] セル数: 日付=${dateCells.length}, 天気=${weatherCells.length}, 気温=${tempCells.length}, 降水確率=${rainCells ? rainCells.length : 0}`);
            
            // 1列目はヘッダーなので、2列目以降がデータ
            const maxCells = Math.min(dateCells.length, weatherCells.length, tempCells.length, rainCells ? rainCells.length : 11, 11);
            for (let i = 1; i < maxCells; i++) {
              const dateCell = $(dateCells[i]);
              const weatherCell = $(weatherCells[i]);
              const tempCell = $(tempCells[i]);
              const rainCell = rainCells ? $(rainCells[i]) : null;
              
              // 日付を取得
              let dateText = dateCell.text().trim();
              // 日付が正しい形式か確認（月日を含むか）
              if (!dateText || !dateText.match(/\d+月\d+日/)) {
                console.log(`[tenki.jp] 日付セル${i}が無効: "${dateText}"`);
                continue;
              }
              
              // 天気を取得
              let condition = '';
              const weatherImg = weatherCell.find('img');
              if (weatherImg.length > 0) {
                const alt = weatherImg.attr('alt') || weatherImg.attr('title') || '';
                if (alt) condition = alt;
              }
              if (!condition) {
                condition = weatherCell.text().trim();
              }
              condition = condition.replace(/\s+/g, ' ').trim();
              
              // 気温を取得 - 形式: "3\n-1" など（最高 最低が改行で区切られている）
              // HTMLを直接解析して、改行を保持したままテキストを取得
              const tempHtml = tempCell.html() || '';
              // HTML内の改行や空白を正規化
              const normalizedHtml = tempHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              
              // セル内のテキストノードを直接取得（改行を保持）
              const tempText = tempCell.text().trim();
              
              let maxTemp = undefined;
              let minTemp = undefined;
              
              // 方法1: HTMLから直接数値を抽出（改行を保持）
              // HTML内のテキストノードを直接取得
              const tempNodes = tempCell.contents().toArray();
              const tempValues = [];
              tempNodes.forEach(node => {
                if (node.type === 'text') {
                  const text = $(node).text().trim();
                  // 数値のみを抽出（負の数も含む）
                  const numbers = text.match(/-?\d+/g);
                  if (numbers) {
                    numbers.forEach(n => {
                      const num = parseInt(n);
                      if (!isNaN(num)) {
                        tempValues.push(num);
                      }
                    });
                  } else {
                    // 数値が直接含まれている場合
                    const num = parseInt(text);
                    if (!isNaN(num)) {
                      tempValues.push(num);
                    }
                  }
                }
              });
              
              if (tempValues.length >= 1) {
                maxTemp = tempValues[0];
              }
              if (tempValues.length >= 2) {
                minTemp = tempValues[1];
              }
              
              // デバッグログ
              if (tempValues.length > 0) {
                console.log(`[tenki.jp] 気温パース: dateText="${dateText}", tempValues=[${tempValues.join(', ')}], maxTemp=${maxTemp}, minTemp=${minTemp}`);
              }
              
              // 方法2: テキストを空白や改行で分割して取得
              if (maxTemp === undefined || minTemp === undefined) {
                // 改行、タブ、複数の空白で分割
                const parts = tempText.split(/[\s\n\t]+/).map(p => p.trim()).filter(p => p);
                const numbers = parts.map(p => parseInt(p)).filter(n => !isNaN(n));
                if (numbers.length >= 1 && maxTemp === undefined) {
                  maxTemp = numbers[0];
                }
                if (numbers.length >= 2 && minTemp === undefined) {
                  minTemp = numbers[1];
                }
              }
              
              // 方法3: 正規表現パターンで取得（フォールバック）
              if (maxTemp === undefined || minTemp === undefined) {
                // "3-1" や "3 -1" のような形式を探す
                const tempMatch = tempText.match(/(-?\d+)\s*[-~]\s*(-?\d+)/) || 
                                 tempText.match(/(-?\d+)\s+(-?\d+)/) ||
                                 normalizedHtml.match(/(-?\d+)\s+(-?\d+)/);
                if (tempMatch) {
                  if (maxTemp === undefined) maxTemp = parseInt(tempMatch[1]);
                  if (minTemp === undefined) minTemp = parseInt(tempMatch[2]);
                }
              }
              
              // デバッグ: 気温が異常な値（30度以上）の場合は警告と修正
              if (maxTemp !== undefined && maxTemp > 30) {
                console.log(`[tenki.jp] 警告: 気温が異常な値です。dateText="${dateText}", tempText="${tempText}", tempHtml="${tempHtml.substring(0, 100)}", maxTemp=${maxTemp}, minTemp=${minTemp}, tempValues=[${tempValues.join(', ')}]`);
                // 2桁の数値の場合は、1桁ずつに分割して再試行
                if (maxTemp >= 10 && maxTemp < 100 && minTemp === undefined) {
                  const firstDigit = Math.floor(maxTemp / 10);
                  const secondDigit = maxTemp % 10;
                  maxTemp = firstDigit;
                  minTemp = secondDigit;
                  console.log(`[tenki.jp] 修正: maxTemp=${maxTemp}, minTemp=${minTemp}`);
                } else if (maxTemp >= 10 && maxTemp < 100 && minTemp !== undefined && minTemp < 10) {
                  // 既にminTempがあるが、maxTempが2桁の場合は分割
                  const firstDigit = Math.floor(maxTemp / 10);
                  const secondDigit = maxTemp % 10;
                  maxTemp = firstDigit;
                  // minTempは既にあるので、secondDigitは無視（または上書き）
                  console.log(`[tenki.jp] 修正: maxTemp=${maxTemp}, minTemp=${minTemp} (保持)`);
                }
              }
              
              // 日付の整形
              // "12月15日(月)" のような形式を "12/15(月)" に変換
              dateText = dateText.replace(/(\d+)月(\d+)日\s*\(([日月火水木金土])\)/, '$1/$2($3)');
              // "12月15日" だけの場合は曜日を追加
              if (!dateText.includes('(')) {
                dateText = dateText.replace(/(\d+)月(\d+)日/, (match, month, day) => {
                  return formatDateLabel(month, day);
                });
              }
              dateText = dateText.replace(/\s+/g, '').trim();
              
              // 降水確率を取得
              let rainProbability = undefined;
              if (rainCell) {
                const rainText = rainCell.text().trim();
                const rainMatch = rainText.match(/(\d+)%/);
                if (rainMatch) {
                  rainProbability = parseInt(rainMatch[1]);
                }
              }
              
              // 気温が取得できていない場合でも、データを追加（デバッグのため）
              if (dateText && dateText.length >= 3 && dateText.length < 30) {
                console.log(`[tenki.jp] 追加: ${dateText}`, { 
                  maxTemp, 
                  minTemp, 
                  condition,
                  rainProbability,
                  tempText: tempText.substring(0, 50),
                  allNumbers: tempText.match(/-?\d+/g)
                });
                weeklyWeather.push({
                  date: dateText,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: condition || undefined,
                  rainProbability: rainProbability,
                  icon: undefined
                });
              } else {
                console.log(`[tenki.jp] スキップ: dateText="${dateText}", length=${dateText?.length}`);
              }
            }
          }
        }
        
        // 今日・明日の天気セクションも確認
        // h3, h4タグで「今日」「明日」を含む見出しを探す
        $('h3, h4').each((index, heading) => {
          const $heading = $(heading);
          const headingText = $heading.text().trim();
          
          if (headingText.includes('今日') || headingText.includes('明日')) {
            // 日付を取得
            const dateMatch = headingText.match(/(\d+)月(\d+)日\(([土日月火水木金])+\)/);
            if (!dateMatch) return;
            
            const month = dateMatch[1];
            const day = dateMatch[2];
            const weekday = dateMatch[3];
            const formattedDate = `${month}/${day}(${weekday})`;
            
            if (seenDates.has(formattedDate)) return;
            
            // 次のセクションを取得
            const $section = $heading.nextUntil('h3, h4');
            
            // 天気を取得（画像のalt属性から、ただし「日の出」「日の入」などの画像は除外）
            let condition = '';
            const weatherImgs = $section.find('img[alt]');
            weatherImgs.each((i, img) => {
              const alt = $(img).attr('alt') || '';
              // 「日の出」「日の入」「風向」「風速」などの画像を除外
              if (alt && !alt.match(/(日の出|日の入|風向|風速|湿度|気圧)/) && alt.match(/(晴|曇|雨|雪|雷|霧)/)) {
                condition = alt;
                return false; // break
              }
            });
            // 画像が見つからない場合は、テキストから取得
            if (!condition) {
              const sectionTextForWeather = $section.text();
              const weatherMatch = sectionTextForWeather.match(/(晴|曇|雨|雪|雷|霧|晴れ|曇り|雨|雪)/);
              if (weatherMatch) {
                condition = weatherMatch[1];
              }
            }
            
            // 気温を取得（「最高3℃[+2]最低0℃[+2]」の形式）
            const sectionText = $section.text();
            console.log(`[tenki.jp] 今日・明日セクション: ${formattedDate}, text="${sectionText.substring(0, 100)}"`);
            
            // 最高気温と最低気温を取得（複数のパターンを試す）
            const maxTempMatch = sectionText.match(/最高\s*(-?\d+)\s*℃/) || 
                                sectionText.match(/最高[：:]\s*(-?\d+)/) ||
                                sectionText.match(/(\d+)\s*℃\s*\[.*?\]\s*最低/);
            const minTempMatch = sectionText.match(/最低\s*(-?\d+)\s*℃/) || 
                                sectionText.match(/最低[：:]\s*(-?\d+)/);
            
            const maxTemp = maxTempMatch ? parseInt(maxTempMatch[1]) : undefined;
            const minTemp = minTempMatch ? parseInt(minTempMatch[1]) : undefined;
            
            // 降水確率を取得（テーブルから）
            let rainProbability = undefined;
            const rainTable = $section.find('table');
            if (rainTable.length > 0) {
              const rainRows = rainTable.find('tr');
              rainRows.each((ri, row) => {
                const rowText = $(row).text();
                if (rowText.includes('降水確率')) {
                  // 降水確率の行を見つけたら、その行のセルから最大値を取得
                  const cells = $(row).find('td');
                  let maxRain = 0;
                  cells.each((ci, cell) => {
                    const cellText = $(cell).text().trim();
                    const rainMatch = cellText.match(/(\d+)%/);
                    if (rainMatch) {
                      const rain = parseInt(rainMatch[1]);
                      if (rain > maxRain) maxRain = rain;
                    }
                  });
                  if (maxRain > 0) rainProbability = maxRain;
                  return false;
                }
              });
            }
            
            console.log(`[tenki.jp] 今日・明日: ${formattedDate}, maxTemp=${maxTemp}, minTemp=${minTemp}, rainProbability=${rainProbability}`);
            
            if (maxTemp !== undefined || minTemp !== undefined) {
              console.log(`[tenki.jp] 今日・明日追加: ${formattedDate}`, { maxTemp, minTemp, condition, rainProbability });
              weeklyWeather.push({
                date: formattedDate,
                maxTemp: maxTemp,
                minTemp: minTemp,
                condition: condition || undefined,
                rainProbability: rainProbability,
                icon: undefined
              });
              seenDates.add(formattedDate);
            }
          }
        });
    } catch (tenkiError) {
      console.error('tenki.jpスクレイピングエラー:', tenkiError);
    }

    // 重複を除去（日付で判定）
    const uniqueWeather = [];
    const seenDatesForUnique = new Set();
    for (const item of weeklyWeather) {
      // 日付ラベルを正規化して比較
      const normalizedDate = item.date.replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '').trim();
      if (!seenDatesForUnique.has(normalizedDate) && !seenDatesForUnique.has(item.date)) {
        seenDatesForUnique.add(normalizedDate);
        seenDatesForUnique.add(item.date);
        uniqueWeather.push(item);
      }
    }

    console.log(`週間天気取得完了: ${uniqueWeather.length}件`);
    console.log(`[tenki.jp] 最終データ:`, uniqueWeather.map(item => ({
      date: item.date,
      maxTemp: item.maxTemp,
      minTemp: item.minTemp,
      condition: item.condition,
      rainProbability: item.rainProbability
    })));

    // 今日と明日のデータを優先的に先頭に配置
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowDay = tomorrow.getDate();
    
    // 今日と明日の日付パターンを生成（複数の形式に対応）
    const todayPatterns = [
      `${todayMonth}/${todayDay}`,
      `${String(todayMonth).padStart(2, '0')}/${String(todayDay).padStart(2, '0')}`,
      `${todayMonth}月${todayDay}日`,
      `今日`
    ];
    const tomorrowPatterns = [
      `${tomorrowMonth}/${tomorrowDay}`,
      `${String(tomorrowMonth).padStart(2, '0')}/${String(tomorrowDay).padStart(2, '0')}`,
      `${tomorrowMonth}月${tomorrowDay}日`,
      `明日`
    ];
    
    // 今日と明日のデータを分離
    const todayItems = [];
    const tomorrowItems = [];
    const otherItems = [];
    
    uniqueWeather.forEach(item => {
      const dateStr = item.date;
      const isToday = todayPatterns.some(pattern => dateStr.includes(pattern)) || dateStr === '今日';
      const isTomorrow = tomorrowPatterns.some(pattern => dateStr.includes(pattern)) || dateStr === '明日';
      
      if (isToday) {
        todayItems.push(item);
      } else if (isTomorrow) {
        tomorrowItems.push(item);
      } else {
        otherItems.push(item);
      }
    });
    
    // 今日、明日、その他の順で並べ替え
    const sortedWeather = [...todayItems, ...tomorrowItems, ...otherItems];
    
    console.log(`[tenki.jp] ソート後のデータ:`, sortedWeather.map(item => ({
      date: item.date,
      maxTemp: item.maxTemp,
      minTemp: item.minTemp,
      rainProbability: item.rainProbability
    })));

    // CORSを許可してJSONを返す
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200'); // 10分キャッシュ、20分間は古いデータでも返す（天気は更新頻度が低いため長め）
    res.status(200).json({ weekly: sortedWeather.slice(0, 10) }); // 最大10日分
  } catch (error) {
    console.error('Unexpected error in /api/nhk-weekly-weather:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

