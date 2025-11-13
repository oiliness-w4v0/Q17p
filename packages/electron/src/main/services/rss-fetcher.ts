import Parser from 'rss-parser';
import { db } from '../db';
import { feeds, articles } from '../db/schema';
import { eq } from 'drizzle-orm';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

interface RssFetchResult {
  success: boolean;
  feedId: string;
  articleCount: number;
  error?: string;
}

/**
 * 抓取单个 RSS 订阅的文章
 */
export async function fetchFeedArticles(feedId: string): Promise<RssFetchResult> {
  try {
    // 获取订阅信息
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));
    
    if (!feed) {
      return {
        success: false,
        feedId,
        articleCount: 0,
        error: '订阅不存在',
      };
    }

    // 解析 RSS
    const rssFeed = await parser.parseURL(feed.feedUrl);

    // 更新订阅信息
    await db
      .update(feeds)
      .set({
        title: rssFeed.title || feed.title,
        description: rssFeed.description || feed.description,
        link: rssFeed.link || feed.link,
        language: rssFeed.language,
        copyright: rssFeed.copyright,
        generator: rssFeed.generator,
        imageUrl: rssFeed.image?.url || rssFeed.itunes?.image || feed.imageUrl,
        lastBuildDate: rssFeed.lastBuildDate ? new Date(rssFeed.lastBuildDate) : null,
        lastFetchedAt: new Date(),
        fetchError: null,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));

    // 准备文章数据
    const newArticles = [];
    
    for (const item of rssFeed.items) {
      if (!item.guid && !item.link) continue;

      // 提取图片 URL
      let imageUrl = item.enclosure?.url || null;
      if (!imageUrl && item['media:content']) {
        const mediaContent: any = item['media:content'];
        if (Array.isArray(mediaContent)) {
          imageUrl = mediaContent[0]?.$?.url || null;
        } else if (mediaContent?.$ ?.url) {
          imageUrl = mediaContent.$.url;
        }
      }
      if (!imageUrl && item['media:thumbnail']) {
        const thumbnail: any = item['media:thumbnail'];
        imageUrl = thumbnail?.$ ?.url || null;
      }

      // 提取内容
      let content = item['content:encoded'] || item.content || item.contentSnippet || null;

      // 提取分类
      let categories: string[] = [];
      if (item.categories && Array.isArray(item.categories)) {
        categories = item.categories;
      }

      const articleData = {
        feedId,
        title: item.title || 'Untitled',
        description: item.summary || item.contentSnippet || null,
        content,
        link: item.link || '',
        guid: item.guid || item.link || '',
        author: item.creator || (item as any).author || null,
        categories: categories.length > 0 ? JSON.stringify(categories) : null,
        imageUrl,
        enclosureUrl: item.enclosure?.url || null,
        enclosureType: item.enclosure?.type || null,
        enclosureLength: item.enclosure?.length ? parseInt(String(item.enclosure.length)) : null,
        pubDate: item.pubDate ? new Date(item.pubDate) : item.isoDate ? new Date(item.isoDate) : null,
        isRead: false,
        isStarred: false,
      };

      newArticles.push(articleData);
    }

    // 批量插入文章（忽略重复的 guid）
    let insertedCount = 0;
    for (const article of newArticles) {
      try {
        // 检查文章是否已存在
        const existing = await db
          .select()
          .from(articles)
          .where(eq(articles.guid, article.guid))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(articles).values(article);
          insertedCount++;
        }
      } catch (error) {
        // 忽略重复插入错误
        console.warn(`跳过重复文章: ${article.guid}`);
      }
    }

    return {
      success: true,
      feedId,
      articleCount: insertedCount,
    };
  } catch (error: any) {
    console.error(`抓取 RSS 失败 (${feedId}):`, error);

    // 更新订阅错误信息
    await db
      .update(feeds)
      .set({
        lastFetchedAt: new Date(),
        fetchError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));

    return {
      success: false,
      feedId,
      articleCount: 0,
      error: error.message,
    };
  }
}

/**
 * 抓取用户所有订阅的文章
 */
export async function fetchAllFeedsByUser(userId: string): Promise<RssFetchResult[]> {
  try {
    // 获取用户的所有活跃订阅
    const userFeeds = await db
      .select()
      .from(feeds)
      .where(eq(feeds.userId, userId));

    const results: RssFetchResult[] = [];

    for (const feed of userFeeds) {
      if (feed.isActive) {
        const result = await fetchFeedArticles(feed.id);
        results.push(result);
      }
    }

    return results;
  } catch (error: any) {
    console.error(`抓取用户订阅失败 (${userId}):`, error);
    return [];
  }
}
