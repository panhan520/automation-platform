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
          <el-form-item label="内网IP" prop="innerIp" required>
            <el-input v-model="form.innerIp" placeholder="请输入内网IP" clearable />
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
              <el-option label="密码" value="password" />
              <el-option label="密钥" value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="form.authMethod === 'password' ? '密码' : '密钥'"
            prop="credential"
            class="label-item-required"
          >
            <template v-if="form.authMethod === 'password'">
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
          <el-form-item label="主机名称" prop="hostName" required>
            <el-input v-model="form.hostName" placeholder="请输入主机名称" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网络类型" prop="networkType" required>
            <el-select v-model="form.networkType" placeholder="请选择网络类型">
              <el-option label="公网" value="public" />
              <el-option label="内网" value="private" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地区" prop="region" required>
            <el-cascader
              v-model="form.region"
              :options="regionOptions"
              :props="regionProps"
              @change="handleChangeRegion"
              placeholder="请选择国家／省／市／区"
              filterable
              clearable
              :show-all-levels="true"
              separator="-"
              :display-render="displayRegionRender"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="登录IP" prop="loginIp" required>
            <el-input v-model="form.loginIp" placeholder="请输入登录IP" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="应用类型" prop="appType" required>
            <el-select v-model="form.appType" placeholder="请选择应用类型">
              <el-option
                v-for="option in appTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商名称" prop="vendorName" required>
            <el-input v-model="form.vendorName" placeholder="请输入供应商名称" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="运营商" prop="operator" required>
            <el-select v-model="form.operator" placeholder="请选择运营商">
              <el-option label="中国移动" value="ChinaMobile" />
              <el-option label="中国电信" value="ChinaUnicom" />
              <el-option label="中国联通" value="ChinaTelecom" />
              <el-option label="中国网通" value="ChinaNetcom" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
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
              <div v-for="(tag, index) in nodeTagItems" :key="tag.id" class="tag-row">
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
                    v-for="item in nodeTagOptions"
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
                    v-for="item in nodeTagOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-button type="text" @click="removeNodeTag(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="tag-section__footer">
                <el-link
                  type="primary"
                  :underline="false"
                  @click="addNodeTag"
                  :disabled="nodeTagItems.length >= maxTags"
                >
                  <el-icon><CirclePlus /></el-icon>添加标签
                </el-link>
                <span class="tag-limit-text">
                  还可添加 {{ maxTags - nodeTagItems.length }} 个标签
                </span>
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
import { computed, reactive, ref, watch, onMounted } from 'vue'
import type { FormInstance, FormRules, CascaderProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Delete, CirclePlus } from '@element-plus/icons-vue'
import {
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
  getDistrictsByCity
} from '@/utils/regionData'
import { apiGetApplicationList } from '@/api/application'
import { apiNodeSingleProbe } from '@/api/node/index'

interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  leaf?: boolean
  [key: string]: any
}

interface AppTypeOption {
  label: string
  value: string | number
}

const regionOptions = ref<CascaderOption[]>([])
const regionDisplayLabel = ref('')

// 懒加载配置
const regionProps: CascaderProps = {
  lazy: true,
  lazyLoad: async (node, resolve) => {
    const level = node.level
    const pathValues = node.pathValues as (string | number)[]

    try {
      // 第一级（国家）
      if (level === 0) {
        const countries = getAllCountries()
        resolve(countries)
      }
      // 第二级（省/州）
      else if (level === 1) {
        const countryCode = node.value as string
        const states = getStatesByCountry(countryCode)
        resolve(states)
      }
      // 第三级（城市）
      else if (level === 2) {
        const countryCode = pathValues[0] as string
        const stateCode = node.value as string
        const cities = getCitiesByState(countryCode, stateCode)
        resolve(cities)
      }
      // 第四级（区/县，仅中国）
      else if (level === 3) {
        const countryCode = pathValues[0] as string
        const stateCode = pathValues[1] as string
        const cityCode = node.value as string
        const districts = getDistrictsByCity(countryCode, stateCode, cityCode)
        resolve(districts)
      } else {
        resolve([])
      }
    } catch (error) {
      console.error('加载地区数据失败:', error)
      resolve([])
    }
  }
}
// 应用类型列表
const appTypeOptions = ref<AppTypeOption[]>([])
// 初始化加载国家
onMounted(() => {
  regionOptions.value = getAllCountries()
  getAppTypeList()
})
// 获取应用类型列表数据
const getAppTypeList = async () => {
  const res = await apiGetApplicationList({})
  appTypeOptions.value =
    res.data?.list.map((item) => ({
      label: item.appType,
      value: item.id
    })) || []
}

