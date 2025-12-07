<template>
  <div class="ad-manager-container">
    <!-- 左侧：编辑区域 -->
    <el-card class="editor-panel">
      <template #header>
        <div class="card-header">
          <h2>📺 广告配置</h2>
          <div>
          <el-button @click="addNewPosition" :icon="Plus" plain>新建广告位</el-button>
            <el-button @click="fetchAds" :icon="Refresh">重置</el-button>
            <el-button type="primary" @click="saveAds" :loading="loading" :icon="Check">保存上线</el-button>
          </div>
        </div>
      </template>

      <!-- 广告位切换 Tabs -->
      <el-tabs
        v-model="activePosition"
        type="card"
        class="position-tabs"
        editable
        @edit="handleTabEdit"
      >
        <el-tab-pane
          v-for="(ads, positionName) in adData"
          :key="positionName"
          :label="formatPositionName(positionName)"
          :name="positionName"
        >
          <!-- 广告列表 -->
          <div class="ad-list">
            <el-collapse accordion>
              <el-collapse-item
                v-for="(ad, index) in ads"
                :key="index"
                :name="index"
              >
                <template #title>
                  <div class="ad-item-header">
                    <el-tag size="small" :type="ad.status === 1 ? 'success' : 'info'">
                      {{ ad.status === 1 ? '上线中' : '已下线' }}
                    </el-tag>
                    <span class="ad-title">{{ ad.title || '未命名广告' }}</span>
                    <el-button
                      type="danger"
                      link
                      :icon="Delete"
                      @click.stop="removeAd(positionName, index)"
                    >删除</el-button>
                  </div>
                </template>

                <!-- 广告编辑表单 -->
                <el-form label-width="80px" size="small">
                  <el-form-item label="标题">
                    <el-input v-model="ad.title" placeholder="后台备注用" />
                  </el-form-item>

                  <el-form-item label="图片URL">
                    <el-input v-model="ad.imageUrl" placeholder="https://..." />
                  </el-form-item>

                  <el-form-item label="跳转URL">
                    <el-input v-model="ad.linkUrl" placeholder="点击跳转地址" />
                  </el-form-item>

                  <el-form-item label="状态">
                    <el-radio-group v-model="ad.status">
                      <el-radio :label="1">上线</el-radio>
                      <el-radio :label="0">下线</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item label="ID">
                    <el-input v-model="ad.id" disabled style="width: 100px;" />
                  </el-form-item>
                </el-form>
              </el-collapse-item>
            </el-collapse>

            <!-- 添加按钮 -->
            <el-button
              class="add-btn"
              type="dashed"
              plain
              style="width: 100%; margin-top: 15px;"
              :icon="Plus"
              @click="addAd(positionName)"
            >
              添加一个新广告
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 右侧：预览区域 -->
    <div class="preview-panel">
      <div class="phone-mockup">
        <div class="notch"></div>
        <div class="screen">
          <!-- 状态栏模拟 -->
          <div class="status-bar">
            <span>12:00</span>
            <span>📶 🔋</span>
          </div>

          <!-- 预览内容：根据当前选中的 Tab 渲染 -->

          <!-- 场景1: 开屏广告 (Splash) -->
          <div v-if="activePosition === 'splash'" class="preview-splash">
            <div v-if="currentActiveAds.length > 0" class="splash-content" :style="{ backgroundImage: `url(${currentActiveAds[0].imageUrl})` }">
              <div class="skip-btn">跳过 3s</div>
              <div class="ad-label">广告</div>
            </div>
            <div v-else class="empty-state">
              当前无上线开屏广告
            </div>
          </div>

          <!-- 场景2: 首页Banner (home_banner) -->
          <div v-else-if="activePosition === 'home_banner'" class="preview-home">
            <div class="app-header">My App</div>
            <div class="banner-container">
              <div v-if="currentActiveAds.length > 0" class="banner-wrapper">
                <!-- 简单模拟轮播图的第一张 -->
                <img :src="currentActiveAds[0].imageUrl" class="banner-img" />
                <div class="dots">
                  <span v-for="n in currentActiveAds.length" :key="n" :class="{active: n===1}"></span>
                </div>
              </div>
              <div v-else class="empty-banner">Banner位空缺</div>
            </div>
            <div class="list-mock">
              <div class="list-item" v-for="n in 3" :key="n"></div>
            </div>
          </div>

          <!-- 默认兜底 -->
          <div v-else class="preview-generic">
            <h3>{{ activePosition }}</h3>
            <div v-for="ad in currentActiveAds" :key="ad.id" class="generic-ad-item">
              <img :src="ad.imageUrl" />
              <p>{{ ad.title }}</p>
            </div>
          </div>

        </div>
        <div class="home-indicator"></div>
      </div>
      <p class="preview-hint">实时预览：仅展示{{ activePosition }}位的第一条有效数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Refresh, Check } from '@element-plus/icons-vue'
import { getConfig } from '../utils/config'

// === 数据状态 ===
const loading = ref(false)
const adData = ref({}) // 存放所有广告数据 { splash: [], home_banner: [] }
const activePosition = ref('splash') // 当前选中的 Tab
let apiBase = ''

// === 计算属性 ===

// 获取当前 Tab 下所有“上线”状态的广告，用于预览
const currentActiveAds = computed(() => {
  const ads = adData.value[activePosition.value] || []
  // 预览只看上线的，且有图片的
  return ads.filter(ad => ad.status === 1 && ad.imageUrl)
})

// === 方法 ===

