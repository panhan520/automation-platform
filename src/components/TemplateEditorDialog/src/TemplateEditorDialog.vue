<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    top="5vh"
    :width="mode === 'template' ? '720px' : '680px'"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item v-if="mode === 'template'" label="模版类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="请选择模版类型"
          style="width: 86%"
          clearable
          filterable
        >
          <el-option v-for="type in localTemplateTypes" :key="type" :label="type" :value="type" />
          <template #empty>
            <el-empty :image-size="80" description="暂无数据" />
          </template>
        </el-select>
        <el-button type="primary" class="inline-link" @click="openTypeDialog" link
          >添加类型</el-button
        >
      </el-form-item>

      <el-form-item :label="mode === 'template' ? '模版名称' : '任务名称'" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="mode === 'template' ? '请输入模版名称' : '请输入任务名称'"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="脚本语言" prop="interpreter">
        <el-segmented v-model="form.interpreter" :options="interpreterOptions" block />
      </el-form-item>

      <el-form-item v-if="mode === 'template'" label="模版内容" prop="body">
        <CodeEditor v-model="form.body" :rows="12" />
      </el-form-item>

      <el-form-item v-if="mode === 'task'" label="模版内容" prop="command">
        <CodeEditor v-model="form.command" :rows="12" />
      </el-form-item>

      <el-form-item label="参数化">
        <!-- 已选参数列表 -->
        <el-table
          v-if="parameterList.length"
          :data="parameterList"
          border
          size="small"
          class="param-table"
        >
          <el-table-column prop="name" label="参数名" />
          <el-table-column prop="variable" label="变量名" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                type="primary"
                link
                size="small"
                @click="editParameter(scope.row, scope.$index)"
              >
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="removeParameter(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" @click="openParameterDialog" link>添加参数</el-button>
      </el-form-item>

      <el-form-item label="目标主机" :class="{ 'required-item': mode === 'task' }">
        <div class="host-row">
          <span v-if="selectedHosts.length" class="selected-count">
            已选择 {{ selectedHosts.length }} 台
          </span>
          <el-button link type="primary" @click="openHostSelector">选择主机</el-button>
        </div>
      </el-form-item>

      <el-form-item label="备注信息">
        <el-input
          v-model="form.desc"
          type="textarea"
          :rows="3"
          :placeholder="`请输入${mode === 'template' ? '模版' : '任务'}备注信息`"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加类型 -->
  <el-dialog
    v-model="typeDialogVisible"
    title="添加模版类型"
    width="400px"
    @close="handleAddTemplateTypeCancel"
  >
    <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
      <el-form-item label="模版类型" prop="type">
        <el-input v-model="typeForm.type" placeholder="请输入模版类型" maxlength="50" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleAddTemplateTypeCancel">取消</el-button>
        <el-button type="primary" @click="handleAddTemplateType">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加参数 -->
  <el-dialog
    v-model="parameterDialogVisible"
    title="添加参数"
    width="540px"
    @close="handleParameterCancel"
  >
    <el-form
      ref="parameterFormRef"
      :model="parameterForm"
      :rules="parameterRules"
      label-width="100px"
    >
      <el-form-item prop="name">
        <template #label>
          <span
            >参数名称
            <el-tooltip content="参数的简短名称" placement="top">
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input v-model="parameterForm.name" placeholder="请输入参数名称" maxlength="50" />
      </el-form-item>
      <el-form-item prop="variable">
        <template #label>
          <span
            >变量名称
            <el-tooltip
              content="在脚本使用的变量名称，固定前缀_AOMP_ + 输入的变量名，例如变量名name，则最终生成环境变量为
                _AOMP_name"
              placement="top"
            >
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input v-model="parameterForm.variable" placeholder="请输入变量名称" maxlength="50" />
      </el-form-item>
      <el-form-item prop="type">
        <template #label>
          <span
            >参数类型
            <el-tooltip content="不同类型展示的形式不同" placement="top">
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-segmented v-model="parameterForm.type" :options="parameterTypeOptions" block />
      </el-form-item>
      <el-form-item v-if="parameterForm.type === 'select'" prop="options">
        <template #label>
          <span
            >可选项
            <el-tooltip
              content="每项单独一行，每行可以用英文冒号分割前边是值后边是显示的内容。"
              placement="top"
            >
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>

        <el-input
          v-model="parameterForm.options"
          type="textarea"
          :rows="3"
          placeholder="每行一个选项，例如：&#10;test:测试环境&#10;prod:生产环境"
        />
      </el-form-item>
      <el-form-item v-if="parameterForm.type === 'namespace'" label="主机属性" prop="property">
        <el-select
          v-model="parameterForm.property"
          placeholder="请选择主机属性"
          style="width: 100%"
        >
          <el-option
            v-for="attr in hostAttributes"
            :key="attr.value"
            :label="attr.label"
            :value="attr.value"
          />
          <template #empty>
            <el-empty :image-size="80" description="暂无数据" />
          </template>
        </el-select>
      </el-form-item>
      <el-form-item>
        <template #label>
          <span
            >必填
            <el-tooltip content="该参数是否为必填项" placement="top">
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-switch
          v-model="parameterForm.required"
          active-text="是"
          inactive-text="否"
          inline-prompt
        />
      </el-form-item>
      <el-form-item label="默认值">
        <el-input v-model="parameterForm.default" placeholder="请输入默认值" maxlength="50" />
      </el-form-item>
      <el-form-item>
        <template #label>
          <span
            >提示信息
            <el-tooltip content="会展示在参数的输入框下方" placement="top">
              <el-icon class="question-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input
          v-model="parameterForm.desc"
          type="textarea"
          :rows="2"
          placeholder="请输入该参数的帮助提示信息"
          maxlength="50"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleParameterCancel">取消</el-button>
        <el-button type="primary" @click="handleParameterConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <!-- 选择主机 -->
  <HostSelectorDialog
    v-model:visible="hostSelectorVisible"
    v-model="selectedHosts"
    @confirm="handleHostSelectionConfirm"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { HostSelectorDialog } from '@/components/HostSelectorDialog'
