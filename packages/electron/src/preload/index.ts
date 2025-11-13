import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // User API
  user: {
    create: (data: any) => ipcRenderer.invoke('user:create', data),
    getAll: () => ipcRenderer.invoke('user:getAll'),
    getById: (userId: string) => ipcRenderer.invoke('user:getById', userId),
    update: (userId: string, data: any) => ipcRenderer.invoke('user:update', userId, data),
    delete: (userId: string) => ipcRenderer.invoke('user:delete', userId),
  },
  
  // Feed API
  feed: {
    create: (data: any) => ipcRenderer.invoke('feed:create', data),
    getByUserId: (userId: string) => ipcRenderer.invoke('feed:getByUserId', userId),
    getById: (feedId: string) => ipcRenderer.invoke('feed:getById', feedId),
    update: (feedId: string, data: any) => ipcRenderer.invoke('feed:update', feedId, data),
    delete: (feedId: string) => ipcRenderer.invoke('feed:delete', feedId),
    updateLastFetched: (feedId: string, error?: string) => ipcRenderer.invoke('feed:updateLastFetched', feedId, error),
    fetch: (feedId: string) => ipcRenderer.invoke('feed:fetch', feedId),
    fetchAll: (userId: string) => ipcRenderer.invoke('feed:fetchAll', userId),
  },
  
  // Article API
  article: {
    createBatch: (data: any[]) => ipcRenderer.invoke('article:createBatch', data),
    getByFeedId: (feedId: string, limit?: number, offset?: number) => ipcRenderer.invoke('article:getByFeedId', feedId, limit, offset),
    getByUserId: (userId: string, limit?: number, offset?: number) => ipcRenderer.invoke('article:getByUserId', userId, limit, offset),
    getById: (articleId: string) => ipcRenderer.invoke('article:getById', articleId),
    markAsRead: (articleId: string, isRead: boolean, userId?: string) => ipcRenderer.invoke('article:markAsRead', articleId, isRead, userId),
    toggleStar: (articleId: string, isStarred: boolean, userId?: string) => ipcRenderer.invoke('article:toggleStar', articleId, isStarred, userId),
    delete: (articleId: string) => ipcRenderer.invoke('article:delete', articleId),
    getUnreadCount: (userId: string) => ipcRenderer.invoke('article:getUnreadCount', userId),
  },

  // Email API
  email: {
    shareArticle: (to: string, article: any, userId?: string, articleId?: string) => 
      ipcRenderer.invoke('email:share-article', { to, article, userId, articleId }),
  },

  // Stats API
  stats: {
    getEmailLogs: (userId: string, limit?: number) => ipcRenderer.invoke('stats:get-email-logs', userId, limit),
    getDailyStats: (userId: string, days?: number) => ipcRenderer.invoke('stats:get-daily-stats', userId, days),
    getOverallStats: (userId: string) => ipcRenderer.invoke('stats:get-overall-stats', userId),
  },
});
