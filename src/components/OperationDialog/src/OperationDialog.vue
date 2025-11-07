<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="600"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" @submit.prevent>
      <!-- 用户名称（只读） -->
      <el-form-item v-if="showUserName" label="用户名称">
        <el-input :model-value="userName" readonly disabled />
      </el-form-item>

      <!-- 动态字段 -->
      <el-form-item
        v-for="field in fields"
        :key="field.prop"
        :label="field.label"
        :prop="field.prop"
        :required="field.required"
      >
        <!-- 选择器（单选） -->
        <el-select
          v-if="field.type === 'select'"
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

        <!-- 选择器（多选） -->
        <el-select
          v-else-if="field.type === 'multiSelect'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          multiple
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

        <!-- 密码输入框（只读显示6个星号） -->
        <template v-else-if="field.type === 'password'">
          <div class="password-input-wrapper">
            <el-input :model-value="'******'" readonly disabled />
            <div
              v-if="field.showGenerate"
              class="generate-link"
              @click="handleGeneratePassword(field.prop)"
            >
              一键生成
            </div>
          </div>
        </template>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { DocumentAdd } from '@element-plus/icons-vue'

export interface OperationField {
  prop: string
  label: string
  type: 'select' | 'multiSelect' | 'password'
  placeholder?: string
  required?: boolean
  showGenerate?: boolean // 仅用于密码类型
  options?: Array<{ label: string; value: any }>
  rules?: any[]
}

interface Props {
  visible: boolean
  title: string
  userName?: string
  showUserName?: boolean
  fields: OperationField[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  userName: '',
  showUserName: true,
  fields: () => [],
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', formData: Record<string, any>, done: (success: boolean) => void): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 生成密码规则（至少包含大小写字母、数字、特殊符号中的3种，长度8-32）
const generatePassword = () => {
  const length = Math.floor(Math.random() * 25) + 8 // 8-32 随机长度
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = lowercase + uppercase + numbers + special

  // 确保至少包含3种类型的字符
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  // 随机填充剩余字符
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // 打乱顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

const handleGeneratePassword = (prop: string) => {
  formData[prop] = generatePassword()
}

// 构建表单验证规则
const rules = computed<FormRules>(() => {
  const formRules: FormRules = {}
  props.fields.forEach((field) => {
    if (field.required || field.rules) {
      const fieldRules: any[] = []
      if (field.required) {
        fieldRules.push({
          required: true,
          message: `请${field.type === 'multiSelect' ? '选择' : '输入'}${field.label}`,
          trigger: field.type === 'select' || field.type === 'multiSelect' ? 'change' : 'blur'
        })
      }
      if (field.rules) {
        fieldRules.push(...field.rules)
      }
      formRules[field.prop] = fieldRules
    }
  })
  return formRules
})

// 初始化表单数据
const initFormData = () => {
  props.fields.forEach((field) => {
    if (field.type === 'multiSelect') {
      formData[field.prop] = []
    } else if (field.type === 'select') {
      formData[field.prop] = undefined
    } else {
      formData[field.prop] = ''
    }
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
    emit('confirm', { ...formData }, (success: boolean) => {
      if (success) {
        visible.value = false
      }
    })
  } catch (error) {
    console.log('表单验证失败', error)
  }
}
</script>

<style lang="less" scoped>
.password-input-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;

  .generate-link {
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
    color: #1664ff;
    &:hover {
      color: #409eff;
    }
  }
}

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
