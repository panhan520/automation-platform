<template>
  <div v-if="visible" ref="panelRef" class="task-detail-panel">
    <!-- 顶部操作栏 -->
    <div class="panel-header">
      <div class="header-left">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="header-title">执行详情</span>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click.stop="handleClose" link> 关闭 </el-button>
        <el-button v-if="!isExpanded" link type="primary" size="small" @click.stop="handleExpand">
          展开
        </el-button>
        <el-button v-else link type="primary" size="small" @click.stop="handleCollapse">
          收起
        </el-button>
      </div>
    </div>

    <!-- 展开后的内容 -->
    <div v-if="isExpanded" class="panel-content" :class="{ expanded: isExpanded }">
      <el-collapse v-model="activeTaskId" accordion @change="handleTaskChange">
        <el-collapse-item v-for="task in taskList" :key="task.id" :name="task.id">
          <template #title>
            <div class="task-title">
              <span class="task-type">{{ task.taskName.slice(0, 2) }}详情</span>
              <span class="task-time">{{ task.executeTime }}</span>
              <span class="task-summary">
                ({{ task.detail.success }}成功, {{ task.detail.running }}进行中,
                {{ task.detail.failed }}失败)
              </span>
              <el-button size="small" @click.stop="handleCloseItem(task.id)"> 关闭 </el-button>
            </div>
          </template>

          <div class="task-detail">
            <el-table :data="detailList" border size="small" max-height="300">
              <el-table-column prop="innerIp" label="内网IP" align="center" />
              <el-table-column prop="publicIp" label="公网IP" align="center" />
              <el-table-column prop="appTypeName" label="应用类型" align="center" />
              <el-table-column prop="status" label="状态" align="center">
                <template #default="scope">
                  <div class="task-status" :class="scope.row.status"></div
                  ><div class="task-status-text">{{ getStatusType(scope.row.status) }}</div>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center">
                <template #default="scope">
                  <div class="task-actions">
                    <el-button
                      v-if="scope.row.status === 'failed'"
                      link
                      type="primary"
                      size="small"
                      @click="handleRetry(scope.row, task.taskType)"
                    >
                      {{ task.taskName }}
                    </el-button>
                    <el-button
                      v-if="task.taskType !== 'NODE_PROBE'"
                      link
                      type="primary"
                      size="small"
                      @click="handleViewLog(scope.row, task)"
                      class="log-button"
                    >
                      查看日志
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getExecTaskList,
  getExecTaskDetail,
  apiUpdateExecTask,
  apiNodeSingleProbe
} from '@/api/node'

export interface TaskDetailItem {
  innerIp: string
  publicIp: string
  appTypeName: string
  status: string
  [key: string]: any
}

export interface Task {
  id: string
  taskType: string
  taskName: string
  executeTime: string
  status: string
  detail: { [key: string]: any }
}

