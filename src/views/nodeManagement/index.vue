<template>
  <div class="node-management-page">
    <ManagementList
      ref="managementListRef"
      :title="title"
      :table-data="allNodes"
      :loading="loading"
      :total-records="totalRecords"
      :show-selection="true"
      :toolbar-buttons="toolbarButtons"
      :filters="toolbarFilters"
      :query-params="queryParams"
      :columns="tableColumnsForList"
      @search="handleSearch"
      @refresh="handleRefresh"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
      @sort-change="handleTableSortChange"
      storageKey="nodeManagement_columnConfig"
    >
      <!-- 统计信息 -->
      <template #extra-toolbar>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-label">总节点数</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
            <div class="stat-icon">📊</div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-label">在线节点</div>
              <div class="stat-value green">{{ stats.online }}</div>
            </div>
            <div class="stat-icon online">🟢</div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-label">离线节点</div>
              <div class="stat-value yellow">{{ stats.offline }}</div>
            </div>
            <div class="stat-icon offline">🟠</div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-label">异常节点</div>
              <div class="stat-value red">{{ stats.abnormal }}</div>
            </div>
            <div class="stat-icon abnormal">🔴</div>
          </div>
        </div>
      </template>
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
          >
            <template v-if="col.slot" #default="scope">
              <el-tooltip
                v-if="col.prop === 'appTypeName'"
                :content="scope.row.appTypeName"
                placement="top"
              >
                <el-tag class="app-type-ellipsis">{{ scope.row.appTypeName || '-' }}</el-tag>
              </el-tooltip>
              <el-tooltip
                v-else-if="col.prop === 'hostName'"
                :content="scope.row.hostName"
                placement="top"
              >
                <span class="app-type-ellipsis">{{ scope.row.hostName || '-' }}</span>
              </el-tooltip>
              <el-tag v-else-if="col.prop === 'status'" :type="getNodeStatusType(scope.row.status)">
                <span class="status-color" :class="getNodeStatusColor(scope.row.status)"></span
                >{{ getNodeStatusText(scope.row.status) }}
              </el-tag>
              <span v-else-if="col.prop === 'os'">
                <el-icon class="os-icon"><Monitor /></el-icon>{{ scope.row[col.prop] }}
              </span>
              <span v-else-if="col.prop === 'nodeTags'">
                {{ formatObjectValue(scope.row[col.prop]) }}
              </span>
              <span v-else>{{ scope.row[col.prop] }}</span>
            </template>
          </el-table-column>
          <TableActionsColumn
            v-else
            :main-actions="executionRowActions"
            @edit="handleEdit"
            @action="handleMoreAction"
          />
        </template>
      </template>
    </ManagementList>
    <!-- 新建/编辑节点的对话框 -->
    <NodeFormDialog
      v-model:visible="nodeDialogVisible"
      :loading="nodeDialogLoading"
      :is-edit="nodeDialogMode === 'edit'"
      :title="nodeDialogMode === 'edit' ? '编辑节点' : '新建节点'"
      :default-data="nodeDialogData"
      :nodeTagOptionsKey="nodeTagOptionsKey.map((item) => ({ label: item, value: item }))"
      :nodeTagOptionsValue="nodeTagOptionsValue.map((item) => ({ label: item, value: item }))"
      @save="handleNodeSave"
      @cancel="handleNodeCancel"
    />

    <!-- 定制列对话框 -->
    <ColumnCustomDialog
      v-model:visible="columnDialogVisible"
      :columns="tableColumns"
      @confirm="handleColumnConfirm"
      storageKey="nodeManagement_columnConfig"
    />

    <!-- 操作确认对话框 -->
    <!-- <OperationConfirmDialog
      v-model:visible="operationDialogVisible"
      :operation="currentOperation"
      :is-batch="isBatchOperation"
      :hostnames="operationHostnames"
      :host-count="operationHostCount"
      :loading="operationLoading"
      @confirm="handleOperationConfirm"
      @cancel="handleOperationCancel"
    /> -->

    <!-- 导入Excel对话框 -->
    <ImportExcelDialog v-model:visible="importDialogVisible" @success="handleImportSuccess" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Setting, Monitor } from '@element-plus/icons-vue'
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import NodeFormDialog from './components/NodeFormDialog.vue'
import {
  apiGetNodeList,
  apiGetNodeStatistics,
  apiGetNodeTags,
  apiNodeSingleProbe,
  apiNodeBatchProbe,
  apiCreateNode
} from '@/api/node/index'
import { apiGetAppTypeList } from '@/api/application'
import { NodeRecord } from '@/api/node/type'
import { ColumnCustomDialog, type ColumnItem } from '@/components/ColumnCustomDialog'
// import { OperationConfirmDialog } from '@/components/OperationConfirmDialog'
import { ImportExcelDialog } from '@/components/ImportExcelDialog'
import { useTaskPanelStore } from '@/store/modules/taskPanel'

