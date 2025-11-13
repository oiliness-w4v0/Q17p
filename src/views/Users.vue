<template>
  <div class="users-page">
    <h1>用户管理</h1>
    
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
          @click="rssStore.setCurrentUser(user.id)"
        >
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
            <small>ID: {{ user.id }}</small>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rssStore.currentUser" class="section">
      <h2>当前用户</h2>
      <div class="current-user">
        <p><strong>姓名:</strong> {{ rssStore.currentUser.name }}</p>
        <p><strong>邮箱:</strong> {{ rssStore.currentUser.email }}</p>
        <p><strong>未读文章:</strong> {{ rssStore.unreadCount }}</p>
        <button @click="$router.push('/feeds')">查看订阅</button>
        <button @click="$router.push('/articles')">查看文章</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRssStore } from '@/stores/rss';

const rssStore = useRssStore();

const newUser = ref({
  name: '',
  email: '',
  avatar: '',
});

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

onMounted(() => {
  rssStore.fetchUsers();
});
</script>

<style scoped>
.users-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.form input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form button {
  padding: 8px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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

.user-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.user-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:hover {
  background: #f5f5f5;
}

.user-item.active {
  border-color: #42b983;
  background: #f0fdf4;
}

.user-info h3 {
  margin: 0 0 5px 0;
}

.user-info p {
  margin: 0 0 5px 0;
  color: #666;
}

.user-info small {
  color: #999;
}

.current-user {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.current-user p {
  margin: 10px 0;
}

.current-user button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