interface Props {
  visible: boolean
  tasks: Task[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
// 任务列表
const taskList = ref<Task[]>([])
// 任务详情列表
const detailList = ref<TaskDetailItem[]>([])
const router = useRouter()

const isExpanded = ref(false)
const activeTaskId = ref<string>('')
const taskListTimer = ref<ReturnType<typeof setInterval> | null>(null)
const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// 关闭单条任务详情
const handleCloseItem = async (taskId: string) => {
  await apiUpdateExecTask({ id: taskId, isClosed: true })
  const index = taskList.value.findIndex((task) => task.id === taskId)
  if (index !== -1) {
    taskList.value.splice(index, 1)
  }
}

// 获取任务列表
const getExecTaskListData = async () => {
  const res = await getExecTaskList()
  taskList.value = res.data.list
  // 判断list中是否有status为RUNNING的任务
  const hasRunningTask = res.data.list.some((item) => item.status === 'RUNNING')
  if (hasRunningTask) {
    startTaskList()
  } else {
    stopTaskList()
  }
}

// 任务列表开始轮询
const startTaskList = () => {
  stopTaskList()
  taskListTimer.value = setInterval(() => {
    getExecTaskListData()
  }, 3000)
}

// 任务列表停止轮询
const stopTaskList = () => {
  if (taskListTimer.value) {
    clearInterval(taskListTimer.value)
    taskListTimer.value = null
  }
}
// 打开/关闭任务详情
const handleTaskChange = async (taskId: string) => {
  // 有选中任务
  if (taskId) {
    await fetchTaskDetail(taskId)
  } else {
    // 收起时停止轮询
    stopPolling()
  }
}

// 获取任务详情列表
const fetchTaskDetail = async (taskId: string) => {
  try {
    const res = await getExecTaskDetail(taskId)
    detailList.value = res.data
    // 判断list中是否有status为RUNNING的任务
    const hasRunningTask = res.data.some((item) => item.status === 'RUNNING')
    if (hasRunningTask) {
      startPolling(taskId)
    } else {
      stopPolling()
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
  }
}

// 任务详情开始轮询
const startPolling = (taskId: string) => {
  stopPolling()
  pollingTimer.value = setInterval(() => {
    fetchTaskDetail(taskId)
  }, 3000)
}

// 任务详情停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// 展开面板
const handleExpand = () => {
  isExpanded.value = true
  getExecTaskListData()
}

// 收缩面板
const handleCollapse = () => {
  stopTaskList()
  stopPolling()
  isExpanded.value = false
  activeTaskId.value = ''
}

// 关闭悬浮框
const handleClose = () => {
  stopTaskList()
  stopPolling()
  emit('close')
}

// 全局点击事件
const handleGlobalClick = (event: MouseEvent) => {
  if (!visible.value || !panelRef.value) return
  if (panelRef.value.contains(event.target as Node)) return
  if (isExpanded.value) {
    handleCollapse()
  }
}

// 任务状态转译
const getStatusType = (status: string) => {
  const map = {
    success: '成功',
    running: '进行中',
    failed: '失败'
  }
  return map[status] || 'running'
}

// 重试操作
const handleRetry = (row: TaskDetailItem, type: string) => {
  // 触发重试操作
  console.log('重试操作:', row, type)
  switch (type) {
    case 'NODE_PROBE':
      handleNodeSingleProbe(row)
      break
    default:
      break
  }
}

// 连通测试
const handleNodeSingleProbe = async (row) => {
  try {
    await apiNodeSingleProbe({ ...row })
    ElMessage.success('连通测试成功')
  } catch (error) {
    ElMessage.closeAll()
    setTimeout(() => {
      ElMessage.error('连通测试失败')
    }, 10)
  }
}
// 查看日志
const handleViewLog = (row: TaskDetailItem, task: Task) => {
  router.push({
    name: 'NodeExecutionHistoryDetail',
    params: { taskId: task.id },
    query: {
      hostId: row.hostId || '',
      innerIp: row.innerIp
    }
  })
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  stopTaskList()
  stopPolling()
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<style lang="less" scoped>
.task-detail-panel {
  position: fixed;
  top: 15px;
  right: 20px;
  width: 260px;
  z-index: 2000;
  transition: all 0.3s ease;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
    background: linear-gradient(135deg, #007dff 0%, #7a5fff 100%);
    border-radius: 30px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;

      .info-icon {
        font-size: 18px;
      }

      .header-title {
        font-size: 13px;
        font-weight: 500;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
    .el-button--primary.is-link,
    .el-button--primary.is-plain,
    .el-button--primary.is-text {
      color: #fff;
    }
  }

  .panel-content {
    width: 600px;
    max-height: 405px;
    overflow-y: auto;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    float: right;
    text-align: left;

    :deep(.el-collapse) {
      border: none;

      .el-collapse-item {
        margin-bottom: 5px;
        border: 1px solid #e4e7ed;
        border-radius: 4px;

        .el-collapse-item__header {
          padding: 0 10px;
          background: #f5f7fa;
          border-radius: 4px 4px 0 0;

          .task-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;

            .task-type {
              font-weight: 500;
              color: #303133;
            }

            .task-time {
              color: #909399;
            }

            .task-summary {
              color: #606266;
            }
            .el-button {
              border-radius: 30px;
            }
          }
        }

        .el-collapse-item__content {
          padding: 0;
        }
      }
    }
    .task-status {
      width: 8px;
      height: 8px;
      display: inline-block;
      border-radius: 50%;
      margin-right: 5px;
    }
    .task-status-text {
      width: 40px;
      text-align: left;
      display: inline-block;
    }
    .success {
      background: #67c23a;
    }
    .failed {
      background: #f56c6c;
    }
    .running {
      background: #e6a23c;
    }
    .task-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #ebeef5;

      .task-item-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }
    .task-actions {
      .log-button {
        color: #333;
      }
    }
  }
}
</style>
