<template>
  <el-dialog
    v-model="visible"
    :title="computedTitle"
    width="1000px"
    class="node-form-dialog"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="node-form">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="内网IP" prop="internalIp" required>
            <el-input v-model="form.internalIp" placeholder="请输入内网IP" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公网IP" prop="publicIp" required>
            <el-input v-model="form.publicIp" placeholder="请输入公网IP" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="操作系统" prop="os" required>
            <el-select v-model="form.os" placeholder="请选择操作系统">
              <el-option label="Windows" value="Windows" />
              <el-option label="Linux" value="Linux" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录端口" prop="loginPort" required>
            <el-input v-model="form.loginPort" placeholder="请输入登录端口" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="认证方式" prop="authMethod" required>
            <el-select v-model="form.authMethod" placeholder="请选择认证方式">
              <el-option label="密码" value="密码" />
              <el-option label="密钥" value="密钥" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="form.authMethod === '密码' ? '密码' : '密钥'"
            prop="credential"
            class="label-item-required"
          >
            <template v-if="form.authMethod === '密码'">
              <el-input
                type="password"
                v-model="form.credentialPassword"
                placeholder="请输入密码"
                show-password
                clearable
              />
            </template>
            <template v-else>
              <el-input
                v-model="form.credentialKey"
                type="textarea"
                :rows="2"
                placeholder="请粘贴密钥内容"
                clearable
              />
            </template>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录账号" prop="loginAccount" required>
            <el-input v-model="form.loginAccount" placeholder="请输入登录账号" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主机名称" prop="hostname" required>
            <el-input v-model="form.hostname" placeholder="请输入主机名称" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网络类型" prop="networkType" required>
            <el-select v-model="form.networkType" placeholder="请选择网络类型">
              <el-option label="公网" value="公网" />
              <el-option label="内网" value="内网" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地区" prop="region" required>
            <el-select v-model="form.region" placeholder="请选择地区">
              <el-option label="中国-上海-浦东新区" value="中国-上海-浦东新区" />
              <el-option label="中国-北京-朝阳区" value="中国-北京-朝阳区" />
              <el-option label="中国-广东-深圳市" value="中国-广东-深圳市" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录IP" prop="loginIp" required>
            <el-input v-model="form.loginIp" placeholder="请输入登录IP" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="应用类型" prop="applicationType" required>
            <el-select v-model="form.applicationType" placeholder="请选择应用类型">
              <el-option label="云拨测" value="云拨测" />
              <el-option label="CDN" value="CDN" />
              <el-option label="监控" value="监控" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商名称" prop="providerName" required>
            <el-input v-model="form.providerName" placeholder="请输入供应商名称" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="运营商" prop="carrier" required>
            <el-select v-model="form.carrier" placeholder="请选择运营商">
              <el-option label="中国移动" value="中国移动" />
              <el-option label="中国电信" value="中国电信" />
              <el-option label="中国联通" value="中国联通" />
              <el-option label="中国网通" value="中国网通" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注">
            <el-input
              v-model="form.remarks"
              type="textarea"
              :maxlength="100"
              show-word-limit
              placeholder="请输入备注"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <div class="tag-section">
            <div class="tag-section__label">节点标签</div>
            <div class="tag-section__content">
              <div v-for="(tag, index) in tags" :key="tag.id" class="tag-row">
                <el-select
                  v-model="tag.key"
                  filterable
                  allow-create
                  default-first-option
                  :reserve-keyword="false"
                  placeholder="标签键"
                  class="tag-row__input"
                >
                  <el-option
                    v-for="item in keyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-select
                  v-model="tag.value"
                  filterable
                  allow-create
                  default-first-option
                  :reserve-keyword="false"
                  placeholder="标签值"
                  class="tag-row__input"
                >
                  <el-option
                    v-for="item in keyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-button type="text" @click="removeTag(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="tag-section__footer">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="addTag"
                  :disabled="tags.length >= maxTags"
                >
                  <el-icon><CirclePlus /></el-icon>添加标签
                </el-link>
                <span class="tag-limit-text">还可添加 {{ maxTags - tags.length }} 个标签</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button type="primary" text :loading="testLoading" @click="handleConnectivityTest">
            连通测试
          </el-button>
          <span v-if="connectivityStatus === 'success'" class="status success">连通测试成功</span>
          <span v-else-if="connectivityStatus === 'failed'" class="status failed"
            >连通测试失败</span
          >
        </div>
        <div class="footer-actions">
          <el-button @click="handleCancel" :disabled="loading">取消</el-button>
          <el-button type="primary" :loading="loading" :disabled="!canSave" @click="handleSave">
            保存
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Delete, CirclePlus } from '@element-plus/icons-vue'

