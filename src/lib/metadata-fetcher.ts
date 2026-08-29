// app/news/page.tsx

import { NewsItem } from '@/components/news-card';
import * as cheerio from 'cheerio'; // Make sure cheerio is installed: npm install cheerio

// Function to fetch and parse a single news article (as previously defined)
export async function fetchAndParseNews(url: string): Promise<NewsItem | null> {
  // ... (Paste the entire fetchAndParseNews function code here) ...
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!response.ok) {
      console.error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled News Article';

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
      'No summary available.';

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
          `Could not parse date string "${dateString}" from ${url}. Error: ${e}`
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
    console.error(`Error processing ${url}:`, error);
    return null;
  }
}
