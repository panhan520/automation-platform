<template>
  <el-dialog v-model="visible" title="定制列" width="600px" :close-on-click-modal="false">
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
        <VueDraggable
          v-model="displayColumns"
          handle=".drag-handle"
          :animation="150"
          item-key="prop"
        >
          <template #item="{ element: column }">
            <div class="column-item">
              <el-checkbox
                :model-value="checkedColumns.includes(column.prop)"
                @change="(val) => handleColumnCheck(column.prop, val)"
              >
                {{ column.label }}
              </el-checkbox>
              <el-icon class="drag-handle"><Rank /></el-icon>
            </div>
          </template>
        </VueDraggable>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleRestore">恢复默认</el-button>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import { VueDraggable } from 'vue-draggable-plus'
import { Rank } from '@element-plus/icons-vue'

export interface ColumnItem {
  prop: string
  label: string
  visible?: boolean
  order?: number
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | string
  slot?: boolean | string
}

interface Props {
  visible: boolean
  columns: ColumnItem[]
}

const props = defineProps<Props>()

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

const initColumns = () => {
  const cols = cloneDeep(props.columns)
  if (defaultColumns.value.length === 0) {
    defaultColumns.value = cloneDeep(cols)
  }
  displayColumns.value = cols
  checkedColumns.value = cols.filter((col) => col.visible !== false).map((col) => col.prop)
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
    padding: 12px 0;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 16px;

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
    gap: 12px;

    .column-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      cursor: move;

      &:hover {
        background: #f5f7fa;
      }

      .drag-handle {
        cursor: move;
        color: #909399;
        font-size: 16px;
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
