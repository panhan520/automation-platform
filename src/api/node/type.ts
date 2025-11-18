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
