<template>
  <el-dialog v-model="dialogVisible" title="选择主机" width="900px">
    <div class="host-dialog-body">
      <!-- 左侧表格 -->
      <div class="host-table">
        <div class="host-search">
          <el-input
            v-model="filters.hostId"
            placeholder="搜索主机ID"
            clearable
            :prefix-icon="Search"
          />
          <el-input
            v-model="filters.publicIp"
            placeholder="搜索公网IP"
            clearable
            :prefix-icon="Search"
          />
          <el-input
            v-model="filters.innerIp"
            placeholder="搜索内网IP"
            clearable
            :prefix-icon="Search"
          />
        </div>
        <el-table
          ref="tableRef"
          :data="allNodes"
          height="320"
          row-key="hostId"
          @selection-change="handleSelectionChange"
        >
          <el-table-column
            type="selection"
            width="50"
            fixed
            :selectable="() => !isSelectionDisabled"
          />
          <el-table-column prop="hostId" label="主机ID" />
          <el-table-column prop="innerIp" label="内网IP" min-width="100" />
          <el-table-column prop="publicIp" label="公网IP" min-width="100" />
          <el-table-column prop="nodeTags" label="节点标签" />
          <el-table-column prop="os" label="操作系统" />
          <el-table-column prop="loginPort" label="登录端口" />
          <el-table-column prop="authMethod" label="认证方式" />
          <el-table-column prop="loginAccount" label="登录账号" />
          <el-table-column prop="loginIp" label="登录IP" min-width="100" />
          <el-table-column prop="hostName" label="主机名称" />
          <el-table-column prop="networkType" label="网络类型" />
          <el-table-column prop="region" label="地区" />
          <el-table-column prop="vendorName" label="供应商名称" min-width="100" />
          <el-table-column prop="appTypeName" label="应用类型" />
          <el-table-column prop="operator" label="运营商" />
          <el-table-column prop="remark" label="备注" />
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
            <div v-for="host in filteredSelectedHosts" :key="host.hostId" class="selected-item">
              <div class="info"> [{{ host.hostId }}] [内] {{ host.innerIp }} </div>
              <el-button type="text" @click="removeTempHost(host.hostId)"
                ><el-icon><Close /></el-icon
              ></el-button>
            </div>
          </div>
          <div class="clear-hosts" @click="clearTempHosts"
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
import { onMounted, computed, reactive, ref, watch, nextTick } from 'vue'
import { ElTable, ElMessage } from 'element-plus'
import { Search, Close, Delete } from '@element-plus/icons-vue'
// import { apiGetNodeList } from '@/api/node/index'
import { debounce } from 'lodash-es'

