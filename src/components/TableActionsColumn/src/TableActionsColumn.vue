<template>
  <el-table-column label="操作" :width="width" :fixed="fixed">
    <template #default="scope">
      <div class="table-actions">
        <el-button
          v-if="showEdit"
          class="table-button"
          link
          size="small"
          type="primary"
          @click="handleEdit(scope.row)"
        >
          {{ editLabel }}
        </el-button>
        <template v-for="action in resolveMainActions(scope.row)" :key="action.key">
          <el-button
            v-if="isActionVisible(action, scope.row)"
            size="small"
            :type="action.type || (action.danger ? 'danger' : '')"
            :text="action.text ?? true"
            :link="action.link ?? false"
            :plain="action.plain ?? false"
            :disabled="isActionDisabled(action, scope.row)"
            class="table-button"
            @click="() => handleMainAction(action.key, scope.row)"
          >
            <template v-if="action.icon" #icon>
              <component :is="action.icon" />
            </template>
            {{ action.label }}
          </el-button>
        </template>
        <el-dropdown
          v-if="resolveDropdownActions(scope.row).length"
          @command="handleCommand"
          trigger="click"
        >
          <div class="table-button dropdown-trigger"
            ><el-button link size="small" type="primary"
              ><el-icon><MoreFilled /></el-icon> </el-button
          ></div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="action in resolveDropdownActions(scope.row)"
                :key="action.key"
                :command="{ action: action.key, row: scope.row }"
                :divided="action.divided"
                :style="action.danger ? 'color: #f56c6c' : ''"
                :disabled="isActionDisabled(action, scope.row)"
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
import type { Component } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
export interface TableAction {
  key: string
  label: string
  divided?: boolean
  danger?: boolean
  icon?: Component
  disabled?: boolean | ((row: any) => boolean)
  show?: boolean | ((row: any) => boolean)
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  text?: boolean
  link?: boolean
  plain?: boolean
}

type ActionConfig = TableAction[] | ((row: any) => TableAction[])

interface Props {
  width?: string | number
  fixed?: boolean | 'left' | 'right'
  actions?: ActionConfig
  mainActions?: ActionConfig
  showEdit?: boolean
  editLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  fixed: 'right' as const,
  actions: () => [],
  mainActions: () => [],
  showEdit: true,
  editLabel: '编辑'
})

const emit = defineEmits<{
  (e: 'edit', row: any): void
  (e: 'action', action: string, row: any): void
}>()

const resolveActionList = (config: ActionConfig, row: any) => {
  const list = typeof config === 'function' ? config(row) : config
  return (list || []).filter((action) => isActionVisible(action, row))
}

const resolveMainActions = (row: any) => resolveActionList(props.mainActions, row)

const resolveDropdownActions = (row: any) => resolveActionList(props.actions, row)

const isActionVisible = (action: TableAction, row: any) => {
  if (typeof action.show === 'function') {
    return action.show(row)
  }
  if (typeof action.show === 'boolean') {
    return action.show
  }
  return true
}

const isActionDisabled = (action: TableAction, row: any) => {
  if (typeof action.disabled === 'function') {
    return action.disabled(row)
  }
  return Boolean(action.disabled)
}

const handleEdit = (row: any) => {
  emit('edit', row)
}

const handleMainAction = (actionKey: string, row: any) => {
  emit('action', actionKey, row)
}

const handleCommand = ({ action, row }: { action: string; row: any }) => {
  emit('action', action, row)
}
</script>

<style lang="less" scoped>
.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .table-button {
    cursor: pointer;
    font-size: 13px;
    margin: 0;
    padding: 0;
  }

  .dropdown-trigger {
    color: #1664ff;
    font-size: 12px;
    font-weight: bold;
  }
}
</style>
