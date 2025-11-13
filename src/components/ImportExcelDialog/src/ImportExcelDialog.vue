<template>
  <el-dialog v-model="visible" width="600px" :close-on-click-modal="false" :show-close="true">
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
        <el-table :data="errorData" border max-height="400" style="width: 100%">
          <el-table-column prop="hostId" label="主机ID" width="100" />
          <el-table-column prop="internalIp" label="内网IP" width="120" />
          <el-table-column prop="publicIp" label="公网IP" width="120" />
          <el-table-column prop="nodeTag" label="节点标签" width="100" />
          <el-table-column prop="os" label="操作系统" width="100" />
          <el-table-column prop="loginPort" label="登录端口" width="100" />
          <el-table-column prop="authMethod" label="认证方式" width="100" />
          <el-table-column prop="loginAccount" label="登录账号" width="120" />
          <el-table-column prop="loginIp" label="登录IP" width="120" />
          <el-table-column prop="hostname" label="主机名称" width="120" />
          <el-table-column prop="networkType" label="网络类型" width="100" />
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="vendorName" label="供应商名称" width="120" />
          <el-table-column prop="applicationType" label="应用类型" width="100" />
          <el-table-column prop="operator" label="运营商" width="100" />
          <el-table-column prop="remark" label="备注" min-width="150" />
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
import { ElMessage, ElLoading } from 'element-plus'
import {
  UploadFilled,
  Download,
  CircleCloseFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import type {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadProps,
  UploadRawFile
} from 'element-plus'
import { importNodesFromExcel, downloadExcelTemplate } from '@/api/node'
import { genFileId } from 'element-plus'
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

// 文件大小限制：20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

const handleFileChange = (file: UploadFile, files: UploadFiles) => {
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
    const response = await downloadExcelTemplate()
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
    const response = await importNodesFromExcel(formData)

    loadingInstance.close()

    if (response.data.success) {
      // 导入成功
      const count = response.data.count || 0
      // 显示成功消息（根据图片要求，显示两行内容）
      ElMessage({
        message: `导入成功\n已成功导入${count}个节点`,
        type: 'success',
        duration: 3000,
        showClose: true,
        dangerouslyUseHTMLString: true,
        customClass: 'import-success-toast'
      })

      emit('success', count)
      handleCancel()
    } else {
      // 导入失败，显示错误数据
      errorData.value = response.data.errorData || []
      errorDialogVisible.value = true
    }
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
  file.uid = genFileId()
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
