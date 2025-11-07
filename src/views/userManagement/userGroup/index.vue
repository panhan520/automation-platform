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
      <el-table-column prop="name" label="用户组名称" />
      <el-table-column prop="createdAt" label="创建时间" sortable="custom" width="180" />
      <el-table-column prop="memberCount" label="用户数" />
      <el-table-column prop="roleNames" label="权限数" width="100" />
      <el-table-column prop="description" label="备注" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <div class="table-button" @click="handleAddUser(scope.row)">添加用户</div>
          <div class="table-button" @click="handleAddPermission(scope.row)">添加权限</div>
          <div class="table-button" @click="handleDelete(scope.row)">删除</div>
        </template>
      </el-table-column>
    </template>
  </ManagementList>

  <!-- 新建/编辑用户组弹框 -->
  <FormDialog
    v-model:visible="createEditDialogVisible"
    :create-title="'新建用户组'"
    :edit-title="'编辑用户组'"
    :fields="createEditFields"
    :default-form-data="currentEditData"
    :is-edit="isEdit"
    @confirm="handleCreateEditConfirm"
  />

  <!-- 邀请用户组弹框 -->
  <FormDialog
    v-model:visible="inviteDialogVisible"
    :title="'邀请用户组'"
    :fields="inviteFields"
    @confirm="handleInviteConfirm"
  />

  <!-- 添加用户弹框 -->
  <AddUserDialog
    ref="addUserDialogRef"
    v-model:visible="addUserDialogVisible"
    :loading="addUserLoading"
    @confirm="handleAddUserConfirm"
    @refresh="handleAddUserRefresh"
    @create-user="handleCreateUserFromAdd"
  />

  <!-- 添加权限弹框 -->
  <FormDialog
    v-model:visible="addPermissionDialogVisible"
    title="添加权限"
    :user-name="currentGroup?.name || ''"
    :show-user-name="false"
    :fields="permissionFields"
    :loading="permissionLoading"
    @confirm="handlePermissionConfirm"
  />

  <!-- 删除确认框 -->
  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    :title="'确认删除'"
    :message="deleteMessage"
    :loading="deleteLoading"
    @confirm="handleDeleteConfirm"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList } from '@/components/ManagementList'
import { FormDialog, type FormField } from '@/components/FormDialog'
import { AddUserDialog } from '@/components/AddUserDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import type { ToolbarButton, SearchOption, BulkAction } from '@/components/ManagementList'
import { apiGetPermissionList, apiBindPermission } from '@/api/permission'
import { apiGetusersList } from '@/api/user'
import { apiGetGroupsList } from '@/api/userGroup'

const title = '用户组'
const managementListRef = ref()
const tableData = ref<any[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const createEditDialogVisible = ref(false)
const inviteDialogVisible = ref(false)
const addUserDialogVisible = ref(false)
const addPermissionDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const currentEditData = ref<any>({})
const selectedRows = ref<any[]>([])
const currentGroup = ref<any>(null)
const addUserLoading = ref(false)
const addUserDialogRef = ref<InstanceType<typeof AddUserDialog> | null>(null)
const permissionFields = ref<FormField[]>([])
const permissionLoading = ref(false)
const deleteMessage = ref('')
const deleteLoading = ref(false)
const currentDeleteRow = ref<any>(null)
const currentDeleteRows = ref<any[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  nameKeyword: ''
})

// 表格列配置
const columns: any[] = []

// 工具栏按钮
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建用户组',
    type: 'primary',
    onClick: () => {
      isEdit.value = false
      currentEditData.value = {}
      createEditDialogVisible.value = true
    }
  }
]

// 搜索选项
const searchOptions: SearchOption[] = [{ label: '搜索用户组名称', value: 'nameKeyword' }]

// 批量操作
const bulkActions: BulkAction[] = [
  {
    key: 'addPermission',
    label: '添加权限',
    disabled: false,
    onClick: (rows) => {
      console.log('添加权限', rows)
    }
  },
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
    label: '删除用户组',
    disabled: false,
    onClick: (rows) => {
      currentDeleteRows.value = rows
      deleteMessage.value = `确定要删除选中的${rows.length}个用户组吗？`
      deleteDialogVisible.value = true
    }
  }
]

// 新建/编辑表单字段
const createEditFields: FormField[] = [
  {
    prop: 'name',
    label: '用户组名称',
    type: 'input',
    placeholder: '仅支持英文、数字、和符号".-_",不超过64个字符',
    required: true,
    maxlength: 64
  },
  {
    prop: 'description',
    label: '备注',
    type: 'textarea',
    maxlength: 128,
    showWordLimit: true,
    placeholder: '不超过128个字符',
    rows: 3
  }
]

