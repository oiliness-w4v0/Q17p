<template>
  <div class="users-page">
    <div class="page-header">
      <button @click="goBack" class="btn-back">← 返回</button>
      <h1>用户管理</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="section">
      <h2>创建新用户</h2>
      <div class="form">
        <input v-model="newUser.name" placeholder="用户名" />
        <input v-model="newUser.email" placeholder="邮箱" />
        <input v-model="newUser.avatar" placeholder="头像URL（可选）" />
        <button @click="handleCreateUser" :disabled="rssStore.loading">创建</button>
      </div>
    </div>

    <div class="section">
      <h2>用户列表</h2>
      <button @click="rssStore.fetchUsers()" :disabled="rssStore.loading">刷新列表</button>
      <div v-if="rssStore.loading" class="loading">加载中...</div>
      <div v-if="rssStore.error" class="error">{{ rssStore.error }}</div>
      <div class="user-list">
        <div 
          v-for="user in rssStore.users" 
          :key="user.id" 
          class="user-item"
          :class="{ active: rssStore.currentUser?.id === user.id }"
          @click="selectUser(user.id)"
        >
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
            <small>未读: {{ user.id === rssStore.currentUser?.id ? rssStore.unreadCount : '-' }}</small>
          </div>
          <div class="user-actions">
            <span v-if="rssStore.currentUser?.id === user.id" class="current-badge">当前</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRssStore } from '@/stores/rss';

const router = useRouter();
const rssStore = useRssStore();

const newUser = ref({
  name: '',
  email: '',
  avatar: '',
});

function goBack() {
  router.push('/');
}

async function selectUser(userId: string) {
  await rssStore.setCurrentUser(userId);
  // 选择用户后自动返回主页
  router.push('/');
}

async function handleCreateUser() {
  if (!newUser.value.name || !newUser.value.email) {
    alert('请填写姓名和邮箱');
    return;
  }
  
  const user = await rssStore.createUser({
    name: newUser.value.name,
    email: newUser.value.email,
    avatar: newUser.value.avatar || undefined,
  });
  
  if (user) {
    newUser.value = { name: '', email: '', avatar: '' };
    alert('创建成功');
  }
}

onMounted(async () => {
  // 尝试恢复上次的用户状态
  await rssStore.restoreLastState();
  // 刷新用户列表
  await rssStore.fetchUsers();
});
</script>

<style scoped>
.users-page {
  padding: 16px;
  max-width: 900px;
  margin: 0 auto;
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

.section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
}

.section h1 {
  font-size: 18px;
  margin-bottom: 16px;
}

.section h2 {
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 600;
}

.form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.form input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  font-size: 12px;
}

.form button {
  padding: 6px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section > button {
  padding: 5px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 12px;
}

.section > button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}

.error {
  padding: 8px 12px;
  background: var(--error-bg);
  color: var(--error-text);
  border-radius: 3px;
  margin: 8px 0;
  font-size: 12px;
}

.user-list {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.user-item {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.user-item.active {
  border-color: var(--accent-color);
  background: #e8f5e9;
  box-shadow: 0 2px 4px rgba(66, 185, 131, 0.1);
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.user-info p {
  margin: 0 0 4px 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.user-info small {
  color: var(--text-tertiary);
  font-size: 11px;
}

.user-actions {
  display: flex;
  align-items: center;
}

.current-badge {
  padding: 2px 8px;
  background: var(--accent-color);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
</style>