interface HostItem {
  hostId: string
  hostName: string
  innerIp: string
  publicIp: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    hosts: HostItem[]
    modelValue?: HostItem[]
  }>(),
  {
    hosts: () => [],
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
  hostId: '',
  publicIp: '',
  innerIp: ''
})
const filters = reactive({
  hostId: '',
  innerIp: '',
  publicIp: '',
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
    const params = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      ...(queryParams.hostId && { hostId: queryParams.hostId }),
      ...(queryParams.publicIp && { publicIp: queryParams.publicIp }),
      ...(queryParams.innerIp && { innerIp: queryParams.innerIp })
    }
    // const res = await apiGetNodeList(params)
    let res
    if (queryParams.page === 1) {
      res = {
        data: {
          list: [
            { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', innerIp: '172.21.0.12' },
            { hostId: '2', hostName: '名称A', publicIp: '121.199.4.33', innerIp: '172.21.0.10' },
            { hostId: '3', hostName: '名称B', publicIp: '192.168.0.22', innerIp: '172.21.0.11' },
            { hostId: '4', hostName: '名称123', publicIp: '192.168.0.33', innerIp: '172.21.0.1' },
            { hostId: '5', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' },
            { hostId: '6', hostName: '名称A', publicIp: '121.199.4.33', innerIp: '172.21.0.10' },
            { hostId: '7', hostName: '名称B', publicIp: '192.168.0.22', innerIp: '172.21.0.11' },
            { hostId: '8', hostName: '名称123', publicIp: '192.168.0.33', innerIp: '172.21.0.1' },
            { hostId: '9', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' }
          ],
          pagination: {
            total: 100
          }
        }
      }
    } else {
      res = {
        data: {
          list: [
            { hostId: '10', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' },
            { hostId: '11', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' },
            { hostId: '12', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' },
            { hostId: '13', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' },
            { hostId: '14', hostName: 'ABCDE', publicIp: '192.168.0.44', innerIp: '172.21.0.15' }
          ],
          pagination: {
            total: 100
          }
        }
      }
    }
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

// 防抖搜索函数
const debouncedSearch = debounce(() => {
  queryParams.page = 1
  getList()
}, 300)

// 监听搜索条件变化（左侧三个搜索框）
watch(
  () => [filters.hostId, filters.publicIp, filters.innerIp],
  ([hostId, publicIp, innerIp]) => {
    queryParams.hostId = hostId
    queryParams.publicIp = publicIp
    queryParams.innerIp = innerIp
    debouncedSearch()
  }
)

// 右侧选中列表的过滤（前端过滤）
const filteredSelectedHosts = computed(() => {
  if (!filters.selectedInnerIp) {
    return tempSelection.value
  }
  return tempSelection.value.filter((host) =>
    host.innerIp.toLowerCase().includes(filters.selectedInnerIp.toLowerCase())
  )
})

// 切换分页
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}

// 同步表格选中状态
const syncTableSelection = () => {
  console.log('切换分页后同步状态', tempSelection.value)
  if (!tableRef.value) return
  // 开启锁，阻止 selection-change 更新 tempSelection
  stopSyncSelection.value = true
  tableRef.value.clearSelection()
  allNodes.value.forEach((node) => {
    if (tempSelection.value.find((item) => item.hostId === node.hostId)) {
      tableRef.value?.toggleRowSelection(node, true)
    }
  })
  // 执行一次 nextTick，再解锁，避免中途又被触发
  nextTick(() => {
    stopSyncSelection.value = false
  })
}

// 监听对话框打开，初始化选中状态
watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 对话框打开时，从 modelValue 初始化选中列表
      tempSelection.value = props.modelValue ? [...props.modelValue] : []
      // 重置搜索条件
      filters.hostId = ''
      filters.publicIp = ''
      filters.innerIp = ''
      filters.selectedInnerIp = ''
      queryParams.hostId = ''
      queryParams.publicIp = ''
      queryParams.innerIp = ''
      queryParams.page = 1
      // 加载列表并同步选中状态
      getList()
    }
  }
)

// 监听 modelValue 变化（编辑时回显）
watch(
  () => props.modelValue,
  (val) => {
    if (props.visible && val) {
      tempSelection.value = [...val]
      nextTick(() => {
        syncTableSelection()
      })
    }
  },
  { immediate: true }
)

// 表格选中变化
const handleSelectionChange = (selection: HostItem[]) => {
  if (stopSyncSelection.value) return
  // 添加新选中的节点
  selection.forEach((host) => {
    if (!tempSelection.value.find((item) => item.hostId === host.hostId)) {
      if (tempSelection.value.length >= MAX_SELECTION) {
        ElMessage.warning(`单次最多${MAX_SELECTION}台主机`)
        // 取消当前行的选中
        tableRef.value?.toggleRowSelection(host, false)
        return
      }
      tempSelection.value.push(host)
    }
  })
}

// 删除选中的主机
const removeTempHost = (hostId: string) => {
  // 从选中列表移除
  tempSelection.value = tempSelection.value.filter((host) => host.hostId !== hostId)
  // 如果该主机在当前页面，取消表格选中
  const row = allNodes.value.find((item) => item.hostId === hostId)
  if (row && tableRef.value) {
    tableRef.value.toggleRowSelection(row, false)
  }
}

// 清空所有选中
const clearTempHosts = () => {
  tempSelection.value = []
  syncTableSelection()
}

// 检查是否可以选择（用于禁用复选框）
const isSelectionDisabled = computed(() => {
  return tempSelection.value.length >= MAX_SELECTION
})

const handleCancel = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('update:modelValue', tempSelection.value)
  emit('confirm', tempSelection.value)
  dialogVisible.value = false
}

onMounted(() => {
  getList()
})
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
    max-width: 500px;

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
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
