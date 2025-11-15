export interface FormField {
  prop: string
  label: string
  type: 'input' | 'email' | 'password' | 'select' | 'multiSelect' | 'textarea' | 'text'
  placeholder?: string
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  maxlength?: number
  showWordLimit?: boolean
  hint?: string
  rows?: number
  readonlyValue?: string // 只读模式下显示的值
  options?: Array<{ label: string; value: any; dept: string }> // 仅用于select类型
  rules?: any[] // 自定义验证规则
  name?: string
}

export interface Props {
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
