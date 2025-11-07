<template>
  <ManagementList
    ref="managementListRef"
    :title="title"
    :table-data="tableData"
    :columns="columns"
    :loading="loading"
    :total-records="totalRecords"
    :show-selection="true"
    :toolbar-buttons="toolbarButtons"
    :search-options="searchOptions"
    :bulk-actions="bulkActions"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
    @selection-change="handleSelectionChange"
    @bulk-action="handleBulkAction"
  >
    <template #columns>
      <el-table-column prop="name" label="权限名称" />
      <el-table-column prop="createdAt" label="创建时间" sortable="custom" width="180" />
      <el-table-column prop="description" label="备注" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-link type="primary" @click="handleEdit(scope.row)">编辑</el-link>
          <el-link type="primary">授权</el-link>
          <el-link type="primary" @click="handleEdit(scope.row)">删除</el-link>
        </template>
      </el-table-column>
    </template>
  </ManagementList>

  <!-- 新建/编辑权限弹框 -->
  <CreateEditDialog
    v-model:visible="createEditDialogVisible"
    :create-title="'新建权限'"
    :edit-title="'编辑权限'"
    :fields="createEditFields"
    :default-form-data="currentEditData"
    :is-edit="isEdit"
    @confirm="handleCreateEditConfirm"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ManagementList } from '@/components/ManagementList'
import { CreateEditDialog, type FormField } from '@/components/CreateEditDialog'
import type { ToolbarButton, SearchOption, BulkAction } from '@/components/ManagementList'
import { apiGetPermissionList } from '@/api/permission'

const title = '权限管理'
const managementListRef = ref()
const tableData = ref<any[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const createEditDialogVisible = ref(false)
const isEdit = ref(false)
const currentEditData = ref<any>({})
const selectedRows = ref<any[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

// 表格列配置
const columns: any[] = []

// 工具栏按钮
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建权限',
    type: 'primary',
    onClick: () => {
      isEdit.value = false
      currentEditData.value = {}
      createEditDialogVisible.value = true
    }
  }
]

// 搜索选项
const searchOptions: SearchOption[] = [{ label: '搜索权限名称', value: 'nameKeyword' }]

// 批量操作
const bulkActions: BulkAction[] = [
  {
    key: 'assignRole',
    label: '分配角色',
    disabled: false,
    onClick: (rows) => {
      console.log('分配角色', rows)
    }
  },
  {
    key: 'delete',
    label: '删除权限',
    disabled: false,
    onClick: (rows) => {
      handleBatchDelete(rows)
    }
  }
]

// 新建/编辑表单字段
const createEditFields: FormField[] = [
  {
    prop: 'name',
    label: '权限名称',
    type: 'input',
    placeholder: '请输入权限名称',
    required: true,
    maxlength: 64,
    showWordLimit: true,
    hint: '仅支持英文、数字、和符号".-_",不超过64个字符'
  },
  {
    prop: 'code',
    label: '权限代码',
    type: 'input',
    placeholder: '请输入权限代码',
    required: true,
    maxlength: 64,
    showWordLimit: true
  },
  {
    prop: 'remark',
    label: '备注',
    type: 'textarea',
    maxlength: 128,
    showWordLimit: true,
    hint: '不超过128个字符',
    rows: 3
  }
]

// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetPermissionList(queryParams)
    tableData.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

// 刷新
const handleRefresh = (params: any) => {
  Object.assign(queryParams, params)
  getList()
}

// 分页变化
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 批量操作
const handleBulkAction = (actionKey: string, rows: any[]) => {
  console.log('批量操作', actionKey, rows)
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  currentEditData.value = { ...row }
  createEditDialogVisible.value = true
}

// 状态变化
const handleStatusChange = (row: any) => {
  console.log('状态变化', row)
  ElMessage.success('状态更新成功')
}

// 更多操作
const handleMoreAction = ({ action, row }: { action: string; row: any }) => {
  switch (action) {
    case 'assignRole':
      ElMessage.info('分配角色功能待实现')
      break
    case 'manageUsers':
      ElMessage.info('管理用户功能待实现')
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// 删除单个权限
const handleDelete = async (row?: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // TODO: 调用API删除，使用 row.id
    ElMessage.success('删除成功')
    getList()
  } catch {
    // 用户取消
  }
}

// 批量删除
const handleBatchDelete = async (rows: any[]) => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的${rows.length}个权限吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('删除成功')
    getList()
  } catch {
    // 用户取消
  }
}

// 新建/编辑确认
const handleCreateEditConfirm = (formData: any) => {
  console.log('提交表单', formData)
  ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style lang="less" scoped>
:deep(.el-link) {
  font-size: 13px;
}
</style>
