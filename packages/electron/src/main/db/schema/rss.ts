import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

// RSS 订阅源表
export const feeds = sqliteTable('feeds', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // RSS 基本信息
  title: text('title').notNull(),
  description: text('description'),
  link: text('link').notNull(),
  feedUrl: text('feed_url').notNull().unique(),
  
  // RSS 元数据
  language: text('language'),
  copyright: text('copyright'),
  generator: text('generator'),
  imageUrl: text('image_url'),
  
  // 最后更新
  lastBuildDate: integer('last_build_date', { mode: 'timestamp' }),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
  
  // 状态
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  fetchError: text('fetch_error'),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table): Record<string, any> => ({
  userIdIdx: index('feeds_user_id_idx').on(table.userId),
  feedUrlIdx: index('feeds_feed_url_idx').on(table.feedUrl),
}));

// RSS 文章表
export const articles = sqliteTable('articles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  feedId: text('feed_id')
    .notNull()
    .references(() => feeds.id, { onDelete: 'cascade' }),
  
  // 文章基本信息
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  link: text('link').notNull(),
  guid: text('guid').notNull(),
  
  // 作者信息
  author: text('author'),
  
  // 分类和标签
  categories: text('categories'), // JSON array
  
  // 媒体
  imageUrl: text('image_url'),
  enclosureUrl: text('enclosure_url'),
  enclosureType: text('enclosure_type'),
  enclosureLength: integer('enclosure_length'),
  
  // 时间
  pubDate: integer('pub_date', { mode: 'timestamp' }),
  
  // 阅读状态
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  isStarred: integer('is_starred', { mode: 'boolean' }).notNull().default(false),
  
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
}, (table): Record<string, any> => ({
  feedIdIdx: index('articles_feed_id_idx').on(table.feedId),
  guidIdx: index('articles_guid_idx').on(table.guid),
  pubDateIdx: index('articles_pub_date_idx').on(table.pubDate),
  isReadIdx: index('articles_is_read_idx').on(table.isRead),
}));

// 导出类型
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
