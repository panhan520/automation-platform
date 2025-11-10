<template>
  <el-table-column label="操作" :width="width" fixed="right">
    <template #default="scope">
      <div class="table-actions">
        <div class="table-button" @click="handleEdit(scope.row)">编辑</div>
        <el-dropdown v-if="actions.length" @command="handleCommand" trigger="click">
          <div class="table-button">更多</div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="action in actions"
                :key="action.key"
                :command="{ action: action.key, row: scope.row }"
                :divided="action.divided"
                :style="action.danger ? 'color: #f56c6c' : ''"
              >
                {{ action.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
export interface TableAction {
  key: string
  label: string
  divided?: boolean
  danger?: boolean
}

interface Props {
  width?: string | number
  actions?: TableAction[]
}

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  actions: () => []
})

const emit = defineEmits<{
  (e: 'edit', row: any): void
  (e: 'action', action: string, row: any): void
}>()

const handleEdit = (row: any) => {
  emit('edit', row)
}

const handleCommand = ({ action, row }: { action: string; row: any }) => {
  emit('action', action, row)
}
</script>

<style lang="less" scoped>
.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .more-link {
    cursor: pointer;
  }
}
</style>
