// app/news/page.tsx

import { NewsItem } from '@/components/news-card';
import * as cheerio from 'cheerio'; // Make sure cheerio is installed: npm install cheerio
import { newsUrls } from './news';

// Function to fetch and parse a single news article (as previously defined)
export async function fetchAndParseNews(prop: typeof newsUrls[number]): Promise<NewsItem | null> {

  if (typeof prop === 'string') {
    const url = prop.trim();

    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        console.warn(`News source returned ${response.status} ${response.statusText}: ${url}`);
        return null;
      }
      const html = await response.text();
      const $ = cheerio.load(html);
  
      const title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text().trim() ||
        $('h1').first().text().trim() ||
        'Berita tanpa judul';
  
      const thumbnail =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('link[rel="image_src"]').attr('href') ||
        $('img.main-article-image').attr('src') ||
        $('article img').first().attr('src') ||
        '/placeholder-image.jpg';
  
      const summary =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        $('p.article-summary').first().text().trim() ||
        $('article p').first().text().trim() ||
        'Ringkasan berita belum tersedia.';
  
      const dateString =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="pubdate"]').attr('content') ||
        $('time[datetime]').attr('datetime') ||
        $('.article-date').text().trim() ||
        $('.post-date').text().trim();
  
      let formattedDate = 'Unknown Date';
      if (dateString) {
        try {
          const dateObj = new Date(dateString);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        } catch (e) {
          console.warn(
            `Could not parse date string "${dateString}" from ${prop}. Error: ${e}`
          );
        }
      }
  
      return {
        link: url,
        title: title,
        imageUrl: thumbnail,
        date: new Date(formattedDate),
        description:
          summary.substring(0, 180).trim() + (summary.length > 180 ? '...' : ''),
      };
    } catch (error) {
      console.warn(`Unable to process news source: ${url}`, error);
      return null;
    }
  }

  return {
    link: prop.url,
    title: prop.title,
    imageUrl: prop.imageUrl || '/placeholder-image.jpg',
    date: prop.date,
    description: prop.description || 'No description available.',
    type: 'file'
  };

  // ... (Paste the entire fetchAndParseNews function code here) ...
}
