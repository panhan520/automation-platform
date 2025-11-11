export interface NodeRecord {
  id: number
  internalIp: string
  publicIp: string
  hostname: string
  hostId: string
  agentId: string
  applicationType: string
  region: string
  os: string
  agentStatus: string
  nodeStatus: string
  agentVersion: string
  lastHeartbeat: string
  tags?: Array<{ key: string; value: string }>
}
