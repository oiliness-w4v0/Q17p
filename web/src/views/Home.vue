<template>
  <div class="home">
    <h1>烟熏三文鱼的阅读神器</h1>
    <div class="nav">
      <button @click="$router.push('/users')">用户管理</button>
      <button @click="$router.push('/feeds')">订阅管理</button>
      <button @click="$router.push('/articles')">文章列表</button>
    </div>
    <p class="intro">这是一个基于 Electron + Vue 3 的 RSS 阅读器 Demo</p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 30px;
}

.nav {
  display: flex;
  gap: 20px;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #35a372;
  transform: translateY(-2px);
}

.intro {
  color: #666;
  font-size: 14px;
}
</style>
