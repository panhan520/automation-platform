<template>
  <ManagementList
    ref="managementListRef"
    :title="title"
    :table-data="tableData"
    :columns="columns"
    :loading="loading"
    :total-records="totalRecords"
    :toolbar-buttons="toolbarButtons"
    :search-options="searchOptions"
    :query-params="queryParams"
    @search="handleSearch"
    @refresh="handleRefresh"
    @page-change="handlePageChange"
  >
    <template #columns>
      <el-table-column prop="id" label="角色ID" />
      <el-table-column prop="name" label="角色名称" />
      <el-table-column prop="createdAt" label="创建时间" sortable="custom" />
      <el-table-column prop="description" label="备注" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <div class="table-button" @click="handleEdit(scope.row)">编辑 </div>
          <div class="table-button" @click="handleEdit(scope.row)">添加权限 </div>
          <div class="table-button" @click="handleDelete(scope.row)">删除 </div>
        </template>
      </el-table-column>
    </template>
  </ManagementList>

  <!-- 新建/编辑角色弹框 -->
  <CreateEditDialog
    v-model:visible="createEditDialogVisible"
    :create-title="'新建角色'"
    :edit-title="'编辑角色'"
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
import type { ToolbarButton, SearchOption } from '@/components/ManagementList'
import { apiGetRoleList, apiCreateRole, apiEditRole, apiDeleteRole } from '@/api/role'

const title = '角色管理'
const managementListRef = ref()
const tableData = ref<any[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const createEditDialogVisible = ref(false)
const isEdit = ref(false)
const currentEditData = ref<any>({})

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

// 表格列配置
const columns: any[] = []

// 工具栏按钮
const toolbarButtons: ToolbarButton[] = [
  {
    key: 'create',
    label: '新建角色',
    type: 'primary',
    onClick: () => {
      isEdit.value = false
      currentEditData.value = {}
      createEditDialogVisible.value = true
    }
  }
]

// 搜索选项
const searchOptions: SearchOption[] = [{ label: '搜索角色名称', value: 'name' }]

// 新建/编辑表单字段
const createEditFields: FormField[] = [
  {
    prop: 'name',
    label: '角色名称',
    type: 'input',
    placeholder: '仅支持英文、数字、和符号".-_",不超过64个字符',
    required: true,
    maxlength: 64,
    rules: [
      {
        required: true,
        message: '请输入角色名称',
        trigger: 'blur'
      },
      {
        pattern: /^[a-zA-Z0-9\.\-_]{1,64}$/,
        message: '仅支持英文、数字、和符号".-_",不超过64个字符',
        trigger: 'blur'
      }
    ]
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

// 获取列表数据
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetRoleList(queryParams)
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

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  currentEditData.value = { ...row }
  createEditDialogVisible.value = true
}

// 删除单个角色
const handleDelete = async (row?: any) => {
  try {
    await ElMessageBox.confirm(`确认删除【${row.name}】，删除后添加的权限将移除`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await apiDeleteRole({ ids: [row.id] })
    ElMessage.success('删除成功')
    getList()
  } catch {
    // 用户取消
  }
}

// 新建/编辑确认
const handleCreateEditConfirm = async (formData: any) => {
  console.log('提交表单', formData)
  if (isEdit.value) {
    await apiEditRole({ ...formData, id: currentEditData.value.id })
  } else {
    await apiCreateRole(formData)
  }
  ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
  getList()
}

onMounted(() => {
  getList()
})
</script>
