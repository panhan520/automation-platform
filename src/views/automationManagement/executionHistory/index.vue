<template>
  <ManagementList
    :title="title"
    :table-data="displayTableData"
    :loading="loading"
    :total-records="totalRecords"
    :toolbar-buttons="toolbarButtons"
    :filters="toolbarFilters"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
  >
    <template #columns>
      <el-table-column prop="taskId" label="任务ID" />
      <el-table-column prop="taskName" label="任务名称" />
      <el-table-column prop="templateName" label="关联模版" />
      <el-table-column prop="executionTime" label="执行时间" />
      <el-table-column prop="executionResult" label="执行结果">
        <template #default="scope">
          <el-tag :type="getResultType(scope.row.executionResult)">{{
            scope.row.executionResult
          }}</el-tag>
        </template>
      </el-table-column>
      <TableActionsColumn :actions="rowActions" @edit="handleEdit" @action="handleMoreAction" />
    </template>
  </ManagementList>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ManagementList } from '@/components/ManagementList'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search } from '@element-plus/icons-vue'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'

interface ExecutionRecord {
  id: number
  taskId: string
  taskName: string
  templateName: string
  executionTime: string
  executionResult: string
}

const title = '执行历史'
const allRecords = ref<ExecutionRecord[]>([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const toolbarButtons: ToolbarButton[] = []
const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索任务ID/名称',
    width: 260,
    prefixIcon: Search
  }
]

const rowActions: TableAction[] = [
  {
    key: 'viewDetails',
    label: '查看详情'
  }
]

const filteredRecords = computed(() => {
  return allRecords.value.filter((item) =>
    queryParams.keyword
      ? item.taskId.includes(queryParams.keyword) || item.taskName.includes(queryParams.keyword)
      : true
  )
})

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredRecords.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredRecords.value.length)

const getResultType = (result: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    成功: 'success',
    失败: 'danger',
    进行中: 'warning'
  }
  return map[result] || 'info'
}

const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取数据
    allRecords.value = [
      {
        id: 1,
        taskId: '1',
        taskName: '任务1',
        templateName: 'Nginx部署模版',
        executionTime: '2025-10-28 10:29:09',
        executionResult: '成功'
      }
    ]
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: Record<string, any>) => {
  queryParams.keyword = params.keyword || ''
  queryParams.page = 1
}

const handleRefresh = () => {
  getList()
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}

const handleEdit = (row: ExecutionRecord) => {
  console.log('编辑', row)
}

const handleMoreAction = (action: string, row: ExecutionRecord) => {
  if (action === 'viewDetails') {
    console.log('查看详情', row)
  }
}

onMounted(() => {
  getList()
})
</script>

<style lang="less" scoped>
.page-title {
  font-size: 18px;
  line-height: 26px;
  color: #0c0d0e;
  margin-bottom: 20px;
  text-align: left;
}

.table-info {
  font-size: 14px;
  color: #606266;
  margin-top: 16px;
}

.bulk-action-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
}
</style>
