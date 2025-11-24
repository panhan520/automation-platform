<template>
  <el-dialog
    v-model="visible"
    :title="title"
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
      :key="dialogKey"
    >
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
            <el-input
              v-else
              v-model="formData[field.prop]"
              type="password"
              :placeholder="field.placeholder"
              :maxlength="field.maxlength"
              show-password
              clearable
            />
          </div>
        </template>
        <!-- 选择器（单选） -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          :readonly="field.readonly"
          :disabled="field.disabled"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
            :label="`${getDeptName(option.dept) || ''}   ${option.label}`"
          >
            <span v-if="option.dept" class="dept">{{ getDeptName(option.dept) }}</span>
            {{ option.label }}
          </el-option>
          <template #empty>
            <el-empty :image-size="80" description="暂无数据" />
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
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
          <template #empty>
            <el-empty :image-size="80" description="暂无数据" />
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
        <div v-if="field.type === 'text'" class="field-name">{{ field.name }}</div>
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
import emptyDataImg from '@/assets/imgs/empty_data.png'
import { Props } from './type'

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  width: 600,
  labelWidth: '120px',
  fields: () => [],
  defaultFormData: () => ({}),
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', formData: Record<string, any>, done: (success: boolean) => void): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})
// 添加 dialogKey
const dialogKey = ref(0)
const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
const getDeptName = (dept: any) => {
  const map: Record<string, string> = {
    dev: '开发',
    test: '测试',
    ops: '运维',
    product: '产品'
  }
  return map[dept] || ''
}
// 统一的重置方法
const resetForm = async () => {
  // 先重置表单数据
  Object.keys(formData).forEach((key) => {
    delete formData[key]
  })

  // 等待 DOM 更新
  await nextTick()

  // 重新初始化数据
  initFormData()

  // 再次等待确保数据已设置
  await nextTick()

  // 清除验证状态
  formRef.value?.clearValidate()
  // formRef.value?.resetFields()
}
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
}

// 监听 visible 变化 - 只在打开时初始化
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      console.log('弹窗打开，初始化表单')
      // initFormData()
      await resetForm()
    }
  }
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
const handleCancel = () => {
  visible.value = false
}

const handleClose = async () => {
  console.log('弹窗关闭，重置表单')
  // 先隐藏弹窗
  visible.value = false

  // 等待 DOM 更新后再清理数据
  await nextTick()

  // 重置表单数据
  await resetForm()

  // 修改 key 强制 el-form 重新渲染
  dialogKey.value += 1

  emit('cancel')
}

// 监听 defaultFormData 变化
watch(
  () => props.defaultFormData,
  (newData) => {
    if (props.visible && newData) {
      // 只有在弹窗打开时更新数据
      Object.keys(newData).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
          formData[key] = newData[key]
        }
      })
      // 清除验证状态
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  },
  { deep: true }
)
</script>

<style lang="less" scoped>
.field-name {
  font-size: 16px;
  transform: translateX(-72px);
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.dept {
  margin-right: 5px;
}
</style>
