<template>
  <ContentWrap>
    <div class="page-title">{{ title }}</div>
    <slot name="extra-toolbar"> </slot>
    <TableToolbar
      :buttons="toolbarButtons"
      :filters="filters"
      :filter-values="queryParams"
      @search="handleSearch"
      @refresh="handleRefresh"
    />

    <el-table
      :data="tableData"
      :row-key="tableData && tableData.length && tableData[0].id ? 'id' : 'userId'"
      border
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="50" />
      <slot name="columns">
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :sortable="column.sortable"
        >
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" :row="scope.row" :column="scope.column" :index="scope.$index">
              {{ scope.row[column.prop] }}
            </slot>
          </template>
        </el-table-column>
      </slot>
    </el-table>

    <!-- 批量操作栏 -->
    <div :class="showSelection ? 'bulk-action-bar' : 'bulk-action-bar only-pagination'">
      <div v-if="showSelection" class="bulk-actions">
        <span class="selected-info">已选{{ selectedRows.length }}/{{ totalRecords }}条</span>
        <el-button
          v-for="action in bulkActions"
          :key="action.key"
          :disabled="selectedRows.length === 0 || action.disabled"
          @click="handleBulkAction(action.key)"
        >
          {{ action.label }}
        </el-button>
      </div>
      <Pagination
        v-model="localPage"
        :page-size="localPageSize"
        :total="totalRecords"
        :page-sizes="[10, 20, 50, 100]"
        @change="handlePageChange"
      />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { TableToolbar } from '@/components/TableToolbar'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Pagination } from '@/components/Pagination'

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  sortable?: boolean | string
  slot?: string
}

export interface ToolbarButton {
  key: string
  label?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: any
  circle?: boolean
  plain?: boolean
  text?: boolean
  textOnly?: boolean
  tooltip?: string
  disabled?: boolean
  dropdownOptions?: Array<{ label: string; command: string }>
  onCommand?: (command: string) => void
  onClick?: () => void
}

export interface BulkAction {
  key: string
  label: string
  disabled?: boolean
  onClick?: (selectedRows: any[]) => void
}

interface Props {
  title: string
  tableData: any[]
  columns?: TableColumn[]
  loading?: boolean
  totalRecords?: number | string
  showSelection?: boolean
  toolbarButtons?: ToolbarButton[]
  filters?: ToolbarFilter[]
  bulkActions?: BulkAction[]
  queryParams?: {
    page: number
    pageSize: number
    [key: string]: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  tableData: () => [],
  columns: () => [],
  loading: false,
  totalRecords: 0,
  showSelection: false,
  toolbarButtons: () => [],
  filters: () => [],
  bulkActions: () => [],
  queryParams: () => ({
    page: 1,
    pageSize: 10
  })
})

const emit = defineEmits<{
  (e: 'search', params: any): void
  (e: 'refresh', params: any): void
  (e: 'page-change', page: number, pageSize: number): void
  (e: 'selection-change', selectedRows: any[]): void
  (e: 'bulk-action', actionKey: string, selectedRows: any[]): void
}>()

const selectedRows = ref<any[]>([])

// 本地分页状态
const localPage = ref(props.queryParams.page)
const localPageSize = ref(props.queryParams.pageSize)

// 监听 props.queryParams 变化
watch(
  () => props.queryParams,
  (newParams) => {
    localPage.value = newParams.page
    localPageSize.value = newParams.pageSize
  },
  { deep: true }
)

const handleSearch = (params: any) => {
  emit('search', params)
}

const handleRefresh = (params: any) => {
  emit('refresh', params)
}

const handlePageChange = (page: number, pageSize: number) => {
  localPage.value = page
  localPageSize.value = pageSize
  emit('page-change', page, pageSize)
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleBulkAction = (actionKey: string) => {
  const action = props.bulkActions.find((a) => a.key === actionKey)
  if (action?.onClick) {
    action.onClick(selectedRows.value)
  }
  emit('bulk-action', actionKey, selectedRows.value)
}
</script>

<style lang="less" scoped>
.page-title {
  font-size: 18px;
  line-height: 26px;
  color: #0c0d0e;
  margin-bottom: 20px;
  text-align: left;
}
.bulk-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  .bulk-actions {
    display: flex;
    align-items: center;
    padding: 12px 0;

    .selected-info {
      color: #606266;
      font-size: 13px;
      margin-right: 8px;
    }
  }
}
.only-pagination {
  justify-content: flex-end;
}
</style>
