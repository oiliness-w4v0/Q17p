import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, Feed, Article } from '@/types/electron';

const api = window.electronAPI;

// 本地存储的 key
const STORAGE_KEYS = {
  CURRENT_USER_ID: 'rss_current_user_id',
  CURRENT_FEED_ID: 'rss_current_feed_id',
};

export const useRssStore = defineStore('rss', () => {
  const currentUser = ref<User | null>(null);
  const currentFeedId = ref<string | null>(null);
  const users = ref<User[]>([]);
  const feeds = ref<Feed[]>([]);
  const articles = ref<Article[]>([]);
  const unreadCount = ref<number>(0);
  const loading = ref<boolean>(false);
  const error = ref<string>('');

  // User Actions
  async function createUser(data: { name: string; email: string; avatar?: string }) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.user.create(data);
      if (result.success && result.data) {
        users.value.push(result.data);
        return result.data;
      } else {
        error.value = result.error || '创建用户失败';
        return null;
      }
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUsers() {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.user.getAll();
      if (result.success && result.data) {
        users.value = result.data;
      } else {
        error.value = result.error || '获取用户列表失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function setCurrentUser(userId: string) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.user.getById(userId);
      if (result.success && result.data) {
        currentUser.value = result.data;
        // 保存到本地存储
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
        await fetchFeedsByUser(userId);
        await fetchUnreadCount(userId);
      } else {
        error.value = result.error || '获取用户信息失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  function setCurrentFeedId(feedId: string | null) {
    currentFeedId.value = feedId;
    // 保存到本地存储
    if (feedId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_FEED_ID, feedId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_FEED_ID);
    }
  }

  // 恢复上次的状态
  async function restoreLastState() {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const savedFeedId = localStorage.getItem(STORAGE_KEYS.CURRENT_FEED_ID);

    if (savedUserId) {
      await setCurrentUser(savedUserId);
      
      // 恢复订阅源选择状态
      if (savedFeedId && savedFeedId !== 'null') {
        currentFeedId.value = savedFeedId;
      }
    }
  }

  // Feed Actions
  async function createFeed(data: Omit<Feed, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.feed.create(data);
      if (result.success && result.data) {
        feeds.value.push(result.data);
        return result.data;
      } else {
        error.value = result.error || '创建订阅失败';
        return null;
      }
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchFeedsByUser(userId: string) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.feed.getByUserId(userId);
      if (result.success && result.data) {
        feeds.value = result.data;
      } else {
        error.value = result.error || '获取订阅列表失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFeed(feedId: string) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.feed.delete(feedId);
      if (result.success) {
        feeds.value = feeds.value.filter(f => f.id !== feedId);
      } else {
        error.value = result.error || '删除订阅失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRssFeed(feedId: string) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.feed.fetch(feedId);
      if (result.success && result.data) {
        return result.data;
      } else {
        error.value = result.error || '抓取RSS失败';
        return null;
      }
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllRssFeeds(userId: string) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.feed.fetchAll(userId);
      if (result.success && result.data) {
        return result.data;
      } else {
        error.value = result.error || '批量抓取RSS失败';
        return null;
      }
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Article Actions
  async function fetchArticlesByUser(userId: string, limit = 50, offset = 0) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.article.getByUserId(userId, limit, offset);
      if (result.success && result.data) {
        articles.value = result.data;
      } else {
        error.value = result.error || '获取文章列表失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchArticlesByFeed(feedId: string, limit = 50, offset = 0) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.article.getByFeedId(feedId, limit, offset);
      if (result.success && result.data) {
        articles.value = result.data;
      } else {
        error.value = result.error || '获取文章列表失败';
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function markArticleAsRead(articleId: string, isRead: boolean) {
    try {
      const result = await api.article.markAsRead(articleId, isRead, currentUser.value?.id);
      if (result.success && result.data) {
        const index = articles.value.findIndex(a => a.id === articleId);
        if (index !== -1) {
          articles.value[index] = result.data;
        }
        if (currentUser.value) {
          await fetchUnreadCount(currentUser.value.id);
        }
      } else {
        error.value = result.error || '操作失败';
      }
    } catch (e: any) {
      error.value = e.message;
    }
  }

  async function toggleArticleStar(articleId: string, isStarred: boolean) {
    try {
      const result = await api.article.toggleStar(articleId, isStarred, currentUser.value?.id);
      if (result.success && result.data) {
        const index = articles.value.findIndex(a => a.id === articleId);
        if (index !== -1) {
          articles.value[index] = result.data;
        }
      } else {
        error.value = result.error || '操作失败';
      }
    } catch (e: any) {
      error.value = e.message;
    }
  }

  async function fetchUnreadCount(userId: string) {
    try {
      const result = await api.article.getUnreadCount(userId);
      if (result.success && result.data !== undefined) {
        unreadCount.value = result.data;
      }
    } catch (e: any) {
      console.error('获取未读数失败:', e);
    }
  }

  return {
    currentUser,
    currentFeedId,
    users,
    feeds,
    articles,
    unreadCount,
    loading,
    error,
    createUser,
    fetchUsers,
    setCurrentUser,
    setCurrentFeedId,
    restoreLastState,
    createFeed,
    fetchFeedsByUser,
    deleteFeed,
    fetchRssFeed,
    fetchAllRssFeeds,
    fetchArticlesByUser,
    fetchArticlesByFeed,
    markArticleAsRead,
    toggleArticleStar,
    fetchUnreadCount,
  };
});
