<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { ConfigGlobal } from '@/components/ConfigGlobal'
import { useDesign } from '@/hooks/web/useDesign'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { useTaskPanelStore } from '@/store/modules/taskPanel'
import { getExecTaskList } from '@/api/node'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('app')

const appStore = useAppStore()
const taskPanelStore = useTaskPanelStore()

const currentSize = computed(() => appStore.getCurrentSize)

const greyMode = computed(() => appStore.getGreyMode)

const taskPanelVisible = computed({
  get: () => taskPanelStore.getVisible,
  set: (val) => taskPanelStore.setVisible(val)
})

const taskList = computed(() => taskPanelStore.getTasks)
const pulseSignal = computed(() => taskPanelStore.getPulseSignal)

// 检查并初始化任务面板显示状态
const initTaskPanelVisibility = async () => {
  const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'
  // const cached = localStorage.getItem(CACHE_KEY_IS_SHOW_DETAIL)
  // if (cached !== null) {
  //   // 有缓存，直接使用
  //   taskPanelVisible.value = cached === 'true'
  // } else {
  // 没有缓存，查询当天任务
  try {
    const response = await getExecTaskList()
    const hasTasks = response.data && response.data.list.length > 0
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, hasTasks ? 'true' : 'false')
    taskPanelVisible.value = hasTasks
  } catch (error) {
    console.error('查询任务列表失败:', error)
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'false')
    taskPanelVisible.value = false
  }
  // }
}

// 关闭任务面板
const handleTaskPanelClose = () => {
  const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'
  taskPanelVisible.value = false
  localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'false')
}

appStore.initTheme()

onMounted(() => {
  initTaskPanelVisibility()
})
</script>

<template>
  <ConfigGlobal :size="currentSize">
    <RouterView :class="greyMode ? `${prefixCls}-grey-mode` : ''" />
    <!-- 全局任务详情悬浮框 -->
    <TaskDetailPanel
      v-model:visible="taskPanelVisible"
      :tasks="taskList"
      :pulse-signal="pulseSignal"
      @close="handleTaskPanelClose"
    />
  </ConfigGlobal>
</template>

<style lang="less">
@prefix-cls: ~'@{adminNamespace}-app';

.size {
  width: 100%;
  height: 100%;
}

html,
body {
  padding: 0 !important;
  margin: 0;
  overflow: hidden;
  .size;

  #app {
    .size;
  }
}

.@{prefix-cls}-grey-mode {
  filter: grayscale(100%);
}
</style>
