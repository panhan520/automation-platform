<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="localPageSize"
    :page-sizes="pageSizes"
    :layout="layout"
    :total="Number(total)"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// 定义组件接收的 props
const props = withDefaults(
  defineProps<{
    modelValue: number
    pageSize: number
    pageSizes?: number[]
    layout?: string
    total?: number | string
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    total: 0
  }
)

// 触发事件定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', currentPage: number, pageSize: number): void
}>()

// 计算属性绑定当前页码
const currentPage = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

// 使用 ref 创建本地 pageSize 状态
const localPageSize = ref(props.pageSize)

// 监听 props.pageSize 变化以同步 localPageSize
watch(
  () => props.pageSize,
  (newVal) => {
    localPageSize.value = newVal
  }
)

// 处理每页数量变化
const handleSizeChange = (size: number) => {
  localPageSize.value = size
  emit('update:pageSize', size)
  emit('change', currentPage.value, size)
}

// 处理当前页码变化
const handleCurrentChange = (current: number) => {
  emit('change', current, localPageSize.value)
}
</script>
