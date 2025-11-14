<template>
  <div class="template-management-page">
    <ManagementList
      :title="title"
      :table-data="displayTableData"
      :loading="loading"
      :total-records="totalRecords"
      :toolbar-buttons="toolbarButtons"
      :filters="toolbarFilters"
      :query-params="queryParams"
      @search="handleSearch"
      @refresh="handleRefresh"
      @page-change="handlePageChange"
    >
      <template #columns>
        <el-table-column prop="templateName" label="模版名称" />
        <el-table-column prop="templateType" label="模版类型">
          <template #default="scope">
            <el-tag :type="getTemplateTypeTagType(scope.row.templateType)">{{
              scope.row.templateType
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="templateContent" label="模版内容" :show-overflow-tooltip="true" />
        <el-table-column prop="description" label="描述信息" />
        <TableActionsColumn :actions="tableActions" @edit="handleEdit" @action="handleMoreAction" />
      </template>
    </ManagementList>

    <!-- 新建/编辑模版 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="新建模版"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateRules"
        label-width="100px"
      >
        <el-form-item label="模版类型" prop="templateType">
          <el-select
            v-model="templateForm.templateType"
            placeholder="请选择模版类型"
            style="width: 100%"
          >
            <el-option v-for="type in templateTypes" :key="type" :label="type" :value="type" />
          </el-select>
          <el-link type="primary" class="inline-link" @click="openTypeDialog">添加类型</el-link>
        </el-form-item>

        <el-form-item label="模版名称" prop="templateName">
          <el-input v-model="templateForm.templateName" placeholder="请输入模版名称" />
        </el-form-item>

        <el-form-item label="脚本语言" required>
          <el-segmented
            v-model="templateForm.scriptLanguage"
            :options="scriptLanguageOptions"
            block
          />
          <div class="form-tip">
            当前仅 Shell 支持引用全局变量（当参数类型中含有“命令空间类型”时）
          </div>
        </el-form-item>

        <el-form-item label="模版内容" prop="templateContent">
          <el-input
            v-model="templateForm.templateContent"
            type="textarea"
            rows="10"
            placeholder="请输入模版内容"
          />
        </el-form-item>

        <el-form-item label="参数化">
          <el-link type="primary" class="inline-link" @click="openParameterDialog">
            添加参数
          </el-link>
          <div v-if="parameterList.length" class="param-list">
            <el-tag
              v-for="param in parameterList"
              :key="param.id"
              closable
              @close="removeParameter(param.id)"
            >
              {{ param.name }}（{{ param.typeLabel }}）
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="目标主机">
          <el-link type="primary" class="inline-link" @click="openHostDialog"> 选择主机 </el-link>
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
            v-model="templateForm.remark"
            type="textarea"
            rows="3"
            placeholder="请输入模版备注信息"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="templateDialogLoading" @click="handleTemplateSave">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加模版类型 -->
    <el-dialog v-model="typeDialogVisible" title="添加模版类型" width="360px">
      <el-form :model="newTypeForm" ref="typeFormRef" :rules="typeRules" label-width="90px">
        <el-form-item label="模版类型" prop="type">
          <el-input v-model="newTypeForm.type" placeholder="请输入模版类型" />
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
          <el-segmented
            v-model="parameterForm.type"
            :options="parameterTypeOptions"
            block
            :disabled="templateForm.scriptLanguage !== 'Shell' && parameterForm.type === 'command'"
          />
        </el-form-item>
        <el-form-item v-if="parameterForm.type === 'select'" label="可选项" prop="optionsText">
          <el-input
            v-model="parameterForm.optionsText"
            type="textarea"
            rows="3"
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
            rows="2"
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

    <!-- 选择主机 -->
    <el-dialog v-model="hostDialogVisible" title="选择主机" width="820px">
      <div class="host-dialog-body">
        <div class="host-table">
          <div class="host-search">
            <el-input
              v-model="hostFilters.hostId"
              placeholder="搜索主机ID"
              clearable
              prefix-icon="Search"
            />
            <el-input
              v-model="hostFilters.internalIp"
              placeholder="搜索内网IP"
              clearable
              prefix-icon="Search"
            />
            <el-input
              v-model="hostFilters.publicIp"
              placeholder="搜索公网IP"
              clearable
              prefix-icon="Search"
            />
          </div>
          <el-table
            :data="filteredHosts"
            @selection-change="handleHostSelection"
            height="320"
            ref="hostTableRef"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="hostId" label="主机ID" width="120" />
            <el-table-column prop="hostName" label="主机名称" />
            <el-table-column prop="publicIp" label="公网IP" />
            <el-table-column prop="internalIp" label="内网IP" />
          </el-table>
          <div class="host-pagination">
            <div>总数 {{ availableHosts.length }}</div>
            <el-pagination
              layout="prev, pager, next"
              :total="availableHosts.length"
              :page-size="10"
            />
          </div>
        </div>
        <div class="selected-panel">
          <div class="panel-title">已选主机({{ selectedHostTemp.length }})</div>
          <el-empty v-if="selectedHostTemp.length === 0" description="暂无数据" />
          <el-scrollbar v-else height="320px">
            <div v-for="host in selectedHostTemp" :key="host.hostId" class="selected-item">
              <div class="info">
                <div class="id">[{{ host.hostId }}] {{ host.hostName }}</div>
                <div class="ip">{{ host.internalIp }}</div>
              </div>
              <el-button type="text" @click="removeTempHost(host.hostId)">移除</el-button>
            </div>
          </el-scrollbar>
          <el-button text type="danger" @click="clearTempHosts">清空所有</el-button>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="hostDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleHostConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ManagementList } from '@/components/ManagementList'
import { Search } from '@element-plus/icons-vue'
import { TableActionsColumn } from '@/components/TableActionsColumn'

const templateDialogVisible = ref(false)
const templateDialogLoading = ref(false)
const templateFormRef = ref()

const title = '模版管理'
const allTemplates = ref([])
const loading = ref(false)
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const toolbarButtons = [
  {
    key: 'create',
    label: '新建模版',
    type: 'primary',
    onClick: () => openCreateTemplateDialog()
  }
]

const tableActions = [
  {
    key: 'delete',
    label: '删除',
    divided: true,
    danger: true
  }
]

const filteredTemplates = computed(() => {
  return allTemplates.value.filter((item) =>
    queryParams.keyword
      ? item.templateName.toLowerCase().includes(queryParams.keyword.toLowerCase())
      : true
  )
})

const toolbarFilters = [
  {
    key: 'keyword',
    type: 'input',
    placeholder: '搜索模版名称',
    width: 260,
    prefixIcon: Search
  }
]

const displayTableData = computed(() => {
  const start = (queryParams.page - 1) * queryParams.pageSize
  return filteredTemplates.value.slice(start, start + queryParams.pageSize)
})

const totalRecords = computed(() => filteredTemplates.value.length)

const templateTypes = ref(['部署模版', '监控模版', '备份模版', '维护模版', '安全模版'])
const templateForm = reactive({
  templateType: '',
  templateName: '',
  scriptLanguage: 'Shell',
  templateContent: '',
  remark: ''
})

const templateRules = {
  templateType: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  templateContent: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const scriptLanguageOptions = [
  { label: 'Shell', value: 'Shell' },
  { label: 'Python', value: 'Python' }
]

const parameterList = ref([])
const parameterDialogVisible = ref(false)
const parameterFormRef = ref()
const parameterForm = reactive({
  id: 0,
  name: '',
  variable: '',
  type: 'text',
  optionsText: '',
  hostAttribute: '',
  required: false,
  defaultValue: '',
  hint: ''
})

const parameterRules = {
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

// 添加类型
const typeDialogVisible = ref(false)
const typeFormRef = ref()
const newTypeForm = reactive({
  type: ''
})
const typeRules = {
  type: [{ required: true, message: '请输入模版类型', trigger: 'blur' }]
}

const hostDialogVisible = ref(false)
const hostTableRef = ref()
const availableHosts = ref([
  { hostId: '1', hostName: '名称1', publicIp: '192.21.0.11', internalIp: '172.21.0.12' },
  { hostId: '3', hostName: '名称A', publicIp: '121.199.4.33', internalIp: '172.21.0.10' },
  { hostId: '6', hostName: '名称B', publicIp: '192.168.0.22', internalIp: '172.21.0.11' },
  { hostId: '9', hostName: '名称123', publicIp: '192.168.0.33', internalIp: '172.21.0.1' },
  { hostId: '10', hostName: 'ABCDE', publicIp: '192.168.0.44', internalIp: '172.21.0.15' }
])
const hostFilters = reactive({
  hostId: '',
  internalIp: '',
  publicIp: ''
})
const selectedHostTemp = ref([])
const selectedHosts = ref([])

const filteredHosts = computed(() =>
  availableHosts.value.filter((host) => {
    const matchHostId = hostFilters.hostId ? host.hostId.includes(hostFilters.hostId) : true
    const matchInternal = hostFilters.internalIp
      ? host.internalIp.includes(hostFilters.internalIp)
      : true
    const matchPublic = hostFilters.publicIp ? host.publicIp.includes(hostFilters.publicIp) : true
    return matchHostId && matchInternal && matchPublic
  })
)
const openCreateTemplateDialog = () => {
  templateForm.templateType = ''
  templateForm.templateName = ''
  templateForm.scriptLanguage = 'Shell'
  templateForm.templateContent = ''
  templateForm.remark = ''
  parameterList.value = []
  selectedHosts.value = []
  selectedHostTemp.value = []
  templateDialogVisible.value = true
}

const getTemplateTypeTagType = (type) => {
  const map = {
    部署模版: 'primary',
    监控模版: 'success',
    备份模版: 'warning',
    维护模版: 'info',
    安全模版: 'danger'
  }
  return map[type] || 'info'
}

const getList = async () => {
  try {
    loading.value = true
    // TODO: 调用API获取数据
    allTemplates.value = [
      {
        id: 1,
        templateName: 'Nginx部署模版',
        templateType: '部署模版',
        templateContent: '#!/bin/bash apt-get update apt-get install -y ngi...',
        description: '用于快速部署Nginx服务器的标准模版'
      },
      {
        id: 2,
        templateName: '系统监控模版',
        templateType: '监控模版',
        templateContent: '#!/bin/bash ps aux | grep nginx df -h free -m ne...',
        description: '监控系统资源使用情况和服务状态'
      }
    ]
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  queryParams.keyword = params.keyword || ''
  queryParams.page = 1
}

const handleRefresh = () => {
  getList()
}

const handlePageChange = (page, pageSize) => {
  queryParams.page = page
  queryParams.pageSize = pageSize
}

const handleEdit = (row) => {
  templateForm.templateType = row.templateType
  templateForm.templateName = row.templateName
  templateForm.scriptLanguage = 'Shell'
  templateForm.templateContent = row.templateContent
  templateForm.remark = row.description
  templateDialogVisible.value = true
}

const handleMoreAction = (action, row) => {
  switch (action) {
    case 'delete':
      handleDelete(row)
      break
    default:
      ElMessage.info('功能待实现')
  }
}

const handleDelete = async (row) => {
  try {
    loading.value = true
    // TODO: 调用API删除
    ElMessage.success(`删除模版 ${row.templateName} 成功`)
    getList()
  } catch (error) {
    ElMessage.error('删除模版失败')
  } finally {
    loading.value = false
  }
}

const handleTemplateSave = () => {
  templateFormRef.value?.validate((valid) => {
    if (!valid) return
    templateDialogLoading.value = true
    setTimeout(() => {
      ElMessage.success('创建成功')
      templateDialogLoading.value = false
      templateDialogVisible.value = false
      getList()
    }, 800)
  })
}

const openTypeDialog = () => {
  newTypeForm.type = ''
  typeDialogVisible.value = true
}

const handleAddTemplateType = () => {
  typeFormRef.value?.validate((valid) => {
    if (!valid) return
    if (!templateTypes.value.includes(newTypeForm.type)) {
      templateTypes.value.push(newTypeForm.type)
      ElMessage.success('添加成功')
    } else {
      ElMessage.warning('该类型已存在')
    }
    typeDialogVisible.value = false
  })
}

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

const handleParameterConfirm = () => {
  parameterFormRef.value?.validate((valid) => {
    if (!valid) return
    const item = {
      id: parameterForm.id,
      name: parameterForm.name,
      variable: parameterForm.variable,
      type: parameterForm.type,
      typeLabel: parameterTypeOptions.find((opt) => opt.value === parameterForm.type)?.label || '',
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
          return { value: value?.trim() || line, label: (label || value).trim() }
        })
    }
    if (parameterForm.type === 'command') {
      item.hostAttribute = parameterForm.hostAttribute
    }
    parameterList.value.push(item)
    parameterDialogVisible.value = false
  })
}

const removeParameter = (id) => {
  parameterList.value = parameterList.value.filter((item) => item.id !== id)
}

const openHostDialog = () => {
  selectedHostTemp.value = [...selectedHosts.value]
  hostDialogVisible.value = true
}

const handleHostSelection = (selection) => {
  selectedHostTemp.value = selection
}

const removeTempHost = (hostId) => {
  selectedHostTemp.value = selectedHostTemp.value.filter((host) => host.hostId !== hostId)
}

const clearTempHosts = () => {
  selectedHostTemp.value = []
  hostTableRef.value?.clearSelection()
}

const handleHostConfirm = () => {
  selectedHosts.value = [...selectedHostTemp.value]
  hostDialogVisible.value = false
}

const removeSelectedHost = (hostId) => {
  selectedHosts.value = selectedHosts.value.filter((host) => host.hostId !== hostId)
}

onMounted(() => {
  getList()
})
</script>

<style lang="less" scoped>
.template-management-page {
  padding-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.inline-link {
  margin-left: 12px;
}

.param-list,
.selected-hosts {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.host-dialog-body {
  display: flex;
  gap: 16px;

  .host-table {
    flex: 1;

    .host-search {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .host-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .selected-panel {
    width: 240px;
    border-left: 1px solid #f0f0f0;
    padding-left: 12px;

    .panel-title {
      font-weight: 600;
      margin-bottom: 12px;
    }

    .selected-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 8px;

      .info {
        .id {
          font-size: 13px;
          font-weight: 600;
        }

        .ip {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>
