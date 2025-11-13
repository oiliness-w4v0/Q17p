<template>
  <div class="stats-page">
    <div class="page-header">
      <button @click="goBack" class="btn-back">← 返回</button>
      <h1>数据统计</h1>
      <div class="spacer"></div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!rssStore.currentUser" class="no-user">请先选择用户</div>

    <template v-else>
      <!-- 总体统计卡片 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <div class="stat-label">总文章数</div>
            <div class="stat-value">{{ overallStats?.articles.total || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✓</div>
          <div class="stat-content">
            <div class="stat-label">已读文章</div>
            <div class="stat-value">{{ overallStats?.articles.read || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">★</div>
          <div class="stat-content">
            <div class="stat-label">收藏文章</div>
            <div class="stat-value">{{ overallStats?.articles.starred || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📧</div>
          <div class="stat-content">
            <div class="stat-label">发送邮件</div>
            <div class="stat-value">{{ overallStats?.emails.successful || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 近7天阅读趋势 -->
      <div class="section">
        <h2>近7天阅读趋势</h2>
        <div class="chart-container">
          <div class="chart">
            <div class="chart-bars">
              <div 
                v-for="stat in dailyStats" 
                :key="stat.date"
                class="chart-bar-group"
              >
                <div class="chart-bars-wrapper">
                  <div 
                    class="chart-bar read"
                    :style="{ height: getBarHeight(stat.articlesRead, maxArticlesRead) }"
                    :title="`已读: ${stat.articlesRead}`"
                  ></div>
                  <div 
                    class="chart-bar starred"
                    :style="{ height: getBarHeight(stat.articlesStarred, maxArticlesRead) }"
                    :title="`收藏: ${stat.articlesStarred}`"
                  ></div>
                  <div 
                    class="chart-bar email"
                    :style="{ height: getBarHeight(stat.emailsSent, maxArticlesRead) }"
                    :title="`邮件: ${stat.emailsSent}`"
                  ></div>
                </div>
                <div class="chart-label">{{ formatDate(stat.date) }}</div>
              </div>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color read"></div>
              <span>已读文章</span>
            </div>
            <div class="legend-item">
              <div class="legend-color starred"></div>
              <span>收藏文章</span>
            </div>
            <div class="legend-item">
              <div class="legend-color email"></div>
              <span>发送邮件</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮件发送历史 -->
      <div class="section">
        <h2>邮件发送历史</h2>
        <div v-if="emailLogs.length === 0" class="empty">暂无发送记录</div>
        <div v-else class="email-logs">
          <div 
            v-for="log in emailLogs" 
            :key="log.id"
            class="email-log-item"
            :class="{ failed: !log.success }"
          >
            <div class="log-icon">
              {{ log.success ? '✓' : '✗' }}
            </div>
            <div class="log-content">
              <div class="log-title">{{ log.articleTitle }}</div>
              <div class="log-meta">
                <span>发送至: {{ log.recipientEmail }}</span>
                <span>{{ formatDateTime(log.createdAt) }}</span>
              </div>
              <div v-if="!log.success && log.errorMessage" class="log-error">
                错误: {{ log.errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRssStore } from '@/stores/rss';
import type { EmailLog, DailyReadingStat, OverallStats } from '@/types/electron';

const router = useRouter();
const rssStore = useRssStore();

const loading = ref(false);
const emailLogs = ref<EmailLog[]>([]);
const dailyStats = ref<DailyReadingStat[]>([]);
const overallStats = ref<OverallStats | null>(null);

const maxArticlesRead = computed(() => {
  const max = Math.max(...dailyStats.value.map(s => 
    Math.max(s.articlesRead, s.articlesStarred, s.emailsSent)
  ));
  return max || 1;
});

function goBack() {
  router.push('/');
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBarHeight(value: number, max: number) {
  if (!value || !max) return '0%';
  return `${Math.max((value / max) * 100, 3)}%`;
}

async function loadStats() {
  if (!rssStore.currentUser) return;

  loading.value = true;
  try {
    // 加载总体统计
    const overallResult = await window.electronAPI.stats.getOverallStats(rssStore.currentUser.id);
    if (overallResult.success && overallResult.data) {
      overallStats.value = overallResult.data;
    }

    // 加载近7天统计
    const dailyResult = await window.electronAPI.stats.getDailyStats(rssStore.currentUser.id, 7);
    if (dailyResult.success && dailyResult.data) {
      dailyStats.value = dailyResult.data;
    }

    // 加载邮件历史
    const emailResult = await window.electronAPI.stats.getEmailLogs(rssStore.currentUser.id, 20);
    if (emailResult.success && emailResult.data) {
      emailLogs.value = emailResult.data;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await rssStore.restoreLastState();
  await loadStats();
});
</script>

<style scoped>
.stats-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header h1 {
  font-size: 18px;
  margin: 0;
  flex: 1;
  text-align: center;
  color: var(--text-primary);
}

.btn-back {
  padding: 5px 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-back:hover {
  background: var(--accent-hover);
}

.spacer {
  width: 80px;
}

.loading, .no-user {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px var(--shadow);
  border-color: var(--accent-color);
}

.stat-icon {
  font-size: 32px;
  line-height: 1;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.section h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.chart-container {
  margin-top: 16px;
}

.chart {
  margin-bottom: 16px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 16px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  gap: 4px;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.chart-bars-wrapper {
  width: 100%;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2px;
}

.chart-bar {
  flex: 1;
  max-width: 16px;
  border-radius: 2px 2px 0 0;
  transition: all 0.2s;
  cursor: pointer;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-bar.read {
  background: #0969da;
}

.chart-bar.starred {
  background: #fb8500;
}

.chart-bar.email {
  background: var(--accent-color);
}

.chart-label {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-color.read {
  background: #0969da;
}

.legend-color.starred {
  background: #fb8500;
}

.legend-color.email {
  background: var(--accent-color);
}

.empty {
  padding: 32px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

.email-logs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.15s;
}

.email-log-item:hover {
  background: var(--bg-tertiary);
}

.email-log-item.failed {
  border-left: 3px solid var(--error-text);
}

.log-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border-radius: 50%;
  flex-shrink: 0;
}

.email-log-item:not(.failed) .log-icon {
  background: var(--accent-color);
  color: white;
}

.email-log-item.failed .log-icon {
  background: var(--error-bg);
  color: var(--error-text);
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.log-error {
  margin-top: 4px;
  font-size: 11px;
  color: var(--error-text);
}
</style>
