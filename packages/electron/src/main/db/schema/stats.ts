import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { articles } from './rss';

// 邮件发送记录表
export const emailLogs = sqliteTable('email_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  articleId: text('article_id')
    .references(() => articles.id, { onDelete: 'set null' }),
  
  // 邮件信息
  recipientEmail: text('recipient_email').notNull(),
  articleTitle: text('article_title').notNull(),
  articleLink: text('article_link').notNull(),
  
  // 发送状态
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorMessage: text('error_message'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table): Record<string, any> => ({
  userIdIdx: index('email_logs_user_id_idx').on(table.userId),
  createdAtIdx: index('email_logs_created_at_idx').on(table.createdAt),
}));

// 每日阅读统计表
export const dailyReadingStats = sqliteTable('daily_reading_stats', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // 统计日期（格式：YYYY-MM-DD）
  date: text('date').notNull(),
  
  // 阅读统计
  articlesRead: integer('articles_read').notNull().default(0),
  articlesStarred: integer('articles_starred').notNull().default(0),
  emailsSent: integer('emails_sent').notNull().default(0),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table): Record<string, any> => ({
  userDateIdx: index('daily_stats_user_date_idx').on(table.userId, table.date),
}));

// 导出类型
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type DailyReadingStat = typeof dailyReadingStats.$inferSelect;
export type NewDailyReadingStat = typeof dailyReadingStats.$inferInsert;
