import { ipcMain } from 'electron';
import { db } from '../db';
import { articles, feeds } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { NewArticle, Article } from '../db/schema';
import { updateDailyStats } from '../services/stats';

// 批量创建文章
ipcMain.handle('article:createBatch', async (_, articlesData: Omit<NewArticle, 'id' | 'createdAt' | 'updatedAt'>[]) => {
  try {
    const result = await db.insert(articles).values(articlesData).returning();
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取订阅的所有文章
ipcMain.handle('article:getByFeedId', async (_, feedId: string, limit: number = 50, offset: number = 0) => {
  try {
    const feedArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.feedId, feedId))
      .orderBy(desc(articles.pubDate))
      .limit(limit)
      .offset(offset);
    return { success: true, data: feedArticles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取用户所有订阅的文章
ipcMain.handle('article:getByUserId', async (_, userId: string, limit: number = 50, offset: number = 0) => {
  try {
    // 先获取用户的所有订阅 ID
    const userFeeds = await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.userId, userId));
    
    if (userFeeds.length === 0) {
      return { success: true, data: [] };
    }
    
    const feedIds = userFeeds.map((f: { id: string }) => f.id);
    
    // 获取这些订阅的所有文章
    const userArticles = await db
      .select()
      .from(articles)
      .where(inArray(articles.feedId, feedIds))
      .orderBy(desc(articles.pubDate))
      .limit(limit)
      .offset(offset);
    
    return { success: true, data: userArticles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取单篇文章
ipcMain.handle('article:getById', async (_, articleId: string) => {
  try {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    return { success: true, data: article };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 标记文章为已读/未读
ipcMain.handle('article:markAsRead', async (_, articleId: string, isRead: boolean, userId?: string) => {
  try {
    const [article] = await db
      .update(articles)
      .set({ isRead, updatedAt: new Date() })
      .where(eq(articles.id, articleId))
      .returning();
    
    // 如果标记为已读且提供了userId，更新统计
    if (isRead && userId) {
      try {
        await updateDailyStats(userId, { articlesRead: 1 });
      } catch (error) {
        console.error('更新阅读统计失败:', error);
      }
    }
    
    return { success: true, data: article };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 标记文章为收藏/取消收藏
ipcMain.handle('article:toggleStar', async (_, articleId: string, isStarred: boolean, userId?: string) => {
  try {
    const [article] = await db
      .update(articles)
      .set({ isStarred, updatedAt: new Date() })
      .where(eq(articles.id, articleId))
      .returning();
    
    // 如果标记为收藏且提供了userId，更新统计
    if (isStarred && userId) {
      try {
        await updateDailyStats(userId, { articlesStarred: 1 });
      } catch (error) {
        console.error('更新收藏统计失败:', error);
      }
    }
    
    return { success: true, data: article };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 删除文章
ipcMain.handle('article:delete', async (_, articleId: string) => {
  try {
    await db.delete(articles).where(eq(articles.id, articleId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取未读文章数量
ipcMain.handle('article:getUnreadCount', async (_, userId: string) => {
  try {
    const userFeeds = await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.userId, userId));
    
    if (userFeeds.length === 0) {
      return { success: true, data: 0 };
    }
    
    const feedIds = userFeeds.map((f: { id: string }) => f.id);
    
    const unreadArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          inArray(articles.feedId, feedIds),
          eq(articles.isRead, false)
        )
      );
    
    return { success: true, data: unreadArticles.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const registerArticleHandlers = () => {
  console.log('✓ Article IPC handlers registered');
};
