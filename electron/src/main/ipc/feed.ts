import { ipcMain } from 'electron';
import { db } from '../db';
import { feeds, articles } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { NewFeed, Feed } from '../db/schema';
import { fetchFeedArticles, fetchAllFeedsByUser } from '../services/rss-fetcher';

// 创建 RSS 订阅
ipcMain.handle('feed:create', async (_, data: Omit<NewFeed, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const [feed] = await db.insert(feeds).values(data).returning();
    return { success: true, data: feed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取用户的所有订阅
ipcMain.handle('feed:getByUserId', async (_, userId: string) => {
  try {
    const userFeeds = await db
      .select()
      .from(feeds)
      .where(eq(feeds.userId, userId))
      .orderBy(desc(feeds.createdAt));
    return { success: true, data: userFeeds };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取单个订阅详情
ipcMain.handle('feed:getById', async (_, feedId: string) => {
  try {
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));
    return { success: true, data: feed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 更新订阅
ipcMain.handle('feed:update', async (_, feedId: string, data: Partial<Feed>) => {
  try {
    const [feed] = await db
      .update(feeds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feeds.id, feedId))
      .returning();
    return { success: true, data: feed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 删除订阅
ipcMain.handle('feed:delete', async (_, feedId: string) => {
  try {
    await db.delete(feeds).where(eq(feeds.id, feedId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 更新订阅的最后抓取时间
ipcMain.handle('feed:updateLastFetched', async (_, feedId: string, error?: string) => {
  try {
    await db
      .update(feeds)
      .set({
        lastFetchedAt: new Date(),
        fetchError: error || null,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 抓取单个订阅的文章
ipcMain.handle('feed:fetch', async (_, feedId: string) => {
  try {
    const result = await fetchFeedArticles(feedId);
    return { success: result.success, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 抓取用户所有订阅的文章
ipcMain.handle('feed:fetchAll', async (_, userId: string) => {
  try {
    const results = await fetchAllFeedsByUser(userId);
    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const registerFeedHandlers = () => {
  console.log('✓ Feed IPC handlers registered');
};
