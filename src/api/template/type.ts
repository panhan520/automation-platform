export type Interpreter = 'sh' | 'python'

export interface TemplateRecord {
  id: number
  name: string
  type: string
  body: string
  desc: string
  interpreter: Interpreter
  remark?: string
  hosts?: HostItem[]
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

export interface HostItem {
  id: number
  innerIp: string
}
