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
      <el-table-column prop="taskName" label="任务名称" />
      <el-table-column prop="templateName" label="关联模版" />
      <el-table-column prop="status" label="任务状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" />
      <el-table-column prop="executeTime" label="执行时间" />
      <TableActionsColumn :actions="tableActions" @edit="handleEdit" @action="handleMoreAction" />
    </template>
  </ManagementList>

  <FormDialog
    v-model:visible="formDialogVisible"
    :title="formDialogTitle"
    :create-title="'新建任务'"
    :edit-title="'编辑任务'"
    :is-edit="formDialogIsEdit"
    :fields="formDialogFields"
    :default-form-data="formDialogDefaultData"
    :loading="formDialogLoading"
    @confirm="handleFormDialogConfirm"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList } from '@/components/ManagementList'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search } from '@element-plus/icons-vue'
import { FormDialog, type FormField } from '@/components/FormDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'

interface TaskRecord {
  id: number
  taskName: string
  templateName: string
  status: string
  createTime: string
  executeTime: string
}

const title = '任务管理'
const allTasks = ref<TaskRecord[]>([])
const loading = ref(false)
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
    onClick: () => openCreateEditDialog(false, {})
  }
]

const tableActions: TableAction[] = [
  {
    key: 'execute',
    label: '执行'
  },
  {
    key: 'delete',
    label: '删除',
    divided: true,
    danger: true
  }
]

const filteredTasks = computed(() => {
  return allTasks.value.filter((item) =>
    queryParams.keyword
      ? item.taskName.toLowerCase().includes(queryParams.keyword.toLowerCase())
      : true
  )
})

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索任务名称',
    width: 260,
    prefixIcon: Search
  }
]

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredTasks.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredTasks.value.length)

const formDialogVisible = ref(false)
const formDialogTitle = ref('')
const formDialogIsEdit = ref(false)
const formDialogFields = ref<FormField[]>([])
const formDialogDefaultData = ref<Record<string, any>>({})
const formDialogLoading = ref(false)

const createEditFields: FormField[] = [
  {
    prop: 'taskName',
    label: '任务名称',
    type: 'input',
    required: true,
    placeholder: '请输入任务名称'
  },
  {
    prop: 'templateId',
    label: '关联模版',
    type: 'select',
    required: true,
    placeholder: '请选择模版',
    options: []
  }
]

const getStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    运行中: 'success',
    已停止: 'info',
    已完成: 'success',
    失败: 'danger'
  }
  return map[status] || 'info'
}

const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取数据
    allTasks.value = [
      {
        id: 1,
        taskName: '任务1',
        templateName: 'Nginx部署模版',
        status: '运行中',
        createTime: '2024-03-15 10:00:00',
        executeTime: '2024-03-15 10:05:00'
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

const openCreateEditDialog = (isEdit: boolean, data: Record<string, any>) => {
  formDialogIsEdit.value = isEdit
  formDialogTitle.value = ''
  formDialogFields.value = createEditFields.map((field) => ({ ...field }))
  formDialogDefaultData.value = { ...data }
  formDialogVisible.value = true
}

const handleEdit = (row: TaskRecord) => {
  openCreateEditDialog(true, row)
}

const handleMoreAction = (action: string, row: TaskRecord) => {
  switch (action) {
    case 'execute':
      handleExecute(row)
      break
    case 'delete':
      handleDelete(row)
      break
    default:
      ElMessage.info('功能待实现')
  }
}

const handleExecute = async (row: TaskRecord) => {
  try {
    loading.value = true
    // TODO: 调用API执行
    ElMessage.success(`任务 ${row.taskName} 执行成功`)
  } catch (error) {
    ElMessage.error('执行失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: TaskRecord) => {
  try {
    loading.value = true
    // TODO: 调用API删除
    ElMessage.success(`删除任务 ${row.taskName} 成功`)
    getList()
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}

const handleFormDialogConfirm = async (formData: any, done: (success: boolean) => void) => {
  try {
    formDialogLoading.value = true
    // TODO: 调用API保存
    ElMessage.success(formDialogIsEdit.value ? '编辑成功' : '创建成功')
    done(true)
    getList()
  } catch (error) {
    ElMessage.error('保存失败')
    done(false)
  } finally {
    formDialogLoading.value = false
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
