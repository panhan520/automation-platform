<template>
  <div v-if="visible" class="task-detail-panel">
    <!-- 顶部操作栏 -->
    <div class="panel-header">
      <div class="header-left">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="header-title">执行详情</span>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="handleClose" link> 关闭 </el-button>
        <el-button v-if="!isExpanded" text type="primary" size="small" @click="handleExpand" link>
          展开
        </el-button>
        <el-button v-else type="primary" size="small" @click="handleCollapse" link>
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
              <span class="task-type">{{ task.type }}详情</span>
              <span class="task-time">{{ task.time }}</span>
              <span class="task-summary">
                ({{ task.successCount }}成功, {{ task.progressCount }}进行中,
                {{ task.failedCount }}失败)
              </span>
              <el-button size="small"> 关闭 </el-button>
            </div>
          </template>

          <div class="task-detail">
            <el-table :data="task.details" border size="small" max-height="300">
              <el-table-column prop="internalIp" label="内网IP" align="center" />
              <el-table-column prop="publicIp" label="公网IP" align="center" />
              <el-table-column prop="applicationType" label="应用类型" align="center" />
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
                      @click="handleRetry(scope.row, task.type)"
                    >
                      {{ task.type }}
                    </el-button>
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click="handleViewLog(scope.row)"
                      class="log-button"
                    >
                      查看日志
                    </el-button></div
                  >
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { getTaskList, getTaskDetail } from '@/api/node'

export interface TaskDetailItem {
  internalIp: string
  publicIp: string
  applicationType: string
  status: '成功' | '进行中' | '失败'
  [key: string]: any
}

export interface Task {
  id: string
  type: string
  time: string
  successCount: number
  progressCount: number
  failedCount: number
  details?: []
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
const taskList = ref<Task[]>([])

const isExpanded = ref(false)
const activeTaskId = ref<string>('')
const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)
// 获取任务列表
const getTaskListData = async () => {
  try {
    const response = await getTaskList()
    if (response.data.list && Array.isArray(response.data.list)) {
      const getOperationName = (type: string): string => {
        const map: Record<string, string> = {
          install: '安装',
          upgrade: '升级',
          online: '上线',
          offline: '下线',
          restart: '重启',
          reinstall: '重装',
          uninstall: '卸载'
        }
        return map[type] || '任务'
      }

      const tasks = response.data.list.map((task: any) => ({
        id: task.id,
        type: getOperationName(task.type),
        time: task.time,
        successCount: task.successCount || 0,
        progressCount: task.progressCount || 0,
        failedCount: task.failedCount || 0
      }))
      taskList.value = tasks
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
  }
}
// 展开面板
const handleExpand = () => {
  isExpanded.value = true
  getTaskListData()
}
// 收缩面板
const handleCollapse = () => {
  stopPolling()
  isExpanded.value = false
  activeTaskId.value = ''
}
// 关闭悬浮框
const handleClose = () => {
  stopPolling()
  emit('close')
}
// 打开/关闭任务详情
const handleTaskChange = async (taskId: string) => {
  console.log('handleTaskChange', taskId)
  // 有选中任务
  if (taskId) {
    await fetchTaskDetail(taskId)
    startPolling(taskId)
  } else {
    // 收起时停止轮询
    stopPolling()
  }
}

const fetchTaskDetail = async (taskId: string) => {
  try {
    const response = await getTaskDetail(taskId)
    // 更新对应任务的详情
    const task = taskList.value.find((t) => t.id === taskId)
    if (task && response.data) {
      task.details = response.data.details || []
      task.successCount = response.data.successCount || 0
      task.progressCount = response.data.progressCount || 0
      task.failedCount = response.data.failedCount || 0
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
  }
}

// 开始轮询
const startPolling = (taskId: string) => {
  stopPolling()

  pollingTimer.value = setInterval(() => {
    fetchTaskDetail(taskId)
  }, 3000)
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const getStatusType = (status: string) => {
  const map = {
    success: '成功',
    pending: '进行中',
    failed: '失败'
  }
  return map[status] || 'pending'
}

const handleRetry = (row: TaskDetailItem, operation: string) => {
  // 触发重试操作
  console.log('重试操作:', row, operation)
}

const handleViewLog = (row: TaskDetailItem) => {
  // 查看日志
  console.log('查看日志:', row)
}

onUnmounted(() => {
  stopPolling()
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
    .pending {
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
      display: flex;
      justify-content: flex-end;
      .log-button {
        color: #333;
      }
    }
  }
}
</style>
