<template>
  <ContentWrap>
    <!-- 标题 -->
    <div class="page-title">{{ title }}</div>
    <!-- 统计栏 -->
    <slot name="extra-toolbar"> </slot>
    <!-- 操作栏 -->
    <TableToolbar
      :buttons="toolbarButtons"
      :filters="filters"
      :filter-values="queryParams"
      @search="handleSearch"
      @refresh="handleRefresh"
    />
    <!-- 表格 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      :row-key="tableData && tableData.length && tableData[0].id ? 'id' : 'userId'"
      border
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @filter-change="onFilterChange"
      @sort-change="onSortChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="50" />
      <slot name="columns" :display-columns="displayColumns">
        <el-table-column
          v-for="column in displayColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
          :filters="column.filters"
          :filter-multiple="column.filterMultiple"
          :column-key="column.prop"
        >
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" :row="scope.row" :column="scope.column" :index="scope.$index">
              {{ scope.row[column.prop] }}
            </slot>
          </template>
        </el-table-column>
      </slot>
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
    </el-table>
    <!-- 分页栏 -->
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
        @changePageSize="handlePageSizeChange"
      />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { TableToolbar } from '@/components/TableToolbar'
import type { ToolbarFilter } from '@/components/TableToolbar'
import { Pagination } from '@/components/Pagination'
import Sortable from 'sortablejs'

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | string
  slot?: boolean | string
  visible?: boolean
  order?: number
  filters?: Array<{ text: string; value: any }>
  filterMultiple?: boolean
  isDisabled?: boolean
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
  loading?: boolean
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
  storageKey?: string
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
  }),
  storageKey: ''
})
const emit = defineEmits<{
  (e: 'search', params: any): void
  (e: 'refresh', params: any): void
  (e: 'page-change', page: number, pageSize: number): void
  (e: 'selection-change', selectedRows: any[]): void
  (e: 'bulk-action', actionKey: string, selectedRows: any[]): void
  (e: 'filter-change', filters: ToolbarFilter[]): void
  (e: 'sort-change', sort: { prop: string; order: string }): void
}>()
// 选中项
const selectedRows = ref<any[]>([])
const columnConfig = ref<TableColumn[]>([])
const tableRef = ref<InstanceType<typeof import('element-plus').ElTable>>()
let sortableInstance: Sortable | null = null

