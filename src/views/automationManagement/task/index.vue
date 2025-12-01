<template>
  <ManagementList
    :title="title"
    :table-data="allTasks"
    :loading="loading"
    :total-records="totalRecords"
    :toolbar-buttons="toolbarButtons"
    :filters="toolbarFilters"
    :columns="tableColumns"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
    @sort-change="handleTableSortChange"
    storageKey="taskManagement_columnConfig"
  >
    <template #columns="{ displayColumns }">
      <template v-for="column in displayColumns" :key="column.prop">
        <TableActionsColumn
          v-if="column.prop === 'actions'"
          :actions="taskRowActions"
          @edit="handleEdit"
          @action="handleRowAction"
        />
        <el-table-column
          v-else
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
        />
      </template>
    </template>
  </ManagementList>

  <TemplateEditorDialog
    v-model:visible="taskDialogVisible"
    :title="taskDialogTitle"
    mode="task"
    :initial-data="taskEditorData"
    :loading="taskDialogLoading"
    @submit="handleTaskSubmit"
  />
  <DeleteConfirmDialog
    v-model:visible="deleteDialog.visible"
    title="删除任务"
    :target-name="deleteDialog.target?.name || ''"
    description="删除后，该任务将无法再次被执行且不在任务列表中展示，请谨慎操作。"
    :loading="deleteDialog.loading"
    @confirm="confirmDeleteTemplate"
    @cancel="handleDeleteCancel"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList, type TableColumn, type ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search, Refresh } from '@element-plus/icons-vue'
import { TemplateEditorDialog } from '@/components/TemplateEditorDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import {
  apiGetTemplatesList,
  apiGetTemplatesType,
  apiCreateTemplates,
  apiDeleteTemplate
} from '@/api/task'
import { type TaskRecord } from '@/api/task/type'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

const title = '任务管理'
const loading = ref(false)
const allTasks = ref<TaskRecord[]>([])
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  orderBy: '',
  order: ''
})
const taskTypeList = ref<string[]>([])

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建任务',
    type: 'primary',
    onClick: () => openTaskDialog()
  }
]

const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'appType',
    type: 'select',
    placeholder: '全部任务类型',
    width: 220,
    clearable: true,
    options: taskTypeList.value.map((item) => ({ label: item, value: item }))
  },
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索任务名称',
    width: 220,
    prefixIcon: Search
  },
  {
    key: 'reset',
    type: 'text',
    placeholder: '重置',
    icon: Refresh,
    onClick: () => handleReset()
  }
])

const tableColumns: TableColumn[] = [
  { prop: 'id', label: '任务ID', order: 0 },
  { prop: 'name', label: '任务名称', order: 1 },
  { prop: 'number', label: '执行主机数量', order: 2 },
  { prop: 'executeTime', label: '最新执行时间', minWidth: 160, order: 3, sortable: true },
  { prop: 'desc', label: '备注', order: 4 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 5 }
]

const taskRowActions: TableAction[] = [
  {
    key: 'execute',
    label: '执行',
    type: 'success',
    link: true
  },
  {
    key: 'log',
    label: '查看日志',
    link: true
  },
  {
    key: 'delete',
    label: '删除',
    type: 'danger',
    link: true
  }
]
const deleteDialog = reactive<{
  visible: boolean
  target: TaskRecord | null
  loading: boolean
}>({
  visible: false,
  target: null,
  loading: false
})

const totalRecords = ref(0)

const taskDialogVisible = ref(false)
const taskDialogLoading = ref(false)
const taskEditorData = ref<any>(null)
const editingTaskId = ref<number | null>(null)
const taskDialogTitle = computed(() => (editingTaskId.value ? '编辑任务' : '新建任务'))
// 获取任务列表
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetTemplatesList(queryParams)
    allTasks.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}
// 获取任务类型列表
const getTaskTypeList = async () => {
  const res = await apiGetTemplatesType()
  taskTypeList.value = res.data.list
}
// 打开新建弹框
const openTaskDialog = (row?: TaskRecord) => {
  if (row) {
    editingTaskId.value = row.id
    taskEditorData.value = {
      ...row
    }
  } else {
    editingTaskId.value = null
    taskEditorData.value = null
  }
  taskDialogVisible.value = true
}
// 打开编辑弹框
const handleEdit = (row: TaskRecord) => {
  openTaskDialog(row)
}
// 提交新建/编辑弹框
const handleTaskSubmit = async (payload: any) => {
  try {
    taskDialogLoading.value = true
    const params = { ...payload }
    if (editingTaskId.value) {
      params.id = editingTaskId.value
    }
    await apiCreateTemplates(params)
    ElMessage.success(editingTaskId.value ? '编辑成功' : '添加成功')
    getList()
    taskDialogVisible.value = false
  } finally {
    taskDialogLoading.value = false
  }
}
// 任务操作
const handleRowAction = (actionKey: string, row: TaskRecord) => {
  if (actionKey === 'execute') {
    handleExecute(row)
    return
  }
  if (actionKey === 'delete') {
    openDeleteDialog(row)
  }
}
const openDeleteDialog = (row: TaskRecord) => {
  deleteDialog.target = row
  deleteDialog.visible = true
}
// 删除
const confirmDeleteTemplate = async () => {
  if (!deleteDialog.target) return
  try {
    deleteDialog.loading = true
    await apiDeleteTemplate(deleteDialog.target.id)
    ElMessage.success('删除成功')
    getList()
    deleteDialog.visible = false
    deleteDialog.target = null
  } finally {
    deleteDialog.loading = false
  }
}
const handleDeleteCancel = () => {
  deleteDialog.target = null
}
// 执行
const handleExecute = async (row: TaskRecord) => {
  try {
    loading.value = true
    // setTimeout(() => {
    //   row.status = '已完成'
    //   row.executeTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    //   loading.value = false
    //   ElMessage.success(`任务 ${row.name} 执行成功`)
    // }, 600)
  } catch (error) {
    loading.value = false
    ElMessage.error('执行失败')
  }
}
// 检索
const handleSearch = (params: Record<string, any>) => {
  queryParams.keyword = params.keyword || ''
  queryParams.page = 1
  getList()
}
// 刷新
const handleRefresh = () => {
  getList()
}
// 重置
const handleReset = () => {
  // queryParams.query = ''
  queryParams.page = 1
  getList()
}
// 分页
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}
// 排序
const handleTableSortChange = (sorts: any) => {
  queryParams.orderBy = sorts.prop
  queryParams.order = sorts.order
  queryParams.page = 1
  getList()
}
onMounted(() => {
  getList()
  getTaskTypeList()
})
</script>

<style scoped lang="less"></style>
