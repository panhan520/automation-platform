<template>
  <el-dialog
    v-model="visible"
    width="600px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="handleCancel"
  >
    <template #header>
      <div class="dialog-header-success">
        <el-icon class="success-header-icon"><CircleCheckFilled /></el-icon>
        <span class="dialog-title">导入Excel</span>
      </div>
    </template>
    <div class="import-excel-dialog">
      <!-- 文件上传区域 -->
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        :on-exceed="handleExceed"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将文件拖到此处或点击上传</div>
      </el-upload>

      <!-- 文件限制说明 -->
      <div class="file-restrictions"> 只能上传xlsx文件,且不超过20MB </div>

      <!-- 下载模板 -->
      <div class="download-template">
        <el-link type="primary" :underline="false" @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          <span>下载模板</span>
        </el-link>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!selectedFile"
          @click="handleConfirm"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 导入失败对话框 -->
  <el-dialog
    v-model="errorDialogVisible"
    width="800px"
    :close-on-click-modal="false"
    title="导入失败"
  >
    <div class="import-error-dialog">
      <div class="error-message">
        <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
        <span>
          以下表格行存在不符合要求的情况,导致整个文件导入失败。请修正相关行后重新上传完整文件。
        </span>
      </div>
      <div class="error-table-wrapper">
        <el-table
          :data="displayErrorTable"
          border
          max-height="320"
          style="width: 100%; overflow-y: auto"
          :span-method="errorSpanMethod"
          :row-class-name="getErrorRowClass"
        >
          <el-table-column prop="innerIp" label="内网IP" width="120">
            <template #default="scope">
              <template v-if="scope.row.__rowType === 'error'">
                <div class="error-row-cell">
                  <div class="error-row-title">
                    <el-icon class="error-icon"><Warning /></el-icon>
                    <span>
                      {{
                        scope.row.rowNumber
                          ? `第${scope.row.rowNumber}行数据校验失败`
                          : '该行数据校验失败'
                      }}
                    </span>
                  </div>
                  <ul class="error-row-list">
                    <li v-for="(msg, idx) in scope.row.errorMessageLines" :key="idx">
                      {{ msg }}
                    </li>
                  </ul>
                </div>
              </template>
              <template v-else>
                {{ scope.row.innerIp }}
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="publicIp" label="公网IP" width="120" />
          <el-table-column prop="nodeTags" label="节点标签" width="100">
            <template #default="scope">
              {{ formatObjectValue(scope.row.nodeTags) }}
            </template>
          </el-table-column>
          <el-table-column prop="os" label="操作系统" width="100" />
          <el-table-column prop="loginPort" label="登录端口" width="100" />
          <el-table-column prop="authMethod" label="认证方式" width="100">
            <template #default="scope">
              {{
                scope.row.authMethod === 'password'
                  ? '密码'
                  : scope.row.authMethod === 'key'
                    ? '密钥'
                    : scope.row.authMethod
              }}
            </template>
          </el-table-column>
          <el-table-column prop="loginAccount" label="登录账号" width="120" />
          <el-table-column prop="loginIp" label="登录IP" width="120" />
          <el-table-column prop="hostName" label="主机名称" width="120" />
          <el-table-column prop="networkType" label="网络类型" width="100">
            <template #default="scope">
              {{
                scope.row.networkType === 'public'
                  ? '公网'
                  : scope.row.networkType === 'private'
                    ? '内网'
                    : scope.row.networkType
              }}
            </template>
          </el-table-column>
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="vendorName" label="供应商名称" width="120" />
          <el-table-column prop="appType" label="应用类型" width="100" />
          <el-table-column prop="operator" label="运营商" width="100" />
          <el-table-column prop="remark" label="备注" min-width="100" />
        </el-table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">知道了</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElLoading, ElNotification } from 'element-plus'