const title = '节点管理'
const loading = ref(false)
// 表格数据
const allNodes = ref<NodeRecord[]>([])
// 状态统计
const stats = ref({
  total: 0,
  online: 0,
  offline: 0,
  abnormal: 0
})
// 应用类型列表
const appTypeList = ref<string[]>([])
const nodeTagOptionsKey = ref<string[]>([])
const nodeTagOptionsValue = ref<string[]>([])
// 查询条件
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  query: '',
  appTypeName: '',
  nodeTags: '',
  orderBy: '',
  order: ''
})
// 选中数据
const selectedRows = ref<NodeRecord[]>([])
const connectTestLoading = ref(false)
// 批量操作列表
// const bulkDropdownOptions = [{ label: '连通测试', command: 'test' }]
// 顶部筛选栏
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'create',
    label: '新建节点',
    type: 'button',
    onClick: () => handleCreate()
  },
  {
    key: 'query',
    type: 'input',
    placeholder: '搜索公网IP/内网IP/主机名称',
    width: 220,
    prefixIcon: Search
  },
  {
    key: 'appTypeName',
    type: 'select',
    placeholder: '应用类型',
    width: 150,
    clearable: true,
    options: appTypeList.value.map((item) => ({ label: item, value: item }))
  },
  {
    key: 'nodeTags',
    type: 'select',
    placeholder: '节点标签',
    width: 150,
    clearable: true,
    options: nodeTagOptionsKey.value.map((item) => ({ label: item, value: item }))
  }
])
// 顶部操作栏
const toolbarButtons = computed<ToolbarButton[]>(() => [
  {
    key: 'settings',
    icon: Setting,
    circle: true,
    tooltip: '定制列',
    onClick: () => handleSettings()
  },
  // {
  //   key: 'bulk',
  //   label: '批量操作',
  //   dropdownOptions: bulkDropdownOptions,
  //   onCommand: handleBulkCommand
  // },
  {
    key: 'bulk',
    label: '连通测试',
    loading: connectTestLoading.value,
    disabled: !selectedRows.value.length,
    onClick: () => handleConnectTest()
  },
  {
    key: 'import',
    label: '导入Excel',
    onClick: () => handleImportExcel()
  }
])
const executionRowActions: TableAction[] = [
  {
    key: 'test',
    label: '连通测试',
    type: 'primary',
    text: true
  }
]
// 新建编辑相关字段
const nodeDialogVisible = ref(false)
const nodeDialogLoading = ref(false)
const nodeDialogMode = ref<'create' | 'edit'>('create')
const nodeDialogData = ref<Record<string, any>>({})
const normalizeNodeTags = (tags?: any): Record<string, string> => {
  if (!tags) return {}
  if (Array.isArray(tags)) {
    return tags.reduce<Record<string, string>>((acc, item) => {
      if (item?.key) {
        acc[item.key] = item.value ?? ''
      }
      return acc
    }, {})
  }
  if (typeof tags === 'object') {
    return { ...tags }
  }
  return {}
}
// 定制列相关
const columnDialogVisible = ref(false)
const managementListRef = ref<InstanceType<typeof ManagementList>>()
const tableColumns = ref<ColumnItem[]>([
  { prop: 'id', label: '主机ID', visible: true, order: 0, isDisabled: true },
  { prop: 'innerIp', label: '内网IP', visible: true, order: 1, sortable: true, minWidth: 100 },
  { prop: 'publicIp', label: '公网IP', visible: true, order: 2, minWidth: 100 },
  {
    prop: 'hostName',
    label: '主机名称',
    visible: true,
    order: 3,
    sortable: true,
    slot: true,
    minWidth: 120
  },
  { prop: 'appTypeName', label: '应用类型', visible: true, order: 4, slot: true, minWidth: 120 },
  { prop: 'region', label: '地区', visible: true, order: 5, minWidth: 150 },
  { prop: 'os', label: '操作系统', visible: true, order: 6, slot: true, minWidth: 100 },
  { prop: 'vendorName', label: '供应商名称', visible: true, order: 7, minWidth: 100 },
  { prop: 'status', label: '节点状态', visible: true, order: 8, slot: true },
  { prop: 'nodeTags', label: '节点标签', visible: true, order: 9, slot: true },
  {
    prop: 'lastCheckTime',
    label: '最后心跳',
    visible: true,
    order: 10,
    sortable: true,
    minWidth: 150
  },
  { prop: 'remark', label: '备注', visible: true, order: 11, minWidth: 100 },
  { prop: 'actions', label: '操作', slot: 'actions', order: 12 }
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
    slot: typeof col.slot === 'string' ? col.slot : col.slot ? col.prop : undefined
  }))
})

