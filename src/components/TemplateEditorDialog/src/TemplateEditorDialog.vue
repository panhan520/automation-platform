<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="mode === 'template' ? '720px' : '680px'"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item v-if="mode === 'template'" label="模版类型" prop="templateType">
        <el-select v-model="form.templateType" placeholder="请选择模版类型" style="width: 100%">
          <el-option v-for="type in localTemplateTypes" :key="type" :label="type" :value="type" />
        </el-select>
        <el-link type="primary" class="inline-link" @click="openTypeDialog">添加类型</el-link>
      </el-form-item>

      <el-form-item v-if="mode === 'template'" label="模版名称" prop="templateName">
        <el-input v-model="form.templateName" placeholder="请输入模版名称" />
      </el-form-item>

      <el-form-item v-if="mode === 'task'" label="任务名称" prop="taskName">
        <el-input v-model="form.taskName" placeholder="请输入任务名称" />
      </el-form-item>

      <el-form-item label="脚本语言" prop="scriptLanguage">
        <el-segmented v-model="form.scriptLanguage" :options="scriptLanguageOptions" block />
      </el-form-item>

      <el-form-item label="模版内容" prop="templateContent">
        <CodeEditor
          v-model="form.templateContent"
          :language="form.scriptLanguage"
          :show-language-switcher="false"
          placeholder="请输入脚本内容"
          :rows="12"
        />
      </el-form-item>

      <el-form-item label="参数化">
        <el-link type="primary" class="inline-link" @click="openParameterDialog">添加参数</el-link>
        <el-table
          v-if="parameterList.length"
          :data="parameterList"
          border
          size="small"
          class="param-table"
        >
          <el-table-column prop="name" label="参数名" width="120" />
          <el-table-column prop="variable" label="变量名" width="140" />
          <el-table-column prop="typeLabel" label="类型" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" text size="small" @click="editParameter(scope.row)"
                >编辑</el-button
              >
              <el-button type="danger" text size="small" @click="removeParameter(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>

      <el-form-item label="目标主机">
        <div class="host-row">
          <el-link type="primary" class="inline-link" @click="openHostSelector">选择主机</el-link>
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
      </el-form-item>

      <el-form-item label="备注信息">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleConfirm">保存</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加类型 -->
  <el-dialog v-model="typeDialogVisible" title="添加模版类型" width="360px">
    <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
      <el-form-item label="模版类型" prop="type">
        <el-input v-model="typeForm.type" placeholder="请输入模版类型" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddTemplateType">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加参数 -->
  <el-dialog v-model="parameterDialogVisible" title="添加参数" width="540px">
    <el-form
      ref="parameterFormRef"
      :model="parameterForm"
      :rules="parameterRules"
      label-width="100px"
    >
      <el-form-item label="参数名" prop="name">
        <el-input v-model="parameterForm.name" placeholder="请输入参数名称" />
      </el-form-item>
      <el-form-item label="变量名" prop="variable">
        <el-input v-model="parameterForm.variable" placeholder="请输入变量名" />
      </el-form-item>
      <el-form-item label="参数类型" prop="type">
        <el-segmented v-model="parameterForm.type" :options="parameterTypeOptions" block />
      </el-form-item>
      <el-form-item v-if="parameterForm.type === 'select'" label="可选项" prop="optionsText">
        <el-input
          v-model="parameterForm.optionsText"
          type="textarea"
          :rows="3"
          placeholder="每行一个选项，例如：\ntest:测试环境\nprod:生产环境"
        />
      </el-form-item>
      <el-form-item v-if="parameterForm.type === 'command'" label="主机属性" prop="hostAttribute">
        <el-select
          v-model="parameterForm.hostAttribute"
          placeholder="请选择主机属性"
          style="width: 100%"
        >
          <el-option
            v-for="attr in hostAttributes"
            :key="attr.value"
            :label="attr.label"
            :value="attr.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="必填">
        <el-switch v-model="parameterForm.required" />
      </el-form-item>
      <el-form-item label="默认值">
        <el-input v-model="parameterForm.defaultValue" placeholder="请输入默认值" />
      </el-form-item>
      <el-form-item label="提示信息">
        <el-input
          v-model="parameterForm.hint"
          type="textarea"
          :rows="2"
          placeholder="请输入该参数的帮助提示信息"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="parameterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleParameterConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <HostSelectorDialog
    v-model:visible="hostSelectorVisible"
    v-model="selectedHosts"
    :hosts="hostSource"
    @confirm="handleHostSelectionConfirm"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { HostSelectorDialog } from '@/components/HostSelectorDialog'
