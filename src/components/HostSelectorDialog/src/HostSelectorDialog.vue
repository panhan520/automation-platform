<template>
  <el-dialog v-model="dialogVisible" title="选择主机" width="900px">
    <div class="host-dialog-body">
      <!-- 左侧表格 -->
      <div class="host-table">
        <div class="host-search">
          <el-input
            v-model="filters.query"
            placeholder="搜索公网IP/内网IP/主机ID"
            clearable
            style="width: 240px"
            :prefix-icon="Search"
          />
        </div>
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="allNodes"
          height="320"
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" fixed />
          <el-table-column prop="id" label="主机ID" />
          <el-table-column prop="innerIp" label="内网IP" min-width="100" />
          <el-table-column prop="publicIp" label="公网IP" min-width="100" />
          <el-table-column prop="nodeTags" label="节点标签">
            <template v-slot="scope">
              {{ formatObjectValue(scope.row.nodeTags) }}
            </template>
          </el-table-column>
          <el-table-column prop="os" label="操作系统" />
          <el-table-column prop="loginPort" label="登录端口" />
          <el-table-column prop="authMethod" label="认证方式" />
          <el-table-column prop="loginAccount" label="登录账号" />
          <el-table-column prop="loginIp" label="登录IP" min-width="100" />
          <el-table-column prop="hostName" label="主机名称" min-width="120">
            <template v-slot="scope">
              <el-tooltip :content="scope.row.hostName" placement="top">
                <span class="app-type-ellipsis">{{ scope.row.hostName || '-' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="networkType" label="网络类型">
            <template v-slot="scope">
              {{
                scope.row.networkType === 'public'
                  ? '公网'
                  : scope.row.networkType === 'private'
                    ? '内网'
                    : '未知'
              }}
            </template>
          </el-table-column>
          <el-table-column prop="region" label="地区" min-width="150" />
          <el-table-column prop="vendorName" label="供应商名称" min-width="100" />
          <el-table-column prop="appTypeName" label="应用类型" min-width="120">
            <template v-slot="scope">
              <el-tooltip :content="scope.row.appTypeName" placement="top">
                <el-tag class="app-type-ellipsis">{{ scope.row.appTypeName || '-' }}</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="运营商" />
          <el-table-column prop="remark" label="备注" min-width="100" />
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </el-table>
        <div class="host-pagination">
          <Pagination
            v-model="queryParams.page"
            :page-size="queryParams.pageSize"
            :total="totalRecords"
            :page-sizes="[10, 20, 50, 100]"
            @change="handlePageChange"
            @changePageSize="handlePageSizeChange"
            :pager-count="5"
            layout="total, sizes, prev, pager, next"
          />
        </div>
      </div>
      <div class="selected-panel">
        <div class="panel-title"
          ><span>已选主机({{ tempSelection.length }})</span>
          <el-input
            v-model="filters.selectedInnerIp"
            placeholder="搜索内网IP"
            clearable
            :prefix-icon="Search"
            style="width: 50%"
          />
        </div>
        <div class="selected-list-container">
          <el-empty
            v-if="filteredSelectedHosts.length === 0"
            description="暂无数据"
            style="height: 313px"
          />
          <div v-else class="selected-list">
            <div v-for="host in filteredSelectedHosts" :key="host.id" class="selected-item">
              <div class="info"> [{{ host.id }}] [内] {{ host.innerIp }} </div>
              <el-button type="text" @click="removeTempHost(host.id)"
                ><el-icon><Close /></el-icon
              ></el-button>
            </div>
          </div>
          <div
            class="clear-hosts"
            :class="tempSelection.length === 0 ? 'clear-disabled' : ''"
            @click="clearTempHosts"
            ><el-icon><Delete /></el-icon>清空所有</div
          >
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { ElTable, ElMessage } from 'element-plus'
import { Search, Close, Delete } from '@element-plus/icons-vue'
import { apiGetNodeList } from '@/api/node/index'
import { debounce } from 'lodash-es'
import { HostItem } from '@/api/node/type'

const props = withDefaults(
  defineProps<{
    visible: boolean
    modelValue?: HostItem[]
  }>(),
  {
    modelValue: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: HostItem[]): void
  (e: 'confirm', value: HostItem[]): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const tableRef = ref<InstanceType<typeof ElTable>>()
const totalRecords = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  query: ''
})
const filters = reactive({
  query: '',
  selectedInnerIp: '' // 用于右侧选中列表的搜索
})
const loading = ref(false)
const allNodes = ref<any[]>([])
const MAX_SELECTION = 100

// 全局选中列表，不随翻页清空
const tempSelection = ref<HostItem[]>([])
// 布尔锁，默认翻页不触发选中change事件
const stopSyncSelection = ref(false)

// 获取节点列表（带搜索参数）
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetNodeList(queryParams)
    // 开启锁，阻止 selection-change 更新 tempSelection
    stopSyncSelection.value = true
    allNodes.value = res.data.list
    totalRecords.value = res.data.pagination.total
    // 加载完数据后同步选中状态
    await nextTick()
    syncTableSelection()
  } catch (error) {
    ElMessage.error('获取节点列表失败')
  } finally {
    loading.value = false
  }
}

