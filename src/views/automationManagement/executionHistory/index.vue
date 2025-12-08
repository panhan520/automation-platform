<template>
  <ManagementList
    :title="title"
    :table-data="allTableData"
    :loading="loading"
    :total-records="totalRecords"
    :filters="toolbarFilters"
    :columns="tableColumns"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="getList"
    @page-change="handlePageChange"
  >
    <template #columns="{ displayColumns }">
      <template v-for="column in displayColumns" :key="column.prop">
        <TableActionsColumn
          v-if="column.prop === 'actions'"
          :show-edit="false"
          :main-actions="executionRowActions"
          @action="handleRowAction"
        />
        <el-table-column
          v-else
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
        >
          <template v-if="column.prop === 'executionResult'" #default="scope">
            <div class="status-cell">
              <el-icon :class="['status-icon', statusIconClass(scope.row.executionResult)]">
                <component :is="statusIcon(scope.row.executionResult)" />
              </el-icon>
              <span>{{ scope.row.executionResult }}</span>
            </div>
          </template>
        </el-table-column>
      </template>
    </template>
  </ManagementList>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, CloseBold, RefreshRight, Search } from '@element-plus/icons-vue'
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import { apiGetHistoryTaskList } from '@/api/executionHistory'

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
const allTableData = ref<ExecutionRecord[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'query',
    type: 'input',
    placeholder: '搜索任务名称',
    width: 220,
    prefixIcon: Search
  }
]

const tableColumns: TableColumn[] = [
  { prop: 'id', label: '任务ID', order: 0 },
  { prop: 'name', label: '任务名称', order: 1 },
  { prop: 'publicIp', label: '执行方式', order: 2 },
  { prop: 'run_time', label: '执行时间', order: 3 },
  { prop: 'status', label: '执行结果', slot: 'executionResult', minWidth: 160, order: 4 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 5 }
]

const executionRowActions: TableAction[] = [
  {
    key: 'detail',
    label: '查看详情',
    type: 'primary',
    text: true
  }
]

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
    const res = await apiGetHistoryTaskList(queryParams)
    allTableData.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: Record<string, any>) => {
  queryParams.page = 1
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}

const handleViewDetails = (record: ExecutionRecord) => {
  router.push({
    name: 'AutomationExecutionHistoryDetail',
    params: { taskId: record.taskId }
  })
}

const handleRowAction = (actionKey: string, row: ExecutionRecord) => {
  if (actionKey === 'detail') {
    handleViewDetails(row)
  }
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
