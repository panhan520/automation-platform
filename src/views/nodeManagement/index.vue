<template>
  <div class="node-management-page">
    <ManagementList
      :title="title"
      :table-data="displayTableData"
      :loading="loading"
      :total-records="totalRecords"
      :show-selection="true"
      :toolbar-buttons="toolbarButtons"
      :filters="toolbarFilters"
      :query-params="queryParams"
      @search="handleSearch"
      @refresh="handleRefresh"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <!-- 统计信息 -->
      <template #extra-toolbar>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总节点数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon online">🟢</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.online }}</div>
              <div class="stat-label">在线节点</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon offline">🟠</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.offline }}</div>
              <div class="stat-label">离线节点</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon abnormal">🔴</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.abnormal }}</div>
              <div class="stat-label">异常节点</div>
            </div>
          </div>
        </div>
      </template>
      <!-- 表格列 -->
      <template #columns>
        <el-table-column prop="internalIp" label="内网IP" />
        <el-table-column prop="hostname" label="主机名" />
        <el-table-column prop="hostId" label="主机ID" />
        <el-table-column prop="agentId" label="AGENT ID" />
        <el-table-column prop="applicationType" label="应用类型">
          <template #default="scope">
            <el-tag>{{ scope.row.applicationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="地区" />
        <el-table-column prop="os" label="操作系统" />
        <el-table-column prop="agentStatus" label="AGENT状态">
          <template #default="scope">
            <el-tag :type="getAgentStatusType(scope.row.agentStatus)">{{
              scope.row.agentStatus
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nodeStatus" label="节点状态">
          <template #default="scope">
            <el-tag :type="getNodeStatusType(scope.row.nodeStatus)">{{
              scope.row.nodeStatus
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="agentVersion" label="AGENT版本" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" />
        <TableActionsColumn :actions="rowActions" @edit="handleEdit" @action="handleMoreAction" />
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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Setting, Refresh } from '@element-plus/icons-vue'
import { ManagementList } from '@/components/ManagementList'
import type { ToolbarButton } from '@/components/ManagementList'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { TableActionsColumn, type TableAction } from '@/components/TableActionsColumn'
import NodeFormDialog from './components/NodeFormDialog.vue'

interface NodeRecord {
  id: number
  internalIp: string
  publicIp: string
  hostname: string
  hostId: string
  agentId: string
  applicationType: string
  region: string
  os: string
  agentStatus: string
  nodeStatus: string
  agentVersion: string
  lastHeartbeat: string
  tags?: Array<{ key: string; value: string }>
}

const title = '节点管理'
const loading = ref(false)
const selectedRows = ref<NodeRecord[]>([])
const allNodes = ref<NodeRecord[]>([])

const stats = reactive({
  total: 156,
  online: 142,
  offline: 8,
  abnormal: 6
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  agentStatus: '',
  applicationType: '',
  nodeTag: ''
})

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

const rowActions: TableAction[] = [
  {
    key: 'delete',
    label: '删除',
    divided: true,
    danger: true
  }
]

const nodeDialogVisible = ref(false)
const nodeDialogLoading = ref(false)
const nodeDialogMode = ref<'create' | 'edit'>('create')
const nodeDialogData = ref<Record<string, any>>({})
const nodeDialogTags = ref<Array<{ key: string; value: string }>>([])

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
      }
    ]
    allNodes.value = mockData
  } finally {
    loading.value = false
  }
}

const handleBulkCommand = (command: string) => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择节点')
    return
  }
  ElMessage.info(
    `批量操作【${command}】已触发，共 ${selectedRows.value.length} 个节点（功能待实现）`
  )
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
  ElMessage.info('导入Excel功能待实现')
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
  ElMessage.info('设置功能待实现')
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

    .stat-icon {
      font-size: 32px;
      margin-right: 12px;
    }

    .stat-content {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}
</style>