// 操作确认对话框相关
// const operationDialogVisible = ref(false)
// const currentOperation = ref('')
// const isBatchOperation = ref(false)
// const operationHostnames = ref<string[]>([])
// const operationHostCount = ref(0)
// const operationLoading = ref(false)
// const pendingOperation = ref<{
//   operation: string
//   nodeIds: number[]
//   isBatch: boolean
// } | null>(null)
const totalRecords = ref(0)
// 导入Excel对话框
const importDialogVisible = ref(false)

// 任务面板store
const taskPanelStore = useTaskPanelStore()

// 缓存 key
const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'
// 节点状态展示相关
const getNodeStatusType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    online: 'success',
    offline: 'info',
    abnormal: 'danger'
  }
  return map[status] || 'warning'
}
const getNodeStatusText = (status: string) => {
  const map = {
    online: '在线',
    offline: '离线',
    abnormal: '异常'
  }
  return map[status] || '未知'
}
const getNodeStatusColor = (status: string) => {
  const map = {
    online: 'green',
    offline: 'gray',
    abnormal: 'red'
  }
  return map[status] || 'yellow'
}
// 转换标签格式
const formatObjectValue = (obj: Record<string, any>) => {
  if (!obj || typeof obj !== 'object') return ''

  return Object.entries(obj)
    .map(([key, value]) => {
      // 确保value是数字类型才进行转换
      const formattedValue =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && !isNaN(Number(value))
            ? Number(value)
            : value
      return `${key}:${formattedValue}`
    })
    .join(', ')
}

// 获取节点列表
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetNodeList({ ...queryParams })
    allNodes.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}
// 批量连通测试
const handleConnectTest = async () => {
  if (connectTestLoading.value) return
  connectTestLoading.value = true
  try {
    await apiNodeBatchProbe(selectedRows.value)
    // 设置缓存为 true，显示任务面板
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'true')
    taskPanelStore.setVisible(true)
    taskPanelStore.triggerPulse()
  } catch (error) {
    console.error('批量连通测试失败:', error)
    ElMessage.error('连通测试失败，请稍后重试')
  } finally {
    connectTestLoading.value = false
  }
  // 刷新任务列表（在 App.vue 中处理，通过 store 更新）
  // 触发 App.vue 中的任务列表刷新
  // showOperationDialog('test', true, selectedRows.value)
}
// 显示操作确认对话框
// const showOperationDialog = (operation: string, isBatch: boolean, nodes: NodeRecord[]) => {
//   currentOperation.value = operation
//   isBatchOperation.value = isBatch
//   operationHostnames.value = nodes.map((n) => n.hostName || n.innerIp)
//   operationHostCount.value = nodes.length
//   pendingOperation.value = {
//     operation,
//     nodeIds: nodes.map((n) => n.id),
//     isBatch
//   }
//   operationDialogVisible.value = true
// }

