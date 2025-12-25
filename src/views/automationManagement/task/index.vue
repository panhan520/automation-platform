<template>
  <ManagementList
    :title="title"
    :table-data="allTasks"
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
    storageKey="taskManagement_columnConfig"
  >
    <template #columns="{ displayColumns }">
      <template v-for="column in displayColumns" :key="column.prop">
        <TableActionsColumn
          v-if="column.prop === 'actions'"
          :main-actions="mainRowActions"
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
          :filters="column.filters"
          :filter-multiple="column.filterMultiple"
          :column-key="column.prop"
        >
          <template #default="scope">
            <template v-if="column.prop === 'host_id_ip_map'">
              {{ scope.row.host_id_ip_map.length }} 台
            </template>
            <div v-if="column.prop === 'interpreter'">{{
              getInterpreterText(scope.row.interpreter)
            }}</div>
          </template>
        </el-table-column>
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
    :description="`将删除【${deleteDialog.target?.name}】,删除后，该任务将无法再次被执行且不在任务列表中展示，请谨慎操作。`"
    :loading="deleteDialog.loading"
    @confirm="confirmDeleteTemplate"
    @cancel="handleDeleteCancel"
  />
  <ParameterFormDialog
    v-model:visible="parameterDialogVisible"
    :parameters="selectedTask?.parameters || []"
    title="执行任务"
    confirm-text="立即执行"
    @confirm="handleParameterConfirm"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search } from '@element-plus/icons-vue'
import { TemplateEditorDialog } from '@/components/TemplateEditorDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import { apiGetTaskList, apiCreateTask, apiDeleteTask, apiExecTask } from '@/api/task'
import { type TaskRecord } from '@/api/task/type'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { useTaskPanelStore } from '@/store/modules/taskPanel'
import { ParameterFormDialog } from '@/components/ParameterFormDialog'
const router = useRouter()
// 缓存 key
const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'
// 任务面板store
const taskPanelStore = useTaskPanelStore()

const title = '任务管理'
const loading = ref(false)
const allTasks = ref<TaskRecord[]>([])
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  interpreter: '',
  query: '',
  orderBy: '',
  order: ''
})
const interpreterList = ref([
  {
    label: 'Shell',
    value: 'sh'
  },
  {
    label: 'Python',
    value: 'python'
  }
])
const parameterDialogVisible = ref(false)
const selectedTask = ref<TaskRecord | null>(null)

const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'create',
    label: '新建任务',
    type: 'button',
    onClick: () => openTaskDialog()
  },
  {
    key: 'query',
    type: 'input',
    placeholder: '搜索任务名称',
    width: 220,
    prefixIcon: Search
  }
])

const tableColumns: TableColumn[] = [
  { prop: 'id', label: '任务ID', order: 0 },
  { prop: 'name', label: '任务名称', order: 1 },
  { prop: 'host_id_ip_map', label: '执行主机数量', order: 2 },
  {
    prop: 'interpreter',
    label: '执行方式',
    order: 3,
    filters: [
      { text: 'Shell', value: 'sh' },
      { text: 'Python', value: 'python' }
    ],
    filterMultiple: false
  },
  { prop: 'updated_at', label: '最新执行时间', minWidth: 160, order: 4, sortable: true },
  { prop: 'desc', label: '备注', order: 5 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 6 }
]
const mainRowActions: TableAction[] = [
  {
    key: 'execute',
    label: '执行',
    type: 'primary',
    link: true
  }
]
const taskRowActions: TableAction[] = [
  {
    key: 'log',
    label: '查看日志',
    link: true
  },
  {
    key: 'delete',
    label: '删除',
    danger: true,
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
    const res = await apiGetTaskList(queryParams)
    allTasks.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
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
    await apiCreateTask(params)
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
  if (actionKey === 'log') {
    handleViewLog(row)
    return
  }
  if (actionKey === 'delete') {
    openDeleteDialog(row)
  }
}
const handleViewLog = (row: TaskRecord) => {
  router.push({
    name: 'AutomationExecutionHistoryDetail',
    params: { taskId: row.id }
  })
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
    await apiDeleteTask(deleteDialog.target.id)
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
const handleParameterConfirm = (values: Record<string, any>) => {
  parameterDialogVisible.value = false
  submitExecution(values)
}
// 执行
const handleExecute = async (row: TaskRecord) => {
  selectedTask.value = row
  if (
    selectedTask.value?.parameters?.length &&
    selectedTask.value.parameters.some((p) => p.type !== 'namespace')
  ) {
    parameterDialogVisible.value = true
    return
  }
  submitExecution([])
}
// 提交执行
const submitExecution = async (params: Record<string, any>) => {
  try {
    await apiExecTask({ id: selectedTask.value?.id, params })
    // 设置缓存为 true，显示任务面板
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'true')
    taskPanelStore.setVisible(true)
    taskPanelStore.triggerPulse()
  } catch (error) {
    ElMessage.error('执行失败')
  }
}
// 检索
const handleSearch = (params: Record<string, any>) => {
  queryParams.query = params.query
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
// 过滤执行方式
const handleTableFilterChange = (filters: any) => {
  if (filters.interpreter && filters.interpreter.length > 0) {
    queryParams.interpreter = filters.interpreter[0] // 单选
  } else {
    queryParams.interpreter = ''
  }
  queryParams.page = 1
  getList()
}
const getInterpreterText = (interpreter: string) => {
  return interpreter === 'sh' ? 'Shell' : 'Python'
}
onMounted(() => {
  getList()
})
</script>
