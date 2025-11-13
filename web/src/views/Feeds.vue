<template>
  <div class="feeds-page">
    <h1>订阅管理</h1>

    <div class="header">
      <button @click="$router.push('/users')">← 返回用户列表</button>
      <div v-if="rssStore.currentUser" class="current-user-info">
        当前用户: {{ rssStore.currentUser.name }}
      </div>
    </div>

    <div v-if="!rssStore.currentUser" class="no-user">
      请先选择一个用户
    </div>

    <template v-else>
      <div class="section">
        <h2>添加新订阅</h2>
        <div class="form">
          <input v-model="newFeed.title" placeholder="订阅标题" />
          <input v-model="newFeed.feedUrl" placeholder="RSS Feed URL" />
          <input v-model="newFeed.link" placeholder="网站链接" />
          <input v-model="newFeed.description" placeholder="描述（可选）" />
          <button @click="handleCreateFeed" :disabled="rssStore.loading">添加</button>
        </div>
      </div>

      <div class="section">
        <h2>我的订阅</h2>
        <div v-if="rssStore.loading" class="loading">加载中...</div>
        <div v-if="rssStore.error" class="error">{{ rssStore.error }}</div>
        <div class="feed-list">
          <div v-for="feed in rssStore.feeds" :key="feed.id" class="feed-item">
            <div class="feed-info">
              <h3>{{ feed.title }}</h3>
              <p>{{ feed.description }}</p>
              <a :href="feed.link" target="_blank">{{ feed.link }}</a>
              <p class="feed-url">Feed URL: {{ feed.feedUrl }}</p>
              <div class="meta">
                <span :class="{ active: feed.isActive, inactive: !feed.isActive }">
                  {{ feed.isActive ? '活跃' : '已禁用' }}
                </span>
                <span v-if="feed.lastFetchedAt">
                  最后抓取: {{ new Date(feed.lastFetchedAt).toLocaleString() }}
                </span>
                <span v-if="feed.fetchError" class="error-msg">错误: {{ feed.fetchError }}</span>
              </div>
            </div>
            <div class="feed-actions">
              <button @click="handleFetchFeed(feed.id)" :disabled="fetchingFeeds.has(feed.id)">
                {{ fetchingFeeds.has(feed.id) ? '抓取中...' : '🔄 抓取' }}
              </button>
              <button @click="viewFeedArticles(feed.id)">查看文章</button>
              <button @click="handleDeleteFeed(feed.id)" class="danger">删除</button>
            </div>
          </div>
          <div v-if="rssStore.feeds.length === 0" class="empty">
            暂无订阅
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRssStore } from '@/stores/rss';

const router = useRouter();
const rssStore = useRssStore();

const newFeed = ref({
  title: '',
  feedUrl: '',
  link: '',
  description: '',
});

const fetchingFeeds = ref<Set<string>>(new Set());

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
    description: newFeed.value.description || undefined,
    isActive: true,
  });

  if (feed) {
    newFeed.value = { title: '', feedUrl: '', link: '', description: '' };
    alert('添加成功');
  }
}

async function handleDeleteFeed(feedId: string) {
  if (confirm('确定要删除这个订阅吗？')) {
    await rssStore.deleteFeed(feedId);
  }
}

function viewFeedArticles(feedId: string) {
  router.push(`/articles?feedId=${feedId}`);
}

async function handleFetchFeed(feedId: string) {
  fetchingFeeds.value.add(feedId);
  try {
    const result = await rssStore.fetchRssFeed(feedId);
    if (result) {
      alert(`抓取成功！新增 ${result.articleCount} 篇文章`);
      // 刷新订阅列表
      if (rssStore.currentUser) {
        await rssStore.fetchFeedsByUser(rssStore.currentUser.id);
      }
    }
  } finally {
    fetchingFeeds.value.delete(feedId);
  }
}

onMounted(() => {
  if (rssStore.currentUser) {
    rssStore.fetchFeedsByUser(rssStore.currentUser.id);
  }
});
</script>

<style scoped>
.feeds-page {
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

.header button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.current-user-info {
  font-weight: bold;
}

.no-user {
  padding: 40px;
  text-align: center;
  color: #999;
}

.section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.form input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form button {
  padding: 10px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;
}

.form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.feed-list {
  display: grid;
  gap: 15px;
  margin-top: 10px;
}

.feed-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.feed-info h3 {
  margin: 0 0 8px 0;
}

.feed-info p {
  margin: 5px 0;
  color: #666;
}

.feed-info a {
  color: #42b983;
  text-decoration: none;
}

.feed-url {
  font-size: 12px;
  color: #999;
}

.meta {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  font-size: 14px;
}

.meta span {
  padding: 2px 8px;
  border-radius: 3px;
}

.meta .active {
  background: #d4edda;
  color: #155724;
}

.meta .inactive {
  background: #f8d7da;
  color: #721c24;
}

.error-msg {
  color: #c33;
}

.feed-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feed-actions button {
  padding: 6px 12px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.feed-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feed-actions button.danger {
  background: #dc3545;
}

.empty {
  padding: 40px;
  text-align: center;
  color: #999;
}
</style>