// 操作框确认
// const handleOperationConfirm = async () => {
//   if (!pendingOperation.value) return

//   try {
//     operationLoading.value = true
//     operationDialogVisible.value = false

//     // 设置缓存为 true，显示任务面板
//     localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'true')
//     taskPanelStore.setVisible(true)

//     // 刷新任务列表（在 App.vue 中处理，通过 store 更新）
//     // 触发 App.vue 中的任务列表刷新
//     const { getExecTaskList } = await import('@/api/node')
//     try {
//       const response = await getExecTaskList()
//       if (response.data && Array.isArray(response.data)) {
//         const getOperationName = (operation: string): string => {
//           const map: Record<string, string> = {
//             install: '安装详情',
//             upgrade: '升级详情',
//             online: '上线详情',
//             offline: '下线详情',
//             restart: '重启详情',
//             reinstall: '重装详情',
//             uninstall: '卸载详情',
//             test: '测试详情'
//           }
//           return map[operation] || '任务'
//         }
//         const tasks = response.data.map((task: any) => ({
//           id: task.id || task.taskId,
//           type: task.type || getOperationName(task.operation),
//           time: task.time,
//           operation: task.operation,
//           successCount: task.successCount || 0,
//           progressCount: task.progressCount || 0,
//           failedCount: task.failedCount || 0,
//           details: task.details || []
//         }))
//         taskPanelStore.setTasks(tasks)
//       }
//     } catch (error) {
//       console.error('刷新任务列表失败:', error)
//     }
//   } catch (error: any) {
//     ElMessage.error(error?.message || '操作失败')
//   } finally {
//     operationLoading.value = false
//     pendingOperation.value = null
//   }
// }
// 操作框取消
// const handleOperationCancel = () => {
//   operationDialogVisible.value = false
//   pendingOperation.value = null
// }
// 批量操作列的点击事件
// const handleBulkCommand = (command: string) => {
//   if (!selectedRows.value.length) {
//     ElMessage.warning('请先选择节点')
//     return
//   }
//   showOperationDialog(command, true, selectedRows.value)
// }

// 操作取消

const handleSearch = (params: Record<string, any>) => {
  queryParams.query = params.query || ''
  queryParams.appTypeName = params.appTypeName || ''
  queryParams.nodeTags = params.nodeTags || ''
  queryParams.page = 1
  getList()
}

const handleRefresh = (params?: Record<string, any>) => {
  if (params) {
    queryParams.query = params.query || ''
    queryParams.appTypeName = params.appTypeName || ''
    queryParams.nodeTags = params.nodeTags || ''
    queryParams.page = 1
  }
  getList()
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}
// 选择行
const handleSelectionChange = (selection: NodeRecord[]) => {
  selectedRows.value = selection
}

const handleTableSortChange = (sorts: any) => {
  queryParams.orderBy = sorts.prop
  queryParams.order = sorts.order
  queryParams.page = 1
  getList()
}

const handleImportExcel = () => {
  importDialogVisible.value = true
}

const handleImportSuccess = () => {
  // 导入成功后刷新列表
  getList()
}

const handleSettings = () => {
  columnDialogVisible.value = true
}

const handleColumnConfirm = (columns: ColumnItem[]) => {
  // 更新列配置，保持原有的其他属性
  tableColumns.value = columns.map((col) => {
    const existing = tableColumns.value.find((c) => c.prop === col.prop)
    return {
      ...existing,
      ...col,
      // 保持原有的 width, minWidth, sortable 等属性
      width: col.width ?? existing?.width,
      minWidth: col.minWidth ?? existing?.minWidth,
      sortable: col.sortable ?? existing?.sortable,
      slot: col.slot ?? existing?.slot
    }
  })

  // 同步更新 ManagementList 的列配置
  if (managementListRef.value) {
    const tableCols: TableColumn[] = tableColumns.value.map((col) => ({
      prop: col.prop,
      label: col.label,
      width: col.width,
      minWidth: col.minWidth,
      sortable: col.sortable,
      visible: col.visible,
      order: col.order,
      slot: typeof col.slot === 'string' ? col.slot : col.slot ? col.prop : undefined
    }))
    managementListRef.value.updateColumnConfig(tableCols)
  }

  ElMessage.success('列配置已保存')
}

