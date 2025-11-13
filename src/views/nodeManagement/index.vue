<template>
  <div class="node-management-page">
    <ManagementList
      ref="managementListRef"
      :title="title"
      :table-data="displayTableData"
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
              <el-tag v-if="col.prop === 'applicationType'">{{ scope.row.applicationType }}</el-tag>
              <el-tag
                v-else-if="col.prop === 'agentStatus'"
                :type="getAgentStatusType(scope.row.agentStatus)"
              >
                {{ scope.row.agentStatus }}
              </el-tag>
              <el-tag
                v-else-if="col.prop === 'nodeStatus'"
                :type="getNodeStatusType(scope.row.nodeStatus)"
              >
                {{ scope.row.nodeStatus }}
              </el-tag>
              <span v-else>{{ scope.row[col.prop] }}</span>
            </template>
          </el-table-column>
        </template>
        <TableActionsColumn
          :actions="getRowActions"
          @edit="handleEdit"
          @action="handleMoreAction"
        />
      </template>
    </ManagementList>

    <NodeFormDialog
      v-model:visible="nodeDialogVisible"
      :loading="nodeDialogLoading"
      :is-edit="nodeDialogMode === 'edit'"
      :title="nodeDialogMode === 'edit' ? '编辑节点' : '新建节点'"
      :default-data="nodeDialogData"
      :default-tags="nodeDialogTags"
      @save="handleNodeSave"
      @cancel="handleNodeCancel"
    />

    <!-- 定制列对话框 -->
    <ColumnCustomDialog
      v-model:visible="columnDialogVisible"
      :columns="tableColumns"
      @confirm="handleColumnConfirm"
    />

    <!-- 操作确认对话框 -->
    <OperationConfirmDialog
      v-model:visible="operationDialogVisible"
      :operation="currentOperation"
      :is-batch="isBatchOperation"
      :hostnames="operationHostnames"
      :host-count="operationHostCount"
      :loading="operationLoading"
      @confirm="handleOperationConfirm"
      @cancel="handleOperationCancel"
    />

    <!-- 导入Excel对话框 -->
    <ImportExcelDialog v-model:visible="importDialogVisible" @success="handleImportSuccess" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Setting, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ManagementList, type TableColumn } from '@/components/ManagementList'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import NodeFormDialog from './components/NodeFormDialog.vue'
import { NodeRecord } from '@/api/node/type'
import { ColumnCustomDialog, type ColumnItem } from '@/components/ColumnCustomDialog'
import { OperationConfirmDialog } from '@/components/OperationConfirmDialog'
import { ImportExcelDialog } from '@/components/ImportExcelDialog'
import { useTaskPanelStore } from '@/store/modules/taskPanel'

