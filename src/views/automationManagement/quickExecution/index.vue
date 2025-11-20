<template>
  <ContentWrap>
    <div class="quick-execution-page">
      <div class="section">
        <div class="field-label">
          <span class="required">*</span>
          目标主机
        </div>
        <div class="host-actions">
          <el-button type="primary" link @click="openHostSelector">添加目标主机</el-button>
          <span v-if="selectedHosts.length" class="selected-count">
            已选择 {{ selectedHosts.length }} 台
          </span>
        </div>
        <div v-if="selectedHosts.length" class="selected-hosts">
          <el-tag
            v-for="host in selectedHosts"
            :key="host.hostId"
            closable
            @close="removeSelectedHost(host.hostId)"
          >
            [{{ host.hostId }}] {{ host.internalIp }}
          </el-tag>
        </div>
      </div>

      <div class="section">
        <div class="field-label">
          <span class="required">*</span>
          执行命令
        </div>
        <div class="command-toolbar">
          <el-button type="primary" text @click="openTemplateDialog">选择执行模版</el-button>
        </div>
        <CodeEditor
          v-model="form.command"
          v-model:language="form.scriptLanguage"
          :language-options="scriptLanguageOptions"
          placeholder="请输入需要执行的脚本内容"
          :rows="12"
        />
      </div>

      <div class="actions">
        <el-button type="primary" :loading="executing" @click="handleExecute">
          <el-icon class="btn-icon"><Lightning /></el-icon>
          开始执行
        </el-button>
        <el-button @click="handleReset">重置</el-button>
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
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Lightning } from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import { HostSelectorDialog } from '@/components/HostSelectorDialog'
import { TemplateSelectDialog } from '@/components/TemplateSelectDialog'
import { CodeEditor } from '@/components/CodeEditor'

interface HostItem {
  hostId: string
  hostName: string
  internalIp: string
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
}

const scriptLanguageOptions = [
  { label: 'Shell', value: 'Shell' },
  { label: 'Python', value: 'Python' }
]

const form = reactive({
  scriptLanguage: 'Shell',
  command: ''
})

const executing = ref(false)
const availableHosts = ref<HostItem[]>([
  { hostId: '1', hostName: '节点-01', publicIp: '192.21.0.11', internalIp: '172.21.0.12' },
  { hostId: '2', hostName: '节点-02', publicIp: '121.199.4.33', internalIp: '172.21.0.10' },
  { hostId: '3', hostName: '节点-03', publicIp: '10.0.0.3', internalIp: '172.21.0.3' }
])
const selectedHosts = ref<HostItem[]>([])
const hostSelectorVisible = ref(false)

const templateDialogVisible = ref(false)
const templateLoading = ref(false)
const templateTypes = ref(['系统信息', '巡检脚本', '运维操作'])
const templateList = ref<TemplateItem[]>([])
const selectedTemplate = ref<TemplateItem | null>(null)

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
        remark: 'free -m',
        scriptLanguage: 'Shell'
      },
      {
        id: 2,
        name: '磁盘检查',
        type: '系统信息',
        hostCount: 2,
        content: 'df -h',
        remark: '查看磁盘',
        scriptLanguage: 'Shell'
      },
      {
        id: 3,
        name: 'Python测试',
        type: '运维操作',
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

const removeSelectedHost = (hostId: string) => {
  selectedHosts.value = selectedHosts.value.filter((host) => host.hostId !== hostId)
}

const openTemplateDialog = () => {
  if (!templateList.value.length) {
    loadTemplates()
  }
  templateDialogVisible.value = true
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
    ElMessage.warning('请输入需要执行的命令')
    return
  }
  executing.value = true
  setTimeout(() => {
    executing.value = false
    ElMessage.success('执行任务已提交')
  }, 600)
}

const handleReset = () => {
  form.command = ''
  form.scriptLanguage = 'Shell'
  selectedHosts.value = []
  selectedTemplate.value = null
}
</script>

<style scoped lang="less">
.quick-execution-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(31, 35, 41, 0.04);
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 12px;

  .required {
    color: #f56c6c;
    margin-right: 4px;
  }
}

.host-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.selected-count {
  color: #909399;
}

.selected-hosts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.command-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
}

.actions {
  display: flex;
  gap: 16px;
}

.btn-icon {
  margin-right: 4px;
}
</style>
