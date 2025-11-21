<template>
  <div class="code-editor" :class="{ disabled }">
    <div v-if="showHeader" class="editor-header">
      <div class="header-left">
        <slot name="language">
          <template v-if="shouldRenderDefaultLanguage">
            <el-segmented v-model="innerLanguage" :options="languageOptions" />
          </template>
        </slot>
        <slot name="header-left-extra"></slot>
      </div>
      <div class="header-right">
        <slot name="header-right"></slot>
      </div>
    </div>
    <div class="editor-body">
      <div ref="lineNumberRef" class="line-numbers">
        <span v-for="line in lineNumbers" :key="line">{{ line }}</span>
      </div>
      <textarea
        ref="textareaRef"
        v-model="localValue"
        class="code-textarea"
        :placeholder="placeholder"
        :readonly="readonly"
        :disabled="disabled"
        :style="textareaStyle"
        @scroll="syncScroll"
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useSlots, watch } from 'vue'

interface LanguageOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    languageOptions?: LanguageOption[]
    showLanguageSwitcher?: boolean
    placeholder?: string
    rows?: number
    maxHeight?: number | string
    readonly?: boolean
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    language: 'Shell',
    languageOptions: () => [
      { label: 'Shell', value: 'Shell' },
      { label: 'Python', value: 'Python' }
    ],
    showLanguageSwitcher: true,
    placeholder: '',
    rows: 12,
    maxHeight: 360,
    readonly: false,
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'update:language', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const lineNumberRef = ref<HTMLDivElement>()
const slots = useSlots()

const localValue = ref(props.modelValue)
watch(
  () => props.modelValue,
  (val) => {
    if (val !== localValue.value) {
      localValue.value = val ?? ''
    }
  }
)

const innerLanguage = ref(props.language)
watch(
  () => props.language,
  (val) => {
    if (val && val !== innerLanguage.value) {
      innerLanguage.value = val
    }
  }
)

watch(innerLanguage, (val) => {
  emit('update:language', val)
})

const lineNumbers = computed(() => {
  const count = localValue.value ? localValue.value.split('\n').length : 1
  return Array.from({ length: count || 1 }, (_, index) => index + 1)
})

const textareaStyle = computed(() => {
  const baseHeight = Math.max(props.rows, 4) * 22
  const maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  return {
    minHeight: `${baseHeight}px`,
    maxHeight
  }
})

const shouldRenderDefaultLanguage = computed(
  () => props.showLanguageSwitcher || !!innerLanguage.value
)

const hasLanguageSlot = computed(() => Boolean(slots.language))
const hasLeftExtraSlot = computed(() => Boolean(slots['header-left-extra']))
const hasRightSlot = computed(() => Boolean(slots['header-right']))

const showHeader = computed(
  () =>
    shouldRenderDefaultLanguage.value ||
    hasLanguageSlot.value ||
    hasLeftExtraSlot.value ||
    hasRightSlot.value
)

const syncScroll = () => {
  if (textareaRef.value && lineNumberRef.value) {
    lineNumberRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

const handleInput = (event: Event) => {
  const value = (event.target as HTMLTextAreaElement).value
  localValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    event.preventDefault()
    insertText('  ')
  }
}

const insertText = (text: string) => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = localValue.value
  const newValue = `${value.slice(0, start)}${text}${value.slice(end)}`
  localValue.value = newValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
  nextTick(() => {
    const newPosition = start + text.length
    textarea.selectionStart = newPosition
    textarea.selectionEnd = newPosition
  })
}
</script>

<style scoped lang="less">
.code-editor {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &.disabled {
    opacity: 0.6;
  }

  &:focus-within {
    border-color: #409eff;
    box-shadow: 0 12px 32px rgba(64, 158, 255, 0.18);
  }
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid #eef1f6;
  background: linear-gradient(180deg, #f9fbff 0%, #f2f5fa 100%);
  border-radius: 12px 12px 0 0;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    :deep(.el-button) {
      border-radius: 6px;
    }
  }
}

.editor-body {
  display: flex;
  width: 100%;
  background: #fff;
  border-radius: 0 0 12px 12px;
}

.line-numbers {
  width: 56px;
  padding: 16px 10px 16px 6px;
  text-align: right;
  background: #f6f7fb;
  color: #9ba3b4;
  font-size: 13px;
  line-height: 24px;
  overflow: hidden;
  border-right: 1px solid #ebeef5;
  border-bottom-left-radius: 12px;

  span {
    display: block;
  }
}

.code-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  background: #fff;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 24px;
  color: #1f2d3d;
  font-family: inherit;
  border-bottom-right-radius: 12px;

  &::placeholder {
    color: #b8b9c3;
  }
}
</style>
