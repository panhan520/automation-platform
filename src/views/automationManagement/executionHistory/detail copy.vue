<template>
  <div class="execution-detail-page">
    <div class="detail-header">
      <el-button link type="primary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="detail-title"> 执行历史：【{{ taskName }}】 {{ taskInfo.executionTime }} </div>
    </div>

    <div class="detail-content">
      <div class="left-panel">
        <div class="search-group">
          <el-input
            v-model="filters.query"
            placeholder="搜索公网IP/内网IP/主机ID"
            clearable
            prefix-icon="Search"
          />
        </div>

        <div class="status-tabs">
          <el-button-group :direction="direction">
            <el-button
              v-for="tab in statusTabs"
              :key="tab.value"
              :type="activeStatus === tab.value ? 'primary' : 'default'"
              @click="activeStatus = tab.value"
            >
              {{ tab.label }}({{ tab.count }})
            </el-button>
          </el-button-group>
        </div>

        <div class="host-list">
          <div
            v-for="host in filteredHosts"
            :key="host.hostId"
            class="host-item"
            :class="{ active: host.hostId === selectedHostId }"
            @click="handleSelectHost(host.hostId)"
          >
            <div class="host-id">[{{ host.hostId }}] [内]</div>
            <div class="host-ip">{{ host.innerIp }}</div>
          </div>

          <el-empty
            v-if="filteredHosts.length === 0"
            description="暂无匹配的主机"
            :image-size="80"
          />
        </div>
      </div>

      <div class="log-panel" v-loading="logLoading">
        <div class="log-viewer" ref="terminalRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { getToken } from '@/utils/auth'
import request from '@/axios'
// import { PATH_URL } from '@/axios/service'

interface HostOutput {
  hostId: string
  innerIp: string
  data: string
  status: number // -2: 进行中, 0: 成功, 其他: 失败
}

const direction = ref<'horizontal' | 'vertical'>('horizontal')
const taskName = ref<string>('')
const taskInfo = reactive<{
  id: number
  name: string
  executionTime: string
}>({
  id: 0,
  name: '',
  executionTime: ''
})
const route = useRoute()
const router = useRouter()

// 从路由参数获取 token（可能是 taskId 或 token）
const token =
  (route.params.token as string) ||
  (route.query.token as string) ||
  '551518f9f77f49e3ae52241b6892291a'

// 主机输出数据，key 为主机ID
const outputs = reactive<Record<string, HostOutput>>({})

// 状态筛选：'all' 所有, 'running' 进行中, 'success' 成功, 'failed' 失败
const activeStatus = ref('all')
// 顶部筛选条件
const filters = reactive({
  query: ''
})
const selectedHostId = ref<string>((route.query.hostId as string) || '')
const logLoading = ref(false)
// 终端相关
const terminalRef = ref<HTMLElement>()
let term: Terminal | null = null
let fitPlugin: FitAddon | null = null
let socket: WebSocket | null = null
let currentHostId: string | null = null
// 状态选项
const statusTabs = computed(() => [
  { label: '所有', value: 'all', count: Object.keys(outputs).length },
  {
    label: '进行中',
    value: 'running',
    count: statusCounts.value.running
  },
  {
    label: '成功',
    value: 'success',
    count: statusCounts.value.success
  },
  {
    label: '失败',
    value: 'failed',
    count: statusCounts.value.failed
  }
])
// 状态计数
const statusCounts = computed(() => {
  const counts = { running: 0, success: 0, failed: 0 }
  Object.values(outputs).forEach((host) => {
    if (host.status === -2) {
      counts.running++
    } else if (host.status === 0) {
      counts.success++
    } else {
      counts.failed++
    }
  })
  return counts
})

// 过滤后的主机列表
const filteredHosts = computed(() => {
  let items = Object.entries(outputs).map(([hostId, host]) => ({
    hostId,
    innerIp: host.hostId,
    status: host.status === -2 ? 'running' : host.status === 0 ? 'success' : 'failed',
    log: host.data
  }))

  // 按关键词搜索
  if (filters.query) {
    const keyword = filters.query.toLowerCase()
    items = items.filter(
      (host) =>
        host.hostId.toLowerCase().includes(keyword) || host.innerIp.toLowerCase().includes(keyword)
    )
  }

  // 按状态筛选
  if (activeStatus.value !== 'all') {
    items = items.filter((host) => host.status === activeStatus.value)
  }

  return items
})

const selectedHost = computed(() => {
  if (!selectedHostId.value) return null
  const host = outputs[selectedHostId.value]
  if (!host) return null
  return {
    hostId: selectedHostId.value,
    innerIp: host.innerIp,
    publicIp: '',
    status: host.status === -2 ? 'running' : host.status === 0 ? 'success' : 'failed',
    log: host.data
  }
})

