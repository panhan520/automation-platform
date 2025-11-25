<template>
  <ContentWrap>
    <div class="quick-execution">
      <div class="page-title">快速执行</div>
      <div class="host-card">
        <div class="card-header">
          <div class="title">
            <span class="required">*</span>
            目标主机
          </div>
          <el-button type="primary" @click="openHostSelector">添加目标主机</el-button>
        </div>
        <div v-if="selectedHosts.length" class="selected-wrapper">
          <div class="selected-meta">
            <span>已选择 {{ selectedHosts.length }} 台主机</span>
            <el-button link type="primary" @click="clearSelectedHosts">清空</el-button>
          </div>
          <el-table :data="selectedHosts" border size="small" max-height="220">
            <el-table-column prop="hostId" label="主机ID" />
            <el-table-column prop="innerIp" label="内网IP" />
            <el-table-column prop="publicIp" label="公网IP" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="removeSelectedHost(row.hostId)"
                  >移除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="command-card">
        <div class="card-header">
          <div class="left-wrapper">
            <div class="title">
              <span class="required">*</span>
              执行命令
            </div>
            <el-segmented v-model="form.scriptLanguage" :options="scriptLanguageOptions" />
          </div>
          <div class="command-actions">
            <el-button type="primary" @click="openTemplateDialog">选择执行模版</el-button>
          </div>
        </div>

        <div v-if="selectedTemplate" class="template-info">
          <div>
            当前模版：<span class="template-name">{{ selectedTemplate.name }}</span>
            <el-tag size="small" type="info">{{ selectedTemplate.type }}</el-tag>
          </div>
          <el-button link type="primary" @click="clearSelectedTemplate">清除</el-button>
        </div>

        <CodeEditor v-model="form.command" v-model:language="form.scriptLanguage" :rows="14" />
      </div>
      <div class="actions">
        <el-button type="primary" :loading="executing" @click="handleExecute">
          <el-icon class="btn-icon"><Odometer /></el-icon>
          开始执行
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <HostSelectorDialog
    v-model:visible="hostSelectorVisible"
    v-model="selectedHosts"
    :hosts="availableHosts"
  />

  <TemplateSelectDialog
    v-model:visible="templateDialogVisible"
    :templates="templateList"
    :template-types="templateTypes"
    :loading="templateLoading"
    @confirm="handleTemplateSelected"
    @refresh="loadTemplates"
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
import { Odometer } from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import { HostSelectorDialog } from '@/components/HostSelectorDialog'
import { TemplateSelectDialog } from '@/components/TemplateSelectDialog'
import { ParameterFormDialog } from '@/components/ParameterFormDialog'
import { CodeEditor } from '@/components/CodeEditor'

interface TemplateParameterOption {
  label: string
  value: string
}

interface TemplateParameter {
  id: number
  name: string
  variable: string
  type: 'text' | 'password' | 'select'
  required?: boolean
  options?: TemplateParameterOption[]
  hint?: string
  defaultValue?: string
}

interface HostItem {
  hostId: string
  hostName: string
  innerIp: string
  publicIp: string
}

interface TemplateItem {
  id: number
  name: string
  type: string
  hostCount: number
  content: string
  remark?: string
  scriptLanguage: 'Shell' | 'Python'
  parameters?: TemplateParameter[]
}

const scriptLanguageOptions = [
  { label: 'Shell', value: 'Shell' },
  { label: 'Python', value: 'Python' }
]

const form = reactive({
  scriptLanguage: 'Shell' as 'Shell' | 'Python',
  command: ''
})

const executing = ref(false)
const availableHosts = ref<HostItem[]>([
  { hostId: '1', hostName: '节点-01', publicIp: '192.21.0.11', innerIp: '172.21.0.12' },
  { hostId: '2', hostName: '节点-02', publicIp: '121.199.4.33', innerIp: '172.21.0.10' },
  { hostId: '3', hostName: '节点-03', publicIp: '10.0.0.3', innerIp: '172.21.0.3' },
  { hostId: '4', hostName: '节点-04', publicIp: '10.0.0.4', innerIp: '172.21.0.4' }
])
const selectedHosts = ref<HostItem[]>([])
const hostSelectorVisible = ref(false)

const templateDialogVisible = ref(false)
const templateLoading = ref(false)
const templateTypes = ref(['系统信息', '巡检脚本', '运维操作'])
const templateList = ref<TemplateItem[]>([])
const selectedTemplate = ref<TemplateItem | null>(null)
const parameterDialogVisible = ref(false)

const loadTemplates = () => {
  templateLoading.value = true
  setTimeout(() => {
    templateList.value = [
      {
        id: 1,
        name: '获取内存使用情况',
        type: '系统信息',
        hostCount: 0,
        content: 'free -m',
        remark: '查看当前主机内存',
        scriptLanguage: 'Shell',
        parameters: [
          {
            id: 101,
            name: '参数名1',
            variable: 'param_one',
            type: 'text',
            defaultValue: '测试1'
          }
        ]
      },
      {
        id: 2,
        name: '磁盘检查',
        type: '系统信息',
        hostCount: 2,
        content: 'df -h',
        remark: '磁盘巡检',
        scriptLanguage: 'Shell',
        parameters: [
          {
            id: 102,
            name: '参数名3',
            variable: 'secure_token',
            type: 'password',
            required: true
          },
          {
            id: 103,
            name: '参数名4',
            variable: 'env_type',
            type: 'select',
            required: true,
            options: [
              { label: '测试环境', value: 'test' },
              { label: '生产环境', value: 'prod' }
            ]
          }
        ]
      },
      {
        id: 3,
        name: 'Python测试',
        type: '运维脚本',
        hostCount: 1,
        content: "print('hello world')",
        remark: 'Python示例',
        scriptLanguage: 'Python'
      }
    ]
    templateLoading.value = false
  }, 300)
}

const openHostSelector = () => {
  hostSelectorVisible.value = true
}

const clearSelectedHosts = () => {
  selectedHosts.value = []
}

const removeSelectedHost = (hostId: string) => {
  selectedHosts.value = selectedHosts.value.filter((host) => host.hostId !== hostId)
}

const openTemplateDialog = () => {
  if (!templateList.value.length) {
    loadTemplates()
  }
  templateDialogVisible.value = true
}

const clearSelectedTemplate = () => {
  selectedTemplate.value = null
}

const handleTemplateSelected = (template: TemplateItem) => {
  selectedTemplate.value = template
  form.scriptLanguage = template.scriptLanguage
  form.command = template.content
}

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

const submitExecution = (params: Record<string, any>) => {
  executing.value = true
  setTimeout(() => {
    executing.value = false
    ElMessage.success('执行任务已提交')
    console.log('执行参数', params)
  }, 600)
}
</script>

<style scoped lang="less">
.quick-execution {
  display: flex;
  flex-direction: column;
  gap: 20px;
  .page-title {
    font-size: 18px;
    line-height: 26px;
    color: #0c0d0e;
    margin-bottom: 20px;
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
  .selected-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
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
