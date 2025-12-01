<template>
  <ManagementList
    :title="title"
    :table-data="displayTableData"
    :loading="loading"
    :total-records="totalRecords"
    :toolbar-buttons="toolbarButtons"
    :filters="toolbarFilters"
    :columns="tableColumns"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
    storageKey="taskManagement_columnConfig"
  >
    <template #columns="{ displayColumns }">
      <template v-for="column in displayColumns" :key="column.prop">
        <TableActionsColumn
          v-if="column.prop === 'actions'"
          :actions="taskRowActions"
          @edit="handleEdit"
          @action="handleRowAction"
          width="200"
        />
        <el-table-column
          v-else
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
        >
          <template v-if="column.prop === 'status'" #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </template>
    </template>
  </ManagementList>

  <TemplateEditorDialog
    v-model:visible="taskDialogVisible"
    :title="taskDialogTitle"
    mode="task"
    :available-hosts="availableHosts"
    :initial-data="taskEditorData"
    :loading="taskDialogLoading"
    @submit="handleTaskSubmit"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList, type TableColumn, type ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search } from '@element-plus/icons-vue'
import { TemplateEditorDialog } from '@/components/TemplateEditorDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'

type ScriptLanguage = 'sh' | 'python'

interface TaskRecord {
  id: number
  taskName: string
  templateName: string
  status: string
  createTime: string
  executeTime: string
  scriptLanguage: ScriptLanguage
  templateContent: string
  remark?: string
}

const title = '任务管理'
const loading = ref(false)
const allTasks = ref<TaskRecord[]>([])
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建任务',
    type: 'primary',
    onClick: () => openTaskDialog()
  }
]

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索任务名称',
    width: 260,
    prefixIcon: Search
  }
]

const tableColumns: TableColumn[] = [
  { prop: 'id', label: '任务ID', order: 0 },
  { prop: 'name', label: '任务名称', order: 1 },
  { prop: 'number', label: '执行主机数量', order: 2 },
  { prop: 'executeTime', label: '最新执行时间', minWidth: 160, order: 3 },
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

const filteredTasks = computed(() => {
  if (!queryParams.keyword) return allTasks.value
  return allTasks.value.filter((item) =>
    item.taskName.toLowerCase().includes(queryParams.keyword.toLowerCase())
  )
})

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredTasks.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredTasks.value.length)

const availableHosts = ref([
  { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', innerIp: '172.21.0.12' },
  { hostId: '2', hostName: '名称2', publicIp: '121.199.4.33', innerIp: '172.21.0.10' }
])

const taskDialogVisible = ref(false)
const taskDialogLoading = ref(false)
const taskEditorData = ref<any>(null)
const editingTaskId = ref<number | null>(null)
const taskDialogTitle = computed(() => (editingTaskId.value ? '编辑任务' : '新建任务'))

const openTaskDialog = (row?: TaskRecord) => {
  if (row) {
    editingTaskId.value = row.id
    taskEditorData.value = {
      taskName: row.taskName,
      templateContent: row.templateContent,
      scriptLanguage: row.scriptLanguage,
      remark: row.remark,
      parameters: [],
      hosts: []
    }
  } else {
    editingTaskId.value = null
    taskEditorData.value = {
      taskName: '',
      templateContent: '',
      scriptLanguage: 'sh',
      remark: '',
      parameters: [],
      hosts: []
    }
  }
  taskDialogVisible.value = true
}

const handleTaskSubmit = (payload: any) => {
  taskDialogLoading.value = true
  setTimeout(() => {
    if (editingTaskId.value) {
      const target = allTasks.value.find((task) => task.id === editingTaskId.value)
      if (target) {
        target.taskName = payload.taskName
        target.templateContent = payload.templateContent
        target.scriptLanguage = payload.scriptLanguage
        target.remark = payload.remark
      }
      ElMessage.success('编辑成功')
    } else {
      allTasks.value.unshift({
        id: Date.now(),
        taskName: payload.taskName,
        templateName: payload.taskName,
        status: '待执行',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        executeTime: '-',
        scriptLanguage: payload.scriptLanguage,
        templateContent: payload.templateContent,
        remark: payload.remark
      })
      ElMessage.success('添加成功')
    }
    taskDialogLoading.value = false
    taskDialogVisible.value = false
  }, 500)
}

const getStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    待执行: 'info',
    运行中: 'warning',
    已完成: 'success',
    失败: 'danger'
  }
  return map[status] || 'info'
}

const getList = async () => {
  loading.value = true
  setTimeout(() => {
    allTasks.value = [
      {
        id: 1,
        taskName: '巡检-内存检查',
        templateName: '获取内存使用情况',
        status: '已完成',
        createTime: '2025-01-12 10:00:00',
        executeTime: '2025-01-12 10:01:12',
        scriptLanguage: 'sh',
        templateContent: 'free -m'
      }
    ]
    loading.value = false
  }, 300)
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

const handleEdit = (row: TaskRecord) => {
  openTaskDialog(row)
}

const handleExecute = async (row: TaskRecord) => {
  try {
    loading.value = true
    setTimeout(() => {
      row.status = '已完成'
      row.executeTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      loading.value = false
      ElMessage.success(`任务 ${row.taskName} 执行成功`)
    }, 600)
  } catch (error) {
    loading.value = false
    ElMessage.error('执行失败')
  }
}

const handleDelete = async (row: TaskRecord) => {
  loading.value = true
  setTimeout(() => {
    allTasks.value = allTasks.value.filter((task) => task.id !== row.id)
    loading.value = false
    ElMessage.success('删除成功')
  }, 300)
}

const handleRowAction = (actionKey: string, row: TaskRecord) => {
  if (actionKey === 'execute') {
    handleExecute(row)
    return
  }
  if (actionKey === 'delete') {
    handleDelete(row)
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="less"></style>