const getRegionLabelsByPath = (path: (string | number)[] = []): string[] => {
  if (!path || !path.length) return []
  const normalized = path.map((item) => String(item))
  const [countryCode, stateCode, cityCode, districtCode] = normalized
  const labels: string[] = []

  const countries = getAllCountries()
  const country = countries.find((item) => String(item.value) === countryCode)
  if (!country) return labels
  labels.push(country.label)

  if (stateCode) {
    const states = getStatesByCountry(countryCode)
    const state = states.find((item) => String(item.value) === stateCode)
    if (state) {
      labels.push(state.label)
    }
  }

  if (cityCode && stateCode) {
    const cities = getCitiesByState(countryCode, stateCode)
    const city = cities.find((item) => String(item.value) === cityCode)
    if (city) {
      labels.push(city.label)
    }
  }

  if (districtCode && stateCode && cityCode) {
    const districts = getDistrictsByCity(countryCode, stateCode, cityCode)
    const district = districts.find((item) => String(item.value) === districtCode)
    if (district) {
      labels.push(district.label)
    }
  }

  return labels
}

const updateRegionDisplay = (path?: (string | number)[]) => {
  const labels = getRegionLabelsByPath(path ?? form.region)
  regionDisplayLabel.value = labels.join('-')
}

const displayRegionRender = ({ labels }: { labels: string[] }) => {
  if (labels?.length) {
    return labels.join('-')
  }
  return regionDisplayLabel.value
}

// 选中变化
const handleChangeRegion = (val: (string | number)[]) => {
  updateRegionDisplay(val)
}
type ConnectivityStatus = 'idle' | 'loading' | 'success' | 'failed'

type AuthMethod = 'password' | 'key'

interface NodeForm {
  innerIp: string
  publicIp: string
  os: 'Windows' | 'Linux'
  loginPort: string
  authMethod: AuthMethod
  credentialPassword: string
  credentialKey: string
  loginAccount: string
  hostName: string
  networkType: 'public' | 'private'
  region: (string | number)[]
  loginIp: string
  appType: string
  vendorName: string
  operator: string
  remark: string
  nodeTags: Record<string, string>
}

interface NodeTagItem {
  id: number
  key: string
  value: string
}

type NodeFormSubmit = Omit<NodeForm, 'region'> & { region: string }

type NodeFormDefaultData = Partial<NodeForm> & {
  regionCodes?: (string | number)[]
  regionLabel?: string
  tags?: Array<{ key: string; value: string }>
  passwordKey?: string
}

interface Props {
  visible: boolean
  loading?: boolean
  title?: string
  isEdit?: boolean
  defaultData?: NodeFormDefaultData
  nodeTagOptions?: Array<{ label: string; value: string }>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  title: '新建节点',
  isEdit: false,
  defaultData: () => ({}),
  nodeTagOptions: () => []
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: { form: NodeFormSubmit; passwordKey: string }): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const createDefaultForm = (): NodeForm => ({
  innerIp: '',
  publicIp: '',
  os: 'Windows',
  loginPort: '22',
  authMethod: 'password',
  credentialPassword: '',
  credentialKey: '',
  loginAccount: '',
  hostName: '',
  networkType: 'public',
  region: ['CN', '31', '310115'],
  loginIp: '',
  appType: '',
  vendorName: '',
  operator: 'ChinaMobile',
  remark: '',
  nodeTags: {}
})
const form = reactive<NodeForm>(createDefaultForm())

const nodeTagItems = ref<NodeTagItem[]>([])
const maxTags = 10
const testLoading = ref(false)
const connectivityStatus = ref<ConnectivityStatus>('idle')
let tagIdSeed = 0

const buildNodeTagsPayload = () => {
  return nodeTagItems.value.reduce<Record<string, string>>((acc, { key, value }) => {
    if (key) {
      acc[key] = value ?? ''
    }
    return acc
  }, {})
}
const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
const createIpValidator =
  (label: string) => (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(`请输入${label}`))
      return
    }
    if (!ipv4Pattern.test(value)) {
      callback(new Error(`${label}格式不正确`))
      return
    }
    callback()
  }

watch(
  nodeTagItems,
  () => {
    form.nodeTags = buildNodeTagsPayload()
  },
  { deep: true }
)

