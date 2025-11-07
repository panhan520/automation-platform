<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="600"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" @submit.prevent>
      <el-form-item
        v-for="field in fields"
        :key="field.prop"
        :label="field.label"
        :prop="field.prop"
        :required="field.required"
      >
        <!-- 邮箱输入框 -->
        <el-input
          v-if="field.type === 'email'"
          v-model="formData[field.prop]"
          placeholder="请输入邮箱地址"
          clearable
        />
        <!-- 选择器 -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
          <template v-if="!field.options || field.options.length === 0" #empty>
            <div class="empty-select">
              <el-icon class="empty-icon"><DocumentAdd /></el-icon>
              <div class="empty-text">暂无数据</div>
            </div>
          </template>
        </el-select>
        <!-- 多行文本 -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.prop]"
          type="textarea"
          :placeholder="field.placeholder"
          :maxlength="field.maxlength"
          :show-word-limit="field.showWordLimit"
          :rows="field.rows || 3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { DocumentAdd } from '@element-plus/icons-vue'

export interface InviteFormField {
  prop: string
  label: string
  type: 'email' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  maxlength?: number
  showWordLimit?: boolean
  rows?: number
  options?: Array<{ label: string; value: any }>
  rules?: any[]
}

interface Props {
  visible: boolean
  title?: string
  fields: InviteFormField[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '邀请',
  fields: () => []
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', formData: Record<string, any>): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 构建表单验证规则
const rules = computed<FormRules>(() => {
  const formRules: FormRules = {}
  props.fields.forEach((field) => {
    if (field.required || field.rules) {
      const fieldRules: any[] = []
      if (field.required) {
        fieldRules.push({
          required: true,
          message: `请输入${field.label}`,
          trigger: field.type === 'select' ? 'change' : 'blur'
        })
      }
      if (field.rules) {
        fieldRules.push(...field.rules)
      }
      // 邮箱验证
      if (field.type === 'email') {
        fieldRules.push({
          type: 'email',
          message: '请输入正确的邮箱地址',
          trigger: 'blur'
        })
      }
      formRules[field.prop] = fieldRules
    }
  })
  return formRules
})

// 初始化表单数据
const initFormData = () => {
  props.fields.forEach((field) => {
    formData[field.prop] = field.type === 'select' ? undefined : ''
  })
}

// 监听 visible 变化，初始化表单
watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData()
    } else {
      formRef.value?.resetFields()
    }
  },
  { immediate: true }
)

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  formRef.value?.resetFields()
  emit('cancel')
}

const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    emit('confirm', { ...formData })
    visible.value = false
  } catch (error) {
    console.log('表单验证失败', error)
  }
}
</script>

<style lang="less" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.empty-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #909399;

  .empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
  }
}
</style>
