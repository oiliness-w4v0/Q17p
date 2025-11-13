<template>
  <div class="home">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>订阅源</h2>
        <div class="header-actions">
          <button @click="toggleThemeMenu" class="btn-icon" title="主题设置">
            {{ themeStore.isDark ? '🌙' : '☀️' }}
          </button>
          <button @click="$router.push('/stats')" class="btn-icon" title="数据统计">
            📊
          </button>
          <button @click="$router.push('/users')" class="btn-small">切换用户</button>
        </div>
      </div>

      <!-- 主题切换菜单 -->
      <div v-if="showThemeMenu" class="theme-menu">
        <button 
          @click="setTheme('light')" 
          :class="{ active: themeStore.mode === 'light' }"
          class="theme-option"
        >
          ☀️ 浅色
        </button>
        <button 
          @click="setTheme('dark')" 
          :class="{ active: themeStore.mode === 'dark' }"
          class="theme-option"
        >
          🌙 深色
        </button>
        <button 
          @click="setTheme('auto')" 
          :class="{ active: themeStore.mode === 'auto' }"
          class="theme-option"
        >
          💻 跟随系统
        </button>
      </div>

      <div v-if="!rssStore.currentUser" class="no-user">
        <button @click="$router.push('/users')" class="btn-primary">选择用户</button>
      </div>

      <template v-else>
        <div class="user-info">
          <span>{{ rssStore.currentUser.name }}</span>
          <span class="unread-badge" v-if="rssStore.unreadCount > 0">{{ rssStore.unreadCount }}</span>
        </div>

        <div class="feed-actions">
          <button @click="handleFetchAll" :disabled="rssStore.loading" class="btn-small btn-refresh">
            🔄 刷新全部
          </button>
          <button @click="showAddFeed = !showAddFeed" class="btn-small">+ 添加订阅</button>
        </div>

        <div v-if="showAddFeed" class="add-feed-form">
          <input v-model="newFeed.title" placeholder="标题" class="input-small" />
          <input v-model="newFeed.feedUrl" placeholder="RSS URL" class="input-small" />
          <input v-model="newFeed.link" placeholder="网站链接" class="input-small" />
          <div class="form-buttons">
            <button @click="handleCreateFeed" class="btn-small btn-primary">添加</button>
            <button @click="showAddFeed = false" class="btn-small">取消</button>
          </div>
        </div>

        <div class="feed-list">
          <div 
            class="feed-item"
            :class="{ active: currentFeedId === null }"
            @click="loadAllArticles"
          >
            <span class="feed-title">全部文章</span>
            <span class="feed-count">{{ rssStore.articles.length }}</span>
          </div>
          
          <div 
            v-for="feed in rssStore.feeds" 
            :key="feed.id"
            class="feed-item"
            :class="{ active: currentFeedId === feed.id }"
            @click="loadFeedArticles(feed.id)"
          >
            <div class="feed-main">
              <span class="feed-title">{{ feed.title }}</span>
              <div class="feed-meta">
                <span v-if="!feed.isActive" class="feed-inactive">已禁用</span>
              </div>
            </div>
            <div class="feed-controls">
              <button @click.stop="handleFetchFeed(feed.id)" class="btn-icon" title="抓取">
                🔄
              </button>
              <button @click.stop="handleDeleteFeed(feed.id)" class="btn-icon" title="删除">
                ×
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="main-content">
      <div v-if="!rssStore.currentUser" class="welcome">
        <h1>RSS 阅读器</h1>
        <p>请先选择或创建一个用户</p>
      </div>

      <template v-else>
        <div v-if="rssStore.loading" class="loading">加载中...</div>
        <div v-else-if="rssStore.error" class="error">{{ rssStore.error }}</div>
        
        <div v-else class="article-list">
          <div v-for="article in rssStore.articles" :key="article.id" class="article-item">
            <div class="article-header">
              <h3 @click="viewArticle(article.id)" class="article-title-link">
                {{ article.title }}
              </h3>
              <div class="article-actions">
                <button 
                  @click="toggleRead(article)" 
                  :class="{ active: article.isRead }"
                  class="btn-icon"
                  :title="article.isRead ? '标记未读' : '标记已读'"
                >
                  {{ article.isRead ? '✓' : '○' }}
                </button>
                <button 
                  @click="toggleStar(article)" 
                  :class="{ starred: article.isStarred }"
                  class="btn-icon"
                  :title="article.isStarred ? '取消收藏' : '收藏'"
                >
                  {{ article.isStarred ? '★' : '☆' }}
                </button>
              </div>
            </div>

            <div class="article-meta">
              <span v-if="article.author">{{ article.author }}</span>
              <span v-if="article.pubDate">
                {{ formatDate(article.pubDate) }}
              </span>
            </div>

            <div v-if="article.description" class="article-description">
              {{ article.description }}
            </div>

            <div v-if="article.imageUrl" class="article-image">
              <img :src="article.imageUrl" :alt="article.title" />
            </div>
          </div>

          <div v-if="rssStore.articles.length === 0" class="empty">
            暂无文章
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRssStore } from '@/stores/rss';
import { useThemeStore } from '@/stores/theme';
import type { Article } from '@/types/electron';
import type { ThemeMode } from '@/stores/theme';

const router = useRouter();
const rssStore = useRssStore();
const themeStore = useThemeStore();
const currentFeedId = ref<string | null>(null);
const showAddFeed = ref(false);
const showThemeMenu = ref(false);
const fetchingFeeds = ref<Set<string>>(new Set());

function toggleThemeMenu() {
  showThemeMenu.value = !showThemeMenu.value;
}

function setTheme(mode: ThemeMode) {
  themeStore.setThemeMode(mode);
  showThemeMenu.value = false;
}

