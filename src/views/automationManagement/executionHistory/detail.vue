<template>
  <div class="execution-detail-page">
    <div class="detail-header">
      <el-button link type="primary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="detail-title">
        执行历史：【{{ selectedHost?.name }}】 {{ selectedHost?.run_time }}
      </div>
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

          <el-empty
            v-if="filteredHosts.length === 0"
            description="暂无匹配的主机"
            :image-size="80"
          />
        </div>
      </div>

      <div class="log-panel" v-loading="logLoading">
        <div class="log-viewer">
          <pre>{{ selectedHost?.output || '暂无日志' }}</pre>
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
  name: string
  run_time: string
  innerIp: string
  publicIp: string
  status: 0 | 1 | 2
  output: string
}
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId as string
const hostList = ref<HostLogItem[]>([])
const loading = ref(false)
// const taskInfo = reactive({
//   executionTime: '2025-10-28 10:29:09',
//   hosts: [
//     {
//       id: '3',
//       innerIp: '172.21.0.10',
//       publicIp: '192.168.21.20',
//       status: 'running',
//       output: '### Waiting for scheduling ...\n### Executing ...\n执行结果：进行中\n总耗时：0.5秒'
//     },
//     {
//       id: '6',
//       innerIp: '172.21.0.11',
//       publicIp: '192.168.21.21',
//       status: 'success',
//       output: '### Waiting for scheduling ...\n### Executing ...\n执行结果：成功\n总耗时：0.3秒'
//     },
//     {
//       id: '9',
//       innerIp: '172.21.0.12',
//       publicIp: '192.168.21.22',
//       status: 'failed',
//       output: '### Waiting for scheduling ...\n### Executing ...\n-bash: xxx: command not found\n执行结果：失败'
//     }
//   ] as HostLogItem[]
// })

const filters = reactive({
  query: ''
})

const activeStatus = ref(2)
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
    value: 1,
    count: hostList.value.filter((h) => h.status === 1).length
  },
  {
    label: '失败',
    value: 2,
    count: hostList.value.filter((h) => h.status === 2).length
  }
])

const selectedHost = computed(() => hostList.value.find((host) => host.id === selectedHostId.value))

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
    hostList.value = res.data.list
    if (!res.data.list.some((item) => item.status === 2)) {
      activeStatus.value = 1
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
  padding: 20px;
  background: #f5f6f8;
  min-height: calc(100vh - 40px);
  box-sizing: border-box;
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
      min-height: 560px;
      display: flex;
      flex-direction: column;
      .log-viewer {
        flex: 1;
        background: #111318;
        border-radius: 10px;
        padding: 16px;
        overflow: auto;
        font-family: 'Fira Code', monospace;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }
}
</style>
