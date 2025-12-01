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
      :template-types="templateTypeList"
      :initial-data="editorInitialData"
      :loading="templateDialogLoading"
      @submit="handleTemplateSubmit"
    />

    <DeleteConfirmDialog
      v-model:visible="deleteDialog.visible"
      title="删除模版"
      :target-name="deleteDialog.target?.name || ''"
      description="删除后该模版将被清除且无法被引用，请谨慎操作。"
      :loading="deleteDialog.loading"
      @confirm="confirmDeleteTemplate"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList, type TableColumn, type ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Search, Refresh } from '@element-plus/icons-vue'
import { TemplateEditorDialog } from '@/components/TemplateEditorDialog'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import {
  apiGetTemplatesList,
  apiGetTemplatesType,
  apiCreateTemplates,
  apiDeleteTemplate
} from '@/api/template'
import type { TemplateRecord } from '@/api/template/type'

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
    width: 220,
    clearable: true,
    options: templateTypeList.value.map((item) => ({ label: item, value: item }))
  },
  {
    key: 'query',
    type: 'input',
    placeholder: '搜索模版名称',
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
    link: true
  }
]

const totalRecords = ref(0)
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
// 打开编辑保存模版的弹框
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
// 新建编辑模版的保存操作
const handleTemplateSubmit = async (payload) => {
  try {
    templateDialogLoading.value = true
    const params = { ...payload }
    if (currentEditingId.value) {
      params.id = currentEditingId.value
    }
    await apiCreateTemplates(params)
    ElMessage.success(currentEditingId.value ? '编辑成功' : '添加成功')
    getList()
    templateDialogLoading.value = false
    templateDialogVisible.value = false
  } finally {
    templateDialogLoading.value = false
  }
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
// 编辑
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
// 删除模版
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

const handleRowAction = (actionKey: string, row: TemplateRecord) => {
  if (actionKey === 'delete') {
    openDeleteDialog(row)
    return
  }
  handleEdit(row)
}

// 预定义的颜色类型
const tagTypes: Array<'primary' | 'success' | 'warning' | 'info' | 'danger'> = [
  'primary',
  'success',
  'warning',
  'info',
  'danger'
]

// 类型到颜色的映射（动态分配）
const typeColorMap = ref<Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'>>({})

// 初始化类型颜色映射
const initTypeColorMap = () => {
  const uniqueTypes = new Set(allTemplates.value.map((t) => t.type).filter(Boolean))
  let colorIndex = 0

  uniqueTypes.forEach((type) => {
    if (!typeColorMap.value[type]) {
      typeColorMap.value[type] = tagTypes[colorIndex % tagTypes.length]
      colorIndex++
    }
  })
}

// 监听模板列表变化，更新颜色映射
watch(
  () => allTemplates.value,
  () => {
    initTypeColorMap()
  },
  { deep: true, immediate: true }
)

const getTemplateTypeTagType = (type: string) => {
  if (!type) return 'info'
  // 如果类型还没有分配颜色，分配一个
  if (!typeColorMap.value[type]) {
    const existingTypes = Object.keys(typeColorMap.value)
    const colorIndex = existingTypes.length % tagTypes.length
    typeColorMap.value[type] = tagTypes[colorIndex]
  }
  return typeColorMap.value[type] || 'info'
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
