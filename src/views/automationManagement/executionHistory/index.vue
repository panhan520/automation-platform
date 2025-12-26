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
    @filter-change="handleTableFilterChange"
    @sort-change="handleTableSortChange"
    storageKey="historyManagement_columnConfig"
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
          :filters="column.filters"
          :filter-multiple="column.filterMultiple"
          :column-key="column.prop"
        >
          <template #default="scope">
            <el-tag
              v-if="column.prop === 'status'"
              :type="getStatusTagType(scope.row.status)"
              class="status-tag"
            >
              <el-icon>
                <component :is="statusIcon(scope.row.status)" />
              </el-icon>
              {{ getStatusText(scope.row.status) }}
            </el-tag>
            <div v-if="column.prop === 'interpreter'">{{
              getInterpreterText(scope.row.interpreter)
            }}</div>
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
import { ExecutionRecord } from '@/api/executionHistory/type'

const title = '执行历史'
const router = useRouter()
const allTableData = ref<ExecutionRecord[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  query: '',
  status: '',
  interpreter: '',
  order: '',
  orderBy: ''
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
const executionRowActions: TableAction[] = [
  {
    key: 'detail',
    label: '查看详情',
    type: 'primary',
    text: true
  }
]
const tableColumns: TableColumn[] = [
  { prop: 'task_id', label: '任务ID', order: 0 },
  { prop: 'name', label: '任务名称', order: 1 },
  {
    prop: 'interpreter',
    label: '执行方式',
    order: 2,
    filters: [
      { text: 'Shell', value: 'sh' },
      { text: 'Python', value: 'python' }
    ],
    filterMultiple: false
  },
  { prop: 'run_time', label: '执行时间', minWidth: 160, order: 3, sortable: true },
  {
    prop: 'status',
    label: '执行结果',
    slot: 'status',
    order: 4,
    filters: [
      { text: '成功', value: 1 },
      { text: '失败', value: 2 },
      { text: '进行中', value: 0 }
    ],
    filterMultiple: false
  },
  { prop: 'actions', label: '操作', slot: 'actions', order: 5 }
]
const statusIcon = (status: number) => {
  switch (status) {
    case 1:
      return Check
    case 2:
      return CloseBold
    default:
      return RefreshRight
  }
}
const getStatusTagType = (status: number) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'success',
    0: 'warning',
    2: 'danger'
  }
  return map[status] || 'info'
}
const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return '成功'
    case 2:
      return '失败'
    default:
      return '进行中'
  }
}
const getInterpreterText = (interpreter: string) => {
  return interpreter === 'sh' ? 'Shell' : 'Python'
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
// 过滤执行方式和执行结果
const handleTableFilterChange = (filters: any) => {
  if (filters.interpreter && filters.interpreter.length > 0) {
    queryParams.interpreter = filters.interpreter[0] // 单选
  } else {
    queryParams.interpreter = ''
  }
  if (filters.status && filters.status.length > 0) {
    queryParams.status = filters.status[0] // 单选
  } else {
    queryParams.status = ''
  }
  queryParams.page = 1
  getList()
}
// 排序
const handleTableSortChange = (sorts: any) => {
  queryParams.orderBy = sorts.prop
  queryParams.order = sorts.order
  queryParams.page = 1
  getList()
}
const handleSearch = (params: Record<string, any>) => {
  queryParams.query = params.query
  queryParams.page = 1
  getList()
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}

const handleViewDetails = (record: ExecutionRecord) => {
  router.push({
    name: 'AutomationExecutionHistoryDetail',
    params: { taskId: record.id },
    query: { pageType: 'execHistory' }
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
.status-tag {
  .el-icon {
    vertical-align: middle;
    margin-top: -2px;
  }
}
</style>
