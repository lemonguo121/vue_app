<template>
  <div class="app-wrapper">
    <!-- 左侧菜单 -->
    <el-menu
      :default-active="activeMenu"
      class="el-menu-vertical"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <div class="logo">管理后台</div>

      <el-menu-item index="/version-manager">
        <el-icon><iphone /></el-icon>
        <span>版本管理</span>
      </el-menu-item>

      <el-menu-item index="/ad-manager">
        <el-icon><picture /></el-icon>
        <span>广告配置</span>
      </el-menu-item>
    </el-menu>

    <!-- 右侧内容 -->
    <div class="main-container">
      <div class="header">
        <span>管理员</span>
        <el-button link @click="handleLogout">退出登录</el-button>
      </div>
      <div class="content">
        <!-- 路由出口，显示 VersionManager 或 AdManager -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 需要安装图标库: npm install @element-plus/icons-vue
import { Iphone, Picture } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  localStorage.removeItem('isLoggedIn')
  router.push('/login')
}
</script>

<style scoped>
.app-wrapper { display: flex; height: 100vh; width: 100%; }
.el-menu-vertical { width: 220px; height: 100%; border-right: none; }
.logo { height: 60px; line-height: 60px; color: white; text-align: center; font-size: 20px; font-weight: bold; background: #2b3648; }
.main-container { flex: 1; display: flex; flex-direction: column; background: #f0f2f5; }
.header { height: 50px; background: white; display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,21,41,.08); }
.content { padding: 20px; flex: 1; overflow: auto; }
</style>
