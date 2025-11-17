<template>
  <el-dialog v-model="visible" title="定制列" width="450px" :close-on-click-modal="false">
    <div class="column-custom-dialog">
      <!-- 全选 -->
      <div class="select-all-row">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
        >
          全选
        </el-checkbox>
        <span class="count-text">{{ checkedCount }} / {{ columns.length }}</span>
      </div>

      <!-- 列列表 -->
      <div class="columns-list">
        <div v-for="column in displayColumns" :key="column.prop" class="column-item">
          <el-checkbox
            :model-value="checkedColumns.includes(column.prop)"
            @change="(val) => handleColumnCheck(column.prop, !!val)"
            :disabled="column.isDisabled"
          >
            {{ column.label }}
          </el-checkbox>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleRestore">恢复默认</el-button>
        <div>
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button></div
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { cloneDeep } from 'lodash-es'

export interface ColumnItem {
  prop: string
  label: string
  visible?: boolean
  order?: number
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | string
  slot?: boolean | string
  isDisabled?: boolean
}

interface Props {
  visible: boolean
  columns: ColumnItem[]
  storageKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  storageKey: 'nodeManagement_columnConfig'
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', columns: ColumnItem[]): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const defaultColumns = ref<ColumnItem[]>([])
const displayColumns = ref<ColumnItem[]>([])
const checkedColumns = ref<string[]>([])

const checkAll = computed({
  get: () =>
    checkedColumns.value.length === displayColumns.value.length && displayColumns.value.length > 0,
  set: (val) => {
    checkedColumns.value = val ? displayColumns.value.map((col) => col.prop) : []
  }
})

const isIndeterminate = computed(() => {
  const checkedCount = checkedColumns.value.length
  return checkedCount > 0 && checkedCount < displayColumns.value.length
})

const checkedCount = computed(() => checkedColumns.value.length)

// 从 localStorage 读取配置
const loadFromStorage = (): ColumnItem[] | null => {
  try {
    const stored = localStorage.getItem(props.storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load column config from localStorage:', error)
  }
  return null
}

// 保存配置到 localStorage
const saveToStorage = (columns: ColumnItem[]) => {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(columns))
  } catch (error) {
    console.error('Failed to save column config to localStorage:', error)
  }
}

const initColumns = () => {
  const cols = cloneDeep(props.columns)
  if (defaultColumns.value.length === 0) {
    defaultColumns.value = cloneDeep(cols)
  }

  // 尝试从 localStorage 加载配置
  const storedConfig = loadFromStorage()
  if (storedConfig) {
    // 合并存储的配置和当前列配置
    const storedMap = new Map(storedConfig.map((col) => [col.prop, col]))
    displayColumns.value = cols.map((col) => {
      const stored = storedMap.get(col.prop)
      if (stored) {
        return {
          ...col,
          visible: stored.visible !== false,
          order: stored.order !== undefined ? stored.order : (col.order ?? 0)
        }
      }
      return col
    })
    // 按 order 排序
    displayColumns.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    checkedColumns.value = displayColumns.value
      .filter((col) => col.visible !== false)
      .map((col) => col.prop)
  } else {
    displayColumns.value = cols
    checkedColumns.value = cols.filter((col) => col.visible !== false).map((col) => col.prop)
  }
}

watch(
  () => props.columns,
  () => {
    if (props.visible) {
      initColumns()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initColumns()
    }
  }
)

const handleCheckAllChange = (val: boolean) => {
  checkedColumns.value = val ? displayColumns.value.map((col) => col.prop) : []
}

const handleColumnCheck = (prop: string, checked: boolean) => {
  if (checked) {
    if (!checkedColumns.value.includes(prop)) {
      checkedColumns.value.push(prop)
    }
  } else {
    checkedColumns.value = checkedColumns.value.filter((p) => p !== prop)
  }
}

const handleRestore = () => {
  const cols = cloneDeep(defaultColumns.value)
  displayColumns.value = cols
  checkedColumns.value = cols.filter((col) => col.visible !== false).map((col) => col.prop)
  // 清除 localStorage
  localStorage.removeItem(props.storageKey)
}

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = () => {
  const result = displayColumns.value.map((col, index) => ({
    ...col,
    visible: checkedColumns.value.includes(col.prop),
    order: index
  }))
  // 保存到 localStorage
  saveToStorage(result)
  emit('confirm', result)
  visible.value = false
}
</script>

<style lang="less" scoped>
.column-custom-dialog {
  .select-all-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 8px;

    .count-text {
      font-size: 13px;
      color: #909399;
    }
  }

  .columns-list {
    max-height: 400px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border: 1px solid #e4e7ed;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;

    .column-item {
      display: flex;
      align-items: center;
      padding: 2px 5px;
      border-radius: 4px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
