<template>
  <div class="article-detail">
    <div class="article-header-bar">
      <button @click="goBack" class="btn-back">← 返回</button>
      <div class="article-actions">
        <button 
          @click="toggleRead" 
          :class="{ active: article?.isRead }"
          class="btn-action"
        >
          {{ article?.isRead ? '✓ 已读' : '○ 未读' }}
        </button>
        <button 
          @click="toggleStar" 
          :class="{ starred: article?.isStarred }"
          class="btn-action"
        >
          {{ article?.isStarred ? '★ 已收藏' : '☆ 收藏' }}
        </button>
        <button 
          @click="showEmailDialog = true" 
          class="btn-action"
        >
          📧 分享
        </button>
      </div>
    </div>

    <!-- 邮件分享对话框 -->
    <div v-if="showEmailDialog" class="modal-overlay" @click="showEmailDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>分享文章到邮箱</h3>
          <button @click="showEmailDialog = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <label for="email-input">收件人邮箱：</label>
          <input 
            id="email-input"
            v-model="emailAddress" 
            type="email" 
            placeholder="请输入邮箱地址"
            class="email-input"
            @keyup.enter="handleShareEmail"
          />
        </div>
        <div class="modal-footer">
          <button @click="showEmailDialog = false" class="btn-secondary">取消</button>
          <button @click="handleShareEmail" :disabled="!emailAddress || sharing" class="btn-primary">
            {{ sharing ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="article" class="article-content">
      <h1 class="article-title">{{ article.title }}</h1>
      
      <div class="article-meta">
        <span v-if="article.author" class="meta-item">
          <strong>作者:</strong> {{ article.author }}
        </span>
        <span v-if="article.pubDate" class="meta-item">
          <strong>发布:</strong> {{ formatDate(article.pubDate) }}
        </span>
        <a 
          v-if="article.link" 
          :href="article.link" 
          target="_blank" 
          class="meta-item meta-link"
        >
          原文链接 ↗
        </a>
      </div>

      <div v-if="article.imageUrl" class="article-hero-image">
        <img :src="article.imageUrl" :alt="article.title" />
      </div>

      <div v-if="article.description" class="article-description">
        <div v-html="sanitizeHtml(article.description)"></div>
      </div>

      <div v-if="article.content" class="article-body">
        <div v-html="sanitizeHtml(article.content)"></div>
      </div>
    </div>
    <div v-else class="empty">
      文章不存在
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRssStore } from '@/stores/rss';
import type { Article } from '@/types/electron';

const route = useRoute();
const router = useRouter();
const rssStore = useRssStore();

const article = ref<Article | null>(null);
const loading = ref(false);
const error = ref('');
const showEmailDialog = ref(false);
const emailAddress = ref('');
const sharing = ref(false);

const articleId = computed(() => route.params.id as string);

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 简单的 HTML 清理函数
function sanitizeHtml(html: string) {
  // 这里可以使用 DOMPurify 等库进行更安全的清理
  // 目前暂时直接返回，实际使用时建议添加安全处理
  return html;
}

function goBack() {
  router.push('/');
}

async function toggleRead() {
  if (!article.value) return;
  await rssStore.markArticleAsRead(article.value.id, !article.value.isRead);
  article.value.isRead = !article.value.isRead;
}

async function toggleStar() {
  if (!article.value) return;
  await rssStore.toggleArticleStar(article.value.id, !article.value.isStarred);
  article.value.isStarred = !article.value.isStarred;
}

async function handleShareEmail() {
  if (!article.value || !emailAddress.value) return;
  
  sharing.value = true;
  try {
    const result = await window.electronAPI.email.shareArticle(
      emailAddress.value,
      {
        title: article.value.title,
        link: article.value.link,
        author: article.value.author || undefined,
        pubDate: article.value.pubDate?.toString(),
        description: article.value.description || undefined,
      },
      rssStore.currentUser?.id,
      article.value.id
    );

    if (result.success) {
      alert('分享成功！邮件已发送');
      showEmailDialog.value = false;
      emailAddress.value = '';
    } else {
      alert(`分享失败：${result.error || '未知错误'}`);
    }
  } catch (err: any) {
    alert(`分享失败：${err.message || '未知错误'}`);
  } finally {
    sharing.value = false;
  }
}

async function loadArticle() {
  if (!articleId.value) {
    error.value = '缺少文章ID';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // 从当前已加载的文章列表中查找
    const foundArticle = rssStore.articles.find(a => a.id === articleId.value);
    
    if (foundArticle) {
      article.value = foundArticle;
      // 自动标记为已读
      if (!foundArticle.isRead) {
        await rssStore.markArticleAsRead(foundArticle.id, true);
        article.value.isRead = true;
      }
    } else {
      error.value = '文章未找到';
    }
  } catch (e: any) {
    error.value = e.message || '加载文章失败';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 恢复用户状态
  await rssStore.restoreLastState();
  
  // 如果文章列表为空，尝试加载
  if (rssStore.articles.length === 0 && rssStore.currentUser) {
    if (rssStore.currentFeedId) {
      await rssStore.fetchArticlesByFeed(rssStore.currentFeedId);
    } else {
      await rssStore.fetchArticlesByUser(rssStore.currentUser.id);
    }
  }
  
  await loadArticle();
});
</script>

<style scoped>
.article-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.article-header-bar {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
}

.btn-back {
  padding: 6px 16px;
  font-size: 13px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-back:hover {
  background: var(--border-color);
  border-color: var(--text-tertiary);
}

.article-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.btn-action:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-secondary);
}

.btn-action.active {
  background: #0969da;
  color: white;
  border-color: #0969da;
}

.btn-action.starred {
  background: #fb8500;
  color: white;
  border-color: #fb8500;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(27, 31, 36, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.btn-close:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 20px;
}

.modal-body label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.email-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.15s;
}

.email-input:focus {
  outline: none;
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-secondary {
  padding: 6px 16px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-primary {
  padding: 6px 16px;
  font-size: 14px;
  border: 1px solid #0969da;
  background: #0969da;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: #0860ca;
  border-color: #0860ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading,
.error,
.empty {
  padding: 40px;
  text-align: center;
  font-size: 13px;
}

.error {
  color: var(--error-text);
}

.article-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-link {
  color: var(--accent-color);
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

.article-hero-image {
  margin-bottom: 24px;
}

.article-hero-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  max-height: 500px;
  object-fit: cover;
}

.article-description {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-left: 4px solid var(--accent-color);
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.article-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.article-body :deep(h1) {
  font-size: 24px;
}

.article-body :deep(h2) {
  font-size: 20px;
}

.article-body :deep(h3) {
  font-size: 18px;
}

.article-body :deep(p) {
  margin-bottom: 16px;
}

.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
}

.article-body :deep(a) {
  color: var(--accent-color);
  text-decoration: none;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
}

.article-body :deep(code) {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.article-body :deep(pre) {
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-body :deep(pre code) {
  padding: 0;
  background: none;
}

.article-body :deep(blockquote) {
  margin: 16px 0;
  padding-left: 16px;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
  font-style: italic;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.article-body :deep(li) {
  margin-bottom: 8px;
}
</style>