// 本地分页状态
const localPage = ref(props.queryParams.page)
const localPageSize = ref(props.queryParams.pageSize)
// 显示的列（根据配置过滤和排序）
const displayColumns = computed(() => {
  // 优先使用 columnConfig，如果为空则使用 props.columns
  const columnsToUse = columnConfig.value.length > 0 ? columnConfig.value : props.columns
  return columnsToUse
    .filter((col) => col.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

// 从 localStorage 读取配置
const loadFromStorage = (): TableColumn[] | null => {
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
const saveToStorage = (columns: TableColumn[]) => {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(columns))
  } catch (error) {
    console.error('Failed to save column config to localStorage:', error)
  }
}

// 初始化列配置
const initColumnConfig = () => {
  if (props.columns.length > 0) {
    // 尝试从 localStorage 加载配置
    const storedConfig = loadFromStorage()
    if (storedConfig) {
      // 合并存储的配置和当前列配置
      const storedMap = new Map(storedConfig.map((col) => [col.prop, col]))
      columnConfig.value = props.columns.map((col) => {
        const stored = storedMap.get(col.prop)
        if (stored) {
          return {
            ...col,
            visible: stored.visible !== false,
            order: stored.order !== undefined ? stored.order : (col.order ?? 0)
          }
        }
        return {
          ...col,
          visible: col.visible !== false,
          order: col.order !== undefined ? col.order : (col.order ?? 0)
        }
      })
      // 按 order 排序
      columnConfig.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    } else {
      columnConfig.value = props.columns.map((col, index) => ({
        ...col,
        visible: col.visible !== false,
        order: col.order !== undefined ? col.order : index
      }))
    }
  }
}

// 监听 columns 变化
watch(
  () => props.columns,
  () => {
    initColumnConfig()
  },
  { immediate: true, deep: true }
)

// 精准锁定表头 row
const getHeaderRow = () => {
  if (!tableRef.value) return null
  const tableEl = tableRef.value.$el
  if (!tableEl) return null
  return tableEl.querySelector(
    '.el-table__header-wrapper table thead tr'
  ) as HTMLTableRowElement | null
}

const initTableColumnDrag = () => {
  setTimeout(() => {
    const headerRow = getHeaderRow()
    if (!headerRow) return

    // 正确获取所有 TH
    let headerCells = Array.from(headerRow.querySelectorAll('th.el-table__cell'))

    // 排除 selection 列
    if (props.showSelection) {
      headerCells = headerCells.slice(1)
    }

    if (!headerCells.length) return

    // 销毁旧实例
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }

    // ⭐ 移除旧的 Sortable 绑定标记，避免重复绑定
    headerCells.forEach((cell) => {
      cell.removeAttribute('data-sortable-id')
    })

    const columnProps = displayColumns.value.map((col) => col.prop)
    headerCells.forEach((cell, index) => {
      const prop = columnProps[index]
      if (prop) {
        cell.setAttribute('data-column-prop', prop)
      }
      if (prop === 'actions') {
        cell.classList.add('no-drag-column')
      } else {
        cell.classList.remove('no-drag-column')
      }
    })

    // 标记selection列不可拖拽
    if (props.showSelection) {
      const allCells = Array.from(headerRow.querySelectorAll('th.el-table__cell'))
      if (allCells[0]) {
        allCells[0].classList.add('no-drag-column')
      }
    }

    // 创建 Sortable
    sortableInstance = Sortable.create(headerRow, {
      animation: 150,
      handle: '.cell', // 只拖 div.cell 区域
      draggable: 'th.el-table__cell:not(.no-drag-column)', // 限制可拖元素
      onEnd: () => {
        // 基于DOM实际顺序更新列配置
        const allCells = Array.from(headerRow.querySelectorAll('th.el-table__cell'))
        const orderedProps: string[] = []

        allCells.forEach((cell) => {
          const prop = cell.getAttribute('data-column-prop')
          if (prop && prop !== 'selection') {
            orderedProps.push(prop)
          }
        })

        if (orderedProps.length === 0) return

        // 创建当前配置的映射
        const configMap = new Map(columnConfig.value.map((col) => [col.prop, { ...col }]))

        // 按照DOM顺序重新排列列配置
        const newColumns: TableColumn[] = []
        orderedProps.forEach((prop, index) => {
          const col = configMap.get(prop)
          if (col) {
            newColumns.push({ ...col, order: index })
          }
        })

        // 添加未在DOM中出现的列（隐藏的列）
        columnConfig.value.forEach((col) => {
          if (!orderedProps.includes(col.prop)) {
            newColumns.push({ ...col, order: newColumns.length })
          }
        })

        columnConfig.value = newColumns
        saveToStorage(newColumns)
        nextTick(() => {
          tableRef.value?.doLayout()
          initTableColumnDrag()
        })
      }
    })
  })
}

// 暴露方法供父组件调用
defineExpose({
  updateColumnConfig: (columns: TableColumn[]) => {
    columnConfig.value = columns.map((col, index) => ({
      ...col,
      order: col.order !== undefined ? col.order : index
    }))
    // 保存到 localStorage
    saveToStorage(columnConfig.value)
    // 重新初始化拖拽
    initTableColumnDrag()
  },
  getColumnConfig: () => columnConfig.value
})

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
const onFilterChange = (filters: ToolbarFilter[]) => {
  emit('filter-change', filters)
}
const onSortChange = (sorts) => {
  if (sorts.order === 'ascending') {
    sorts.order = 'asc'
  } else if (sorts.order === 'descending') {
    sorts.order = 'desc'
  }
  emit('sort-change', sorts)
}
// 分页切换
const handlePageChange = (page: number, pageSize: number) => {
  localPage.value = page
  localPageSize.value = pageSize
  emit('page-change', page, pageSize)
}
const handlePageSizeChange = (pageSize: number) => {
  localPage.value = 1
  localPageSize.value = pageSize
  emit('page-change', 1, pageSize)
}
// 选中行变化
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

// 监听 displayColumns 变化，重新初始化拖拽
watch(
  () => displayColumns.value,
  () => {
    initTableColumnDrag()
  },
  { flush: 'post' }
)

onMounted(() => {
  initTableColumnDrag()
})

onUnmounted(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
})
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