const rules = reactive<FormRules>({
  innerIp: [
    { required: true, message: '请输入内网IP', trigger: 'blur' },
    { validator: createIpValidator('内网IP'), trigger: 'blur' }
  ],
  publicIp: [
    { required: true, message: '请输入公网IP', trigger: 'blur' },
    { validator: createIpValidator('公网IP'), trigger: 'blur' }
  ],
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
        if (form.authMethod === 'password' && !form.credentialPassword) {
          callback(new Error('请输入密码'))
          return
        }
        if (form.authMethod === 'key' && !form.credentialKey) {
          callback(new Error('请填写密钥内容'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  loginAccount: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  hostName: [{ required: true, message: '请输入主机名称', trigger: 'blur' }],
  networkType: [{ required: true, message: '请选择网络类型', trigger: 'change' }],
  region: [{ required: true, message: '请选择地区', trigger: 'change' }],
  loginIp: [
    { required: true, message: '请输入登录IP', trigger: 'blur' },
    { validator: createIpValidator('登录IP'), trigger: 'blur' }
  ],
  appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
  vendorName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  operator: [{ required: true, message: '请选择运营商', trigger: 'change' }]
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

const convertTagsToList = (source?: any): NodeTagItem[] => {
  const list: NodeTagItem[] = []
  if (!source) return list

  if (Array.isArray(source)) {
    source.forEach((item) => {
      if (item?.key) {
        list.push({
          id: ++tagIdSeed,
          key: item.key,
          value: item.value ?? ''
        })
      }
    })
  } else if (typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      if (key) {
        list.push({
          id: ++tagIdSeed,
          key,
          value: value as string
        })
      }
    })
  }

  return list
}

const preloadRegionPath = (path: (string | number)[]) => {
  if (!path?.length) return
  if (!regionOptions.value.length) {
    regionOptions.value = getAllCountries()
  }
  const normalized = path.map((item) => String(item))
  let currentLevel = regionOptions.value
  normalized.forEach((value, index) => {
    const node = currentLevel.find((item) => String(item.value) === value)
    if (!node) {
      currentLevel = []
      return
    }
    if (index === 0) {
      node.children = node.children || getStatesByCountry(value)
    } else if (index === 1) {
      node.children = node.children || getCitiesByState(normalized[0], value)
    } else if (index === 2) {
      node.children = node.children || getDistrictsByCity(normalized[0], normalized[1], value)
    }
    currentLevel = node.children || []
  })
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTickInit()
    }
  }
)

watch(
  () => form.region,
  (val) => {
    updateRegionDisplay(val)
  },
  { deep: true, immediate: true }
)

const nextTickInit = () => {
  connectivityStatus.value = 'idle'
  testLoading.value = false
  Object.assign(form, createDefaultForm())
  nodeTagItems.value = []
  tagIdSeed = 0
  regionDisplayLabel.value = ''

  const hasDefaultData = props.defaultData && Object.keys(props.defaultData).length > 0
  if (hasDefaultData) {
    applyDefaultData(props.defaultData as NodeFormDefaultData)
  } else {
    updateRegionDisplay(form.region)
  }

  if (!form.loginIp) {
    form.loginIp = form.networkType === 'public' ? form.publicIp : form.innerIp
  }

  formRef.value?.clearValidate()
  preloadRegionPath(form.region)
  updateRegionDisplay(form.region)
}

const applyDefaultData = (data: NodeFormDefaultData) => {
  if (!data) return
  const {
    region,
    regionCodes,
    regionLabel,
    nodeTags: nodeTagsRecord,
    tags,
    passwordKey,
    ...rest
  } = data

  Object.assign(form, rest)

  if (Array.isArray(regionCodes) && regionCodes.length) {
    form.region = [...regionCodes]
  } else if (Array.isArray(region)) {
    form.region = [...region]
  }

  if (typeof regionLabel === 'string' && regionLabel) {
    regionDisplayLabel.value = regionLabel
  } else if (typeof region === 'string' && region) {
    regionDisplayLabel.value = region
  }

  const tagSource = nodeTagsRecord ?? tags
  const tagList = convertTagsToList(tagSource)
  if (tagList.length) {
    nodeTagItems.value = tagList
  }

  if (passwordKey) {
    if (form.authMethod === 'password') {
      form.credentialPassword = passwordKey
      form.credentialKey = ''
    } else {
      form.credentialKey = passwordKey
      form.credentialPassword = ''
    }
  }
}

watch(
  () => [form.networkType, form.publicIp, form.innerIp],
  () => {
    if (form.networkType === 'public') {
      form.loginIp = form.publicIp
    } else {
      form.loginIp = form.innerIp
    }
    resetConnectivityStatus()
  }
)

watch(
  () => [form.innerIp, form.publicIp, form.loginAccount, form.loginPort],
  () => {
    resetConnectivityStatus()
  }
)

const addNodeTag = () => {
  if (nodeTagItems.value.length >= maxTags) return
  nodeTagItems.value.push({ id: ++tagIdSeed, key: '', value: '' })
}

const removeNodeTag = (index: number) => {
  nodeTagItems.value.splice(index, 1)
  resetConnectivityStatus()
}

const handleConnectivityTest = async () => {
  try {
    await formRef.value?.validateField()
  } catch (error) {
    ElMessage.error('请完善必填信息后再进行连通测试')
    return
  }
  connectivityStatus.value = 'idle'
  testLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await apiNodeSingleProbe({
      loginAccount: form.loginAccount,
      loginIp: form.loginIp,
      loginPort: form.loginPort,
      authMethod: form.authMethod,
      passwordKey: form.authMethod === 'password' ? form.credentialPassword : form.credentialKey
    })
    connectivityStatus.value = 'success'
    ElMessage.success('连通测试成功')
  } catch (error) {
    connectivityStatus.value = 'failed'
    ElMessage.closeAll()
    setTimeout(() => {
      ElMessage.error('连通测试失败')
    }, 10)
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

  const passwordKey = form.authMethod === 'password' ? form.credentialPassword : form.credentialKey
  const tagPayload = buildNodeTagsPayload()
  const submitForm: NodeFormSubmit = {
    ...form,
    nodeTags: tagPayload,
    region: regionDisplayLabel.value || getRegionLabelsByPath(form.region).join('-')
  }

  emit('save', {
    form: submitForm,
    passwordKey
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
:deep(.el-cascader) {
  width: 100%;
}
</style>
