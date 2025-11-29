<template>
  <el-dialog v-model="dialogVisible" title="选择执行模版" width="800px">
    <div class="filter-row">
      <el-select
        v-model="queryParams.type"
        placeholder="请选择模版类型"
        clearable
        style="width: 220px"
      >
        <el-option v-for="type in templateTypeList" :key="type" :label="type" :value="type" />
      </el-select>
      <el-input
        v-model="queryParams.query"
        placeholder="搜索模版名称"
        clearable
        :prefix-icon="Search"
        style="width: 240px"
      />
      <el-button :icon="RefreshRight" circle @click="handleRefresh" />
    </div>

    <el-table
      v-loading="loading"
      :data="allTemplates"
      highlight-current-row
      @current-change="handleCurrentChange"
      height="360px"
    >
      <el-table-column width="60" align="center">
        <template #default="{ row }">
          <el-radio v-model="currentId" :label="row.id">
            <span style="display: none">{{ row.id }}</span>
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="模版类型" />
      <el-table-column prop="host_id_ip_map" label="目标主机">
        <template #default="{ row }"> {{ row.host_id_ip_map?.length || 0 }}台 </template>
      </el-table-column>
      <el-table-column prop="body" label="内容" />
      <el-table-column prop="desc" label="备注" />
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
      />
    </div>

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
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { apiGetTemplatesList, apiGetTemplatesType } from '@/api/template'
import type { TemplateRecord } from '@/api/template/type'
import { debounce } from 'lodash-es'

const props = withDefaults(
  defineProps<{
    visible: boolean
    selectedTemplate?: TemplateRecord | null
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', template: TemplateRecord): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
const loading = ref(false)
const allTemplates = ref<TemplateRecord[]>([])
const templateTypeList = ref<string[]>([])
const totalRecords = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  query: '',
  type: ''
})

const currentId = ref<number | string>('')

// 获取模版列表
const getList = async () => {
  try {
    loading.value = true
    const res = await apiGetTemplatesList(queryParams)
    allTemplates.value = res.data.list
    totalRecords.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}
// 获取模版类型列表
const getTemplateTypeList = async () => {
  const res = await apiGetTemplatesType()
  templateTypeList.value = res.data.list
}
// 切换分页
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
  getList()
}

watch(
  () => [queryParams.query, queryParams.type],
  ([query, type]) => {
    queryParams.query = query
    queryParams.type = type
    debouncedSearch()
  }
)
// 防抖搜索函数
const debouncedSearch = debounce(() => {
  queryParams.page = 1
  getList()
}, 300)

const currentTemplate = computed(() => {
  return allTemplates.value.find((tpl) => tpl.id === currentId.value) || null
})

const handleCurrentChange = (row: TemplateRecord) => {
  currentId.value = row?.id ?? null
}

const handleConfirm = () => {
  if (currentTemplate.value) {
    emit('confirm', currentTemplate.value)
    dialogVisible.value = false
  }
}
// 刷新
const handleRefresh = () => {
  getList()
}

watch(
  () => props.visible,
  (val) => {
    if (!val) {
      queryParams.query = ''
      queryParams.type = ''
      currentId.value = ''
    } else if (props.selectedTemplate) {
      currentId.value = props.selectedTemplate.id
    }
  }
)

onMounted(() => {
  getList()
  getTemplateTypeList()
})
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
.host-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 12px 0 20px;
  font-size: 12px;
  color: #909399;
}
</style>
