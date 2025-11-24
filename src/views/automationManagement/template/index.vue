<template>
  <div class="template-management-page">
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
              <el-tag
                v-if="column.prop === 'templateType'"
                :type="getTemplateTypeTagType(scope.row.templateType)"
              >
                {{ scope.row.templateType }}
              </el-tag>
              <el-tooltip
                v-if="column.prop === 'templateContent'"
                class="box-item"
                effect="dark"
                :content="scope.row.templateContent"
                placement="top"
              >
                {{ scope.row.templateContent }}
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

type ScriptLanguage = 'Shell' | 'Python'

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
  templateType?: string
  templateName?: string
  scriptLanguage: ScriptLanguage
  templateContent: string
  remark?: string
  parameters: ParameterItem[]
  hosts: HostItem[]
}

const title = '模版管理'
const loading = ref(false)
const allTemplates = ref<TemplateRecord[]>([])
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})
const appTypeList = ref<string[]>([])

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建模版',
    type: 'primary',
    onClick: () => openTemplateDialog()
  }
]

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'appTypeName',
    type: 'select',
    placeholder: '全部模版类型',
    width: 200,
    clearable: true,
    options: appTypeList.value.map((item) => ({ label: item, value: item }))
  },
  {
    key: 'keyword',
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
]

const tableColumns: TableColumn[] = [
  { prop: 'templateName', label: '模版名称', order: 0 },
  { prop: 'templateType', label: '模版类型', slot: 'templateType', order: 1 },
  { prop: 'templateContent', label: '模版内容', minWidth: 150, slot: 'templateContent', order: 2 },
  { prop: 'description', label: '描述信息', minWidth: 150, order: 3 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 4 }
]

const templateRowActions: TableAction[] = [
  {
    key: 'delete',
    label: '删除',
    type: 'danger',
    text: true
  }
]
const handleReset = () => {
  // queryParams.query = ''
  // queryParams.appTypeName = ''
  // queryParams.nodeTags = ''
  // queryParams.page = 1
  // getList()
}
const filteredTemplates = computed(() => {
  if (!queryParams.keyword) {
    return allTemplates.value
  }
  return allTemplates.value.filter((item) =>
    item.templateName.toLowerCase().includes(queryParams.keyword.toLowerCase())
  )
})

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredTemplates.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredTemplates.value.length)

const templateTypes = ref(['系统信息', '部署模版', '运维脚本'])
const availableHosts = ref<HostItem[]>([
  { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', innerIp: '172.21.0.12' },
  { hostId: '2', hostName: '名称2', publicIp: '121.199.4.33', innerIp: '172.21.0.10' },
  { hostId: '3', hostName: '名称3', publicIp: '10.0.0.12', innerIp: '172.21.0.1' }
])

const templateDialogVisible = ref(false)
const templateDialogLoading = ref(false)
const editorInitialData = ref<TemplateEditorPayload | null>(null)
const currentEditingId = ref<number | null>(null)
const dialogTitle = computed(() => (editorInitialData.value ? '编辑模版' : '新建模版'))

const openTemplateDialog = (row?: TemplateRecord) => {
  if (row) {
    currentEditingId.value = row.id
    editorInitialData.value = {
      templateType: row.templateType,
      templateName: row.templateName,
      scriptLanguage: row.scriptLanguage,
      templateContent: row.templateContent,
      remark: row.remark,
      parameters: row.parameters || [],
      hosts: row.hosts || []
    }
  } else {
    currentEditingId.value = null
    editorInitialData.value = null
  }
  templateDialogVisible.value = true
}

const handleTemplateSubmit = (payload: TemplateEditorPayload) => {
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

const tableSample = [
  {
    id: 1,
    templateName: '获取内存使用情况',
    templateType: '系统信息',
    templateContent: 'free -m',
    description: '查询目标机器内存占用',
    scriptLanguage: 'Shell' as ScriptLanguage
  },
  {
    id: 2,
    templateName: '采集磁盘状态',
    templateType: '系统信息',
    templateContent: 'df -h',
    description: '磁盘巡检',
    scriptLanguage: 'Shell' as ScriptLanguage
  }
]

const getList = async () => {
  loading.value = true
  setTimeout(() => {
    allTemplates.value = tableSample
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

const handleEdit = (row: TemplateRecord) => {
  openTemplateDialog(row)
}

const handleMoreAction = (action: string, row: TemplateRecord) => {
  if (action === 'delete') {
    allTemplates.value = allTemplates.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')
  }
}

const handleRowAction = (actionKey: string, row: TemplateRecord) => {
  handleMoreAction(actionKey, row)
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
})
</script>

<style scoped lang="less">
.template-management-page {
  padding-bottom: 16px;
}
</style>
