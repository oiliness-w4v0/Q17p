import { db } from '../db';
import { emailLogs, dailyReadingStats, articles } from '../db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

// 记录邮件发送
export async function logEmailSent(data: {
  userId: string;
  articleId?: string;
  recipientEmail: string;
  articleTitle: string;
  articleLink: string;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    // 插入邮件日志
    const [log] = await db.insert(emailLogs).values({
      userId: data.userId,
      articleId: data.articleId,
      recipientEmail: data.recipientEmail,
      articleTitle: data.articleTitle,
      articleLink: data.articleLink,
      success: data.success,
      errorMessage: data.errorMessage,
    }).returning();

    // 如果发送成功，更新今日统计
    if (data.success) {
      await updateDailyStats(data.userId, { emailsSent: 1 });
    }

    return log;
  } catch (error) {
    console.error('记录邮件发送失败:', error);
    throw error;
  }
}

// 获取邮件发送历史
export async function getEmailLogs(userId: string, limit = 50) {
  try {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId))
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);

    return logs;
  } catch (error) {
    console.error('获取邮件日志失败:', error);
    throw error;
  }
}

// 更新每日统计
export async function updateDailyStats(
  userId: string,
  increment: {
    articlesRead?: number;
    articlesStarred?: number;
    emailsSent?: number;
  }
) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 查找今天的记录
    const [existing] = await db
      .select()
      .from(dailyReadingStats)
      .where(
        and(
          eq(dailyReadingStats.userId, userId),
          eq(dailyReadingStats.date, today)
        )
      );

    if (existing) {
      // 更新现有记录
      const [updated] = await db
        .update(dailyReadingStats)
        .set({
          articlesRead: sql`${dailyReadingStats.articlesRead} + ${increment.articlesRead || 0}`,
          articlesStarred: sql`${dailyReadingStats.articlesStarred} + ${increment.articlesStarred || 0}`,
          emailsSent: sql`${dailyReadingStats.emailsSent} + ${increment.emailsSent || 0}`,
          updatedAt: new Date(),
        })
        .where(eq(dailyReadingStats.id, existing.id))
        .returning();

      return updated;
    } else {
      // 创建新记录
      const [created] = await db
        .insert(dailyReadingStats)
        .values({
          userId,
          date: today,
          articlesRead: increment.articlesRead || 0,
          articlesStarred: increment.articlesStarred || 0,
          emailsSent: increment.emailsSent || 0,
        })
        .returning();

      return created;
    }
  } catch (error) {
    console.error('更新每日统计失败:', error);
    throw error;
  }
}

// 获取近N天的阅读统计
export async function getDailyStats(userId: string, days = 7) {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const dateThreshold = daysAgo.toISOString().split('T')[0];

    const stats = await db
      .select()
      .from(dailyReadingStats)
      .where(
        and(
          eq(dailyReadingStats.userId, userId),
          gte(dailyReadingStats.date, dateThreshold)
        )
      )
      .orderBy(dailyReadingStats.date);

    // 填充缺失的日期
    const filledStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = stats.find(s => s.date === dateStr);
      filledStats.push(existing || {
        date: dateStr,
        articlesRead: 0,
        articlesStarred: 0,
        emailsSent: 0,
      });
    }

    return filledStats;
  } catch (error) {
    console.error('获取每日统计失败:', error);
    throw error;
  }
}

// 获取总体统计
export async function getOverallStats(userId: string) {
  try {
    // 总文章数、已读数、收藏数
    const [articleStats] = await db
      .select({
        total: sql<number>`count(*)`,
        read: sql<number>`sum(case when ${articles.isRead} = 1 then 1 else 0 end)`,
        starred: sql<number>`sum(case when ${articles.isStarred} = 1 then 1 else 0 end)`,
      })
      .from(articles)
      .innerJoin(
        sql`feeds`,
        sql`feeds.id = ${articles.feedId} AND feeds.user_id = ${userId}`
      );

    // 总邮件发送数
    const [emailStats] = await db
      .select({
        total: sql<number>`count(*)`,
        successful: sql<number>`sum(case when ${emailLogs.success} = 1 then 1 else 0 end)`,
      })
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId));

    return {
      articles: {
        total: Number(articleStats?.total || 0),
        read: Number(articleStats?.read || 0),
        starred: Number(articleStats?.starred || 0),
        unread: Number(articleStats?.total || 0) - Number(articleStats?.read || 0),
      },
      emails: {
        total: Number(emailStats?.total || 0),
        successful: Number(emailStats?.successful || 0),
        failed: Number(emailStats?.total || 0) - Number(emailStats?.successful || 0),
      },
    };
  } catch (error) {
    console.error('获取总体统计失败:', error);
    throw error;
  }
}
