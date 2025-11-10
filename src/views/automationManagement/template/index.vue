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
      <el-table-column prop="templateName" label="模版名称" />
      <el-table-column prop="templateType" label="模版类型">
        <template #default="scope">
          <el-tag :type="getTemplateTypeTagType(scope.row.templateType)">{{
            scope.row.templateType
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="templateContent" label="模版内容" :show-overflow-tooltip="true" />
      <el-table-column prop="description" label="描述信息" />
      <TableActionsColumn :actions="tableActions" @edit="handleEdit" @action="handleMoreAction" />
    </template>
  </ManagementList>

  <FormDialog
    v-model:visible="formDialogVisible"
    :title="formDialogTitle"
    :create-title="'新建模版'"
    :edit-title="'编辑模版'"
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

interface TemplateRecord {
  id: number
  templateName: string
  templateType: string
  templateContent: string
  description: string
}

const title = '模版管理'
const allTemplates = ref<TemplateRecord[]>([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建模版',
    type: 'primary',
    onClick: () => openCreateEditDialog(false, {})
  }
]

const tableActions: TableAction[] = [
  {
    key: 'delete',
    label: '删除',
    divided: true,
    danger: true
  }
]

const filteredTemplates = computed(() => {
  return allTemplates.value.filter((item) =>
    queryParams.keyword
      ? item.templateName.toLowerCase().includes(queryParams.keyword.toLowerCase())
      : true
  )
})

const toolbarFilters: ToolbarFilter[] = [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索模版名称',
    width: 260,
    prefixIcon: Search
  }
]

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredTemplates.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredTemplates.value.length)

const formDialogVisible = ref(false)
const formDialogTitle = ref('')
const formDialogIsEdit = ref(false)
const formDialogFields = ref<FormField[]>([])
const formDialogDefaultData = ref<Record<string, any>>({})
const formDialogLoading = ref(false)

const createEditFields: FormField[] = [
  {
    prop: 'templateType',
    label: '模版类型',
    type: 'select',
    required: true,
    placeholder: '请选择模版类型',
    options: [
      { label: '部署模版', value: '部署模版' },
      { label: '监控模版', value: '监控模版' },
      { label: '备份模版', value: '备份模版' },
      { label: '维护模版', value: '维护模版' },
      { label: '安全模版', value: '安全模版' }
    ]
  },
  {
    prop: 'templateName',
    label: '模版名称',
    type: 'input',
    required: true,
    placeholder: '请输入模版名称'
  },
  {
    prop: 'scriptLanguage',
    label: '脚本语言',
    type: 'select',
    required: true,
    options: [
      { label: 'Shell', value: 'Shell' },
      { label: 'Python', value: 'Python' }
    ]
  },
  {
    prop: 'templateContent',
    label: '模板内容',
    type: 'textarea',
    required: true,
    placeholder: '请输入模板内容',
    rows: 10
  },
  {
    prop: 'remarks',
    label: '备注信息',
    type: 'textarea',
    placeholder: '请输入模板备注信息',
    rows: 3
  }
]

const getTemplateTypeTagType = (
  type: string
): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    部署模版: 'primary',
    监控模版: 'success',
    备份模版: 'warning',
    维护模版: 'info',
    安全模版: 'danger'
  }
  return map[type] || 'info'
}

const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取数据
    allTemplates.value = [
      {
        id: 1,
        templateName: 'Nginx部署模版',
        templateType: '部署模版',
        templateContent: '#!/bin/bash apt-get update apt-get install -y ngi...',
        description: '用于快速部署Nginx服务器的标准模版'
      },
      {
        id: 2,
        templateName: '系统监控模版',
        templateType: '监控模版',
        templateContent: '#!/bin/bash ps aux | grep nginx df -h free -m ne...',
        description: '监控系统资源使用情况和服务状态'
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

const handleEdit = (row: TemplateRecord) => {
  openCreateEditDialog(true, row)
}

const handleMoreAction = (action: string, row: TemplateRecord) => {
  switch (action) {
    case 'delete':
      handleDelete(row)
      break
    default:
      ElMessage.info('功能待实现')
  }
}

const handleDelete = async (row: TemplateRecord) => {
  try {
    loading.value = true
    // TODO: 调用API删除
    ElMessage.success(`删除模版 ${row.templateName} 成功`)
    getList()
  } catch (error) {
    ElMessage.error('删除模版失败')
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
    ElMessage.error('操作失败')
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
