export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feed {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  link: string;
  feedUrl: string;
  language?: string | null;
  copyright?: string | null;
  generator?: string | null;
  imageUrl?: string | null;
  lastBuildDate?: Date | null;
  lastFetchedAt?: Date | null;
  isActive: boolean;
  fetchError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  description?: string | null;
  content?: string | null;
  link: string;
  guid: string;
  author?: string | null;
  categories?: string | null;
  imageUrl?: string | null;
  enclosureUrl?: string | null;
  enclosureType?: string | null;
  enclosureLength?: number | null;
  pubDate?: Date | null;
  isRead: boolean;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RssFetchResult {
  success: boolean;
  feedId: string;
  articleCount: number;
  error?: string;
}

export interface EmailLog {
  id: string;
  userId: string;
  articleId?: string | null;
  recipientEmail: string;
  articleTitle: string;
  articleLink: string;
  success: boolean;
  errorMessage?: string | null;
  createdAt: Date;
}

export interface DailyReadingStat {
  id?: string;
  userId?: string;
  date: string;
  articlesRead: number;
  articlesStarred: number;
  emailsSent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OverallStats {
  articles: {
    total: number;
    read: number;
    starred: number;
    unread: number;
  };
  emails: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface ElectronAPI {
  user: {
    create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<User>>;
    getAll: () => Promise<IpcResponse<User[]>>;
    getById: (userId: string) => Promise<IpcResponse<User>>;
    update: (userId: string, data: Partial<User>) => Promise<IpcResponse<User>>;
    delete: (userId: string) => Promise<IpcResponse>;
  };
  feed: {
    create: (data: Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IpcResponse<Feed>>;
    getByUserId: (userId: string) => Promise<IpcResponse<Feed[]>>;
    getById: (feedId: string) => Promise<IpcResponse<Feed>>;
    update: (feedId: string, data: Partial<Feed>) => Promise<IpcResponse<Feed>>;
    delete: (feedId: string) => Promise<IpcResponse>;
    updateLastFetched: (feedId: string, error?: string) => Promise<IpcResponse>;
    fetch: (feedId: string) => Promise<IpcResponse<RssFetchResult>>;
    fetchAll: (userId: string) => Promise<IpcResponse<RssFetchResult[]>>;
  };
  article: {
    createBatch: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<IpcResponse<Article[]>>;
    getByFeedId: (feedId: string, limit?: number, offset?: number) => Promise<IpcResponse<Article[]>>;
    getByUserId: (userId: string, limit?: number, offset?: number) => Promise<IpcResponse<Article[]>>;
    getById: (articleId: string) => Promise<IpcResponse<Article>>;
    markAsRead: (articleId: string, isRead: boolean, userId?: string) => Promise<IpcResponse<Article>>;
    toggleStar: (articleId: string, isStarred: boolean, userId?: string) => Promise<IpcResponse<Article>>;
    delete: (articleId: string) => Promise<IpcResponse>;
    getUnreadCount: (userId: string) => Promise<IpcResponse<number>>;
  };
  email: {
    shareArticle: (to: string, article: {
      title: string;
      link: string;
      author?: string;
      pubDate?: string;
      description?: string;
    }, userId?: string, articleId?: string) => Promise<IpcResponse>;
  };
  stats: {
    getEmailLogs: (userId: string, limit?: number) => Promise<IpcResponse<EmailLog[]>>;
    getDailyStats: (userId: string, days?: number) => Promise<IpcResponse<DailyReadingStat[]>>;
    getOverallStats: (userId: string) => Promise<IpcResponse<OverallStats>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