const handleCreate = () => {
  nodeDialogMode.value = 'create'
  nodeDialogData.value = {}
  nodeDialogVisible.value = true
}

const handleEdit = (row: NodeRecord) => {
  nodeDialogMode.value = 'edit'
  const normalizedTags = normalizeNodeTags((row as any).nodeTags || (row as any).tags)
  nodeDialogData.value = {
    ...row,
    nodeTags: normalizedTags,
    regionCodes: Array.isArray((row as any).regionCodes)
      ? [...((row as any).regionCodes as (string | number)[])]
      : Array.isArray(row.region)
        ? [...(row.region as any[])]
        : undefined,
    regionLabel: typeof row.region === 'string' ? row.region : ''
  }
  nodeDialogVisible.value = true
}

const handleMoreAction = (action: string, row: NodeRecord) => {
  switch (action) {
    case 'test':
      // showOperationDialog(action, false, [row])
      handleNodeSingleProbe(row)
      break
    default:
      ElMessage.info('功能待实现')
  }
}
const handleNodeSingleProbe = async (row: NodeRecord) => {
  try {
    await apiNodeSingleProbe({
      id: row.id,
      loginAccount: row.loginAccount,
      loginIp: row.loginIp,
      loginPort: row.loginPort,
      authMethod: row.authMethod,
      passwordKey: row.passwordKey,
      publicIp: row.publicIp,
      innerIp: row.innerIp,
      appType: row.appType
    })
    ElMessage.success('连通测试成功')
  } catch (error) {
    ElMessage.closeAll()
    setTimeout(() => {
      ElMessage.error('连通测试失败')
    }, 10)
  } finally {
    getList()
  }
}

const handleNodeSave = async ({
  form: _form,
  passwordKey: _passwordKey
}: {
  form: Record<string, any>
  passwordKey: string
}) => {
  try {
    nodeDialogLoading.value = true
    const payload = { ..._form, passwordKey: _passwordKey }
    await apiCreateNode(payload)
    ElMessage.success(nodeDialogMode.value === 'edit' ? '编辑成功' : '添加成功')
    nodeDialogVisible.value = false
    getList()
  } finally {
    nodeDialogLoading.value = false
  }
}
// 节点保存取消
const handleNodeCancel = () => {
  nodeDialogVisible.value = false
}

// 获取节点统计信息
const getNodeStatistics = async () => {
  const res = await apiGetNodeStatistics()
  if (res.data) {
    stats.value = { ...res.data }
  }
}

// 获取应用类型列表
const getAppTypeList = async () => {
  const res = await apiGetAppTypeList()
  appTypeList.value = res.data.list
}

// 获取节点标签
const getNodeTags = async () => {
  const res = await apiGetNodeTags()
  nodeTagOptionsKey.value = res.data.keys
  nodeTagOptionsValue.value = res.data.values
}

onMounted(() => {
  getList()
  getNodeStatistics()
  getAppTypeList()
  getNodeTags()
})
</script>

<style scoped lang="less">
.node-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    justify-content: space-between;

    .stat-icon {
      font-size: 22px;
    }

    .stat-content {
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
      }
      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: #303133;
      }
      .green {
        color: #67c23a;
      }
      .yellow {
        color: #e6a23c;
      }
      .red {
        color: #f56c6c;
      }
    }
  }
}
.status-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
  &.green {
    background: #67c23a;
  }
  &.gray {
    background: #909399;
  }
  &.red {
    background: #f56c6c;
  }
  &.yellow {
    background: #e6a23c;
  }
}
.app-type-ellipsis {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  line-height: 20px;
}
.os-icon {
  margin-right: 5px;
  margin-top: 5px;
  vertical-align: top;
}
</style>
