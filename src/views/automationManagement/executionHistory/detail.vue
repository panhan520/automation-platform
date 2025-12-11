<template>
  <div class="execution-detail-page">
    <div class="detail-header">
      <el-button link type="primary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="detail-title"> 执行历史：【{{ taskInfo?.name }}】 {{ taskInfo?.run_time }} </div>
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
            :key="host.id"
            class="host-item"
            :class="{ active: host.id === selectedHostId }"
            @click="handleSelectHost(host.id)"
          >
            <div class="host-id">[{{ host.id }}] [内]</div>
            <div class="host-ip">{{ host.innerIp }}</div>
          </div>

          <el-empty v-if="filteredHosts.length === 0" description="暂无数据" :image-size="80" />
        </div>
      </div>

      <div class="log-panel" v-loading="logLoading">
        <div
          class="log-viewer"
          :class="
            !formattedLog.logHtml ? 'no-log' : activeStatus === 1 ? 'failed-log' : 'success-log'
          "
        >
          <pre v-html="formattedLog.logHtml || '暂无日志'"></pre>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { apiGetHistoryTaskDetail } from '@/api/executionHistory'
interface HostLogItem {
  id: string
  innerIp: string
  publicIp: string
  status: 0 | 1
  output: string
  duration: string
  appTypeName: string
  hostName: string
}
type HostOutputData = [number, string, string, string, string, string, string]
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId as string
const hostList = ref<HostLogItem[]>([])
const loading = ref(false)
const taskInfo = reactive({
  name: '',
  run_time: ''
})
const filters = reactive({
  query: ''
})

const activeStatus = ref(1)
const selectedHostId = ref<string>((route.query.id as string) || '')
const logLoading = ref(false)
// 筛选
const filteredHosts = computed(() => {
  return hostList.value.filter((host) => {
    const query = filters.query?.toString() ?? ''

    const queryMatch = filters.query
      ? host.id?.toString().includes(query) ||
        host.innerIp?.toString().includes(query) ||
        host.publicIp?.toString().includes(query)
      : true

    const matchStatus = host.status === activeStatus.value
    return queryMatch && matchStatus
  })
})
// 状态标签
const statusTabs = computed(() => [
  {
    label: '成功',
    value: 0,
    count: hostList.value.filter((h) => h.status === 0).length
  },
  {
    label: '失败',
    value: 1,
    count: hostList.value.filter((h) => h.status === 1).length
  }
])

const selectedHost = computed(() => hostList.value.find((host) => host.id === selectedHostId.value))

const formattedLog = computed(() => {
  const raw = selectedHost.value?.output
  if (!raw) return { logHtml: '' }

  const parseArrayOutput = () => {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const [status, duration, content] = parsed
        const statusText = String(status ?? '')
        const durationText =
          typeof duration === 'number' ? `${duration.toFixed(3)}s` : String(duration ?? '')
        const body = typeof content === 'string' ? content : ''
        const bodyHtml = escapeHtml(body).replace(/\n/g, '<br>')
        const statusClass = statusText === 'success' ? 'log-status-success' : 'log-status-failed'
        const statusHtml = `<span class="log-status ${statusClass}">${statusText}${
          durationText ? ` (${durationText})` : ''
        }</span>`
        return `${statusHtml}<br>${bodyHtml}`
      }
    } catch (e) {
      // ignore parse errors and fallback
    }
    return ''
  }

  const arrayHtml = parseArrayOutput()
  if (arrayHtml) {
    return { logHtml: arrayHtml }
  }

  const bodyHtml = escapeHtml(String(raw)).replace(/\n/g, '<br>')
  return { logHtml: bodyHtml }
})

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

watch(
  filteredHosts,
  (hosts) => {
    if (hosts.length === 0) {
      selectedHostId.value = ''
      return
    }
    if (!hosts.find((host) => host.id === selectedHostId.value)) {
      selectedHostId.value = hosts[0].id
    }
  },
  { immediate: true }
)

const handleSelectHost = (id: string) => {
  selectedHostId.value = id
}
const handleBack = () => {
  router.back()
}
const getDetail = async () => {
  try {
    loading.value = true
    const res = await apiGetHistoryTaskDetail(taskId)
    taskInfo.name = res.data.list[0].name
    taskInfo.run_time = res.data.list[0].run_time
    // 解析 output 数据
    const outputData = JSON.parse(res.data.list[0].output)
    // 转换数据格式
    const transformedList = Object.entries(outputData).map(([id, dataArray]) => {
      const [status, duration, output, publicIp, innerIp, appTypeName, hostName] =
        dataArray as HostOutputData
      return {
        id,
        status: status as 0 | 1, // 类型转换,
        duration,
        output,
        publicIp,
        innerIp,
        appTypeName,
        hostName
      }
    })
    hostList.value = transformedList
    // 设置 activeStatus
    if (!transformedList.some((item) => item.status === 1)) {
      activeStatus.value = 0
    }
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  getDetail()
})
</script>
<style scoped lang="less">
.execution-detail-page {
  padding: 10px;
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
    grid-template-columns: 400px 1fr;
    gap: 10px;
    flex: 1;
    .left-panel {
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: solid 1px #e5eaf3;
      max-height: calc(100vh - 80px);
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
          display: inline-flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 48%;
          margin: 0 1% 8px;

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
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 80px);
      .log-viewer {
        flex: 1;
        background: #111318;
        border-radius: 10px;
        padding: 16px;
        overflow: auto;
        font-family: 'Fira Code', monospace;
        font-size: 13px;
        line-height: 1.6;
        .log-status {
          font-weight: 600;
          &.log-status-success {
            color: #52c41a;
          }
          &.log-status-failed {
            color: #ff4d4f;
          }
        }
      }
      .success-log {
        color: #52c41a;
      }
      .failed-log {
        color: #ff4d4f;
      }
      .no-log {
        color: #ffffff;
      }
    }
  }
}
</style>
