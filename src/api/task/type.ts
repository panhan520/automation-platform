export type Interpreter = 'sh' | 'python'

export interface TaskRecord {
  id: number
  name: string
  targets: string[]
  updated_at: string
  desc?: string
  parameters?: ParameterItem[]
}
export interface ParameterItem {
  id: number
  name: string
  variable: string
  type: 'string' | 'password' | 'select' | 'namespace'
  typeLabel: string
  options?: Array<{ label: string; value: string }>
  hostAttribute?: string
  required: boolean
  default?: string
  desc?: string
}