import { CodeEditor } from '@/components/CodeEditor'

interface ParameterItem {
  id: number
  name: string
  variable: string
  type: 'text' | 'password' | 'select' | 'command'
  typeLabel: string
  options?: Array<{ label: string; value: string }>
  hostAttribute?: string
  required: boolean
  defaultValue?: string
  hint?: string
}

interface HostItem {
  hostId: string
  hostName: string
  internalIp: string
  publicIp: string
}

interface TemplateEditorData {
  templateType?: string
  templateName?: string
  taskName?: string
  scriptLanguage: 'Shell' | 'Python'
  templateContent: string
  remark?: string
  parameters?: ParameterItem[]
  hosts?: HostItem[]
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    mode?: 'template' | 'task'
    templateTypes?: string[]
    availableHosts?: HostItem[]
    initialData?: TemplateEditorData | null
    loading?: boolean
  }>(),
  {
    mode: 'template',
    templateTypes: () => [],
    availableHosts: () => [],
    initialData: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (
    e: 'submit',
    payload: TemplateEditorData & { parameters: ParameterItem[]; hosts: HostItem[] }
  ): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formRef = ref<FormInstance>()
const submitLoading = computed(() => props.loading)

const scriptLanguageOptions = [
  { label: 'Shell', value: 'Shell' },
  { label: 'Python', value: 'Python' }
]

const form = reactive({
  templateType: '',
  templateName: '',
  taskName: '',
  scriptLanguage: 'Shell',
  templateContent: '',
  remark: ''
})

const formRules: FormRules = {
  templateType: [{ required: true, message: '请选择模版类型', trigger: 'change' }],
  templateName: [{ required: true, message: '请输入模版名称', trigger: 'blur' }],
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  templateContent: [{ required: true, message: '请输入模版内容', trigger: 'blur' }]
}

const parameterList = ref<ParameterItem[]>([])
const selectedHosts = ref<HostItem[]>([])

const localTemplateTypes = ref<string[]>([])
watch(
  () => props.templateTypes,
  (types) => {
    localTemplateTypes.value = types.slice()
  },
  { immediate: true }
)

const applyInitialData = (data?: TemplateEditorData | null) => {
  form.templateType = data?.templateType || ''
  form.templateName = data?.templateName || ''
  form.taskName = data?.taskName || ''
  form.scriptLanguage = data?.scriptLanguage || 'Shell'
  form.templateContent = data?.templateContent || ''
  form.remark = data?.remark || ''
  parameterList.value = data?.parameters ? [...data.parameters] : []
  selectedHosts.value = data?.hosts ? [...data.hosts] : []
}

watch(
  () => props.initialData,
  (val) => {
    applyInitialData(val || undefined)
  },
  { immediate: true }
)

watch(
  () => props.mode,
  () => {
    if (props.mode === 'task') {
      form.templateType = ''
      form.templateName = ''
    }
  }
)

const typeDialogVisible = ref(false)
const typeFormRef = ref<FormInstance>()
const typeForm = reactive({ type: '' })
const typeRules: FormRules = {
  type: [{ required: true, message: '请输入模版类型', trigger: 'blur' }]
}

const openTypeDialog = () => {
  typeForm.type = ''
  typeDialogVisible.value = true
}

const handleAddTemplateType = () => {
  typeFormRef.value?.validate((valid) => {
    if (!valid) return
    if (!localTemplateTypes.value.includes(typeForm.type)) {
      localTemplateTypes.value.push(typeForm.type)
    }
    typeDialogVisible.value = false
    form.templateType = typeForm.type
  })
}

const parameterDialogVisible = ref(false)
const parameterFormRef = ref<FormInstance>()
const parameterForm = reactive({
  id: 0,
  name: '',
  variable: '',
  type: 'text' as 'text' | 'password' | 'select' | 'command',
  optionsText: '',
  hostAttribute: '',
  required: false,
  defaultValue: '',
  hint: ''
})

const parameterRules: FormRules = {
  name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  variable: [{ required: true, message: '请输入变量名', trigger: 'blur' }],
  optionsText: [
    {
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (parameterForm.type === 'select' && !value) {
          callback(new Error('请填写可选项'))
        } else {
          callback()
        }
      }
    }
  ],
  hostAttribute: [
    {
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (parameterForm.type === 'command' && !value) {
          callback(new Error('请选择主机属性'))
        } else {
          callback()
        }
      }
    }
  ]
}

