<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
      <el-form-item v-for="param in parameters" :key="param.id" :prop="param.variable">
        <template #label>
          <span>
            <span v-if="param.required" class="required">*</span>
            {{ param.name }}
            <el-tooltip v-if="param.hint" :content="param.hint" placement="top">
              <el-icon class="hint-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input
          v-if="param.type === 'text'"
          v-model="form[param.variable]"
          placeholder="请输入"
          clearable
          @blur="validateField(param)"
        />
        <el-input
          v-else-if="param.type === 'password'"
          v-model="form[param.variable]"
          type="password"
          show-password
          placeholder="请输入"
          @blur="validateField(param)"
        />
        <el-select
          v-else
          v-model="form[param.variable]"
          placeholder="请选择"
          style="width: 100%"
          @change="validateField(param)"
        >
          <el-option
            v-for="option in param.options || []"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">{{
          confirmText
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { ParameterItem } from '@/api/template/type'

const props = withDefaults(
  defineProps<{
    visible: boolean
    parameters: ParameterItem[]
    title?: string
    confirmText?: string
    loading?: boolean
    modelValue?: Record<string, any>
  }>(),
  {
    parameters: () => [],
    title: '执行任务',
    confirmText: '立即执行',
    loading: false,
    modelValue: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', values: Record<string, any>): void
  (e: 'cancel'): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const formRef = ref<FormInstance>()
const form = reactive<Record<string, any>>({})

const initForm = () => {
  Object.keys(form).forEach((key) => {
    delete form[key]
  })
  props.parameters.forEach((param) => {
    form[param.variable] = props.modelValue?.[param.variable] ?? param.defaultValue ?? ''
  })
}

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  props.parameters.forEach((param) => {
    if (param.required) {
      rules[param.variable] = [
        {
          required: true,
          message: `${param.name}不能为空`,
          trigger: param.type === 'select' ? 'change' : 'blur'
        }
      ]
    }
  })
  return rules
})

watch(
  () => props.parameters,
  () => {
    initForm()
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (val) => {
    if (!val) {
      formRef.value?.clearValidate()
    }
  }
)

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

const handleConfirm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('confirm', { ...form })
    }
  })
}

const validateField = (param: ParameterItem) => {
  if (!param.required || !formRef.value) return
  formRef.value.validateField(param.variable).catch(() => {})
}
</script>

<style scoped lang="less">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.hint-icon {
  font-size: 14px;
  color: #a1a7b3;
  margin-left: 4px;
}

.required {
  color: #f56c6c;
  margin-right: 2px;
}
</style>
