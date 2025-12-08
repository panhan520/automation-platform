export interface NodeRecord {
  id: number
  innerIp: string
  publicIp: string
  hostName: string
  appTypeName: string
  region: string
  os: string
  status: string
  lastCheckTime: string
  nodeTags?: Array<{ key: string; value: string }>
  loginAccount?: string
  loginIp?: string
  loginPort?: number
  authMethod?: string
  passwordKey?: string
  appType?: number
}
export interface ParameterItem {
  id?: number
  name: string
  variable: string
  type: 'string' | 'password' | 'select' | 'namespace'
  options?: string
  property?: string
  required: boolean
  default?: string
  desc?: string
}

export interface HostItem {
  id: number
  innerIp: string
}

export interface TemplateEditorData {
  type: string
  name: string
  interpreter: 'sh' | 'python'
  body: string
  command?: string
  desc?: string
  parameters?: ParameterItem[]
  host_ids?: HostItem[]
}
export interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  leaf?: boolean
  [key: string]: any
}

export interface AppTypeOption {
  label: string
  value: string | number
}
export interface NodeForm {
  innerIp: string
  publicIp: string
  os: 'Windows' | 'Linux'
  loginPort: string
  authMethod: AuthMethod
  credentialPassword: string
  credentialKey: string
  loginAccount: string
  hostName: string
  networkType: 'public' | 'private'
  region: (string | number)[]
  loginIp: string
  appType: string
  vendorName: string
  operator: string
  remark: string
  nodeTags: Record<string, string>
}

export interface NodeTagItem {
  id: number
  key: string
  value: string
}
export interface Props {
  visible: boolean
  loading?: boolean
  title?: string
  isEdit?: boolean
  defaultData?: NodeFormDefaultData
  nodeTagOptionsKey?: Array<{ label: string; value: string }>
  nodeTagOptionsValue?: Array<{ label: string; value: string }>
}
type AuthMethod = 'password' | 'key'
export type ConnectivityStatus = 'idle' | 'loading' | 'success' | 'failed'

export type NodeFormSubmit = Omit<NodeForm, 'region'> & { region: string }

export type NodeFormDefaultData = Partial<NodeForm> & {
  id?: number
  regionCodes?: (string | number)[]
  regionLabel?: string
  tags?: Array<{ key: string; value: string }>
  passwordKey?: string
}
