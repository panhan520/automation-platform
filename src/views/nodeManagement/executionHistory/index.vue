<template>
  <ManagementList
    :title="title"
    :table-data="displayTableData"
    :loading="loading"
    :total-records="totalRecords"
    :filters="toolbarFilters"
    :columns="tableColumns"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="getList"
    @page-change="handlePageChange"
  >
    <template #executionResult="{ row }">
      <div class="status-cell">
        <el-icon :class="['status-icon', statusIconClass(row.executionResult)]">
          <component :is="statusIcon(row.executionResult)" />
        </el-icon>
        <span>{{ row.executionResult }}</span>
      </div>
    </template>
    <template #actions="{ row }">
      <el-button type="primary" text size="small" @click="handleViewDetails(row)"
        >查看详情</el-button
      >
    </template>
  </ManagementList>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CloseBold, RefreshRight, Search } from '@element-plus/icons-vue'
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'

interface ExecutionRecord {
  id: number
  taskId: string
  internalIp: string
  publicIp: string
  executionTime: string
  executionResult: '进行中' | '成功' | '失败'
}

const title = '执行历史'
const router = useRouter()

const allRecords = ref<ExecutionRecord[]>([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const filtersState = reactive({
  internalIp: '',
  publicIp: ''
})

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'internalIp',
    type: 'input',
    placeholder: '搜索内网IP',
    width: 200,
    prefixIcon: Search
  },
  {
    key: 'publicIp',
    type: 'input',
    placeholder: '搜索公网IP',
    width: 200,
    prefixIcon: Search
  }
]

const tableColumns: TableColumn[] = [
  { prop: 'taskId', label: '任务ID', width: 120 },
  { prop: 'internalIp', label: '内网IP' },
  { prop: 'publicIp', label: '公网IP' },
  { prop: 'executionTime', label: '执行时间', minWidth: 180 },
  { prop: 'executionResult', label: '执行结果', width: 140, slot: 'executionResult' },
  { prop: 'actions', label: '操作', width: 120, slot: 'actions' }
]

const filteredRecords = computed(() =>
  allRecords.value.filter((item) => {
    const matchInternal = filtersState.internalIp
      ? item.internalIp.includes(filtersState.internalIp)
      : true
    const matchPublic = filtersState.publicIp ? item.publicIp.includes(filtersState.publicIp) : true
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
  loading.value = true
  setTimeout(() => {
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
    loading.value = false
  }, 300)
}

const handleSearch = (params: Record<string, any>) => {
  filtersState.internalIp = params.internalIp || ''
  filtersState.publicIp = params.publicIp || ''
  queryParams.page = 1
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
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
</style>
