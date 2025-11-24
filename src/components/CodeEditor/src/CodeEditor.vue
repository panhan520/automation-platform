<template>
  <div class="code-editor" :class="{ disabled }">
    <div class="editor-body" ref="editorContainer" :style="editorStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ace from 'ace-builds'
import 'ace-builds/src-noconflict/mode-sh'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/ext-language_tools'

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

const editorContainer = ref<HTMLDivElement | null>(null)
const editorInstance = ref<ace.Ace.Editor | null>(null)

const localValue = ref(props.modelValue)
const innerLanguage = ref(props.language)

const editorStyle = computed(() => {
  const baseHeight = Math.max(props.rows, 4) * 24
  const maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  return {
    minHeight: `${baseHeight}px`,
    maxHeight,
    width: '100%'
  }
})

const languageToAceMode = (lang: string) => {
  const map: Record<string, string> = {
    Shell: 'ace/mode/sh',
    shell: 'ace/mode/sh',
    bash: 'ace/mode/sh',
    Python: 'ace/mode/python',
    python: 'ace/mode/python'
  }
  return map[lang] || 'ace/mode/text'
}

const initEditor = () => {
  if (!editorContainer.value) return

  editorInstance.value = ace.edit(editorContainer.value, {
    mode: languageToAceMode(innerLanguage.value),
    theme: 'ace/theme/github',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    showPrintMargin: false,
    showLineNumbers: true,
    highlightActiveLine: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: false,
    enableSnippets: false,
    readOnly: props.readonly || props.disabled,
    placeholder: props.placeholder,
    minLines: Math.max(props.rows, 4),
    maxLines: props.maxHeight ? undefined : Math.max(props.rows, 4),
    wrap: false,
    tabSize: 2,
    useSoftTabs: true,
    scrollPastEnd: 0
  })

  // 自定义主题样式（使用类型断言绕过类型检查）
  editorInstance.value.setOptions({
    'editor.lineHighlightBackground': '#f2f5fa',
    'editor.lineHighlightBorder': '#dfe3eb',
    'editor.cursorStyle': 'slim',
    'editor.cursorColor': '#111827',
    'editor.lineNumberColor': '#c4c7d1',
    'editor.activeLineNumberColor': '#2563eb'
  } as any)

  // 设置初始值
  editorInstance.value.setValue(localValue.value || '', -1)

  // 监听内容变化
  editorInstance.value.on('change', () => {
    const value = editorInstance.value?.getValue() || ''
    if (value !== localValue.value) {
      localValue.value = value
      emit('update:modelValue', value)
      emit('change', value)
    }
  })

  // 监听焦点变化
  editorContainer.value.addEventListener('focus', () => {
    editorInstance.value?.focus()
  })
}

const updateEditorValue = (value: string) => {
  if (editorInstance.value && editorInstance.value.getValue() !== value) {
    editorInstance.value.setValue(value || '', -1)
  }
}

const updateEditorLanguage = (lang: string) => {
  if (editorInstance.value) {
    editorInstance.value.session.setMode(languageToAceMode(lang))
  }
}

const updateReadonlyState = () => {
  if (editorInstance.value) {
    editorInstance.value.setReadOnly(props.readonly || props.disabled)
  }
}

watch(
  () => props.modelValue,
  (val) => {
    const value = val ?? ''
    if (value !== localValue.value) {
      localValue.value = value
      updateEditorValue(value)
    }
  }
)

watch(
  () => props.language,
  (val) => {
    if (val && val !== innerLanguage.value) {
      innerLanguage.value = val
      updateEditorLanguage(val)
    }
  }
)

watch(innerLanguage, (val) => {
  emit('update:language', val)
  updateEditorLanguage(val)
})

watch(
  () => props.readonly || props.disabled,
  () => updateReadonlyState()
)

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>

<style scoped lang="less">
.editor-body {
  :deep(.ace_gutter) {
    background: #f6f7fb;
    color: #9ba3b4;
  }
  :deep(.ace_active-line) {
    background: #f2f5fa !important;
  }
}
.code-editor {
  display: block;
  width: 100%;
}
.editor-body {
  min-height: 200px;
}
</style>