const parameterTypeOptions = [
  { label: '文本框', value: 'text' },
  { label: '密码框', value: 'password' },
  { label: '下拉选择', value: 'select' },
  { label: '命令空间', value: 'command' }
]

const hostAttributes = [
  { label: '内网IP', value: 'internalIp' },
  { label: '公网IP', value: 'publicIp' },
  { label: '主机名称', value: 'hostName' }
]

const openParameterDialog = () => {
  parameterForm.id = Date.now()
  parameterForm.name = ''
  parameterForm.variable = ''
  parameterForm.type = 'text'
  parameterForm.optionsText = ''
  parameterForm.hostAttribute = ''
  parameterForm.required = false
  parameterForm.defaultValue = ''
  parameterForm.hint = ''
  parameterDialogVisible.value = true
}

const editParameter = (row: ParameterItem) => {
  parameterForm.id = row.id
  parameterForm.name = row.name
  parameterForm.variable = row.variable
  parameterForm.type = row.type
  parameterForm.optionsText = row.options
    ? row.options.map((opt) => `${opt.value}:${opt.label}`).join('\n')
    : ''
  parameterForm.hostAttribute = row.hostAttribute || ''
  parameterForm.required = row.required
  parameterForm.defaultValue = row.defaultValue || ''
  parameterForm.hint = row.hint || ''
  parameterDialogVisible.value = true
}

const handleParameterConfirm = () => {
  parameterFormRef.value?.validate((valid) => {
    if (!valid) return
    const typeLabel =
      parameterTypeOptions.find((opt) => opt.value === parameterForm.type)?.label || '文本框'
    const item: ParameterItem = {
      id: parameterForm.id,
      name: parameterForm.name,
      variable: parameterForm.variable,
      type: parameterForm.type,
      typeLabel,
      required: parameterForm.required,
      defaultValue: parameterForm.defaultValue,
      hint: parameterForm.hint
    }
    if (parameterForm.type === 'select') {
      item.options = (parameterForm.optionsText || '')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [value, label] = line.split(':')
          return { value: (value || '').trim(), label: (label || value || '').trim() }
        })
    }
    if (parameterForm.type === 'command') {
      item.hostAttribute = parameterForm.hostAttribute
    }
    const index = parameterList.value.findIndex((param) => param.id === item.id)
    if (index > -1) {
      parameterList.value.splice(index, 1, item)
    } else {
      parameterList.value.push(item)
    }
    parameterDialogVisible.value = false
  })
}

const removeParameter = (id: number) => {
  parameterList.value = parameterList.value.filter((item) => item.id !== id)
}

const hostSelectorVisible = ref(false)

const hostSource = computed<HostItem[]>(() => {
  if (props.availableHosts.length > 0) {
    return props.availableHosts
  }
  return [
    { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', internalIp: '172.21.0.12' },
    { hostId: '3', hostName: '名称A', publicIp: '121.199.4.33', internalIp: '172.21.0.10' },
    { hostId: '6', hostName: '名称B', publicIp: '192.168.0.22', internalIp: '172.21.0.11' },
    { hostId: '9', hostName: '名称123', publicIp: '192.168.0.33', internalIp: '172.21.0.1' },
    { hostId: '10', hostName: 'ABCDE', publicIp: '192.168.0.44', internalIp: '172.21.0.15' }
  ]
})

const openHostSelector = () => {
  hostSelectorVisible.value = true
}

const handleHostSelectionConfirm = (hosts: HostItem[]) => {
  selectedHosts.value = hosts
}

const removeSelectedHost = (hostId: string) => {
  selectedHosts.value = selectedHosts.value.filter((host) => host.hostId !== hostId)
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return
    if (props.mode === 'template') {
      if (!form.templateType) {
        return
      }
    } else if (!form.taskName) {
      return
    }
    emit('submit', {
      templateType: form.templateType,
      templateName: form.templateName,
      taskName: form.taskName,
      scriptLanguage: form.scriptLanguage as 'Shell' | 'Python',
      templateContent: form.templateContent,
      remark: form.remark,
      parameters: parameterList.value,
      hosts: selectedHosts.value
    })
  })
}
</script>

<style scoped lang="less">
.inline-link {
  margin-left: 12px;
}

.param-table {
  margin-top: 12px;
}

.selected-hosts {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.host-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
