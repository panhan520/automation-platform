<template>
  <div class="table-toolbar">
    <!-- 左侧动态筛选 -->
    <div class="toolbar-left">
      <!-- 传入的筛选项 -->
      <template v-if="hasFilters">
        <div v-for="filter in filterList" :key="filter.key" class="filter-item">
          <el-input
            v-if="filter.type === 'input' || !filter.type"
            v-model="filterValuesState[filter.key]"
            :placeholder="filter.placeholder"
            :clearable="filter.clearable ?? true"
            :prefix-icon="filter.prefixIcon"
            :style="getFilterStyle(filter)"
            @input="handleFilterInput"
            @keyup.enter="emitImmediateSearch"
          />
          <el-select
            v-else-if="filter.type === 'select'"
            v-model="filterValuesState[filter.key]"
            :placeholder="filter.placeholder"
            :clearable="filter.clearable ?? true"
            :style="getFilterStyle(filter)"
            @change="emitImmediateSearch"
            filterable
          >
            <el-option
              v-for="option in filter.options || []"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <!-- 重置按钮 -->
          <el-button v-else-if="filter.type === 'text'" @click="() => handleButtonClick(filter)">
            <template v-if="filter.icon" #icon>
              <component :is="filter.icon" />
            </template>
            <span>{{ filter.placeholder }}</span>
          </el-button>
          <component
            :is="filter.render"
            v-else
            v-model="filterValuesState[filter.key]"
            @change="emitImmediateSearch"
          />
        </div>
      </template>
      <!-- 筛选项为空时，显示搜索框 -->
      <template v-else>
        <el-input
          v-model="searchParams[selectValue]"
          :placeholder="selectLabel"
          @input="handleInput"
          clearable
          @keyup.enter="handleSearch"
          style="width: 300px"
          :prefix-icon="Search"
        />
      </template>
    </div>

    <!-- 右侧按钮 -->
    <div class="toolbar-right">
      <!-- 刷新按钮 -->
      <el-tooltip v-if="showRefresh" content="刷新" placement="top" effect="light">
        <el-button @click="handleRefresh" class="refresh-btn" circle>
          <el-icon :size="16"><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
      <!-- 传入的按钮 -->
      <template v-for="btn in buttons" :key="btn.key">
        <el-dropdown
          v-if="btn.dropdownOptions && btn.dropdownOptions.length"
          trigger="click"
          @command="(command: string) => handleDropdownCommand(btn, command)"
        >
          <el-tooltip v-if="btn.tooltip" :content="btn.tooltip" placement="top" effect="light">
            <el-button
              v-bind="getButtonProps(btn)"
              :type="btn.type"
              :disabled="btn.disabled"
              :loading="btn.loading"
            >
              <template v-if="btn.icon" #icon>
                <component :is="btn.icon" />
              </template>
              <span v-if="btn.label">{{ btn.label }}</span>
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            v-bind="getButtonProps(btn)"
            :type="btn.type"
            :disabled="btn.disabled"
            :loading="btn.loading"
          >
            <template v-if="btn.icon" #icon>
              <component :is="btn.icon" />
            </template>
            <span v-if="btn.label">{{ btn.label }}</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="option in btn.dropdownOptions"
                :key="option.command"
                :command="option.command"
              >
                {{ option.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <template v-else>
          <el-tooltip v-if="btn.tooltip" :content="btn.tooltip" placement="top" effect="light">
            <el-button
              v-bind="getButtonProps(btn)"
              :icon="btn.icon"
              :circle="btn.circle"
              :plain="btn.plain"
              :text="btn.text"
              :type="btn.type"
              :disabled="btn.disabled"
              :loading="btn.loading"
              @click="() => handleButtonClick(btn)"
            >
              <template v-if="btn.icon && !btn.circle && !btn.text" #icon>
                <component :is="btn.icon" />
              </template>
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            v-bind="getButtonProps(btn)"
            :icon="btn.icon"
            :circle="btn.circle"
            :plain="btn.plain"
            :text="btn.text"
            :type="btn.type"
            :disabled="btn.disabled"
            :loading="btn.loading"
            @click="() => handleButtonClick(btn)"
          >
            <template v-if="btn.icon && !btn.circle && !btn.text" #icon>
              <component :is="btn.icon" />
            </template>
            <template v-if="btn.label && !btn.textOnly">
              {{ btn.label }}
            </template>
          </el-button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { Component, CSSProperties } from 'vue'
import { debounce } from 'lodash-es'
import { Search, RefreshRight } from '@element-plus/icons-vue'

export interface ToolbarFilterOption {
  label: string
  value: any
}

export interface ToolbarFilter {
  key: string
  type?: 'input' | 'select' | 'text'
  placeholder?: string
  width?: number | string
  clearable?: boolean
  options?: ToolbarFilterOption[]
  defaultValue?: any
  prefixIcon?: Component
  render?: Component
  icon?: Component
}

interface ButtonItem {
  key: string
  label?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  icon?: Component
  circle?: boolean
  plain?: boolean
  text?: boolean
  textOnly?: boolean
  tooltip?: string
  disabled?: boolean
  dropdownOptions?: Array<{ label: string; command: string }>
  onCommand?: (command: string) => void
  onClick?: () => void
  placeholder?: string
  loading?: boolean
}

interface SearchOption {
  label: string
  value: string
}

interface SearchParams {
  [key: string]: string | null
}

const props = withDefaults(
  defineProps<{
    buttons?: ButtonItem[]
    filters?: ToolbarFilter[]
    filterValues?: Record<string, any>
    showRefresh?: boolean
    searchOptions?: SearchOption[]
    searchValue?: string
  }>(),
  {
    buttons: () => [],
    filters: () => [],
    filterValues: () => ({}),
    showRefresh: true,
    searchOptions: () => []
  }
)

const emit = defineEmits<{
  (e: 'search', params: Record<string, any>): void
  (e: 'refresh', params: Record<string, any>): void
}>()

const filterList = computed(() => props.filters || [])
const hasFilters = computed(() => filterList.value.length > 0)
const filterValuesState = reactive<Record<string, any>>({})
const selectValue = computed(() => props.searchOptions?.[0]?.value || '')
const selectLabel = computed(() => props.searchOptions?.[0]?.label || '')
const searchParams = reactive<SearchParams>({})

const initializeFilterValues = () => {
  Object.keys(filterValuesState).forEach((key) => {
    delete filterValuesState[key]
  })
  filterList.value.forEach((filter) => {
    filterValuesState[filter.key] =
      props.filterValues?.[filter.key] ??
      filter.defaultValue ??
      (filter.type === 'select' ? undefined : '')
  })
}

watch(
  filterList,
  () => {
    if (hasFilters.value) {
      initializeFilterValues()
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.filterValues,
  (val) => {
    if (!val) return
    filterList.value.forEach((filter) => {
      if (Object.prototype.hasOwnProperty.call(val, filter.key)) {
        filterValuesState[filter.key] = val[filter.key]
      }
    })
  },
  { deep: true }
)

/** 防抖搜索函数（输入类） */
const debounceSearch = debounce(() => {
  emit('search', { ...filterValuesState })
}, 300)

const handleFilterInput = () => {
  debounceSearch()
}

const emitImmediateSearch = () => {
  emit('search', { ...filterValuesState })
}

const handleRefresh = () => {
  emit('refresh', hasFilters.value ? { ...filterValuesState } : { ...searchParams })
}

const handleInput = debounce(() => {
  emit('search', { ...searchParams })
}, 300)

const handleSearch = () => {
  emit('search', { ...searchParams })
}

const getFilterStyle = (filter: ToolbarFilter): CSSProperties => {
  if (!filter.width) return {}
  return {
    width: typeof filter.width === 'number' ? `${filter.width}px` : filter.width
  }
}

const getButtonProps = (btn: ButtonItem) => {
  return {
    class: btn.circle ? 'circle-btn' : '',
    style: btn.textOnly ? { padding: '0 12px' } : undefined
  }
}

const handleButtonClick = (btn) => {
  btn.onClick?.()
}

const handleDropdownCommand = (btn: ButtonItem, command: string) => {
  btn.onCommand?.(command)
}

watch(
  () => props.searchOptions,
  (options) => {
    Object.keys(searchParams).forEach((key) => {
      delete searchParams[key]
    })
    if (options && options.length) {
      searchParams[options[0].value] = props.searchValue ?? ''
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.searchValue,
  (val) => {
    if (selectValue.value) {
      searchParams[selectValue.value] = val || ''
    }
  }
)
</script>

<style scoped lang="less">
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 15px;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  width: 32px;
  height: 32px;
}
.el-button + .el-button {
  margin-left: 0;
}
</style>
