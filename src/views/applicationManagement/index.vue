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
      <el-table-column prop="applicationType" label="应用类型" />
      <el-table-column
        prop="lifecycle"
        label="生命周期"
        :filters="[
          { text: '已上线', value: '已上线' },
          { text: '测试中', value: '测试中' },
          { text: '停运', value: '停运' }
        ]"
        :filter-method="filterHandler"
      >
        <template #default="scope">
          <el-tag :type="getLifecycleTagType(scope.row.lifecycle)">
            {{ scope.row.lifecycle }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="timezone" label="时区" />
      <el-table-column prop="language" label="语言" />
      <el-table-column prop="operator" label="运维人员" />
      <TableActionsColumn @edit="handleEdit" />
    </template>
  </ManagementList>

  <FormDialog
    v-model:visible="formDialogVisible"
    :title="formDialogTitle"
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
import { FormDialog, type FormField } from '@/components/FormDialog'
import { TableActionsColumn } from '@/components/TableActionsColumn'

interface ApplicationRecord {
  id: number
  applicationType: string
  lifecycle: string
  timezone: string
  language: string
  operator: string
}

const title = '应用管理'
const allApplications = ref<ApplicationRecord[]>([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  applicationType: ''
})
const totalRecords = computed(() => filteredApplications.value.length)
// 全部的应用类型
const applicationTypeOptions = computed(() =>
  Array.from(new Set(allApplications.value.map((item) => item.applicationType)))
)
// 顶部筛选
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'applicationType',
    type: 'select',
    placeholder: '全部应用类型',
    width: 180,
    clearable: true,
    options: applicationTypeOptions.value.map((item) => ({ label: item, value: item }))
  }
])
// 顶部操作
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建应用',
    type: 'primary',
    onClick: () => openCreateEditDialog(false, {})
  }
]
// 过滤后的表格数据
const filteredApplications = computed(() => {
  return allApplications.value.filter((item) => {
    const matchType = queryParams.applicationType
      ? item.applicationType === queryParams.applicationType
      : true
    return matchType
  })
})
// 截取过滤后的表格数据
const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredApplications.value.slice(start, start + queryParams.pageSize)
})

// 弹框相关
const formDialogVisible = ref(false)
const formDialogTitle = ref('')
const formDialogIsEdit = ref(false)
const formDialogFields = ref<FormField[]>([])
const formDialogDefaultData = ref<Record<string, any>>({})
const formDialogLoading = ref(false)

// 表单字段合集
const createEditFields: FormField[] = [
  {
    prop: 'basicInfo',
    name: '基础信息',
    type: 'text'
  },
  {
    prop: 'applicationType',
    label: '应用类型',
    type: 'input',
    placeholder: '请输入应用类型',
    required: true
  },
  {
    prop: 'lifecycle',
    label: '生命周期',
    type: 'select',
    required: true,
    options: [
      { label: '已上线', value: '已上线' },
      { label: '测试中', value: '测试中' },
      { label: '停运', value: '停运' }
    ]
  },
  {
    prop: 'language',
    label: '语言',
    type: 'select',
    required: true,
    options: [
      { label: '简体中文', value: '简体中文' },
      { label: 'English', value: 'English' }
    ]
  },
  {
    prop: 'timezone',
    label: '时区',
    type: 'input',
    required: true,
    disabled: true,
    placeholder: 'Asia/Shanghai',
    readonly: true
  },
  {
    prop: 'principal',
    name: '负责人',
    type: 'text'
  },
  {
    prop: 'operator',
    label: '运维人员',
    type: 'select',
    required: true,
    placeholder: '请选择人员',
    options: []
  },
  {
    prop: 'productPersonnel',
    label: '产品人员',
    type: 'select',
    placeholder: '请选择人员',
    options: []
  },
  {
    prop: 'developmentPersonnel',
    label: '开发人员',
    type: 'select',
    placeholder: '请选择人员',
    options: []
  },
  {
    prop: 'testingPersonnel',
    label: '测试人员',
    type: 'select',
    placeholder: '请选择人员',
    options: []
  },
  {
    prop: 'operationPersonnel',
    label: '操作人员',
    type: 'select',
    placeholder: '请选择人员',
    options: []
  },
  {
    prop: 'remarks',
    label: '备注',
    type: 'textarea',
    maxlength: 100,
    showWordLimit: true,
    placeholder: '请输入',
    rows: 3
  }
]
// 生命周期标签颜色
const getLifecycleTagType = (lifecycle: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    已上线: 'success',
    测试中: 'warning',
    停运: 'danger'
  }
  return map[lifecycle] || 'info'
}
// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取数据
    const mockData: ApplicationRecord[] = [
      {
        id: 1,
        applicationType: '应用A',
        lifecycle: '测试中',
        timezone: 'Asia/Shanghai',
        language: '简体中文',
        operator: '张三'
      },
      {
        id: 2,
        applicationType: '应用B',
        lifecycle: '已上线',
        timezone: 'Asia/Shanghai',
        language: 'English',
        operator: '张五'
      },
      {
        id: 3,
        applicationType: '应用C',
        lifecycle: '停运',
        timezone: 'Asia/Shanghai',
        language: '简体中文',
        operator: '李四'
      }
    ]
    allApplications.value = mockData
  } finally {
    loading.value = false
  }
}
const filterHandler = (value: string, row, column) => {
  const property = column['property']
  return row[property] === value
}
// 搜索
const handleSearch = (params: Record<string, any>) => {
  queryParams.applicationType = params.applicationType || ''
  queryParams.page = 1
  getList()
}
// 刷新
const handleRefresh = (params?: Record<string, any>) => {
  if (params) {
    queryParams.applicationType = params.applicationType || ''
    queryParams.page = 1
  }
  getList()
}
// 分页切换
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}
// 新建/编辑应用
const openCreateEditDialog = (isEdit: boolean, data: Record<string, any>) => {
  formDialogIsEdit.value = isEdit
  formDialogTitle.value = isEdit ? '编辑应用' : '新建应用'
  formDialogFields.value = createEditFields.map((field) => ({ ...field }))
  formDialogDefaultData.value = {
    lifecycle: '已上线',
    language: '简体中文',
    timezone: 'Asia/Shanghai',
    ...data
  }
  formDialogVisible.value = true
}
// 编辑
const handleEdit = (row: ApplicationRecord) => {
  openCreateEditDialog(true, row)
}
// 新建/编辑弹框保存
const handleFormDialogConfirm = async (_formData: any, done: (success: boolean) => void) => {
  try {
    formDialogLoading.value = true
    // TODO: 调用API保存
    if (formDialogIsEdit.value) {
      ElMessage.success('编辑成功')
    } else {
      ElMessage.success('创建成功')
    }
    done(true)
    getList()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
    done(false)
  } finally {
    formDialogLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="less"></style>
