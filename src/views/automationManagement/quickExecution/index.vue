<template>
  <ContentWrap>
    <div class="quick-execution">
      <div class="page-title">快速执行</div>
      <!-- 目标主机 -->
      <div class="host-card">
        <div class="card-header">
          <div class="title">
            <span class="required">*</span>
            目标主机
          </div>
          <el-button type="primary" @click="openHostSelector">添加目标主机</el-button>
        </div>
        <div v-if="selectedHosts.length" class="selected-wrapper">
          <el-collapse expand-icon-position="left" model-value="1">
            <el-collapse-item name="1" :icon="CaretRight">
              <template #title>
                <div class="selected-meta">
                  <span
                    >已选择<span class="selected-count">{{ selectedHosts.length }}</span
                    >台主机</span
                  >
                </div>
              </template>
              <el-table :data="selectedHosts" border size="small" max-height="220">
                <el-table-column prop="id" label="主机ID" />
                <el-table-column prop="innerIp" label="内网IP" />
                <el-table-column prop="publicIp" label="公网IP" />
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button type="primary" link @click="removeSelectedHost(row.id)"
                      >移除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      <!-- 执行命令 -->
      <div class="command-card">
        <div class="card-header">
          <div class="left-wrapper">
            <div class="title">
              <span class="required">*</span>
              执行命令
            </div>
            <el-segmented v-model="form.interpreter" :options="interpreterOptions" />
          </div>
          <div class="command-actions">
            <el-button type="primary" @click="openTemplateDialog">选择执行模版</el-button>
          </div>
        </div>
        <CodeEditor v-model="form.command" v-model:language="form.interpreter" :rows="14" />
      </div>
      <div class="actions">
        <el-button type="primary" :loading="executing" @click="handleExecute">
          <el-icon class="btn-icon"><Odometer /></el-icon>
          开始执行
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <HostSelectorDialog v-model:visible="hostSelectorVisible" v-model="selectedHosts" />

  <TemplateSelectDialog
    v-model:visible="templateDialogVisible"
    :selectedTemplate="selectedTemplate"
    @confirm="handleTemplateSelected"
  />

  <ParameterFormDialog
    v-model:visible="parameterDialogVisible"
    :parameters="selectedTemplate?.parameters || []"
    title="执行任务"
    confirm-text="立即执行"
    @confirm="handleParameterConfirm"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Odometer, CaretRight } from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import { HostSelectorDialog } from '@/components/HostSelectorDialog'
import { TemplateSelectDialog } from '@/components/TemplateSelectDialog'
import { ParameterFormDialog } from '@/components/ParameterFormDialog'
import { CodeEditor } from '@/components/CodeEditor'
import { TemplateRecord, HostItem } from '@/api/template/type'
import { apiCreateExecDo } from '@/api/quickExecution'
import { useTaskPanelStore } from '@/store/modules/taskPanel'
// 缓存 key
const CACHE_KEY_IS_SHOW_DETAIL = 'nodeManagement_isShowDetail'
// 任务面板store
const taskPanelStore = useTaskPanelStore()
const interpreterOptions = [
  { label: 'Shell', value: 'sh' },
  { label: 'Python', value: 'python' }
]

const form = reactive({
  interpreter: 'sh' as 'sh' | 'python',
  command: ''
})

const executing = ref(false)
const selectedHosts = ref<HostItem[]>([])
const hostSelectorVisible = ref(false)

const templateDialogVisible = ref(false)
const selectedTemplate = ref<TemplateRecord | null>(null)
const parameterDialogVisible = ref(false)

const openHostSelector = () => {
  hostSelectorVisible.value = true
}

const removeSelectedHost = (id) => {
  selectedHosts.value = selectedHosts.value.filter((host) => host.id !== id)
}

const openTemplateDialog = () => {
  templateDialogVisible.value = true
}

const handleTemplateSelected = (template) => {
  selectedTemplate.value = template
  form.interpreter = template.interpreter
  form.command = template.body
}
// 开始执行
const handleExecute = () => {
  if (!selectedHosts.value.length) {
    ElMessage.warning('请先选择目标主机')
    return
  }
  if (!form.command.trim()) {
    ElMessage.warning('请输入需要执行的脚本内容')
    return
  }
  if (selectedTemplate.value?.parameters?.length) {
    parameterDialogVisible.value = true
    return
  }
  submitExecution({})
}

const handleParameterConfirm = (values: Record<string, any>) => {
  parameterDialogVisible.value = false
  submitExecution(values)
}

const submitExecution = async (params: Record<string, any>) => {
  try {
    executing.value = true
    await apiCreateExecDo({
      ...params,
      ...form,
      host_ids: selectedHosts.value.map((host) => host.id),
      template_id: selectedTemplate.value?.id
    })
    ElMessage.success('执行任务已提交')
    // 设置缓存为 true，显示任务面板
    localStorage.setItem(CACHE_KEY_IS_SHOW_DETAIL, 'true')
    taskPanelStore.setVisible(true)
    taskPanelStore.triggerPulse()
  } finally {
    executing.value = false
  }
}
</script>

<style scoped lang="less">
.el-collapse {
  border: solid 1px #ebeef5;
  padding: 0 15px;
  border-radius: 8px;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 20px !important;
}
:deep(.el-table--small) {
  margin: 0;
}

.quick-execution {
  display: flex;
  flex-direction: column;
  gap: 20px;
  .page-title {
    font-size: 18px;
    line-height: 26px;
    color: #0c0d0e;
    margin-bottom: 10px;
    text-align: left;
  }
}

.card-header {
  display: flex;
  align-items: center;

  .title {
    font-size: 14px;
    color: #1f2329;
    margin-right: 20px;
    display: inline-block;

    .required {
      color: #f56c6c;
      margin-right: 4px;
    }
  }
}
.left-wrapper {
  margin-bottom: 20px;
}
.command-card {
  .card-header {
    display: flex;
    justify-content: space-between;
  }
}

.command-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-wrapper {
  margin: 12px 0 0;
  .selected-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .selected-count {
      color: #1664ff;
      margin: 0 5px;
    }
  }
}

.template-info {
  background: #f5f7ff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  .template-name {
    font-weight: 600;
    margin-right: 8px;
  }
}

.actions {
  display: flex;
  gap: 16px;
}

.btn-icon {
  margin-right: 4px;
}
</style>
