<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    :show-close="true"
  >
    <template #header>
      <div class="icon-wrapper">
        <el-icon :size="26" color="#32c388"><SuccessFilled /></el-icon><span>{{ title }}</span>
      </div>
    </template>
    <div class="operation-confirm-dialog">
      <div class="content">
        <p v-html="formattedContent"></p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SuccessFilled } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  operation: string
  isBatch: boolean
  hostnames?: string[]
  hostCount?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isBatch: false,
  hostnames: () => [],
  hostCount: 0,
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const operationMap = computed(() => ({
  install: {
    title: props.isBatch ? '批量安装' : '安装Agent',
    text: props.isBatch
      ? '将在【主机名称/IP】等【主机数量】台主机上安装 Agent, 用于启用主机监控、数据采集及自动化管控功能, 请保持网络畅通'
      : '将在【主机名称/IP】安装 Agent, 用于启用主机监控、数据采集及自动化管控功能, 请保持网络畅通',
    buttonText: '确定'
  },
  upgrade: {
    title: props.isBatch ? '批量升级' : '升级Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的 Agent 从版本[当前版本]升级至[目标版本]。升级过程中监控数据采集会短暂中断，升级完成后自动恢复，不影响本地配置与已下发插件。建议先在测试环境验证目标版本兼容性，再对生产环境 Agent 执行升级。'
      : '将对【主机名称/IP】主机的 Agent 从版本[当前版本]升级至[目标版本]。升级过程中监控数据采集会短暂中断，升级完成后自动恢复，不影响本地配置与已下发插件。建议先在测试环境验证目标版本兼容性，再对生产环境 Agent 执行升级。',
    buttonText: '升级'
  },
  online: {
    title: props.isBatch ? '批量上线' : '上线Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的Agent 执行上线操作。上线后，系统将开始对该主机进行基础监控、数据采集，并允许执行自动化任务与下发插件，期间主机网络需保持通畅。'
      : '将对【主机名称/IP】主机的 Agent 执行上线操作。上线后，系统将开始对该主机进行基础监控、数据采集，并允许执行自动化任务与下发插件，期间主机网络需保持通畅。',
    buttonText: '上线'
  },
  offline: {
    title: props.isBatch ? '批量下线' : '下线Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的 Agent 执行下线操作。下线后，该主机将停止所有监控数据上报，无法接收自动化任务与插件，已运行的本地任务可能中断。'
      : '将对【主机名称/IP】主机的 Agent 执行下线操作。下线后，该主机将停止所有监控数据上报，无法接收自动化任务与插件，已运行的本地任务可能中断。',
    buttonText: '下线'
  },
  restart: {
    title: props.isBatch ? '批量重启' : '重启Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的 Agent 执行重启操作。重启过程中监控数据采集会中断，重启完成后将自动恢复正常管控。若主机上有正在执行的自动化任务，可能会被强制终止，请确认任务状态后操作。'
      : '将对【主机名称/IP】主机的 Agent 执行重启操作。重启过程中监控数据采集会中断，重启完成后将自动恢复正常管控。若主机上有正在执行的自动化任务，可能会被强制终止，请确认任务状态后操作。',
    buttonText: '重启'
  },
  reinstall: {
    title: props.isBatch ? '批量重装' : '重装Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的 Agent 执行重装操作。重装会先卸载当前 Agent，再重新安装最新版本，期间所有监控、任务将中断。操作会清除 Agent 本地配置（如自定义插件路径），需提前备份关键配置文件。'
      : '将对【主机名称/IP】主机的 Agent 执行重装操作。重装会先卸载当前 Agent，再重新安装最新版本，期间所有监控、任务将中断。操作会清除 Agent 本地配置（如自定义插件路径），需提前备份关键配置文件。',
    buttonText: '重装'
  },
  uninstall: {
    title: props.isBatch ? '批量卸载' : '卸载Agent',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机的 Agent 执行卸载操作。期间所有监控、任务将中断。操作会清除 Agent 本地配置（如自定义插件路径），需提前备份关键配置文件。'
      : '将对【主机名称/IP】主机的 Agent 执行卸载操作。期间所有监控、任务将中断。操作会清除 Agent 本地配置（如自定义插件路径），需提前备份关键配置文件。',
    buttonText: '卸载'
  },
  test: {
    title: props.isBatch ? '批量连通测试' : '连通测试',
    text: props.isBatch
      ? '将对【主机名称/IP】等【主机数量】台主机执行连通测试。'
      : '将对【主机名称/IP】主机执行连通测试。',
    buttonText: '测试'
  }
}))

const title = computed(() => {
  return operationMap.value[props.operation]?.title || '操作确认'
})

const confirmButtonText = computed(() => {
  return operationMap.value[props.operation]?.buttonText || '确定'
})

const formattedContent = computed(() => {
  let text = operationMap.value[props.operation]?.text || ''
  console.log('text:', text)
  console.log(props.isBatch)
  if (props.isBatch) {
    const hostnameText = props.hostnames.length > 0 ? props.hostnames[0] : '主机'
    text = text.replace('【主机名称/IP】', `<strong>【${hostnameText}】</strong>`)
    text = text.replace(
      '【主机数量】',
      `<strong>【${props.hostCount || props.hostnames.length}】</strong>`
    )
    console.log('text:', text)
  } else {
    const hostnameText = props.hostnames.length > 0 ? props.hostnames[0] : '主机'
    text = text.replace('【主机名称/IP】', `<strong>【${hostnameText}】</strong>`)
  }
  return text
})

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style lang="less" scoped>
.icon-wrapper {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  span {
    font-size: 18px;
    margin-left: 8px;
    color: #333;
  }
}
.operation-confirm-dialog {
  display: flex;
  flex-direction: column;
  padding: 10px 0 20px;
  text-align: left;

  .content {
    color: #606266;
    font-size: 14px;
    line-height: 1.6;

    :deep(strong) {
      color: #303133;
      font-weight: 500;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