// 邀请表单字段
const inviteFields: FormField[] = [
  {
    prop: 'email',
    label: '邮箱地址',
    type: 'email',
    required: true
  },
  {
    prop: 'permission',
    label: '权限名称',
    type: 'select',
    placeholder: '请选择权限',
    options: [
      { label: '权限A', value: '权限A' },
      { label: '权限B', value: '权限B' }
    ]
  },
  {
    prop: 'remark',
    label: '备注',
    type: 'textarea',
    rows: 3
  }
]

// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetGroupsList({})
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

// 添加用户
const handleAddUser = (row: any) => {
  currentGroup.value = row
  addUserDialogVisible.value = true
  handleAddUserRefresh()
}

// 添加权限
const handleAddPermission = (row: any) => {
  currentGroup.value = row
  permissionFields.value = [
    {
      prop: 'product',
      label: '所属产品',
      type: 'select',
      required: true,
      placeholder: '请选择所属产品',
      options: [
        { label: '产品A', value: 'productA' },
        { label: '产品B', value: 'productB' }
      ]
    },
    {
      prop: 'permissionIds',
      label: '选择权限',
      type: 'multiSelect',
      required: true,
      placeholder: '请选择权限',
      options: []
    }
  ]
  loadPermissionOptions()
  addPermissionDialogVisible.value = true
}

// 加载权限选项
const loadPermissionOptions = async () => {
  try {
    const { data, code } = await apiGetPermissionList({})
    if (code === 200 && data?.list) {
      const permissionField = permissionFields.value.find((field) => field.prop === 'permissionIds')
      if (permissionField) {
        permissionField.options = data.list.map((permission: any) => ({
          label: permission.name,
          value: +permission.id
        }))
      }
    }
  } catch (error) {
    console.error('获取权限列表失败', error)
  }
}

// 添加用户相关
const handleAddUserRefresh = async () => {
  try {
    addUserLoading.value = true
    const res = await apiGetusersList({ page: 1, pageSize: 200 })
    if (addUserDialogRef.value) {
      addUserDialogRef.value.setUserList(res.data.list || [])
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    addUserLoading.value = false
  }
}

const handleAddUserConfirm = (users: any[]) => {
  console.log('添加用户到组', currentGroup.value, users)
  // TODO: 调用API添加用户到组
  ElMessage.success('添加成功')
  getList()
}

const handleCreateUserFromAdd = () => {
  addUserDialogVisible.value = false
  // TODO: 打开新建用户弹框
  ElMessage.info('请从用户管理页面新建用户')
}

// 权限确认
const handlePermissionConfirm = async (formData: any, done: (success: boolean) => void) => {
  try {
    permissionLoading.value = true
    await apiBindPermission({
      groupIds: [currentGroup.value.id],
      permissionGroupIds: formData.permissionIds,
      product: formData.product
    })
    ElMessage.success('添加成功')
    getList()
    done(true)
  } catch (error: any) {
    console.error('添加权限失败', error)
    ElMessage.error(error?.message || '添加权限失败')
    done(false)
  } finally {
    permissionLoading.value = false
  }
}

// 更多操作
const handleMoreAction = ({ action, row }: { action: string; row: any }) => {
  switch (action) {
    case 'assignRole':
      ElMessage.info('分配角色功能待实现')
      break
    case 'addPermission':
      handleAddPermission(row)
      break
    case 'manageMembers':
      handleAddUser(row)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// 删除单个用户组
const handleDelete = (row: any) => {
  currentDeleteRow.value = row
  deleteMessage.value = `确定要删除用户组【${row.name}】吗？`
  deleteDialogVisible.value = true
}

// 删除确认
const handleDeleteConfirm = async () => {
  try {
    deleteLoading.value = true
    const rowsToDelete = currentDeleteRow.value ? [currentDeleteRow.value] : currentDeleteRows.value
    // TODO: 调用API删除用户组
    // await apiDeleteGroup({ ids: rowsToDelete.map((r) => r.id) })
    ElMessage.success('删除成功')
    getList()
    deleteDialogVisible.value = false
    currentDeleteRow.value = null
    currentDeleteRows.value = []
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 新建/编辑确认
const handleCreateEditConfirm = async (formData: any, done: (success: boolean) => void) => {
  try {
    console.log('提交表单', formData)
    // TODO: 调用API保存
    ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
    getList()
    done(true)
  } catch (error: any) {
    console.error('保存失败', error)
    ElMessage.error(error?.message || (isEdit.value ? '编辑失败' : '创建失败'))
    done(false)
  }
}

// 邀请确认
const handleInviteConfirm = (formData: any) => {
  console.log('邀请用户组', formData)
  ElMessage.success('邀请成功')
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