// 处理 WebSocket 消息
function handleData(message: string) {
  try {
    const { key, data, status, innerIp } = JSON.parse(message)

    // 初始化主机数据（如果不存在）
    if (!outputs[key]) {
      outputs[key] = {
        hostId: key,
        innerIp,
        data: '',
        status: -2 // 默认进行中
      }
    }

    // 更新状态
    if (status !== undefined) {
      outputs[key].status = status
    }

    // 更新日志数据
    if (data) {
      outputs[key].data += data

      // 如果当前选中的是这个主机，写入终端
      if (String(key) === currentHostId && term) {
        term.write(data)
      }
    }
  } catch (error) {
    console.error('解析 WebSocket 消息失败:', error)
  }
}
// 初始化 WebSocket 连接
function initWebSocket() {
  if (!token) {
    console.error('缺少 token 参数')
    return
  }
  // 构建 WebSocket URL
  let wsUrl: string
  const isDev = import.meta.env.DEV
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL
  console.log('isDev:', isDev)
  console.log('wsBaseUrl:', wsBaseUrl)
  if (isDev) {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = location.host
    wsUrl = `ws://172.31.28.121/api/ws/subscribe/${token}/?x-token=${getToken() || ''}`
  } else {
    // 测试/生产环境：使用环境变量配置的地址
    // wsBaseUrl 可以是完整 URL（如 http://172.31.28.121:8000）或域名（如 172.31.28.121:8000）
    let baseUrl = wsBaseUrl.trim()
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      // 如果没有协议，根据端口判断（8000 通常是 http）
      baseUrl = `http://${baseUrl}`
    }
    const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:'
    const host = baseUrl.replace(/^https?:\/\//, '')
    wsUrl = `${protocol}//${host}/api/ws/subscribe/${token}/?x-token=${getToken() || ''}`
  }
  socket = new WebSocket(wsUrl)
  socket.onopen = () => {
    logLoading.value = false
    const message = '\r\x1b[K\x1b[36m### Waiting for scheduling ...\x1b[0m'
    // 初始化所有主机的初始消息
    Object.keys(outputs).forEach((key) => {
      outputs[key].data = message
    })
    if (term) {
      term.write(message)
    }
    socket?.send('ok')
    // 发送终端尺寸信息
    if (fitPlugin && terminalRef.value) {
      const dimensions = fitPlugin.proposeDimensions()
      if (dimensions) {
        const formData = {
          cols: dimensions.cols,
          rows: dimensions.rows,
          token: token
        }
        request.patch({ url: '/api/v1/exec/do/releaseTask/', data: formData }).catch(console.error)
      }
    }
  }

  socket.onmessage = (e) => {
    if (e.data === 'pong') {
      socket?.send('ping')
    } else {
      handleData(e.data)
    }
  }

  socket.onclose = () => {
    Object.keys(outputs).forEach((key) => {
      if (outputs[key].status === -2) {
        outputs[key].status = -1
      }
      outputs[key].data += '\r\n\x1b[31mWebsocket connection failed!\x1b[0m'
    })

    if (term) {
      term.write('\r\n\x1b[31mWebsocket connection failed!\x1b[0m')
    }
  }

  socket.onerror = (error) => {
    console.error('WebSocket 错误:', error)
    logLoading.value = false
  }
}
// 初始化终端
function initTerminal() {
  if (!terminalRef.value) return
  term = new Terminal({
    disableStdin: true,
    fontSize: 13,
    fontFamily: 'Fira Code, Consolas, Monaco, monospace',
    theme: {
      background: '#111318',
      foreground: '#A9B7C6',
      cursor: '#111318'
    }
  })
  fitPlugin = new FitAddon()
  term.loadAddon(fitPlugin)
  // 自定义按键处理：Ctrl+C 复制
  term.attachCustomKeyEventHandler((arg) => {
    if (arg.ctrlKey && arg.code === 'KeyC' && arg.type === 'keydown') {
      document.execCommand('copy')
      return false
    }
    return true
  })
  term.open(terminalRef.value)
  fitPlugin.fit()
  term.write('\x1b[36m### WebSocket connecting ...\x1b[0m')
}

// 切换主机
function handleSelectHost(hostId: string) {
  selectedHostId.value = hostId
  currentHostId = hostId
  if (term && outputs[hostId]) {
    term.clear()
    term.write(outputs[hostId].data)
  }
}

// 监听窗口大小变化
function handleResize() {
  if (fitPlugin) {
    fitPlugin.fit()
    if (socket?.readyState === WebSocket.OPEN && terminalRef.value) {
      const dimensions = fitPlugin.proposeDimensions()
      if (dimensions) {
        const formData = {
          cols: dimensions.cols,
          rows: dimensions.rows,
          token: token
        }
        request.patch({ url: '/api/v1/exec/do/', data: formData }).catch(console.error)
      }
    }
  }
}

const handleBack = () => {
  router.back()
}

// 自动选择第一个主机
watch(
  filteredHosts,
  (hosts) => {
    if (hosts.length > 0 && !selectedHostId.value) {
      handleSelectHost(hosts[0].hostId)
    } else if (hosts.length === 0) {
      selectedHostId.value = ''
    }
  },
  { immediate: true }
)

onMounted(() => {
  logLoading.value = true
  nextTick(() => {
    initTerminal()
    initWebSocket()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (socket) {
    socket.close()
    socket = null
  }
  if (term) {
    term.dispose()
    term = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="less">
.execution-detail-page {
  padding: 20px;
  background: #f5f6f8;
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .detail-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2329;
  }
}

.detail-content {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
}

.left-panel {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .search-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .status-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .host-list {
    flex: 1;
    overflow: auto;
    max-height: calc(100vh - 260px);

    .host-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;

      .host-id {
        color: #909399;
        margin-right: 6px;
      }

      .host-ip {
        flex: 1;
        color: #303133;
      }

      &.active {
        border-color: #409eff;
        background: #f0f7ff;
      }
    }
  }
}

.log-panel {
  background: #1f2329;
  border-radius: 12px;
  padding: 16px;
  color: #e5eaf3;
  min-height: 560px;
  display: flex;
  flex-direction: column;

  .log-viewer {
    flex: 1;
    background: #111318;
    border-radius: 10px;
    padding: 16px;
    overflow: hidden;

    :deep(.xterm) {
      height: 100%;
    }

    :deep(.xterm-viewport) {
      overflow: auto;
    }
  }
}
</style>
