import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import VersionManager from '../views/VersionManager.vue'
import AdManager from '../views/AdManager.vue' // 新导入

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Home,
    redirect: '/version-manager', // 默认跳到版本管理
    children: [
      {
        path: 'version-manager',
        name: 'VersionManager',
        component: VersionManager
      },
      {
        path: 'ad-manager', // 新增路由
        name: 'AdManager',
        component: AdManager
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简单的路由守卫：没登录就踢回登录页
// src/router/index.js

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (to.path === '/login') {
    // A. 如果要去登录页
    if (isLoggedIn) {
      // 已经登录了，就别去登录页了，直接踢回首页
      next('/');
    } else {
      // 没登录，正常放行去登录页
      next();
    }
  } else {
    // B. 如果要去非登录页（比如首页、广告页）
    if (isLoggedIn) {
      // 登录了，放行
      next();
    } else {
      // 没登录，强制踢回登录页
      next('/login');
    }
  }
});


export default router