// 同步本地状态与 store
watch(() => rssStore.currentFeedId, (newVal) => {
  if (newVal !== currentFeedId.value) {
    currentFeedId.value = newVal;
  }
}, { immediate: true });

const newFeed = ref({
  title: '',
  feedUrl: '',
  link: '',
});

function formatDate(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (hours < 48) return '昨天';
  return d.toLocaleDateString('zh-CN');
}

async function loadAllArticles() {
  if (!rssStore.currentUser) return;
  currentFeedId.value = null;
  rssStore.setCurrentFeedId(null);
  await rssStore.fetchArticlesByUser(rssStore.currentUser.id);
}

async function loadFeedArticles(feedId: string) {
  currentFeedId.value = feedId;
  rssStore.setCurrentFeedId(feedId);
  await rssStore.fetchArticlesByFeed(feedId);
}

async function toggleRead(article: Article) {
  await rssStore.markArticleAsRead(article.id, !article.isRead);
}

async function toggleStar(article: Article) {
  await rssStore.toggleArticleStar(article.id, !article.isStarred);
}

function viewArticle(articleId: string) {
  router.push(`/article/${articleId}`);
}

async function handleCreateFeed() {
  if (!rssStore.currentUser) {
    alert('请先选择用户');
    return;
  }

  if (!newFeed.value.title || !newFeed.value.feedUrl || !newFeed.value.link) {
    alert('请填写必填项');
    return;
  }

  const feed = await rssStore.createFeed({
    userId: rssStore.currentUser.id,
    title: newFeed.value.title,
    feedUrl: newFeed.value.feedUrl,
    link: newFeed.value.link,
    isActive: true,
  });

  if (feed) {
    newFeed.value = { title: '', feedUrl: '', link: '' };
    showAddFeed.value = false;
    if (rssStore.currentUser) {
      await rssStore.fetchFeedsByUser(rssStore.currentUser.id);
    }
  }
}

async function handleDeleteFeed(feedId: string) {
  if (confirm('确定要删除这个订阅吗?')) {
    await rssStore.deleteFeed(feedId);
    if (currentFeedId.value === feedId) {
      await loadAllArticles();
    }
  }
}

async function handleFetchFeed(feedId: string) {
  fetchingFeeds.value.add(feedId);
  try {
    const result = await rssStore.fetchRssFeed(feedId);
    if (result && rssStore.currentUser) {
      await rssStore.fetchFeedsByUser(rssStore.currentUser.id);
      if (currentFeedId.value === feedId || currentFeedId.value === null) {
        if (currentFeedId.value) {
          await loadFeedArticles(feedId);
        } else {
          await loadAllArticles();
        }
      }
    }
  } finally {
    fetchingFeeds.value.delete(feedId);
  }
}

async function handleFetchAll() {
  if (!rssStore.currentUser) return;
  
  const results = await rssStore.fetchAllRssFeeds(rssStore.currentUser.id);
  
  if (results) {
    if (currentFeedId.value) {
      await loadFeedArticles(currentFeedId.value);
    } else {
      await loadAllArticles();
    }
  }
}

onMounted(async () => {
  // 首先尝试恢复上次的状态
  await rssStore.restoreLastState();
  
  // 如果成功恢复了用户状态
  if (rssStore.currentUser) {
    // 恢复订阅列表
    await rssStore.fetchFeedsByUser(rssStore.currentUser.id);
    
    // 恢复文章列表（根据上次选择的订阅源）
    if (rssStore.currentFeedId) {
      await loadFeedArticles(rssStore.currentFeedId);
    } else {
      await loadAllArticles();
    }
  }
});
</script>

<style scoped>
.home {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.theme-menu {
  padding: 8px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-option {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.theme-option:hover {
  background: var(--bg-tertiary);
}

.theme-option.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.user-info {
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-primary);
}

.unread-badge {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.no-user {
  padding: 20px 12px;
  text-align: center;
}

.feed-actions {
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
}

.add-feed-form {
  padding: 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-buttons {
  display: flex;
  gap: 6px;
}

.feed-list {
  flex: 1;
  overflow-y: auto;
}

.feed-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  transition: background 0.15s;
}

.feed-item:hover {
  background: var(--bg-secondary);
}

.feed-item.active {
  background: #e8f5e9;
  border-left: 3px solid var(--accent-color);
}

.feed-main {
  flex: 1;
  min-width: 0;
}

.feed-title {
  display: block;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.feed-inactive {
  color: #dc3545;
}

.feed-controls {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.feed-item:hover .feed-controls {
  opacity: 1;
}

.feed-count {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-left: 8px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.welcome h1 {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.welcome p {
  font-size: 14px;
  color: var(--text-secondary);
}

.loading, .error {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.error {
  color: var(--error-text);
}

.article-list {
  padding: 16px;
}

.article-item {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  transition: all 0.15s;
}

.article-item:hover {
  background: var(--bg-tertiary);
  box-shadow: 0 2px 4px var(--shadow);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.article-header h3 {
  margin: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.article-title-link {
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.15s;
}

.article-title-link:hover {
  color: var(--accent-color);
}

.article-actions {
  display: flex;
  gap: 4px;
}

.article-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.article-description {
  margin: 8px 0;
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-image {
  margin: 8px 0;
}

.article-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  max-height: 300px;
  object-fit: cover;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* 按钮样式 */
.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-small:hover {
  background: var(--bg-tertiary);
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-refresh {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-refresh:hover:not(:disabled) {
  background: #2980b9;
}

.btn-icon {
  padding: 2px 6px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 24px;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
}

.btn-icon.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-icon.starred {
  background: #ffd700;
  color: #333;
  border-color: #ffd700;
}

.input-small {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
}

.input-small:focus {
  outline: none;
  border-color: var(--accent-color);
}
</style>
