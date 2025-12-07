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
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  if (to.name !== 'Login' && !isLoggedIn) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
