<template>
  <el-dialog
    v-model="visible"
    :title="computedTitle"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      @submit.prevent
    >
      <!-- 用户名称（只读） -->
      <el-form-item v-if="showUserName" :label="userNameLabel || '用户名称'">
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
        <!-- 输入框 -->
        <el-input
          v-if="field.type === 'input'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder"
          :maxlength="field.maxlength"
          :show-word-limit="field.showWordLimit"
          :readonly="field.readonly"
          :disabled="field.disabled"
          clearable
        />
        <!-- 邮箱输入框 -->
        <el-input
          v-else-if="field.type === 'email'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请输入邮箱地址'"
          :readonly="field.readonly"
          :disabled="field.disabled"
          clearable
        />
        <!-- 密码输入框 -->
        <template v-else-if="field.type === 'password'">
          <div class="password-input-wrapper">
            <!-- 只读模式：显示指定值或6个星号 -->
            <el-input
              v-if="field.readonly"
              :model-value="field.readonlyValue || '******'"
              readonly
              disabled
            />
            <!-- 编辑模式：正常输入 -->
            <template v-else>
              <el-popover
                v-if="field.showPasswordStrength"
                placement="bottom"
                :width="380"
                :visible="!!formData[field.prop] && isPopoverVisible"
                trigger="hover"
              >
                <template #reference>
                  <el-input
                    v-model="formData[field.prop]"
                    type="password"
                    :placeholder="field.placeholder"
                    :maxlength="field.maxlength"
                    show-password
                    clearable
                  />
                </template>
                <!-- 校验提示 -->
                <div class="password-check-list">
                  <div :class="['check-item', validRule.containsTypes ? 'ok' : 'fail']">
                    <el-icon v-if="validRule.containsTypes"><SuccessFilled /></el-icon>
                    <el-icon v-else><CircleCloseFilled /></el-icon>
                    <span>同时包含大、小写字母、数字和特殊符号至少 3 种</span>
                  </div>
                  <div :class="['check-item', validRule.validChars ? 'ok' : 'fail']">
                    <el-icon v-if="validRule.validChars"><SuccessFilled /></el-icon>
                    <el-icon v-else><CircleCloseFilled /></el-icon>
                    <span>仅支持字母、数字、特殊字符（除空格）</span>
                  </div>
                  <div :class="['check-item', validRule.validLength ? 'ok' : 'fail']">
                    <el-icon v-if="validRule.validLength"><SuccessFilled /></el-icon>
                    <el-icon v-else><CircleCloseFilled /></el-icon>
                    <span>长度为 8–32 个字符</span>
                  </div>
                </div>
              </el-popover>
              <el-input
                v-else
                v-model="formData[field.prop]"
                type="password"
                :placeholder="field.placeholder"
                :maxlength="field.maxlength"
                show-password
                clearable
              />
              <div
                v-if="field.showGenerate"
                class="generate-link"
                @click="handleGeneratePassword(field.prop)"
              >
                一键生成
              </div>
            </template>
          </div>
          <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
        </template>
        <!-- 选择器（单选） -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          :readonly="field.readonly"
          :disabled="field.disabled"
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
          :readonly="field.readonly"
          :disabled="field.disabled"
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
        <!-- 多行文本 -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.prop]"
          type="textarea"
          :placeholder="field.placeholder"
          :maxlength="field.maxlength"
          :show-word-limit="field.showWordLimit"
          :readonly="field.readonly"
          :disabled="field.disabled"
          :rows="field.rows || 3"
        />
        <!-- 提示信息 -->
        <div v-if="field.hint && field.type !== 'password'" class="field-hint">
          {{ field.hint }}
        </div>
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
import { ref, computed, watch, reactive, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { DocumentAdd, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'

export interface FormField {
  prop: string
  label: string
  type: 'input' | 'email' | 'password' | 'select' | 'multiSelect' | 'textarea'
  placeholder?: string
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  maxlength?: number
  showWordLimit?: boolean
  hint?: string
  rows?: number
  showGenerate?: boolean // 仅用于密码类型
  showPasswordStrength?: boolean // 是否显示密码强度提示
  readonlyValue?: string // 只读模式下显示的值
  options?: Array<{ label: string; value: any }> // 仅用于select类型
  rules?: any[] // 自定义验证规则
}

interface Props {
  visible: boolean
  title?: string
  createTitle?: string
  editTitle?: string
  width?: string | number
  labelWidth?: string
  fields: FormField[]
  defaultFormData?: Record<string, any>
  isEdit?: boolean
  showUserName?: boolean
  userName?: string
  userNameLabel?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  createTitle: '新建',
  editTitle: '编辑',
  width: 600,
  labelWidth: '120px',
  fields: () => [],
  defaultFormData: () => ({}),
  isEdit: false,
  showUserName: false,
  userName: '',
  userNameLabel: '用户名称',
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', formData: Record<string, any>, done: (success: boolean) => void): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})
const isPopoverVisible = ref(false)

// 密码校验规则
const validRule = reactive({
  containsTypes: false,
  validChars: false,
  validLength: false
})

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const computedTitle = computed(() => {
  if (props.title) return props.title
  return props.isEdit ? props.editTitle : props.createTitle
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

// 监听密码变化，更新校验规则
watch(
  () => formData,
  (newData) => {
    const passwordField = props.fields.find((f) => f.type === 'password' && f.showPasswordStrength)
    if (passwordField && newData[passwordField.prop]) {
      const password = newData[passwordField.prop]
      // 检查是否包含至少3种类型
      const hasLower = /[a-z]/.test(password)
      const hasUpper = /[A-Z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const hasSpecial = /[^a-zA-Z0-9\s]/.test(password)
      const typeCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
      validRule.containsTypes = typeCount >= 3

      // 检查字符是否有效（不含空格）
      validRule.validChars = !/\s/.test(password)

      // 检查长度
      validRule.validLength = password.length >= 8 && password.length <= 32
    }
  },
  { deep: true }
)
watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 打开弹窗：初始化表单数据
      // 清除上次的校验状态
      console.log('visible', val)
      initFormData()
    } else {
      console.log('visible-close', val)
      // 关闭弹窗：重置字段
      formRef.value?.resetFields()
      // 再次确保清空校验状态
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

// 构建表单验证规则
const rules = computed<FormRules>(() => {
  const formRules: FormRules = {}
  props.fields.forEach((field) => {
    if (field.required || field.rules) {
      const fieldRules: any[] = []
      if (field.required && !field.readonly) {
        fieldRules.push({
          required: true,
          message: `请${field.type === 'select' || field.type === 'multiSelect' ? '选择' : '输入'}${field.label}`,
          trigger: field.type === 'select' || field.type === 'multiSelect' ? 'change' : 'change'
        })
      }
      if (field.rules) {
        fieldRules.push(...field.rules)
      }
      // 密码验证规则
      if (field.type === 'password') {
        fieldRules.push({
          min: 8,
          max: 32,
          message: '密码长度为 8–32 个字符',
          trigger: 'change'
        })
        fieldRules.push({
          validator: (_rule: any, value: string, callback: any) => {
            if (!value) {
              callback()
              return
            }
            // 检查是否包含空格
            if (/\s/.test(value)) {
              callback(new Error('密码不能包含空格'))
              return
            }
            // 检查字符类型（仅支持字母、数字、特殊字符）
            if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/.test(value)) {
              callback(new Error('密码仅支持字母、数字、特殊字符（除空格）'))
              return
            }
            // 检查是否至少包含3种类型（大小写字母、数字、特殊符号）
            let typeCount = 0
            if (/[a-z]/.test(value)) typeCount++ // 小写字母
            if (/[A-Z]/.test(value)) typeCount++ // 大写字母
            if (/[0-9]/.test(value)) typeCount++ // 数字
            if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(value)) typeCount++ // 特殊符号

            if (typeCount < 3) {
              callback(new Error('密码需同时包含大、小写字母、数字和特殊符号至少 3 种'))
              return
            }
            callback()
          },
          trigger: 'change'
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
    if (field.type === 'multiSelect') {
      formData[field.prop] = props.defaultFormData?.[field.prop] || []
    } else if (field.type === 'select') {
      formData[field.prop] = props.defaultFormData?.[field.prop] ?? undefined
    } else {
      formData[field.prop] = props.defaultFormData?.[field.prop] ?? ''
    }
  })
  formRef.value?.clearValidate()
  formRef.value?.resetFields()
}

// // 监听 visible 变化，初始化表单
// watch(
//   () => props.visible,
//   (val) => {
//     if (val) {
//       initFormData()
//     } else {
//       formRef.value?.resetFields()
//     }
//   },
//   { immediate: true }
// )

// 监听 defaultFormData 变化，更新表单数据
watch(
  () => props.defaultFormData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.keys(newData).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
          formData[key] = newData[key]
        }
      })
    }
  },
  { deep: true }
)

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  setTimeout(() => {
    formRef.value?.resetFields()
    formRef.value?.clearValidate()
  }, 100)
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

.password-check-list {
  .check-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;

    &.ok {
      color: #67c23a;
    }

    &.fail {
      color: #909399;
    }
  }
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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
