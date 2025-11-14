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
      <el-table-column prop="appType" label="应用类型" />
      <el-table-column
        prop="lifecycle"
        label="生命周期"
        :filters="[
          { text: '已上线', value: 'online' },
          { text: '测试中', value: 'testing' },
          { text: '停运', value: 'offline' }
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
      <el-table-column prop="language" label="语言">
        <template #default="scope">
          {{
            scope.row.language === 'zh-hans'
              ? '简体中文'
              : scope.row.language === 'en'
                ? '英语'
                : '其他'
          }}
        </template>
      </el-table-column>
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
import {
  apiGetApplicationList,
  apiGetPersonList,
  apiCreateApplication,
  apiDeleteApplication
} from '@/api/application'

interface ApplicationRecord {
  id: number
  appType: string
  lifecycle: string
  timezone: string
  language: string
  operator: string
}

const title = '应用管理'
const allApplications = ref<ApplicationRecord[]>([])
const loading = ref(false)
// 请求参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  appType: '',
  lifecycle: ''
})
const totalRecords = ref(0)
// 所有的人员
interface PersonItem {
  id: number
  name: string
  [key: string]: any
}
const personList = ref<PersonItem[]>([])
// 全部的应用类型
const applicationTypeOptions = computed(() =>
  Array.from(new Set(allApplications.value.map((item) => item.appType)))
)
// 顶部筛选
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'appType',
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
    const matchType = queryParams.appType ? item.appType === queryParams.appType : true
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
    prop: 'appType',
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
      { label: '已上线', value: 'online' },
      { label: '测试中', value: 'testing' },
      { label: '停运', value: 'offline' }
    ]
  },
  {
    prop: 'language',
    label: '语言',
    type: 'select',
    required: true,
    options: [
      { label: '简体中文', value: 'zh-hans' },
      { label: 'English', value: 'en' }
    ]
  },
  {
    prop: 'timeZone',
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
    prop: 'opsPerson',
    label: '运维人员',
    type: 'select',
    required: true,
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({ label: item.name, value: item.id }))
  },
  {
    prop: 'productPerson',
    label: '产品人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({ label: item.name, value: item.id }))
  },
  {
    prop: 'developer',
    label: '开发人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({ label: item.name, value: item.id }))
  },
  {
    prop: 'tester',
    label: '测试人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({ label: item.name, value: item.id }))
  },
  {
    prop: 'operator',
    label: '操作人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({ label: item.name, value: item.id }))
  },
  {
    prop: 'remark',
    label: '备注',
    type: 'textarea',
    maxlength: 100,
    showWordLimit: true,
    placeholder: '请输入',
    rows: 3
  }
]
// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetApplicationList({ ...queryParams })
    allApplications.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}
// 获取人员列表
const getPersonListData = async () => {
  const res = await apiGetPersonList()
  personList.value = res.data.list
}
// 生命周期标签颜色
const getLifecycleTagType = (lifecycle: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    online: 'success',
    testing: 'warning',
    offline: 'danger'
  }
  return map[lifecycle] || 'info'
}
// 过滤生命周期
const filterHandler = (value: string) => {
  console.log('filterHandler', value)
  queryParams.appType = value
  queryParams.page = 1
  getList()
}
// 搜索
const handleSearch = (params: Record<string, any>) => {
  queryParams.appType = params.appType || ''
  queryParams.page = 1
  getList()
}
// 刷新
const handleRefresh = (params?: Record<string, any>) => {
  if (params) {
    queryParams.appType = params.appType || ''
    queryParams.page = 1
    queryParams.lifecycle = params.lifecycle || ''
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
    lifecycle: 'online',
    language: 'zh-hans',
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
    await apiCreateApplication(_formData)
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
  getPersonListData()
})
</script>

<style scoped lang="less"></style>