// 赋值选中数组和渲染选中列表
const syncTableSelection = () => {
  if (!tableRef.value) return
  // 同步表格选中状态
  tableRef.value.clearSelection()
  allNodes.value.forEach((node) => {
    if (tempSelection.value.find((item) => item.id === node.id)) {
      tableRef.value?.toggleRowSelection(node, true)
    }
  })
  // 执行一次 nextTick，再解锁，避免中途又被触发
  nextTick(() => {
    stopSyncSelection.value = false
  })
}

// 防抖搜索函数
const debouncedSearch = debounce(() => {
  queryParams.page = 1
  getList()
}, 300)

// 右侧选中列表的过滤（前端过滤）
const filteredSelectedHosts = computed(() => {
  if (!filters.selectedInnerIp) {
    return tempSelection.value
  }
  return tempSelection.value.filter((host) =>
    host.innerIp.toLowerCase().includes(filters.selectedInnerIp.toLowerCase())
  )
})
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
// 切换分页
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}
const handlePageSizeChange = (pageSize: number) => {
  queryParams.page = 1
  queryParams.pageSize = pageSize
  getList()
}
// 监听对话框打开，初始化选中状态
watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 开启锁，阻止 selection-change 更新 tempSelection
      stopSyncSelection.value = true
      // 对话框打开时，从 modelValue 初始化选中列表
      tempSelection.value = props.modelValue ? [...props.modelValue] : []
      // 重置搜索条件
      filters.query = ''
      filters.selectedInnerIp = ''
      queryParams.query = ''
      queryParams.page = 1
      tableRef.value?.clearSelection()
      // 加载列表并同步选中状态
      getList()
    }
  }
)
// 监听搜索条件变化（左侧三个搜索框）
watch(
  () => [filters.query],
  ([query]) => {
    queryParams.query = query
    debouncedSearch()
  }
)
// 表格选中变化
const handleSelectionChange = (selection: HostItem[]) => {
  if (stopSyncSelection.value) return
  // 添加新选中的节点
  selection.forEach((host) => {
    if (!tempSelection.value.find((item) => item.id === host.id)) {
      if (tempSelection.value.length >= MAX_SELECTION) {
        ElMessage.warning(`单次最多${MAX_SELECTION}台主机`)
        // 取消当前行的选中
        tableRef.value?.toggleRowSelection(host, false)
        return
      }
      tempSelection.value.push(host)
    }
  })
  // 同步移除未选中的（仅移除当前页中被取消勾选的项，避免跨页误删）
  const currentPageIds = allNodes.value.map((n) => n.id)
  tempSelection.value = tempSelection.value.filter((h) => {
    if (!currentPageIds.includes(h.id)) return true
    return selection.some((s) => s.id === h.id)
  })
}

// 删除选中的主机
const removeTempHost = (id: number) => {
  // 从选中列表移除
  tempSelection.value = tempSelection.value.filter((host) => host.id !== id)
  // 如果该主机在当前页面，取消表格选中
  const row = allNodes.value.find((item) => item.id === id)
  if (row && tableRef.value) {
    tableRef.value.toggleRowSelection(row, false)
  }
}

// 清空所有选中
const clearTempHosts = () => {
  tempSelection.value = []
  tableRef.value?.clearSelection()
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('update:modelValue', tempSelection.value)
  emit('confirm', tempSelection.value)
  dialogVisible.value = false
}
</script>

<style scoped lang="less">
:deep(.el-pagination .el-select) {
  width: 100px;
}
.host-dialog-body {
  display: flex;
  gap: 16px;

  .host-table {
    flex: 1;
    max-width: 470px;

    .host-search {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .host-pagination {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .selected-panel {
    width: 100%;

    .panel-title {
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
      padding-left: 12px;
    }
    .selected-list-container {
      border: solid 1px #f0f0f0;
      border-radius: 8px;
      padding: 5px 0 0;
      .selected-list {
        height: 313px;
        overflow: auto;
        .selected-item {
          width: 47%;
          margin-left: 3%;
          display: inline-flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 5px;
          border: 1px solid rgb(217, 236, 255);
          border-radius: 8px;
          margin-bottom: 8px;
          background: rgb(236, 245, 255);

          .info {
            font-size: 12px;
            color: #409eff;
          }
        }
      }
      .clear-hosts {
        height: 40px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border-top: solid 1px #f0f0f0;
        color: #f56c6c;
        cursor: pointer;
      }
      .clear-disabled {
        cursor: not-allowed;
        color: #909399;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.app-type-ellipsis {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  line-height: 20px;
}
</style>