const formatPositionName = (key) => {
  const map = {
    'splash': '开屏广告 (Splash)',
    'home_banner': '首页轮播 (Banner)',

    // ===在此处添加新类型===
    'popup': '首页弹窗 (Popup)',       // <--- 新增
    'profile_banner': '个人中心横幅'    // <--- 新增
  }

  // 如果 map 里没有，就直接显示 key 本身 (兜底逻辑)
  return map[key] || key
}

// 初始化
onMounted(async () => {
  const config = await getConfig()
  apiBase = config.apiBaseUrl || ''
  fetchAds()
})

// 拉取数据
const fetchAds = async () => {
  loading.value = true
  try {
  const res = await axios.get(`${apiBase}/api/ads/manage/list`)
    const serverData = res.data.data || {}

    // 补全默认 Key
    if (!serverData.splash) serverData.splash = []
    if (!serverData.home_banner) serverData.home_banner = []

    // ===在此处添加新类型的初始化===
    if (!serverData.popup) serverData.popup = [] // <--- 新增

    adData.value = serverData
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error(error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 保存数据
const saveAds = async () => {
  loading.value = true
  try {
    const res = await axios.post(`${apiBase}/api/ads/manage/save`, adData.value)
    if (res.data.success) {
      ElMessage.success('保存成功！')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error('保存请求失败')
  } finally {
    loading.value = false
  }
}

// 处理 Tab 的编辑事件（新增和删除）
const handleTabEdit = (targetName, action) => {
  if (action === 'add') {
    addNewPosition() // 复用之前说的添加逻辑
  } else if (action === 'remove') {
    removePosition(targetName)
  }
}

// 删除广告位逻辑
const removePosition = (targetName) => {
  // 1. 防误删提示
  ElMessageBox.confirm(
    `确定要删除广告位 "${formatPositionName(targetName)}" 及其所有广告吗？`,
    '高危操作警告',
    {
      confirmButtonText: '狠心删除',
      cancelButtonText: '点错了',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    // 2. 执行删除
    delete adData.value[targetName] // 删除数据对象中的 key

    // 3. 界面处理：如果删的是当前选中的 Tab，要自动切到别的 Tab
    if (activePosition.value === targetName) {
      const keys = Object.keys(adData.value)
      activePosition.value = keys.length > 0 ? keys[0] : ''
    }

    ElMessage.success('广告位已删除 (记得点击保存生效)')
  }).catch(() => {
    // 取消删除，不做操作
  })
}

// 添加广告位
const addNewPosition = () => {
  ElMessageBox.prompt('请输入新广告位的英文Key (如: user_top)', '新建广告位', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-z_]+$/,
    inputErrorMessage: '只能包含小写字母和下划线'
  }).then(({ value }) => {
    if (adData.value[value]) {
      ElMessage.warning('该广告位已存在')
      return
    }
    // 动态添加响应式属性
    adData.value[value] = []
    // 自动切换到新 Tab
    activePosition.value = value
    ElMessage.success(`添加成功: ${value}`)
  })
}


// 添加广告
const addAd = (position) => {
  const newAd = {
    id: Date.now(), // 生成一个临时 ID
    title: '新广告',
    imageUrl: '',
    linkUrl: '',
    status: 0 // 默认下线
  }
  if (!adData.value[position]) {
    adData.value[position] = []
  }
  adData.value[position].push(newAd)
}

// 删除广告
const removeAd = (position, index) => {
  ElMessageBox.confirm('确定要删除这条广告配置吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    adData.value[position].splice(index, 1)
    ElMessage.success('已删除 (记得点击保存)')
  })
}
</script>

<style scoped>
.ad-manager-container {
  display: flex;
  height: calc(100vh - 80px); /* 减去顶部导航高度 */
  gap: 20px;
}

/* === 左侧编辑器 === */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 穿透修改 Element Plus Tabs 样式，使其占满高度 */
:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.ad-item-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}
.ad-title {
  flex: 1;
  font-weight: bold;
}

/* === 右侧预览 === */
.preview-panel {
  width: 320px; /* 模拟手机宽度 */
  background: #f5f7fa;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.phone-mockup {
  width: 280px;
  height: 580px;
  background: #fff;
  border-radius: 30px;
  border: 8px solid #333;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 20px;
  background: #333;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  z-index: 10;
}

.screen {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  overflow: hidden;
}

.status-bar {
  height: 24px;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  color: #000;
  margin-top: 5px;
}

.home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: #000;
  border-radius: 2px;
  opacity: 0.2;
}

.preview-hint {
  margin-top: 15px;
  color: #999;
  font-size: 12px;
}

/* === 预览内容样式：Splash === */
.preview-splash .splash-content {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-size: cover;
  background-position: center;
  background-color: #eee;
}
.skip-btn {
  position: absolute;
  top: 40px;
  right: 20px;
  background: rgba(0,0,0,0.3);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}
.ad-label {
  position: absolute;
  bottom: 20px;
  right: 10px;
  background: rgba(0,0,0,0.2);
  color: white;
  padding: 2px 4px;
  font-size: 10px;
  border: 1px solid rgba(255,255,255,0.5);
}

/* === 预览内容样式：Home Banner === */
.preview-home .app-header {
  height: 44px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  padding-left: 15px;
  font-weight: bold;
}
.banner-container {
  padding: 10px;
}
.banner-wrapper {
  width: 100%;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.empty-banner {
  width: 100%;
  height: 140px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  border-radius: 8px;
}
.dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}
.dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
}
.dots span.active {
  background: #fff;
}
.list-mock {
  padding: 0 10px;
}
.list-item {
  height: 60px;
  background: #f9f9f9;
  margin-bottom: 10px;
  border-radius: 4px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* === 预览样式：通用 === */
.preview-generic {
  padding: 20px;
}
.generic-ad-item img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 5px;
}
</style>
