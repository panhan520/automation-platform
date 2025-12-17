<template>
  <el-dialog
    v-model="dialogVisible"
    :width="440"
    :close-on-click-modal="false"
    class="delete-confirm-dialog"
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <div class="title">
          <div class="icon-wrapper" :id="titleId" :class="titleClass">
            <el-icon><WarningFilled /></el-icon> </div
          >{{ title }}</div
        >
        <el-icon class="close-btn" @click="close"><Close /></el-icon>
      </div>
    </template>
    <!-- <template #header="{ close, titleId, titleClass }">
      <div class="title">
        <div class="icon-wrapper">
          <el-icon><WarningFilled /></el-icon> </div
        >{{ title }}</div
      >
      <el-icon class="close-btn" @click="handleCancel"><Close /></el-icon>
    </template> -->
    <div class="dialog-body">
      <div class="content">
        <div class="description">
          <slot name="description"> 将删除【{{ targetName }}】，{{ description }} </slot>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="danger" :loading="loading" @click="handleConfirm">
          {{ confirmButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Close, WarningFilled } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    targetName?: string
    description?: string
    confirmButtonText?: string
    loading?: boolean
  }>(),
  {
    title: '删除确认',
    targetName: '',
    description: '删除后将无法恢复，请谨慎操作。',
    confirmButtonText: '删除',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<style scoped lang="less">
.delete-confirm-dialog {
  :deep(.el-dialog__body) {
    padding: 24px 24px 12px;
  }
}
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
  .title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1d2129;
    display: flex;
    align-items: center;
    .icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #fff3e8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ff9f43;
      margin-right: 10px;
      border-radius: 50%;

      :deep(.el-icon) {
        font-size: 20px;
      }
    }
  }
}
.dialog-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  position: relative;

  .content {
    flex: 1;
    margin-left: 27px;

    .description {
      color: #4e5969;
      line-height: 22px;
      font-size: 14px;
    }
  }

  .close-btn {
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    color: #c9cdd4;

    &:hover {
      color: #86909c;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
