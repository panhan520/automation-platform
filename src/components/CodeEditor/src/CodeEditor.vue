<template>
  <div class="code-editor" :class="{ disabled }">
    <div v-if="showLanguageHeader" class="editor-header">
      <slot name="toolbar">
        <template v-if="showLanguageSwitcher && languageOptions.length">
          <el-segmented v-model="innerLanguage" :options="languageOptions" size="small" />
        </template>
        <span v-else class="language-indicator">{{ innerLanguage }}</span>
      </slot>
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
import { computed, nextTick, ref, watch } from 'vue'

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

const showLanguageHeader = computed(() => props.showLanguageSwitcher || !!innerLanguage.value)

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
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f9fafc;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  transition: box-shadow 0.2s ease;

  &.disabled {
    opacity: 0.6;
  }
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fdfdff;

  .language-indicator {
    font-size: 12px;
    color: #606266;
  }
}

.editor-body {
  display: flex;
  width: 100%;
}

.line-numbers {
  width: 48px;
  padding: 12px 8px 12px 4px;
  text-align: right;
  background: #f4f6fb;
  color: #a0a4b1;
  font-size: 13px;
  line-height: 22px;
  overflow: hidden;
  border-right: 1px solid #e4e7ed;

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
  padding: 12px;
  font-size: 13px;
  line-height: 22px;
  color: #1f2d3d;
  font-family: inherit;

  &::placeholder {
    color: #b8b9c3;
  }
}
</style>
