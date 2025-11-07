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
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="username" label="用户名称" />
      <el-table-column prop="createTime" label="创建时间" sortable="custom" />
      <el-table-column prop="enable" label="用户状态">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enable"
            active-color="#409EFF"
            inactive-color="#C0CCDA"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="roles" label="角色">
        <template #default="scope">
          <span>{{ scope.row.roles.map((role) => role.label).join(', ') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="groups" label="用户组">
        <template #default="scope">
          <span>{{ scope.row.groups.map((group) => group.label).join(', ') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最近登录时间" sortable="custom" />
      <el-table-column prop="description" label="备注" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <div class="table-button" @click="handleEdit(scope.row)">编辑</div>
          <el-dropdown @command="handleMoreAction" trigger="click">
            <div class="table-button">更多</div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'activeUser', row: scope.row }">
                  激活
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'assignRole', row: scope.row }">
                  分配角色
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'addToGroup', row: scope.row }">
                  添加至组
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'resetPassword', row: scope.row }">
                  重置密码
                </el-dropdown-item>
                <el-dropdown-item
                  :command="{ action: 'delete', row: scope.row }"
                  divided
                  style="color: #f56c6c"
                >
                  删除用户
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </template>
  </ManagementList>

  <!-- 统一表单弹框（新建/编辑用户、邀请用户、操作弹框） -->
  <FormDialog
    v-model:visible="formDialogVisible"
    :title="formDialogTitle"
    :create-title="'新建用户'"
    :edit-title="'编辑用户'"
    :is-edit="formDialogIsEdit"
    :fields="formDialogFields"
    :default-form-data="formDialogDefaultData"
    :show-user-name="formDialogShowUserName"
    :user-name="formDialogUserName"
    :loading="formDialogLoading"
    @confirm="handleFormDialogConfirm"
  />

  <!-- 删除确认框 -->
  <ConfirmDeleteDialog
    v-model:visible="deleteDialogVisible"
    :title="deleteTitle"
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
import type {
  TableColumn,
  ToolbarButton,
  SearchOption,
  BulkAction
} from '@/components/ManagementList'
import { apiGetRoleList } from '@/api/role'
import { apiGetGroupsList } from '@/api/userGroup'
import { apiGetPermissionList, apiBindPermission } from '@/api/permission'
import {
  apiGetusersList,
  apiCreateUser,
  apiEditUser,
  apiActiveUser,
  apiOperateUser,
  apiResetPwdUser,
  apiInviteUser
} from '@/api/user'

const title = '用户'
const managementListRef = ref()
const tableData = ref<any[]>([])
const loading = ref(false)
const totalRecords = ref(0)
// 统一表单弹框相关状态
const formDialogVisible = ref(false)
const formDialogTitle = ref('')
const formDialogIsEdit = ref(false)
const formDialogType = ref<'createEdit' | 'invite' | 'operation'>('createEdit')
const formDialogFields = ref<FormField[]>([])
const formDialogDefaultData = ref<any>({})
const formDialogLoading = ref(false)
const formDialogShowUserName = ref(false)
const formDialogUserName = ref('')
const currentOperationType = ref<string>('')
const currentOperationUser = ref<any>(null)

// 其他弹框
const addUserDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedRows = ref<any[]>([])
const addUserLoading = ref(false)
const addUserDialogRef = ref<InstanceType<typeof AddUserDialog> | null>(null)
const deleteTitle = ref('确认删除')
const deleteMessage = ref('')
const deleteLoading = ref(false)
const currentDeleteRows = ref<any[]>([])

// 表单字段配置（用于新建/编辑）
const createEditFields: FormField[] = [
  {
    prop: 'username',
    label: '用户名称',
    type: 'input',
    placeholder: '仅支持英文、数字、和符号".-_",6-40个字符',
    required: true,
    maxlength: 64,
    rules: [
      {
        required: true,
        message: '请输入用户名称',
        trigger: 'change'
      },
      {
        pattern: /^[a-zA-Z0-9\.\-_]{6,64}$/,
        message: '仅支持英文、数字、和符号".-_",6-40个字符',
        trigger: 'change'
      }
    ]
  },
  {
    prop: 'email',
    label: '邮箱地址',
    type: 'email',
    required: true,
    rules: [
      {
        required: true,
        message: '请输入邮箱地址',
        trigger: 'change'
      },
      {
        type: 'email',
        message: '请输入正确的邮箱地址',
        trigger: 'change'
      }
    ]
  },
  {
    prop: 'rid',
    label: '角色',
    type: 'select',
    options: []
  },
  {
    prop: 'password',
    label: '登录密码',
    type: 'password',
    required: false,
    showGenerate: true,
    showPasswordStrength: true,
    readonly: false
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
      { label: '权限B', value: '权限B' },
      { label: '权限C', value: '权限C' }
    ]
  },
  {
    prop: 'description',
    label: '备注',
    type: 'textarea',
    rows: 3
  }
]

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

