<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="500"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="delete-content">
      <el-icon class="warning-icon"><WarningFilled /></el-icon>
      <div class="delete-message">{{ message }}</div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="danger" @click="handleConfirm" :loading="loading">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  title?: string
  message?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '确认删除',
  message: '确定要删除吗？',
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style lang="less" scoped>
.delete-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;

  .warning-icon {
    font-size: 24px;
    color: #e6a23c;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .delete-message {
    flex: 1;
    font-size: 14px;
    color: #606266;
    line-height: 1.5;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
