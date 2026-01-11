<template>
  <div class="version-manager-container">
    <!-- 左侧：编辑区域 -->
    <el-card class="editor-panel">
      <template #header>
        <div class="card-header">
          <h2>📱 应用版本管理</h2>
          <div>
            <el-button @click="addNewApp" :icon="Plus" plain>新建应用</el-button>
            <el-button @click="fetchVersions" :icon="Refresh">重置</el-button>
            <el-button type="primary" @click="saveVersions" :loading="loading" :icon="Check">保存上线</el-button>
          </div>
        </div>
      </template>

      <!-- 应用切换 Tabs -->
      <el-tabs
        v-model="activeApp"
        type="card"
        class="app-tabs"
        editable
        @edit="handleTabEdit"
      >
        <el-tab-pane
          v-for="(versionData, appId) in versionConfig"
          :key="appId"
          :label="formatAppName(appId)"
          :name="appId"
        >
          <!-- 版本信息展示与编辑 -->
          <el-descriptions title="当前版本信息" :column="1" border style="margin-top: 20px;">
            <el-descriptions-item label="应用ID">{{ appId }}</el-descriptions-item>
            <el-descriptions-item label="版本号">
              <el-input v-model="versionData.versionName" placeholder="如 1.0.0" size="small" style="width: 200px;" />
            </el-descriptions-item>
            <el-descriptions-item label="版本Code">
              <el-input-number v-model="versionData.versionCode" :min="1" size="small" style="width: 200px;" />
            </el-descriptions-item>
            <el-descriptions-item label="下载方式">
              <el-radio-group v-model="versionData.downloadType" size="small">
                <el-radio label="direct">应用内直接下载</el-radio>
                <el-radio label="web">跳转浏览器下载</el-radio>
              </el-radio-group>
            </el-descriptions-item>
            <el-descriptions-item label="下载地址">
              <el-input v-model="versionData.downLoadUrl" placeholder="https://..." size="small" />
            </el-descriptions-item>
            <el-descriptions-item label="是否强制更新">
              <el-switch v-model="versionData.isMust" />
            </el-descriptions-item>
            <el-descriptions-item label="更新说明">
              <el-input
                v-model="versionData.updateDes"
                type="textarea"
                :rows="4"
                placeholder="请输入更新说明"
              />
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 右侧：API文档 -->
    <div class="api-doc-panel">
      <el-card>
        <template #header>
          <h3>📖 API 使用文档</h3>
        </template>

        <div class="doc-section">
          <h4>获取版本信息</h4>
          <el-tag>GET</el-tag>
          <code class="api-url">{{ apiBase }}/api/version?appId={{ activeApp }}</code>
          <p class="doc-note">不传 appId 参数时，默认返回 clickmate 应用（兼容老版本）</p>

          <h5>返回示例：</h5>
          <pre class="code-block">{{ exampleResponse }}</pre>

          <h4 style="margin-top: 20px;">字段说明</h4>
          <ul class="field-list">
            <li><strong>downloadType:</strong> "direct" = 应用内直接下载，"web" = 跳转浏览器</li>
            <li><strong>isMust:</strong> true = 强制更新，false = 可选更新</li>
          </ul>
        </div>
      </el-card>
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
const versionConfig = ref({}) // 存放所有应用版本配置 { clickmate: {...}, otherapp: {...} }
const activeApp = ref('clickmate') // 当前选中的 Tab
let apiBase = ''

// === 计算属性 ===
const exampleResponse = computed(() => {
  const currentVersion = versionConfig.value[activeApp.value]
  if (!currentVersion) return '{}'
  return JSON.stringify(currentVersion, null, 2)
})

// === 方法 ===

const formatAppName = (appId) => {
  const map = {
    'clickmate': '懒人连点器 (ClickMate)',
    'lmplayer': 'LM播放器 (LMPlayer)',
  }
  return map[appId] || appId
}

// 初始化
onMounted(async () => {
  const config = await getConfig()
  apiBase = config.apiBaseUrl || ''
  fetchVersions()
})

// 拉取数据
const fetchVersions = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${apiBase}/api/version/manage/list`)
    const serverData = res.data.data || {}

    // 确保至少有一个默认应用
    if (Object.keys(serverData).length === 0) {
      serverData.clickmate = {
        versionName: '1.0.0',
        versionCode: 1,
        downloadType: 'direct',
        downLoadUrl: '',
        updateDes: '',
        isMust: false
      }
    }

    versionConfig.value = serverData
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error(error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 保存数据
const saveVersions = async () => {
  loading.value = true
  try {
    const res = await axios.post(`${apiBase}/api/version/manage/save`, versionConfig.value)
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
    addNewApp()
  } else if (action === 'remove') {
    removeApp(targetName)
  }
}

// 删除应用
const removeApp = (targetName) => {
  ElMessageBox.confirm(
    `确定要删除应用 "${formatAppName(targetName)}" 及其版本配置吗？`,
    '高危操作警告',
    {
      confirmButtonText: '狠心删除',
      cancelButtonText: '点错了',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    delete versionConfig.value[targetName]

    // 如果删的是当前选中的 Tab，自动切到别的 Tab
    if (activeApp.value === targetName) {
      const keys = Object.keys(versionConfig.value)
      activeApp.value = keys.length > 0 ? keys[0] : ''
    }

    ElMessage.success('应用已删除 (记得点击保存生效)')
  }).catch(() => {
    // 取消删除
  })
}

// 添加新应用
const addNewApp = () => {
  ElMessageBox.prompt('请输入新应用的英文ID (如: myapp)', '新建应用', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-z_]+$/,
    inputErrorMessage: '只能包含小写字母和下划线'
  }).then(({ value }) => {
    if (versionConfig.value[value]) {
      ElMessage.warning('该应用已存在')
      return
    }

    // 添加新应用配置
    versionConfig.value[value] = {
      versionName: '1.0.0',
      versionCode: 1,
      downloadType: 'direct',
      downLoadUrl: '',
      updateDes: '首次发布',
      isMust: false
    }

    // 自动切换到新 Tab
    activeApp.value = value
    ElMessage.success(`添加成功: ${value}`)
  })
}
</script>

<style scoped>
.version-manager-container {
  display: flex;
  height: calc(100vh - 80px);
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

.app-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

/* === 右侧API文档 === */
.api-doc-panel {
  width: 400px;
  overflow-y: auto;
}

.doc-section {
  font-size: 14px;
  line-height: 1.6;
}

.doc-section h4 {
  margin: 15px 0 10px;
  color: #333;
}

.doc-section h5 {
  margin: 10px 0 5px;
  color: #666;
}

.api-url {
  display: block;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0;
  font-size: 13px;
  word-break: break-all;
}

.doc-note {
  color: #909399;
  font-size: 12px;
  margin: 5px 0;
}

.code-block {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.field-list {
  list-style: none;
  padding: 0;
}

.field-list li {
  padding: 5px 0;
  color: #606266;
}

.el-tag {
  margin-right: 8px;
}
</style>