<template>
  <el-dialog v-model="dialogVisible" title="选择执行模版" width="800px">
    <div class="filter-row">
      <el-select v-model="filters.type" placeholder="请选择模版类型" clearable style="width: 220px">
        <el-option v-for="type in templateTypes" :key="type" :label="type" :value="type" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索模版名称"
        clearable
        :prefix-icon="Search"
        style="width: 240px"
      />
      <el-button :icon="RefreshRight" circle @click="handleRefresh" />
    </div>

    <el-table
      v-loading="loading"
      :data="filteredTemplates"
      highlight-current-row
      @current-change="handleCurrentChange"
      height="360px"
    >
      <el-table-column width="60" align="center">
        <template #default="{ row }">
          <el-radio v-model="currentId" :label="row.id" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="模版类型" width="140" />
      <el-table-column prop="hostCount" label="目标主机" width="120" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="remark" label="备注" />
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!currentTemplate" @click="handleConfirm">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RefreshRight, Search } from '@element-plus/icons-vue'

interface TemplateParameter {
  id: number
  name: string
  variable: string
  type: 'text' | 'password' | 'select'
  required: boolean
  options?: Array<{ label: string; value: string }>
  hint?: string
  helper?: string
  defaultValue?: string
}

interface TemplateItem {
  id: number
  name: string
  type: string
  hostCount: number
  content: string
  remark?: string
  scriptLanguage: 'sh' | 'python'
  parameters?: TemplateParameter[]
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    templates: TemplateItem[]
    templateTypes?: string[]
    loading?: boolean
  }>(),
  {
    templates: () => [],
    templateTypes: () => [],
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', template: TemplateItem): void
  (e: 'refresh'): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const filters = reactive({
  type: '',
  keyword: ''
})

const currentId = ref<number | null>(null)

const filteredTemplates = computed(() =>
  props.templates.filter((tpl) => {
    const matchType = filters.type ? tpl.type === filters.type : true
    const matchKeyword = filters.keyword
      ? tpl.name.toLowerCase().includes(filters.keyword.toLowerCase())
      : true
    return matchType && matchKeyword
  })
)

const currentTemplate = computed(() => {
  return props.templates.find((tpl) => tpl.id === currentId.value) || null
})

const handleCurrentChange = (row: TemplateItem) => {
  currentId.value = row?.id ?? null
}

const handleConfirm = () => {
  if (currentTemplate.value) {
    emit('confirm', currentTemplate.value)
    dialogVisible.value = false
  }
}

const handleRefresh = () => {
  emit('refresh')
}

watch(
  () => props.visible,
  (val) => {
    if (!val) {
      filters.keyword = ''
      filters.type = ''
      currentId.value = null
    }
  }
)
</script>

<style scoped lang="less">
.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