// 表格列配置
const columns: TableColumn[] = []

// 工具栏按钮
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建用户',
    type: 'primary',
    onClick: () => {
      openCreateEditDialog(false, {})
    }
  },
  {
    key: 'invite',
    label: '邀请用户',
    type: 'primary',
    onClick: () => {
      openInviteDialog()
    }
  }
]

// 搜索选项
const searchOptions: SearchOption[] = [{ label: '搜索用户名称', value: 'username' }]

// 批量操作
const bulkActions: BulkAction[] = [
  {
    key: 'addPermission',
    label: '添加权限',
    disabled: false,
    onClick: (rows) => {
      handleAddPermission(rows)
    }
  },
  {
    key: 'addToGroup',
    label: '添加至组',
    disabled: false,
    onClick: (rows) => {
      handleAddToGroup(rows)
    }
  },
  {
    key: 'assignRole',
    label: '分配角色',
    disabled: false,
    onClick: (rows) => {
      handleAssignRole(rows)
    }
  },
  {
    key: 'delete',
    label: '删除用户',
    disabled: false,
    onClick: (rows) => {
      handleBatchDelete(rows)
    }
  }
]

// 获取角色列表
const getRoleList = async () => {
  try {
    const { data, code } = await apiGetRoleList({})
    if (code === 200 && data?.list) {
      // 找到角色字段并更新选项
      const roleField = createEditFields.find((field) => field.prop === 'rid')
      if (roleField) {
        roleField.options = data.list.map((role) => ({
          label: role.name,
          value: +role.id
        }))
      }
    }
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetusersList(queryParams)
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

// 打开新建/编辑弹框
const openCreateEditDialog = (isEdit: boolean, data: any) => {
  formDialogType.value = 'createEdit'
  formDialogIsEdit.value = isEdit
  formDialogTitle.value = ''
  formDialogShowUserName.value = false
  formDialogUserName.value = ''
  formDialogFields.value = createEditFields.map((field) => ({ ...field }))
  formDialogDefaultData.value = { ...data }

  // 编辑模式下，密码字段只读
  if (isEdit) {
    const passwordField = formDialogFields.value.find((field) => field.prop === 'password')
    if (passwordField) {
      passwordField.readonly = true
      passwordField.readonlyValue = '******'
      passwordField.required = false
    }
  } else {
    // 新建模式下，密码字段可编辑且必填
    const passwordField = formDialogFields.value.find((field) => field.prop === 'password')
    if (passwordField) {
      passwordField.readonly = false
      passwordField.required = true
    }
  }

  formDialogVisible.value = true
}

// 打开邀请弹框
const openInviteDialog = () => {
  formDialogType.value = 'invite'
  formDialogIsEdit.value = false
  formDialogTitle.value = '邀请用户'
  formDialogShowUserName.value = false
  formDialogUserName.value = ''
  formDialogFields.value = inviteFields.map((field) => ({ ...field }))
  formDialogDefaultData.value = {}
  formDialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  openCreateEditDialog(true, row)
}

// 状态变化
const handleStatusChange = async (row: any) => {
  await apiActiveUser({
    actionIds: [row.userId],
    action: row.enable ? 'USER_ACTION_DISABLE' : 'USER_ACTION_ENABLE'
  })
  ElMessage.closeAll()
  setTimeout(() => {
    ElMessage.success(`${row.enable ? '启用' : '禁用'}成功`)
  }, 10)
}
// 激活用户
const handleActiveUser = async (row: any) => {
  await apiActiveUser({
    actionIds: [row.userId],
    action: 'USER_ACTION_ACTIVE'
  })
  ElMessage.success('激活成功')
}
// 更多操作
const handleMoreAction = ({ action, row }: { action: string; row: any }) => {
  switch (action) {
    case 'activeUser':
      handleActiveUser(row)
      break
    case 'assignRole':
      handleAssignRole([row])
      break
    case 'addToGroup':
      handleAddToGroup([row])
      break
    case 'resetPassword':
      handleResetPassword([row])
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// 删除单个用户
const handleDelete = (row?: any) => {
  currentDeleteRows.value = [row]
  deleteTitle.value = '确认删除'
  deleteMessage.value = `确认删除【${row.username}】，删除后用户将无法登录`
  deleteDialogVisible.value = true
}

// 批量删除
const handleBatchDelete = (rows: any[]) => {
  currentDeleteRows.value = rows
  deleteTitle.value = '确认删除'
  deleteMessage.value = `确定要删除选中的${rows.length}个用户吗？`
  deleteDialogVisible.value = true
}

// 删除确认
const handleDeleteConfirm = async () => {
  try {
    deleteLoading.value = true
    const userIds = currentDeleteRows.value.map((row) => row.userId)
    await apiActiveUser({
      actionIds: userIds,
      action: 'USER_ACTION_DELETE'
    })
    ElMessage.success('删除成功')
    getList()
    deleteDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 统一表单弹框确认
const handleFormDialogConfirm = async (formData: any, done: (success: boolean) => void) => {
  try {
    formDialogLoading.value = true

    if (formDialogType.value === 'createEdit') {
      // 新建/编辑用户
      if (formDialogIsEdit.value) {
        formData.userId = formDialogDefaultData.value.userId
        await apiEditUser(formData)
      } else {
        await apiCreateUser(formData)
      }
      ElMessage.success(formDialogIsEdit.value ? '编辑成功' : '创建成功')
      getList()
      done(true)
    } else if (formDialogType.value === 'invite') {
      // 邀请用户
      console.log('邀请用户', formData)
      formData.email = [formData.email]
      await apiInviteUser(formData)
      ElMessage.success('邀请成功')
      getList()
      done(true)
    } else if (formDialogType.value === 'operation') {
      // 操作弹框（分配角色、添加至组、重置密码、添加权限）
      await handleOperationConfirm(formData, done)
    }
  } catch (error: any) {
    console.error('操作失败', error)
    ElMessage.error(error?.message || '操作失败')
    done(false)
  } finally {
    formDialogLoading.value = false
  }
}

// 分配角色
const handleAssignRole = (rows: any[]) => {
  currentOperationUser.value = rows.length === 1 ? rows[0] : null
  currentOperationType.value = 'assignRole'
  formDialogType.value = 'operation'
  formDialogTitle.value = '分配角色'
  formDialogIsEdit.value = false
  formDialogShowUserName.value = rows.length === 1
  formDialogUserName.value = rows.length === 1 ? rows[0].username : ''
  formDialogFields.value = [
    {
      prop: 'roleId',
      label: '选择角色',
      type: 'select',
      required: true,
      placeholder: '请选择角色',
      options: []
    }
  ]
  formDialogDefaultData.value = {}
  // 获取角色列表
  loadRoleOptions()
  formDialogVisible.value = true
}

// 添加至组
const handleAddToGroup = (rows: any[]) => {
  currentOperationUser.value = rows.length === 1 ? rows[0] : null
  currentOperationType.value = 'addToGroup'
  formDialogType.value = 'operation'
  formDialogTitle.value = '添加至组'
  formDialogIsEdit.value = false
  formDialogShowUserName.value = rows.length === 1
  formDialogUserName.value = rows.length === 1 ? rows[0].username : ''
  formDialogFields.value = [
    {
      prop: 'groupId',
      label: '选择用户组',
      type: 'select',
      required: true,
      placeholder: '请选择用户组',
      options: []
    }
  ]
  formDialogDefaultData.value = {}
  // 获取用户组列表
  loadGroupOptions()
  formDialogVisible.value = true
}

// 重置密码
const handleResetPassword = (rows: any[]) => {
  currentOperationUser.value = rows.length === 1 ? rows[0] : null
  currentOperationType.value = 'resetPassword'
  formDialogType.value = 'operation'
  formDialogTitle.value = '重置密码'
  formDialogIsEdit.value = false
  formDialogShowUserName.value = rows.length === 1
  formDialogUserName.value = rows.length === 1 ? rows[0].username : ''
  formDialogFields.value = [
    {
      prop: 'password',
      label: '输入密码',
      type: 'password',
      required: true,
      showGenerate: true
    }
  ]
  formDialogDefaultData.value = {}
  formDialogVisible.value = true
}

// 添加权限
const handleAddPermission = (rows: any[]) => {
  currentOperationUser.value = rows.length === 1 ? rows[0] : null
  currentOperationType.value = 'addPermission'
  formDialogType.value = 'operation'
  formDialogTitle.value = '添加权限'
  formDialogIsEdit.value = false
  formDialogShowUserName.value = rows.length === 1
  formDialogUserName.value = rows.length === 1 ? rows[0].username : ''
  formDialogFields.value = [
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
  formDialogDefaultData.value = {}
  // 获取权限列表
  loadPermissionOptions()
  formDialogVisible.value = true
}

// 加载角色选项
const loadRoleOptions = async () => {
  try {
    const { data, code } = await apiGetRoleList({})
    if (code === 200 && data?.list) {
      const roleField = formDialogFields.value.find((field) => field.prop === 'roleId')
      if (roleField) {
        roleField.options = data.list.map((role: any) => ({
          label: role.name,
          value: +role.id
        }))
      }
    }
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 加载用户组选项
const loadGroupOptions = async () => {
  try {
    const { data, code } = await apiGetGroupsList({})
    if (code === 200 && data?.list) {
      const groupField = formDialogFields.value.find((field) => field.prop === 'groupId')
      if (groupField) {
        groupField.options = data.list.map((group: any) => ({
          label: group.name,
          value: +group.id
        }))
      }
    }
  } catch (error) {
    console.error('获取用户组列表失败', error)
  }
}

// 加载权限选项
const loadPermissionOptions = async () => {
  try {
    const { data, code } = await apiGetPermissionList({})
    if (code === 200 && data?.list) {
      const permissionField = formDialogFields.value.find((field) => field.prop === 'permissionIds')
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

// 操作确认（统一处理分配角色、添加至组、重置密码、添加权限）
const handleOperationConfirm = async (formData: any, done: (success: boolean) => void) => {
  try {
    console.log('操作数据', currentOperationUser.value)
    const userIds = currentOperationUser.value
      ? [currentOperationUser.value.userId]
      : selectedRows.value.map((row) => row.userId)
    const roleIds = currentOperationUser.value
      ? currentOperationUser.value.roles.map((row) => row.id)
      : selectedRows.value.flatMap((row) => row.roles?.map((role) => role.id) || [])
    const groupIds = currentOperationUser.value
      ? currentOperationUser.value.groups.map((row) => row.id)
      : selectedRows.value.flatMap((row) => row.groups?.map((group) => group.id) || [])

    let apiCall: Promise<any>
    switch (currentOperationType.value) {
      case 'assignRole':
        // 分配角色
        apiCall = apiOperateUser({
          userIdList: userIds,
          roleIdList: [formData.roleId],
          groupIdList: groupIds
        })
        break
      case 'addToGroup':
        // 添加至组
        apiCall = apiOperateUser({
          userIdList: userIds,
          roleIdList: roleIds,
          groupIdList: [formData.groupId]
        })
        break
      case 'resetPassword':
        apiCall = apiResetPwdUser({
          targetUid: currentOperationUser.value.userId,
          password: formData.password
        })
        break
      case 'addPermission':
        apiCall = apiBindPermission({
          userIds,
          permissionGroupIds: formData.permissionIds,
          product: formData.product
        })
        break
      default:
        throw new Error('未知的操作类型')
    }

    await apiCall
    ElMessage.success('操作成功')
    getList()
    done(true)
  } catch (error: any) {
    console.error('操作失败', error)
    ElMessage.error(error?.message || '操作失败')
    done(false)
  }
}

// 添加用户相关
const handleAddUserRefresh = async () => {
  try {
    addUserLoading.value = true
    // TODO: 调用API获取用户列表
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
  console.log('添加用户', users)
  // TODO: 调用API添加用户
  ElMessage.success('添加成功')
  getList()
}

const handleCreateUserFromAdd = () => {
  addUserDialogVisible.value = false
  openCreateEditDialog(false, {})
}

onMounted(() => {
  getList()
  getRoleList()
})
</script>

<style lang="less" scoped>
:deep(.el-link) {
  font-size: 13px;
}
</style>
