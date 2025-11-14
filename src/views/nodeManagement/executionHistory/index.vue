<template>
  <div class="execution-history-page">
    <div class="page-card">
      <div class="page-header">
        <div class="title">执行历史</div>
      </div>

      <div class="filter-row">
        <el-input
          v-model="filters.internalIp"
          placeholder="搜索内网IP"
          clearable
          prefix-icon="Search"
        />
        <el-input
          v-model="filters.publicIp"
          placeholder="搜索公网IP"
          clearable
          prefix-icon="Search"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="displayTableData" border v-loading="loading">
        <el-table-column prop="taskId" label="任务ID" width="120" />
        <el-table-column prop="internalIp" label="内网IP" />
        <el-table-column prop="publicIp" label="公网IP" />
        <el-table-column prop="executionTime" label="执行时间" width="200" />
        <el-table-column prop="executionResult" label="执行结果" width="140">
          <template #default="scope">
            <div class="status-cell">
              <el-icon :class="['status-icon', statusIconClass(scope.row.executionResult)]">
                <component :is="statusIcon(scope.row.executionResult)" />
              </el-icon>
              <span>{{ scope.row.executionResult }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewDetails(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="total-text">共 {{ totalRecords }} 条</div>
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="totalRecords"
          layout="prev, pager, next, sizes"
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CloseBold, RefreshRight } from '@element-plus/icons-vue'

interface ExecutionRecord {
  id: number
  taskId: string
  internalIp: string
  publicIp: string
  executionTime: string
  executionResult: '进行中' | '成功' | '失败'
}

const router = useRouter()

const allRecords = ref<ExecutionRecord[]>([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const filters = reactive({
  internalIp: '',
  publicIp: ''
})

const filteredRecords = computed(() =>
  allRecords.value.filter((item) => {
    const matchInternal = filters.internalIp ? item.internalIp.includes(filters.internalIp) : true
    const matchPublic = filters.publicIp ? item.publicIp.includes(filters.publicIp) : true
    return matchInternal && matchPublic
  })
)

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredRecords.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredRecords.value.length)

const statusIcon = (status: string) => {
  switch (status) {
    case '成功':
      return Check
    case '失败':
      return CloseBold
    default:
      return RefreshRight
  }
}

const statusIconClass = (status: string) => {
  switch (status) {
    case '成功':
      return 'success'
    case '失败':
      return 'danger'
    default:
      return 'warning'
  }
}

const getList = async () => {
  try {
    loading.value = true
    allRecords.value = [
      {
        id: 1,
        taskId: '1',
        internalIp: '192.168.21.20',
        publicIp: '192.23.21.12',
        executionTime: '2025-10-28 13:29:09',
        executionResult: '进行中'
      },
      {
        id: 2,
        taskId: '2',
        internalIp: '192.12.21.23',
        publicIp: '192.168.09.99',
        executionTime: '2025-10-28 13:29:09',
        executionResult: '成功'
      },
      {
        id: 3,
        taskId: '3',
        internalIp: '192.210.212.22',
        publicIp: '192.123.121.12',
        executionTime: '2025-10-20 11:29:09',
        executionResult: '失败'
      }
    ]
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
}

const resetFilters = () => {
  filters.internalIp = ''
  filters.publicIp = ''
  handleSearch()
}

const handleViewDetails = (record: ExecutionRecord) => {
  router.push({
    name: 'NodeExecutionHistoryDetail',
    params: { taskId: record.taskId }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="less">
.execution-history-page {
  padding: 16px;
  background: #f5f6f8;
  min-height: calc(100vh - 32px);
  box-sizing: border-box;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(15, 18, 34, 0.05);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2329;
  }
}

.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .status-icon {
    font-size: 14px;
    &.success {
      color: #67c23a;
    }
    &.danger {
      color: #f56c6c;
    }
    &.warning {
      color: #e6a23c;
    }
  }
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;

  .total-text {
    color: #909399;
  }
}
</style>
