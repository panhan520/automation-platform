<template>
  <el-dialog v-model="dialogVisible" title="选择主机" width="820px">
    <div class="host-dialog-body">
      <div class="host-table">
        <div class="host-search">
          <el-input v-model="filters.hostId" placeholder="搜索主机ID" clearable :prefix-icon="Search" />
          <el-input
            v-model="filters.internalIp"
            placeholder="搜索内网IP"
            clearable
            :prefix-icon="Search"
          />
          <el-input
            v-model="filters.publicIp"
            placeholder="搜索公网IP"
            clearable
            :prefix-icon="Search"
          />
        </div>
        <el-table
          ref="tableRef"
          :data="filteredHosts"
          height="320"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="hostId" label="主机ID" width="120" />
          <el-table-column prop="hostName" label="主机名称" />
          <el-table-column prop="publicIp" label="公网IP" />
          <el-table-column prop="internalIp" label="内网IP" />
        </el-table>
        <div class="host-pagination">
          <div>总数 {{ filteredHosts.length }}</div>
          <el-pagination layout="prev, pager, next" :total="filteredHosts.length" :page-size="10" />
        </div>
      </div>
      <div class="selected-panel">
        <div class="panel-title">已选主机({{ tempSelection.length }})</div>
        <el-empty v-if="tempSelection.length === 0" description="暂无数据" />
        <el-scrollbar v-else height="320px">
          <div v-for="host in tempSelection" :key="host.hostId" class="selected-item">
            <div class="info">
              <div class="id">[{{ host.hostId }}] {{ host.hostName }}</div>
              <div class="ip">{{ host.internalIp }}</div>
            </div>
            <el-button type="text" @click="removeTempHost(host.hostId)">移除</el-button>
          </div>
        </el-scrollbar>
        <el-button text type="danger" @click="clearTempHosts">清空所有</el-button>
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
import { computed, reactive, ref, watch } from 'vue'
import { ElTable } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

interface HostItem {
  hostId: string
  hostName: string
  internalIp: string
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

const filters = reactive({
  hostId: '',
  internalIp: '',
  publicIp: ''
})

const tempSelection = ref<HostItem[]>([])

const filteredHosts = computed(() =>
  props.hosts.filter((host) => {
    const matchHostId = filters.hostId ? host.hostId.includes(filters.hostId) : true
    const matchInternal = filters.internalIp ? host.internalIp.includes(filters.internalIp) : true
    const matchPublic = filters.publicIp ? host.publicIp.includes(filters.publicIp) : true
    return matchHostId && matchInternal && matchPublic
  })
)

const syncTableSelection = () => {
  if (!tableRef.value) return
  tableRef.value.clearSelection()
  filteredHosts.value.forEach((host) => {
    if (tempSelection.value.find((item) => item.hostId === host.hostId)) {
      tableRef.value?.toggleRowSelection(host, true)
    }
  })
}

watch(
  () => props.modelValue,
  (val) => {
    tempSelection.value = val ? [...val] : []
    syncTableSelection()
  },
  { immediate: true }
)

watch(filteredHosts, () => {
  syncTableSelection()
})

const handleSelectionChange = (selection: HostItem[]) => {
  tempSelection.value = selection
}

const removeTempHost = (hostId: string) => {
  tempSelection.value = tempSelection.value.filter((host) => host.hostId !== hostId)
  syncTableSelection()
}

const clearTempHosts = () => {
  tempSelection.value = []
  syncTableSelection()
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
.host-dialog-body {
  display: flex;
  gap: 16px;

  .host-table {
    flex: 1;

    .host-search {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .host-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .selected-panel {
    width: 240px;
    border-left: 1px solid #f0f0f0;
    padding-left: 12px;

    .panel-title {
      font-weight: 600;
      margin-bottom: 12px;
    }

    .selected-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 8px;

      .info {
        .id {
          font-size: 13px;
          font-weight: 600;
        }

        .ip {
          font-size: 12px;
          color: #909399;
        }
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