import {
  UploadFilled,
  Download,
  CircleCloseFilled,
  CircleCheckFilled,
  Warning
} from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance, UploadProps, UploadRawFile } from 'element-plus'
import { apiNodeImport, apiGetNodeDownload } from '@/api/node'
// import { genFileId } from 'element-plus'
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', count: number): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const errorDialogVisible = ref(false)
const errorData = ref<any[]>([])
const errorsList = ref<string[]>([])
const TOTAL_ERROR_COLUMNS = 15

const extractRowNumber = (message?: string) => {
  if (!message) return undefined
  const match = message.match(/第(\d+)行/)
  return match ? Number(match[1]) : undefined
}

const normalizeErrorDetails = (message?: string) => {
  if (!message) return []
  const payload = message.split('：').slice(1).join('：').trim()

  // 只处理第一个 [ 和最后一个 ]
  let content = payload
  const firstBracketIndex = content.indexOf('[')
  const lastBracketIndex = content.lastIndexOf(']')

  if (firstBracketIndex !== -1 && lastBracketIndex !== -1 && lastBracketIndex > firstBracketIndex) {
    // 提取第一个 [ 和最后一个 ] 之间的内容
    content = content.substring(firstBracketIndex + 1, lastBracketIndex)

    // 移除首尾的引号
    content = content.replace(/^['"]+|['"]+$/g, '')

    // 只按最外层的逗号分割，保留内部的数组结构
    const segments: string[] = []
    let currentSegment = ''
    let bracketDepth = 0
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < content.length; i++) {
      const char = content[i]

      if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuotes = false
          quoteChar = ''
        }
        currentSegment += char
      } else if (char === '[' && !inQuotes) {
        bracketDepth++
        currentSegment += char
      } else if (char === ']' && !inQuotes) {
        bracketDepth--
        currentSegment += char
      } else if (char === ',' && bracketDepth === 0 && !inQuotes) {
        // 只在最外层且不在引号内时分割
        const trimmed = currentSegment.replace(/^['"]+|['"]+$/g, '').trim()
        if (trimmed) {
          segments.push(trimmed)
        }
        currentSegment = ''
      } else {
        currentSegment += char
      }
    }

    // 添加最后一个片段
    if (currentSegment.trim()) {
      const trimmed = currentSegment.replace(/^['"]+|['"]+$/g, '').trim()
      if (trimmed) {
        segments.push(trimmed)
      }
    }

    if (segments.length > 0) {
      return segments
    }
  }

  // 如果没有找到括号，返回原始消息
  return [message]
}

const normalizedErrorList = computed(() =>
  errorsList.value.map((msg) => normalizeErrorDetails(msg))
)

const displayErrorTable = computed(() => {
  const rows: any[] = []
  errorData.value.forEach((row, index) => {
    rows.push({
      ...row,
      __rowIndex: index,
      __rowType: 'data'
    })
    const errorMessages = normalizedErrorList.value[index]
    if (errorMessages && errorMessages.length) {
      rows.push({
        __rowType: 'error',
        __rowIndex: index,
        rowNumber: extractRowNumber(errorsList.value[index]),
        errorMessageLines: errorMessages
      })
    }
  })
  return rows
})

const errorSpanMethod = ({ row, columnIndex }: { row: any; columnIndex: number }) => {
  if (row.__rowType === 'error') {
    if (columnIndex === 0) {
      return [1, TOTAL_ERROR_COLUMNS]
    }
    return [0, 0]
  }
  return [1, 1]
}

const getErrorRowClass = ({ row }: { row: any }) => {
  return row.__rowType === 'error' ? 'error-row' : ''
}

// 文件大小限制：20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

const handleFileChange = (file: UploadFile) => {
  const rawFile = file.raw
  if (!rawFile) return

  // 验证文件类型
  if (!rawFile.name.endsWith('.xlsx')) {
    ElMessage.error('只支持上传xlsx文件且不超过20MB')
    uploadRef.value?.clearFiles()
    selectedFile.value = null
    return
  }

  // 验证文件大小
  if (rawFile.size > MAX_FILE_SIZE) {
    ElMessage.error('只支持上传xlsx文件且不超过20MB')
    uploadRef.value?.clearFiles()
    selectedFile.value = null
    return
  }

  selectedFile.value = rawFile
}

const handleFileRemove = () => {
  selectedFile.value = null
}

const handleDownloadTemplate = async () => {
  try {
    const response = await apiGetNodeDownload()
    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '节点导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
  }
}

const formatObjectValue = (obj: Record<string, any>) => {
  if (!obj || typeof obj !== 'object') return ''

  return Object.entries(obj)
    .map(([key, value]) => {
      // 确保value是数字类型才进行转换
      const formattedValue =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && !isNaN(Number(value))
            ? Number(value)
            : value
      return `${key}:${formattedValue}`
    })
    .join(', ')
}

const handleCancel = () => {
  uploadRef.value?.clearFiles()
  selectedFile.value = null
  visible.value = false
}

const handleConfirm = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    loading.value = true

    // 显示全屏loading
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '导入中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    const formData = new FormData()
    formData.append('file', selectedFile.value)
    console.log(formData)
    const response = await apiNodeImport(formData)

    loadingInstance.close()

    if (response.data.total) {
      // 导入成功
      const total = response.data.total || 0
      // 显示成功消息
      ElNotification({
        title: '导入成功',
        message: `已成功导入${total}个节点`,
        type: 'success'
      })

      emit('success', total)
    } else {
      // 导入失败，显示错误数据
      errorData.value = response.data.list || []
      errorsList.value = response.message || []
      errorDialogVisible.value = true
    }
    handleCancel()
  } catch (error: any) {
    ElLoading.service().close()
    if (error.response?.data?.errorData) {
      // 有错误数据，显示错误对话框
      errorData.value = error.response.data.errorData
      errorDialogVisible.value = true
    } else {
      ElMessage.error(error?.message || '导入失败')
    }
  } finally {
    loading.value = false
  }
}

const handleExceed: UploadProps['onExceed'] = (files) => {
  selectedFile.value = null
  const file = files[0] as UploadRawFile
  // file.uid = genFileId()
  // 创建完整的UploadFile对象
  const uploadFile: UploadFile = {
    name: file.name,
    percentage: 0,
    status: 'ready',
    size: file.size,
    uid: file.uid,
    raw: file
  }
  selectedFile.value = file
  fileList.value = [uploadFile]
}
</script>

<style lang="less" scoped>
.import-excel-dialog {
  .upload-area {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }

    .upload-icon {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 16px;
    }

    .upload-text {
      color: #606266;
      font-size: 14px;
    }
  }

  .file-restrictions {
    margin-top: 10px;
    color: #909399;
    font-size: 13px;
  }

  .download-template {
    margin-top: 10px;

    .el-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.dialog-header-success {
  display: flex;
  align-items: center;
  gap: 8px;

  .success-header-icon {
    color: #67c23a;
    font-size: 20px;
  }

  .dialog-title {
    font-size: 16px;
    font-weight: 500;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .error-header-icon {
    color: #f56c6c;
    font-size: 20px;
  }

  .dialog-title {
    font-size: 16px;
    font-weight: 500;
  }
}

.import-error-dialog {
  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
    color: #606266;
    font-size: 14px;
    line-height: 1.6;

    .error-icon {
      color: #f56c6c;
      font-size: 18px;
      margin-top: 2px;
      flex-shrink: 0;
    }
  }

  .error-table-wrapper {
    max-height: 400px;
    overflow: auto;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.error-row {
  background-color: #fff7f7;
}
.error-row-cell {
  color: #d14b4b;
  font-size: 13px;

  .error-row-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  .error-row-list {
    margin: 6px 0 0 18px;
    padding: 0;
    list-style: disc;
    color: #b91c1c;
    li {
      list-style: none;
    }
  }
}
</style>

<style lang="less">
// 全局样式：导入成功消息
.import-success-toast {
  .el-message__content {
    white-space: pre-line;
    line-height: 1.6;
  }
}
</style>
