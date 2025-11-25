<template>
  <div class="template-management-page">
    <ManagementList
      :title="title"
      :table-data="allTemplates"
      :loading="loading"
      :total-records="totalRecords"
      :toolbar-buttons="toolbarButtons"
      :filters="toolbarFilters"
      :columns="tableColumns"
      :query-params="queryParams"
      @search="handleSearch"
      @refresh="handleRefresh"
      @page-change="handlePageChange"
      storageKey="template_columnConfig"
    >
      <template #columns="{ displayColumns }">
        <template v-for="column in displayColumns" :key="column.prop">
          <TableActionsColumn
            v-if="column.prop === 'actions'"
            :main-actions="templateRowActions"
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
          >
            <template #default="scope">
              <el-tag v-if="column.prop === 'type'" :type="getTemplateTypeTagType(scope.row.type)">
                {{ scope.row.type }}
              </el-tag>
              <el-tooltip
                v-if="column.prop === 'body'"
                class="box-item"
                effect="dark"
                :content="scope.row.body"
                placement="top"
              >
                {{ scope.row.body }}
              </el-tooltip>
            </template>
          </el-table-column>
        </template>
      </template>
    </ManagementList>

    <TemplateEditorDialog
      v-model:visible="templateDialogVisible"
      :title="dialogTitle"
      mode="template"
      :template-types="templateTypes"
      :available-hosts="availableHosts"
      :initial-data="editorInitialData"
      :loading="templateDialogLoading"
      @submit="handleTemplateSubmit"
    />

    <DeleteConfirmDialog
      v-model:visible="deleteDialog.visible"
      title="删除模版"
      :target-name="deleteDialog.target?.templateName || ''"
      description="删除后该模版将被清除且无法被引用，请谨慎操作。"
      :loading="deleteDialog.loading"
      @confirm="confirmDeleteTemplate"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList, type TableColumn, type ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search, Refresh } from '@element-plus/icons-vue'
import { TemplateEditorDialog } from '@/components/TemplateEditorDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { apiGetTemplatesList, apiGetTemplatesType } from '@/api/template'

type ScriptLanguage = 'sh' | 'python'

interface TemplateRecord {
  id: number
  templateName: string
  templateType: string
  templateContent: string
  description: string
  scriptLanguage: ScriptLanguage
  remark?: string
  hosts?: HostItem[]
  parameters?: ParameterItem[]
}

interface ParameterItem {
  id: number
  name: string
  variable: string
  type: 'text' | 'password' | 'select' | 'command'
  typeLabel: string
  options?: Array<{ label: string; value: string }>
  hostAttribute?: string
  required: boolean
  defaultValue?: string
  hint?: string
}

interface HostItem {
  hostId: string
  hostName: string
  innerIp: string
  publicIp: string
}

interface TemplateEditorPayload {
  type?: string
  name?: string
  interpreter: ScriptLanguage
  body: string
  desc?: string
  parameters: ParameterItem[]
  host_ids: HostItem[]
}

const title = '模版管理'
const loading = ref(false)
const allTemplates = ref<TemplateRecord[]>([])
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  query: '',
  type: ''
})
const templateTypeList = ref<string[]>([])
// 表格筛选项（左侧）
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'type',
    type: 'select',
    placeholder: '全部模版类型',
    width: 200,
    clearable: true,
    options: templateTypeList.value.map((item) => ({ label: item, value: item }))
  },
  {
    key: 'query',
    type: 'input',
    placeholder: '搜索模版名称',
    width: 200,
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
// 表格操作项（右侧）
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建模版',
    type: 'primary',
    onClick: () => openTemplateDialog()
  }
]
// 表格列
const tableColumns: TableColumn[] = [
  { prop: 'name', label: '模版名称', order: 0 },
  { prop: 'type', label: '模版类型', slot: 'type', order: 1 },
  { prop: 'body', label: '模版内容', minWidth: 150, slot: 'body', order: 2 },
  { prop: 'desc', label: '描述信息', minWidth: 150, order: 3 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 4 }
]
// 行内操作栏
const templateRowActions: TableAction[] = [
  {
    key: 'delete',
    label: '删除',
    type: 'danger',
    text: true
  }
]

