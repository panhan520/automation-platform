<template>
  <ManagementList
    :title="title"
    :table-data="allApplications"
    :loading="loading"
    :total-records="totalRecords"
    :toolbar-buttons="toolbarButtons"
    :filters="toolbarFilters"
    :query-params="queryParams"
    :columns="tableColumnsForList"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
    @filter-change="handleTableFilterChange"
    storageKey="applicationManagement_columnConfig"
  >
    <!-- 表格列 -->
    <template #columns="{ displayColumns }">
      <template v-for="col in displayColumns" :key="col.prop">
        <el-table-column
          v-if="col.prop !== 'actions'"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :sortable="col.sortable"
          :filters="col.filters"
          :filter-multiple="col.filterMultiple"
          :column-key="col.prop"
        >
          <template v-if="col.slot" #default="scope">
            <el-tag
              v-if="col.prop === 'lifeCycle'"
              :type="getLifecycleTagType(scope.row.lifeCycle)"
            >
              {{ getLifecycleName(scope.row.lifeCycle) }}
            </el-tag>
            <template v-else-if="col.prop === 'language'">{{
              scope.row.language === 'zh-hans'
                ? '简体中文'
                : scope.row.language === 'en'
                  ? '英语'
                  : '其他'
            }}</template>
            <span v-else>{{ scope.row[col.prop] }}</span>
          </template>
        </el-table-column>
      </template>
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
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import { type ColumnItem } from '@/components/ColumnCustomDialog'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { FormDialog, type FormField } from '@/components/FormDialog'
import { TableActionsColumn } from '@/components/TableActionsColumn'
import {
  apiGetApplicationList,
  apiGetPersonList,
  apiGetAppTypeList,
  apiCreateApplication
} from '@/api/application'

interface ApplicationRecord {
  id: number
  appType: string
  lifeCycle: string
  timeZone: string
  language: string
  opsPerson: string
}

const title = '应用管理'
const allApplications = ref<ApplicationRecord[]>([])
const loading = ref(false)
// 请求参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  appType: '',
  lifeCycle: ''
})
const totalRecords = ref(0)
// 所有的人员
interface PersonItem {
  id: number
  nickname: string
  [key: string]: any
}
const personList = ref<PersonItem[]>([])
const appTypeList = ref<string[]>([])
// 顶部筛选
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'appType',
    type: 'select',
    placeholder: '全部应用类型',
    width: 180,
    clearable: true,
    options: appTypeList.value.map((item) => ({ label: item, value: item }))
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

// 弹框相关
const formDialogVisible = ref(false)
const formDialogTitle = ref('')
const formDialogIsEdit = ref(false)
const formDialogDefaultData = ref<Record<string, any>>({})
const formDialogLoading = ref(false)

// 表单字段合集
const formDialogFields = computed<FormField[]>(() => [
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
    required: true,
    maxlength: 50
  },
  {
    prop: 'lifeCycle',
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
    options: personList.value.map((item) => ({
      label: item.nickname,
      value: item.id,
      dept: item.dept
    }))
  },
  {
    prop: 'productPerson',
    label: '产品人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({
      label: item.nickname,
      value: item.id,
      dept: item.dept
    }))
  },
  {
    prop: 'developer',
    label: '开发人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({
      label: item.nickname,
      value: item.id,
      dept: item.dept
    }))
  },
  {
    prop: 'tester',
    label: '测试人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({
      label: item.nickname,
      value: item.id,
      dept: item.dept
    }))
  },
  {
    prop: 'operator',
    label: '操作人员',
    type: 'select',
    placeholder: '请选择人员',
    options: personList.value.map((item) => ({
      label: item.nickname,
      value: item.id,
      dept: item.dept
    }))
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
])
const tableColumns = ref<ColumnItem[]>([
  { prop: 'appType', label: '应用类型', visible: true, order: 0 },
  {
    prop: 'lifeCycle',
    label: '生命周期',
    visible: true,
    order: 1,
    filters: [
      { text: '已上线', value: 'online' },
      { text: '测试中', value: 'testing' },
      { text: '停运', value: 'offline' }
    ],
    filterMultiple: false,
    slot: true
  },
  { prop: 'timeZone', label: '时区', visible: true, order: 2 },
  { prop: 'language', label: '语言', visible: true, order: 3, slot: true },
  { prop: 'opsPersonNickname', label: '运维人员', visible: true, order: 4, slot: true }
])

// 转换为 TableColumn 类型供 ManagementList 使用
const tableColumnsForList = computed<TableColumn[]>(() => {
  return tableColumns.value.map((col) => ({
    prop: col.prop,
    label: col.label,
    width: col.width,
    minWidth: col.minWidth,
    sortable: col.sortable,
    visible: col.visible,
    order: col.order,
    isDisabled: col.isDisabled,
    filters: col.filters,
    filterMultiple: col.filterMultiple,
    slot: typeof col.slot === 'string' ? col.slot : col.slot ? col.prop : undefined
  }))
})
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
const getPersonList = async () => {
  const res = await apiGetPersonList()
  personList.value = res.data.list
}
// 获取应用类型列表
const getAppTypeList = async () => {
  const res = await apiGetAppTypeList()
  appTypeList.value = res.data.list
}
// 生命周期标签颜色
const getLifecycleTagType = (lifeCycle: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    online: 'success',
    testing: 'warning',
    offline: 'danger'
  }
  return map[lifeCycle] || 'info'
}
// 生命周期名称
const getLifecycleName = (lifeCycle: string) => {
  const map: Record<string, string> = {
    online: '已上线',
    testing: '测试中',
    offline: '停运'
  }
  return map[lifeCycle] || '未知'
}
// 过滤生命周期
const handleTableFilterChange = (filters: any) => {
  if (filters.lifeCycle && filters.lifeCycle.length > 0) {
    queryParams.lifeCycle = filters.lifeCycle[0] // 单选
  } else {
    queryParams.lifeCycle = ''
  }
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
    queryParams.lifeCycle = params.lifeCycle || ''
  }
  getList()
}
// 分页切换
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}
// 新建/编辑应用
const openCreateEditDialog = (isEdit: boolean, data: Record<string, any>) => {
  formDialogIsEdit.value = isEdit
  formDialogTitle.value = isEdit ? '编辑应用' : '新建应用'
  formDialogDefaultData.value = {
    lifeCycle: 'online',
    language: 'zh-hans',
    timeZone: 'Asia/Shanghai',
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
    delete _formData.basicInfo
    delete _formData.principal
    _formData.id = formDialogDefaultData.value.id
    await apiCreateApplication(_formData)
    if (formDialogIsEdit.value) {
      ElMessage.success('编辑成功')
    } else {
      ElMessage.success('添加成功')
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
  getAppTypeList()
  getPersonList()
})
</script>

<style scoped lang="less"></style>