type ConnectivityStatus = 'idle' | 'loading' | 'success' | 'failed'

type AuthMethod = '密码' | '密钥'

interface NodeForm {
  internalIp: string
  publicIp: string
  os: 'Windows' | 'Linux'
  loginPort: string
  authMethod: AuthMethod
  credentialPassword: string
  credentialKey: string
  loginAccount: string
  hostname: string
  networkType: '公网' | '内网'
  region: string
  loginIp: string
  applicationType: string
  providerName: string
  carrier: string
  remarks: string
}

interface NodeTagItem {
  id: number
  key: string
  value: string
}

interface Props {
  visible: boolean
  loading?: boolean
  title?: string
  isEdit?: boolean
  defaultData?: Partial<NodeForm>
  defaultTags?: Array<{ key: string; value: string }>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  title: '新建节点',
  isEdit: false,
  defaultData: () => ({}),
  defaultTags: () => []
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (
    e: 'save',
    data: { form: NodeForm; tags: Array<{ key: string; value: string }>; authCredential: string }
  ): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const form = reactive<NodeForm>({
  internalIp: '',
  publicIp: '',
  os: 'Windows',
  loginPort: '22',
  authMethod: '密码',
  credentialPassword: '',
  credentialKey: '',
  loginAccount: '',
  hostname: '',
  networkType: '公网',
  region: '中国-上海-浦东新区',
  loginIp: '',
  applicationType: '',
  providerName: '',
  carrier: '中国移动',
  remarks: ''
})

const keyOptions = [
  {
    value: '1',
    label: '1'
  },
  {
    value: '2',
    label: '2'
  },
  {
    value: '3',
    label: '3'
  }
]

const tags = ref<NodeTagItem[]>([])
const maxTags = 10
const testLoading = ref(false)
const connectivityStatus = ref<ConnectivityStatus>('idle')
let tagIdSeed = 0

const rules = reactive<FormRules>({
  internalIp: [{ required: true, message: '请输入内网IP', trigger: 'blur' }],
  publicIp: [{ required: true, message: '请输入公网IP', trigger: 'blur' }],
  os: [{ required: true, message: '请选择操作系统', trigger: 'change' }],
  loginPort: [
    { required: true, message: '请输入登录端口', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!/^[0-9]{1,5}$/.test(value)) {
          callback(new Error('端口应为1-5位数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  authMethod: [{ required: true, message: '请选择认证方式', trigger: 'change' }],
  credential: [
    {
      validator: (_rule, _value, callback) => {
        if (form.authMethod === '密码' && !form.credentialPassword) {
          callback(new Error('请输入密码'))
          return
        }
        if (form.authMethod === '密钥' && !form.credentialKey) {
          callback(new Error('请填写密钥内容'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  loginAccount: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  hostname: [{ required: true, message: '请输入主机名称', trigger: 'blur' }],
  networkType: [{ required: true, message: '请选择网络类型', trigger: 'change' }],
  region: [{ required: true, message: '请选择地区', trigger: 'change' }],
  loginIp: [{ required: true, message: '请输入登录IP', trigger: 'blur' }],
  applicationType: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
  providerName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  carrier: [{ required: true, message: '请选择运营商', trigger: 'change' }]
})

const visible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
})

const computedTitle = computed(() =>
  props.title ? props.title : props.isEdit ? '编辑节点' : '新建节点'
)

const canSave = computed(() => connectivityStatus.value === 'success' && !props.loading)

const resetConnectivityStatus = () => {
  if (connectivityStatus.value === 'idle') return
  connectivityStatus.value = 'idle'
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTickInit()
    }
  }
)

const nextTickInit = () => {
  connectivityStatus.value = 'idle'
  testLoading.value = false
  form.credentialPassword = ''
  form.credentialKey = ''
  Object.assign(form, {
    internalIp: '',
    publicIp: '',
    os: 'Windows',
    loginPort: '22',
    authMethod: '密码',
    credentialPassword: '',
    credentialKey: '',
    loginAccount: '',
    hostname: '',
    networkType: '公网',
    region: '中国-上海-浦东新区',
    loginIp: '',
    applicationType: '',
    providerName: '',
    carrier: '中国移动',
    remarks: ''
  })
  tags.value = []
  tagIdSeed = 0

  if (props.defaultData) {
    Object.assign(form, props.defaultData)
  }

  if (props.defaultTags?.length) {
    tags.value = props.defaultTags.map((tag) => ({
      id: ++tagIdSeed,
      key: tag.key,
      value: tag.value
    }))
  }

  if (!form.loginIp) {
    form.loginIp = form.networkType === '公网' ? form.publicIp : form.internalIp
  }

  formRef.value?.resetFields()
}

watch(
  () => [form.networkType, form.publicIp, form.internalIp],
  () => {
    if (form.networkType === '公网') {
      form.loginIp = form.publicIp
    } else {
      form.loginIp = form.internalIp
    }
    resetConnectivityStatus()
  }
)

watch(
  () => [form.internalIp, form.publicIp, form.loginAccount, form.loginPort],
  () => {
    resetConnectivityStatus()
  }
)

const addTag = () => {
  if (tags.value.length >= maxTags) return
  tags.value.push({ id: ++tagIdSeed, key: '', value: '' })
}

const removeTag = (index: number) => {
  tags.value.splice(index, 1)
  resetConnectivityStatus()
}

const handleConnectivityTest = async () => {
  try {
    await formRef.value?.validateField([
      'internalIp',
      'publicIp',
      'loginAccount',
      'loginPort',
      'loginIp'
    ])
  } catch (error) {
    ElMessage.error('请完善必填信息后再进行连通测试')
    return
  }
  connectivityStatus.value = 'idle'
  testLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    connectivityStatus.value = 'success'
    ElMessage.success('连通测试成功')
  } catch (error) {
    connectivityStatus.value = 'failed'
    ElMessage.error('连通测试失败')
  } finally {
    testLoading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  if (connectivityStatus.value !== 'success') {
    ElMessage.warning('请先完成连通测试')
    return
  }

  const authCredential = form.authMethod === '密码' ? form.credentialPassword : form.credentialKey
  emit('save', {
    form: { ...form },
    tags: tags.value
      .map(({ key, value }) => ({ key, value }))
      .filter((item) => item.key || item.value),
    authCredential
  })
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  emit('cancel')
  connectivityStatus.value = 'idle'
}
</script>

<style scoped lang="less">
.node-form-dialog {
  .node-form {
    padding-right: 8px;
  }
  .tag-section__label {
    color: #606266;
    font-size: 13px;
    &::before {
      content: '';
    }
  }
  .tag-section__footer {
    margin-top: 7px;
  }
  .el-link {
    font-size: 13px;
    .el-icon {
      margin-right: 5px;
    }
  }
}
.tag-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 8px;

  &__label {
    width: 120px;
    text-align: right;
    line-height: 32px;
    color: var(--el-color-danger);

    &::before {
      content: '*';
      margin-right: 4px;
    }
  }

  &__content {
    flex: 1;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  &__input {
    flex: 1;
  }
}

.tag-limit-text {
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .status {
      font-size: 13px;

      &.success {
        color: #67c23a;
      }

      &.failed {
        color: #f56c6c;
      }
    }
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
.label-item-required {
  :deep(.el-form-item__label) {
    &::before {
      color: #f56c6c;
      content: '*';
      margin-right: 4px;
    }
  }
}
</style>