const totalRecords = ref(0)
const templateTypes = ref(['系统信息', '部署模版', '运维脚本'])
const availableHosts = ref<HostItem[]>([
  { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', innerIp: '172.21.0.12' },
  { hostId: '2', hostName: '名称2', publicIp: '121.199.4.33', innerIp: '172.21.0.10' },
  { hostId: '3', hostName: '名称3', publicIp: '10.0.0.12', innerIp: '172.21.0.1' }
])

const templateDialogVisible = ref(false)
const templateDialogLoading = ref(false)
const editorInitialData = ref(null)
const currentEditingId = ref<number | null>(null)
const dialogTitle = computed(() => (editorInitialData.value ? '编辑模版' : '新建模版'))

// 获取模版列表
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetTemplatesList(queryParams)
    allTemplates.value = res.data.list
    totalRecords.value = res.data.pagination.total
    // allTemplates.value = [
    //   {
    //     id: 1,
    //     templateName: '系统监控模版',
    //     templateType: '系统信息',
    //     templateContent: 'free -m',
    //     description: '查询目标机器内存占用',
    //     scriptLanguage: 'Shell' as ScriptLanguage
    //   },
    //   {
    //     id: 2,
    //     templateName: '数据库备份模版',
    //     templateType: '系统信息',
    //     templateContent: 'df -h',
    //     description: '磁盘巡检',
    //     scriptLanguage: 'Shell' as ScriptLanguage
    //   }
    // ]
  } finally {
    loading.value = false
  }
}
// 获取模版类型列表
const getTemplateTypeList = async () => {
  const res = await apiGetTemplatesType()
  templateTypeList.value = res.data.list
}
// 重置按钮
const handleReset = () => {
  queryParams.query = ''
  queryParams.type = ''
  queryParams.page = 1
  getList()
}
const openTemplateDialog = (row?) => {
  if (row) {
    currentEditingId.value = row.id
    editorInitialData.value = {
      ...row
    }
  } else {
    currentEditingId.value = null
    editorInitialData.value = null
  }
  templateDialogVisible.value = true
}

const handleTemplateSubmit = (payload) => {
  templateDialogLoading.value = true
  setTimeout(() => {
    if (currentEditingId.value) {
      const target = allTemplates.value.find((item) => item.id === currentEditingId.value)
      if (target) {
        target.templateType = payload.templateType || target.templateType
        target.templateContent = payload.templateContent
        target.scriptLanguage = payload.scriptLanguage
        target.description = payload.remark || ''
        target.parameters = payload.parameters
        target.hosts = payload.hosts
      }
      ElMessage.success('更新成功')
    } else {
      allTemplates.value.unshift({
        id: Date.now(),
        templateName: payload.templateName || '新模版',
        templateType: payload.templateType || '系统信息',
        templateContent: payload.templateContent,
        description: payload.remark || '',
        scriptLanguage: payload.scriptLanguage,
        parameters: payload.parameters,
        hosts: payload.hosts
      })
      ElMessage.success('创建成功')
    }
    templateDialogLoading.value = false
    templateDialogVisible.value = false
  }, 600)
}

const handleSearch = (params: Record<string, any>) => {
  queryParams.query = params.query || ''
  queryParams.type = params.type || ''
  queryParams.page = 1
  getList()
}

const handleRefresh = () => {
  getList()
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}

const handleEdit = (row: TemplateRecord) => {
  openTemplateDialog(row)
}

const deleteDialog = reactive<{
  visible: boolean
  target: TemplateRecord | null
  loading: boolean
}>({
  visible: false,
  target: null,
  loading: false
})

const openDeleteDialog = (row: TemplateRecord) => {
  deleteDialog.target = row
  deleteDialog.visible = true
}

const confirmDeleteTemplate = () => {
  if (!deleteDialog.target) return
  deleteDialog.loading = true
  setTimeout(() => {
    allTemplates.value = allTemplates.value.filter((item) => item.id !== deleteDialog.target?.id)
    ElMessage.success('删除成功')
    deleteDialog.visible = false
    deleteDialog.loading = false
    deleteDialog.target = null
  }, 400)
}

const handleDeleteCancel = () => {
  deleteDialog.target = null
}

const handleRowAction = (actionKey: string, row: TemplateRecord) => {
  if (actionKey === 'delete') {
    openDeleteDialog(row)
    return
  }
  handleEdit(row)
}

const getTemplateTypeTagType = (type: string) => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    系统信息: 'primary',
    部署模版: 'success',
    运维脚本: 'warning'
  }
  return map[type] || 'info'
}

onMounted(() => {
  getList()
  getTemplateTypeList()
})
</script>

<style scoped lang="less">
.template-management-page {
  padding-bottom: 16px;
}
</style>