const title = '节点管理'
const loading = ref(false)
// 表格数据
const allNodes = ref<NodeRecord[]>([])
// 状态统计
const stats = reactive({
  total: 156,
  online: 142,
  offline: 8,
  abnormal: 6
})
// 查询条件
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  agentStatus: '',
  applicationType: '',
  nodeTag: ''
})
// 选中数据
const selectedRows = ref<NodeRecord[]>([])
// 批量操作列表
const bulkDropdownOptions = [
  { label: '安装 Agent', command: 'install' },
  { label: '升级 Agent', command: 'upgrade' },
  { label: '上线 Agent', command: 'online' },
  { label: '下线 Agent', command: 'offline' },
  { label: '重启 Agent', command: 'restart' },
  { label: '重装 Agent', command: 'reinstall' },
  { label: '卸载 Agent', command: 'uninstall' },
  { label: '连通测试', command: 'test' }
]
// 下拉选
const agentStatusOptions = [
  { label: '运行中', value: '运行中' },
  { label: '异常', value: '异常' },
  { label: '未安装', value: '未安装' }
]
const applicationTypeOptions = [
  { label: '云拨测', value: '云拨测' },
  { label: 'CDN', value: 'CDN' },
  { label: '监控', value: '监控' }
]
const nodeTagOptions = [
  { label: '标签1', value: '标签1' },
  { label: '标签2', value: '标签2' }
]
// 顶部操作栏
const toolbarButtons = computed<ToolbarButton[]>(() => [
  {
    key: 'settings',
    icon: Setting,
    circle: true,
    tooltip: '定制列',
    onClick: () => handleSettings()
  },
  {
    key: 'bulk',
    label: '批量操作',
    dropdownOptions: bulkDropdownOptions,
    onCommand: handleBulkCommand
  },
  {
    key: 'import',
    label: '导入Excel',
    onClick: () => handleImportExcel()
  },
  {
    key: 'create',
    label: '新建节点',
    type: 'primary',
    onClick: () => handleCreate()
  }
])
// 顶部筛选栏
const toolbarFilters = computed<ToolbarFilter[]>(() => [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索IP/主机名称/Agent ID',
    width: 200,
    prefixIcon: Search
  },
  {
    key: 'agentStatus',
    type: 'select',
    placeholder: 'Agent状态',
    width: 150,
    clearable: true,
    options: agentStatusOptions
  },
  {
    key: 'applicationType',
    type: 'select',
    placeholder: '应用类型',
    width: 150,
    clearable: true,
    options: applicationTypeOptions
  },
  {
    key: 'nodeTag',
    type: 'select',
    placeholder: '节点标签',
    width: 150,
    clearable: true,
    options: nodeTagOptions
  },
  {
    key: 'reset',
    type: 'text',
    placeholder: '重置',
    icon: Refresh,
    onClick: () => handleReset()
  }
])
// 表格每行操作列的动态函数（更多）
const getRowActions = (row: NodeRecord): TableAction[] => {
  switch (row.agentStatus) {
    case '运行中':
      return [
        { key: 'offline', label: '下线' },
        { key: 'restart', label: '重启' },
        { key: 'reinstall', label: '重装' },
        { key: 'uninstall', label: '卸载' },
        { key: 'upgrade', label: '升级' },
        { key: 'test', label: '连通测试' },
        { key: 'log', label: '查看日志' }
      ]
    case '异常':
      return [
        { key: 'restart', label: '重启' },
        { key: 'reinstall', label: '重装' },
        { key: 'uninstall', label: '卸载' },
        { key: 'test', label: '连通测试' },
        { key: 'log', label: '查看日志' }
      ]
    case '未安装':
      return [
        { key: 'install', label: '安装' },
        { key: 'test', label: '连通测试' },
        ...(row.agentId ? [{ key: 'log', label: '查看日志' }] : [])
      ]
    default:
      return []
  }
}
// 新建编辑相关字段
const nodeDialogVisible = ref(false)
const nodeDialogLoading = ref(false)
const nodeDialogMode = ref<'create' | 'edit'>('create')
const nodeDialogData = ref<Record<string, any>>({})
const nodeDialogTags = ref<Array<{ key: string; value: string }>>([])

// 定制列相关
const columnDialogVisible = ref(false)
const managementListRef = ref<InstanceType<typeof ManagementList>>()
const tableColumns = ref<ColumnItem[]>([
  { prop: 'internalIp', label: '内网IP', visible: true, order: 0, sortable: true, minWidth: 100 },
  { prop: 'hostname', label: '主机名', visible: true, order: 1, sortable: true, minWidth: 120 },
  { prop: 'hostId', label: '主机ID', visible: true, order: 2 },
  { prop: 'agentId', label: 'AGENT ID', visible: true, order: 3, minWidth: 160 },
  { prop: 'applicationType', label: '应用类型', visible: true, order: 4, slot: true },
  { prop: 'region', label: '地区', visible: true, order: 5 },
  { prop: 'os', label: '操作系统', visible: true, order: 6 },
  { prop: 'agentStatus', label: 'AGENT状态', visible: true, order: 7, slot: true, minWidth: 100 },
  { prop: 'nodeStatus', label: '节点状态', visible: true, order: 8, slot: true },
  { prop: 'agentVersion', label: 'AGENT版本', visible: true, order: 9, minWidth: 100 },
  {
    prop: 'lastHeartbeat',
    label: '最后心跳',
    visible: true,
    order: 10,
    sortable: true,
    minWidth: 150
  }
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
const operationDialogVisible = ref(false)
const currentOperation = ref('')
const isBatchOperation = ref(false)
const operationHostnames = ref<string[]>([])
const operationHostCount = ref(0)
const operationLoading = ref(false)
const pendingOperation = ref<{
  operation: string
  nodeIds: number[]
  isBatch: boolean
} | null>(null)

// 导入Excel对话框
const importDialogVisible = ref(false)

// 任务面板store
const taskPanelStore = useTaskPanelStore()

// 缓存 key
const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'

const filteredData = computed(() => {
  const { keyword, agentStatus, applicationType, nodeTag } = queryParams
  return allNodes.value.filter((item) => {
    const matchKeyword = keyword
      ? [item.internalIp, item.publicIp, item.hostname, item.agentId].some((field) =>
          field.toLowerCase().includes(keyword.toLowerCase())
        )
      : true
    const matchAgentStatus = agentStatus ? item.agentStatus === agentStatus : true
    const matchAppType = applicationType ? item.applicationType === applicationType : true
    const matchTag = nodeTag
      ? (item.tags || []).some((tag) => tag.key === nodeTag || tag.value === nodeTag)
      : true
    return matchKeyword && matchAgentStatus && matchAppType && matchTag
  })
})

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredData.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredData.value.length)

const getAgentStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    运行中: 'success',
    异常: 'danger',
    未安装: 'warning'
  }
  return map[status] || 'info'
}

const getNodeStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    在线: 'success',
    离线: 'info',
    异常: 'danger'
  }
  return map[status] || 'info'
}

const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取节点数据
    const mockData: NodeRecord[] = [
      {
        id: 1,
        internalIp: '192.168.1.101',
        publicIp: '10.0.0.101',
        hostname: 'web-server-01',
        hostId: '1',
        agentId: 'AGT-001-WEB-2024',
        applicationType: '云拨测',
        region: '华东-上海',
        os: 'Linux',
        agentStatus: '运行中',
        nodeStatus: '在线',
        agentVersion: 'v2.1.3',
        lastHeartbeat: '2024-03-15 16:45:23',
        tags: [
          { key: 'env', value: 'prod' },
          { key: 'team', value: 'sre' }
        ]
      },
      {
        id: 2,
        internalIp: '192.168.1.102',
        publicIp: '10.0.0.102',
        hostname: 'cdn-node-02',
        hostId: '2',
        agentId: 'AGT-002-CDN-2024',
        applicationType: 'CDN',
        region: '华北-北京',
        os: 'Windows',
        agentStatus: '异常',
        nodeStatus: '在线',
        agentVersion: 'v2.0.8',
        lastHeartbeat: '2024-03-15 16:42:10',
        tags: [{ key: 'env', value: 'staging' }]
      },
      {
        id: 3,
        internalIp: '192.168.1.102',
        publicIp: '10.0.0.102',
        hostname: 'cdn-node-02',
        hostId: '2',
        agentId: 'AGT-002-CDN-2024',
        applicationType: 'CDN',
        region: '华北-北京',
        os: 'Windows',
        agentStatus: '未安装',
        nodeStatus: '在线',
        agentVersion: 'v2.0.8',
        lastHeartbeat: '2024-03-15 16:42:10',
        tags: [{ key: 'env', value: 'staging' }]
      }
    ]
    allNodes.value = mockData
  } finally {
    loading.value = false
  }
}
// 批量操作列的点击事件
const handleBulkCommand = (command: string) => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择节点')
    return
  }
  showOperationDialog(command, true, selectedRows.value)
}

// 显示操作确认对话框
const showOperationDialog = (operation: string, isBatch: boolean, nodes: NodeRecord[]) => {
  currentOperation.value = operation
  isBatchOperation.value = isBatch
  operationHostnames.value = nodes.map((n) => n.hostname || n.internalIp)
  operationHostCount.value = nodes.length
  pendingOperation.value = {
    operation,
    nodeIds: nodes.map((n) => n.id),
    isBatch
  }
  operationDialogVisible.value = true
}

