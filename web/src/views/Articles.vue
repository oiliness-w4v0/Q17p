<template>
  <div class="articles-page">
    <h1>文章列表</h1>

    <div class="header">
      <button @click="$router.push('/feeds')">← 返回订阅列表</button>
      <div class="header-actions">
        <button @click="handleFetchAll" :disabled="rssStore.loading || !rssStore.currentUser" class="fetch-btn">
          🔄 刷新所有订阅
        </button>
        <div v-if="rssStore.currentUser" class="stats">
          未读: {{ rssStore.unreadCount }}
        </div>
      </div>
    </div>

    <div v-if="!rssStore.currentUser" class="no-user">
      请先选择一个用户
    </div>

    <template v-else>
      <div class="filters">
        <button 
          @click="loadAllArticles" 
          :class="{ active: !currentFeedId }"
        >
          全部文章
        </button>
        <button 
          v-for="feed in rssStore.feeds" 
          :key="feed.id"
          @click="loadFeedArticles(feed.id)"
          :class="{ active: currentFeedId === feed.id }"
        >
          {{ feed.title }}
        </button>
      </div>

      <div v-if="fetchMessage" class="fetch-message">
        {{ fetchMessage }}
      </div>

      <div class="section">
        <div v-if="rssStore.loading" class="loading">加载中...</div>
        <div v-if="rssStore.error" class="error">{{ rssStore.error }}</div>
        
        <div class="article-list">
          <div v-for="article in rssStore.articles" :key="article.id" class="article-item">
            <div class="article-header">
              <h3>
                <a :href="article.link" target="_blank">{{ article.title }}</a>
              </h3>
              <div class="article-actions">
                <button 
                  @click="toggleRead(article)" 
                  :class="{ active: article.isRead }"
                >
                  {{ article.isRead ? '已读' : '未读' }}
                </button>
                <button 
                  @click="toggleStar(article)" 
                  :class="{ starred: article.isStarred }"
                >
                  {{ article.isStarred ? '★' : '☆' }}
                </button>
              </div>
            </div>

            <div class="article-meta">
              <span v-if="article.author">作者: {{ article.author }}</span>
              <span v-if="article.pubDate">
                发布: {{ new Date(article.pubDate).toLocaleString() }}
              </span>
            </div>

            <div v-if="article.description" class="article-description">
              {{ article.description }}
            </div>

            <div v-if="article.imageUrl" class="article-image">
              <img :src="article.imageUrl" :alt="article.title" />
            </div>

            <div class="article-footer">
              <small>GUID: {{ article.guid }}</small>
            </div>
          </div>

          <div v-if="rssStore.articles.length === 0" class="empty">
            暂无文章
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRssStore } from '@/stores/rss';
import type { Article } from '@/types/electron';

const route = useRoute();
const rssStore = useRssStore();
const currentFeedId = ref<string | null>(null);
const fetchMessage = ref<string>('');

async function loadAllArticles() {
  if (!rssStore.currentUser) return;
  currentFeedId.value = null;
  await rssStore.fetchArticlesByUser(rssStore.currentUser.id);
}

async function loadFeedArticles(feedId: string) {
  currentFeedId.value = feedId;
  await rssStore.fetchArticlesByFeed(feedId);
}

async function toggleRead(article: Article) {
  await rssStore.markArticleAsRead(article.id, !article.isRead);
}

async function toggleStar(article: Article) {
  await rssStore.toggleArticleStar(article.id, !article.isStarred);
}

async function handleFetchAll() {
  if (!rssStore.currentUser) return;
  
  fetchMessage.value = '正在抓取RSS...';
  const results = await rssStore.fetchAllRssFeeds(rssStore.currentUser.id);
  
  if (results) {
    const totalArticles = results.reduce((sum, r) => sum + r.articleCount, 0);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    fetchMessage.value = `抓取完成！成功: ${successCount}, 失败: ${failCount}, 新文章: ${totalArticles}`;
    
    // 重新加载文章列表
    if (currentFeedId.value) {
      await loadFeedArticles(currentFeedId.value);
    } else {
      await loadAllArticles();
    }
    
    // 3秒后清空提示
    setTimeout(() => {
      fetchMessage.value = '';
    }, 3000);
  } else {
    fetchMessage.value = '抓取失败';
    setTimeout(() => {
      fetchMessage.value = '';
    }, 3000);
  }
}

onMounted(() => {
  if (rssStore.currentUser) {
    const feedId = route.query.feedId as string;
    if (feedId) {
      loadFeedArticles(feedId);
    } else {
      loadAllArticles();
    }
  }
});
</script>

<style scoped>
.articles-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.header button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.header button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fetch-btn {
  background: #3498db !important;
}

.fetch-btn:hover:not(:disabled) {
  background: #2980b9 !important;
}

.stats {
  font-weight: bold;
  color: #42b983;
}

.no-user {
  padding: 40px;
  text-align: center;
  color: #999;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters button {
  padding: 8px 16px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.filters button:hover {
  background: #e0e0e0;
}

.filters button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.fetch-message {
  padding: 12px;
  margin-bottom: 15px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.section {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error {
  padding: 10px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin: 10px 0;
}

.article-list {
  display: grid;
  gap: 20px;
}

.article-item {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 10px;
}

.article-header h3 {
  margin: 0;
  flex: 1;
}

.article-header h3 a {
  color: #333;
  text-decoration: none;
}

.article-header h3 a:hover {
  color: #42b983;
}

.article-actions {
  display: flex;
  gap: 8px;
}

.article-actions button {
  padding: 4px 12px;
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.article-actions button:hover {
  background: #e0e0e0;
}

.article-actions button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.article-actions button.starred {
  background: #ffd700;
  color: #333;
  border-color: #ffd700;
}

.article-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.article-description {
  margin: 15px 0;
  color: #555;
  line-height: 1.6;
}

.article-image {
  margin: 15px 0;
}

.article-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.article-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.article-footer small {
  color: #999;
  font-size: 12px;
}

.empty {
  padding: 40px;
  text-align: center;
  color: #999;
}
</style>
