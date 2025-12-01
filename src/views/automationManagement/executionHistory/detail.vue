<template>
  <div class="execution-detail-page">
    <div class="detail-header">
      <el-button link type="primary" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="detail-title"> 执行历史：【{{ taskId }}】 {{ taskInfo.executionTime }} </div>
    </div>

    <div class="detail-content">
      <div class="left-panel">
        <div class="search-group">
          <el-input
            v-model="filters.hostId"
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
            <div class="host-ip">{{ host.internalIp }}</div>
          </div>

          <el-empty
            v-if="filteredHosts.length === 0"
            description="暂无匹配的主机"
            :image-size="80"
          />
        </div>
      </div>

      <div class="log-panel" v-loading="logLoading">
        <div v-if="selectedHost" class="log-header">
          <div>
            <span class="log-host-id">主机ID：{{ selectedHost.hostId }}</span>
            <span class="log-host-ip">内网IP：{{ selectedHost.internalIp }}</span>
          </div>
          <el-tag :type="statusTagType(selectedHost.status)" size="small">
            {{ statusText(selectedHost.status) }}
          </el-tag>
        </div>
        <div v-else class="log-header">请选择左侧主机查看日志</div>

        <div class="log-viewer">
          <pre>{{ selectedHost?.log || '暂无日志' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

interface HostLogItem {
  hostId: string
  internalIp: string
  publicIp: string
  status: 'running' | 'success' | 'failed'
  log: string
}
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const route = useRoute()
const router = useRouter()

const taskId = route.params.taskId as string

const taskInfo = reactive({
  executionTime: '2025-10-28 10:29:09',
  hosts: [
    {
      hostId: '3',
      internalIp: '172.21.0.10',
      publicIp: '192.168.21.20',
      status: 'running',
      log: '### Waiting for scheduling ...\n### Executing ...\n执行结果：进行中\n总耗时：0.5秒'
    },
    {
      hostId: '6',
      internalIp: '172.21.0.11',
      publicIp: '192.168.21.21',
      status: 'success',
      log: '### Waiting for scheduling ...\n### Executing ...\n执行结果：成功\n总耗时：0.3秒'
    },
    {
      hostId: '9',
      internalIp: '172.21.0.12',
      publicIp: '192.168.21.22',
      status: 'failed',
      log: '### Waiting for scheduling ...\n### Executing ...\n-bash: xxx: command not found\n执行结果：失败'
    }
  ] as HostLogItem[]
})

const filters = reactive({
  hostId: (route.query.hostId as string) || '',
  internalIp: (route.query.internalIp as string) || ''
})

const activeStatus = ref('all')
const selectedHostId = ref<string>((route.query.hostId as string) || '')
const logLoading = ref(false)

const statusOptions: Record<string, string> = {
  running: '进行中',
  success: '成功',
  failed: '失败'
}

const filteredHosts = computed(() => {
  return taskInfo.hosts.filter((host) => {
    const matchHostId = filters.hostId ? host.hostId.includes(filters.hostId) : true
    const matchInternal = filters.internalIp ? host.internalIp.includes(filters.internalIp) : true
    const matchStatus = activeStatus.value === 'all' ? true : host.status === activeStatus.value
    return matchHostId && matchInternal && matchStatus
  })
})

const statusTabs = computed(() => [
  { label: '所有', value: 'all', count: taskInfo.hosts.length },
  {
    label: '进行中',
    value: 'running',
    count: taskInfo.hosts.filter((h) => h.status === 'running').length
  },
  {
    label: '成功',
    value: 'success',
    count: taskInfo.hosts.filter((h) => h.status === 'success').length
  },
  {
    label: '失败',
    value: 'failed',
    count: taskInfo.hosts.filter((h) => h.status === 'failed').length
  }
])

const selectedHost = computed(() =>
  taskInfo.hosts.find((host) => host.hostId === selectedHostId.value)
)

watch(
  filteredHosts,
  (hosts) => {
    if (hosts.length === 0) {
      selectedHostId.value = ''
      return
    }
    if (!hosts.find((host) => host.hostId === selectedHostId.value)) {
      selectedHostId.value = hosts[0].hostId
    }
  },
  { immediate: true }
)

const handleSelectHost = (hostId: string) => {
  selectedHostId.value = hostId
}

const statusTagType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    success: 'success',
    running: 'warning',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const statusText = (status: string) => statusOptions[status] || status

const handleBack = () => {
  router.back()
}
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

  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: #e5eaf3;

    .log-host-ip,
    .log-host-id {
      margin-right: 16px;
      font-size: 14px;
    }
  }

  .log-viewer {
    flex: 1;
    background: #111318;
    border-radius: 10px;
    padding: 16px;
    overflow: auto;
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #38ef7d;
  }
}
</style>