// 操作确认
const handleOperationConfirm = async () => {
  if (!pendingOperation.value) return

  try {
    operationLoading.value = true
    // const { operation, isBatch } = pendingOperation.value

    // if (isBatch) {
    //   await batchOperateAgent({
    //     operation,
    //     nodeIds
    //   })
    // } else {
    //   await operateAgent({
    //     operation,
    //     nodeId: nodeIds[0]
    //   })
    // }

    // ElMessage.success(`${isBatch ? '批量' : ''}${operation}操作已提交`)
    operationDialogVisible.value = false

    // 设置缓存为 true，显示任务面板
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'true')
    taskPanelStore.setVisible(true)

    // 刷新任务列表（在 App.vue 中处理，通过 store 更新）
    // 触发 App.vue 中的任务列表刷新
    const { getTaskList } = await import('@/api/node')
    const today = dayjs().format('YYYY-MM-DD')
    try {
      const response = await getTaskList({ date: today })
      if (response.data && Array.isArray(response.data)) {
        const getOperationName = (operation: string): string => {
          const map: Record<string, string> = {
            install: '安装详情',
            upgrade: '升级详情',
            online: '上线详情',
            offline: '下线详情',
            restart: '重启详情',
            reinstall: '重装详情',
            uninstall: '卸载详情',
            test: '测试详情'
          }
          return map[operation] || '任务'
        }
        const tasks = response.data.map((task: any) => ({
          id: task.id || task.taskId,
          type: task.type || getOperationName(task.operation),
          time: task.time || task.createTime || dayjs().format('HH:mm:ss'),
          operation: task.operation,
          successCount: task.successCount || 0,
          progressCount: task.progressCount || 0,
          failedCount: task.failedCount || 0,
          details: task.details || []
        }))
        taskPanelStore.setTasks(tasks)
      }
    } catch (error) {
      console.error('刷新任务列表失败:', error)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    operationLoading.value = false
    pendingOperation.value = null
  }
}

// 操作取消
const handleOperationCancel = () => {
  operationDialogVisible.value = false
  pendingOperation.value = null
}

const handleSearch = (params: Record<string, any>) => {
  queryParams.keyword = params.keyword || ''
  queryParams.agentStatus = params.agentStatus || ''
  queryParams.applicationType = params.applicationType || ''
  queryParams.nodeTag = params.nodeTag || ''
  queryParams.page = 1
  getList()
}

const handleRefresh = (params?: Record<string, any>) => {
  if (params) {
    queryParams.keyword = params.keyword || ''
    queryParams.agentStatus = params.agentStatus || ''
    queryParams.applicationType = params.applicationType || ''
    queryParams.nodeTag = params.nodeTag || ''
    queryParams.page = 1
  }
  getList()
}

const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}

const handleSelectionChange = (selection: NodeRecord[]) => {
  selectedRows.value = selection
}

const handleImportExcel = () => {
  importDialogVisible.value = true
}

const handleImportSuccess = (count: number) => {
  // 导入成功后刷新列表
  getList()
  ElMessage.success(`已成功导入${count}个节点`)
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.agentStatus = ''
  queryParams.applicationType = ''
  queryParams.nodeTag = ''
  queryParams.page = 1
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
  nodeDialogData.value = {
    publicIp: '',
    internalIp: ''
  }
  nodeDialogTags.value = []
  nodeDialogVisible.value = true
}

const handleEdit = (row: NodeRecord) => {
  nodeDialogMode.value = 'edit'
  nodeDialogData.value = {
    internalIp: row.internalIp,
    publicIp: row.publicIp,
    hostname: row.hostname,
    applicationType: row.applicationType,
    loginAccount: 'administrator',
    loginIp: row.publicIp,
    os: row.os === 'Windows' ? 'Windows' : 'Linux',
    agentStatus: row.agentStatus
  }
  nodeDialogTags.value = row.tags || []
  nodeDialogVisible.value = true
}

const handleMoreAction = (action: string, row: NodeRecord) => {
  switch (action) {
    case 'delete':
      handleDelete(row)
      break
    case 'install':
    case 'upgrade':
    case 'online':
    case 'offline':
    case 'restart':
    case 'reinstall':
    case 'uninstall':
    case 'test':
      showOperationDialog(action, false, [row])
      break
    default:
      ElMessage.info('功能待实现')
  }
}

const handleDelete = async (row: NodeRecord) => {
  try {
    loading.value = true
    // TODO: 调用API删除节点
    ElMessage.success(`删除节点 ${row.hostname} 成功`)
    getList()
  } catch (error) {
    ElMessage.error('删除节点失败')
  } finally {
    loading.value = false
  }
}

const handleNodeSave = async ({
  form: _form,
  tags: _tags,
  authCredential: _authCredential
}: {
  form: Record<string, any>
  tags: Array<{ key: string; value: string }>
  authCredential: string
}) => {
  try {
    nodeDialogLoading.value = true
    // TODO: 调用API保存节点
    ElMessage.success('保存节点成功')
    nodeDialogVisible.value = false
    getList()
  } catch (error) {
    ElMessage.error('保存节点失败')
  } finally {
    nodeDialogLoading.value = false
  }
}

const handleNodeCancel = () => {
  nodeDialogVisible.value = false
}

onMounted(() => {
  getList()
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
</style>