import { CodeEditor } from '@/components/CodeEditor'
import { ElMessage } from 'element-plus'
import { ParameterItem, TemplateEditorData, HostItem } from '@/api/node/type'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    mode?: 'template' | 'task'
    templateTypes?: string[]
    initialData?: TemplateEditorData | null
    loading?: boolean
  }>(),
  {
    mode: 'template',
    templateTypes: () => [],
    initialData: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formRef = ref<FormInstance>()
const submitLoading = computed(() => props.loading)
const form = reactive({
  type: '',
  name: '',
  interpreter: 'sh',
  body: '',
  command: '',
  desc: ''
})
const parameterList = ref<ParameterItem[]>([])
const selectedHosts = ref<HostItem[]>([])
const localTemplateTypes = ref<string[]>([])
const interpreterOptions = [
  { label: 'Shell', value: 'sh' },
  { label: 'Python', value: 'python' }
]
const formRules: FormRules = {
  type: [{ required: true, message: '请选择模版类型', trigger: 'change' }],
  name: [
    {
      required: true,
      message: props.mode === 'template' ? '请输入模版名称' : '请输入任务名称',
      trigger: 'blur'
    }
  ],
  interpreter: [{ required: true, message: '请选择脚本语言', trigger: 'change' }],
  body: [{ required: true, message: '请输入模版内容', trigger: 'blur' }],
  command: [{ required: true, message: '请输入模版内容', trigger: 'blur' }]
}
// 模版类型弹框相关
const typeDialogVisible = ref(false)
const typeFormRef = ref<FormInstance>()
const typeForm = reactive({ type: '' })
const typeRules: FormRules = {
  type: [{ required: true, message: '请输入模版类型', trigger: 'blur' }]
}
watch(
  () => props.templateTypes,
  (types) => {
    localTemplateTypes.value = types.slice()
  },
  { immediate: true }
)
watch(
  () => props.visible,
  (val) => {
    if (val) {
      applyInitialData(props.initialData)
    }
  },
  { immediate: true }
)

// 设置默认值
const applyInitialData = (data) => {
  form.type = data?.type || ''
  form.name = data?.name || ''
  form.interpreter = data?.interpreter || 'sh'
  form.body = data?.body || ''
  form.command = data?.command || ''
  form.desc = data?.desc || ''
  parameterList.value = JSON.parse(JSON.stringify(data?.parameters || []))
  selectedHosts.value = data?.host_id_ip_map || []
}

// watch(
//   () => props.mode,
//   () => {
//     if (props.mode === 'task') {
//       form.type = ''
//       form.name = ''
//     }
//   }
// )

// 打开添加类型弹框
const openTypeDialog = () => {
  typeForm.type = ''
  typeDialogVisible.value = true
}
// 添加类型取消
const handleAddTemplateTypeCancel = () => {
  typeFormRef.value?.resetFields()
  typeDialogVisible.value = false
}
// 确认添加类型
const handleAddTemplateType = () => {
  typeFormRef.value?.validate((valid) => {
    if (!valid) return
    if (!typeForm.type.trim()) {
      ElMessage.warning('请输入模版类型')
      return
    }
    if (!localTemplateTypes.value.includes(typeForm.type)) {
      localTemplateTypes.value.push(typeForm.type)
      form.type = typeForm.type
      ElMessage.success('添加成功')
    } else {
      form.type = typeForm.type
      ElMessage.warning('该类型已存在')
    }
    handleAddTemplateTypeCancel()
  })
}

const parameterDialogVisible = ref(false)
const parameterFormRef = ref<FormInstance>()
const parameterForm = reactive({
  id: undefined as number | undefined,
  name: '',
  variable: '',
  type: 'string' as 'string' | 'password' | 'select' | 'namespace',
  options: '',
  property: '',
  required: false,
  default: '',
  desc: ''
})

const editingParameterIndex = ref<number | null>(null)

const parameterRules: FormRules = {
  name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  variable: [{ required: true, message: '请输入变量名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择参数类型', trigger: 'change' }],
  options: [
    {
      required: true,
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
  property: [
    {
      required: true,
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (parameterForm.type === 'namespace' && !value) {
          callback(new Error('请选择主机属性'))
        } else {
          callback()
        }
      }
    }
  ]
}

const parameterTypeOptions = [
  { label: '文本框', value: 'string' },
  { label: '密码框', value: 'password' },
  { label: '下拉选择', value: 'select' },
  { label: '命令空间', value: 'namespace' }
]

const hostAttributes = [
  { label: '地区', value: 'region' },
  { label: '节点标签', value: 'nodeTags' },
  { label: '运营商', value: 'operator' },
  { label: '供应商名称', value: 'vendorName' }
]
// 打开参数弹框
const openParameterDialog = () => {
  editingParameterIndex.value = null
  parameterForm.id = undefined
  parameterForm.name = ''
  parameterForm.variable = ''
  parameterForm.type = 'string'
  parameterForm.options = ''
  parameterForm.property = ''
  parameterForm.required = false
  parameterForm.default = ''
  parameterForm.desc = ''
  parameterDialogVisible.value = true
}
// 编辑参数
const editParameter = (row, index: number) => {
  editingParameterIndex.value = index
  parameterForm.id = row.id
  parameterForm.name = row.name
  parameterForm.variable = row.variable
  parameterForm.type = row.type
  parameterForm.options = row.options || ''
  parameterForm.property = row.property || ''
  parameterForm.required = row.required
  parameterForm.default = row.default || ''
  parameterForm.desc = row.desc || ''
  parameterDialogVisible.value = true
}
// 添加参数弹框取消
const handleParameterCancel = () => {
  parameterFormRef.value?.resetFields()
  parameterDialogVisible.value = false
}
// 添加参数弹框确认
const handleParameterConfirm = () => {
  parameterFormRef.value?.validate((valid) => {
    if (!valid) return
    const item: ParameterItem = { ...parameterForm }
    if (editingParameterIndex.value !== null) {
      parameterList.value.splice(editingParameterIndex.value, 1, item)
    } else {
      parameterList.value.push(item)
    }
    ElMessage.success('添加成功')
    handleParameterCancel()
  })
}

const removeParameter = (index: number) => {
  parameterList.value.splice(index, 1)
}

const hostSelectorVisible = ref(false)

const openHostSelector = () => {
  hostSelectorVisible.value = true
}

const handleHostSelectionConfirm = (hosts) => {
  selectedHosts.value = hosts
}

const handleCancel = () => {
  formRef.value?.resetFields()
  dialogVisible.value = false
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return
    if (props.mode === 'task' && selectedHosts.value.length === 0) {
      ElMessage.warning('请选择目标主机')
      return
    }
    const formData: any = {
      ...form,
      parameters: parameterList.value
    }
    if (props.mode === 'task') {
      formData.targets = selectedHosts.value.map((host) => host.id)
      delete formData.type
      delete formData.body
    }
    if (props.mode === 'template') {
      formData.host_ids = selectedHosts.value.map((host) => host.id)
      delete formData.command
    }
    emit('submit', formData)
  })
}
</script>

<style scoped lang="less">
:deep(.el-segmented.is-block .el-segmented__item) {
  min-width: 80px;
}
:deep(.el-dialog) {
  max-height: 85vh;
  top: -90px;
}
.inline-link {
  margin-left: 12px;
}

.param-table {
  margin-top: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.required-item {
  :deep(.el-form-item__label) {
    &::before {
      color: #f56c6c;
      content: '*';
      margin-right: 4px;
    }
  }
}
.host-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
