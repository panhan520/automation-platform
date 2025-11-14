import request from '@/axios/index'
import type { NodeRecord } from './type'
import { id } from 'element-plus/es/locale'

// 批量操作 Agent
export const batchOperateAgent = (data: { operation: string; nodeIds: number[] }) => {
  return request.post('/api/v1/node/batch-operate', data)
}

// 单个操作 Agent
export const operateAgent = (data: { operation: string; nodeId: number }) => {
  return request.post('/api/v1/node/operate', data)
}

// 获取任务列表
export const getTaskList = (params?: { date?: string }) => {
  console.log('获取执行任务列表接口')
  return {
    data: [
      { id: 1, name: '任务1', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 2, name: '任务2', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 3, name: '任务3', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 4, name: '任务4', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 5, name: '任务5', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 6, name: '任务6', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 7, name: '任务6', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 8, name: '任务6', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 },
      { id: 9, name: '任务6', type: '安装', successCount: 1, progressCount: 1, failedCount: 1 }
    ]
  }
  // return request.get('/api/v1/node/tasks', { params })
}

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
  console.log('获取执行任务详情接口')
  return {
    data: {
      details: [
        {
          id: 1,
          internalIp: '1.1.1.111',
          publicIp: '1.1.1.111',
          applicationType: '云拨测',
          status: 'success'
        },
        {
          id: 2,
          internalIp: '1.1.1.222',
          publicIp: '1.1.1.122',
          applicationType: 'CDN',
          status: 'failed'
        },
        {
          id: 3,
          internalIp: '1.1.1.222',
          publicIp: '1.1.1.122',
          applicationType: 'CDN',
          status: 'pending'
        },
        {
          id: 4,
          internalIp: '1.1.1.222',
          publicIp: '1.1.1.122',
          applicationType: 'CDN',
          status: 'failed'
        }
      ],
      successCount: 1,
      progressCount: 1,
      failedCount: 1
    }
  }
  // return request.get(`/api/v1/node/tasks/${taskId}`)
}

// 获取节点列表
export const getNodeList = (params?: any) => {
  return request.get('/api/v1/node/list', { params })
}

// 导入Excel
export const importNodesFromExcel = (formData: FormData) => {
  return {
    data: {
      success: true,
      count: 10,
      errorData: [
        {
          id: 1,
          internalIp: '192.168.1.101',
          publicIp: '10.0.0.101',
          hostname: 'web-server-01',
          hostId: '1',
          agentId: 'AGT-001-WEB-2024',
          applicationType: '云拨测',
          region: '华东-上海',
          os: 'Linux',
          agentStatus: '运行中',
          nodeStatus: '在线',
          agentVersion: 'v2.1.3',
          lastHeartbeat: '2024-03-15 16:45:23',
          tags: [
            { key: 'env', value: 'prod' },
            { key: 'team', value: 'sre' }
          ]
        },
        {
          id: 2,
          internalIp: '192.168.1.102',
          publicIp: '10.0.0.102',
          hostname: 'cdn-node-02',
          hostId: '2',
          agentId: 'AGT-002-CDN-2024',
          applicationType: 'CDN',
          region: '华北-北京',
          os: 'Windows',
          agentStatus: '异常',
          nodeStatus: '在线',
          agentVersion: 'v2.0.8',
          lastHeartbeat: '2024-03-15 16:42:10',
          tags: [{ key: 'env', value: 'staging' }]
        },
        {
          id: 3,
          internalIp: '192.168.1.102',
          publicIp: '10.0.0.102',
          hostname: 'cdn-node-02',
          hostId: '2',
          agentId: 'AGT-002-CDN-2024',
          applicationType: 'CDN',
          region: '华北-北京',
          os: 'Windows',
          agentStatus: '未安装',
          nodeStatus: '在线',
          agentVersion: 'v2.0.8',
          lastHeartbeat: '2024-03-15 16:42:10',
          tags: [{ key: 'env', value: 'staging' }]
        },
        {
          id: 4,
          internalIp: '192.168.1.102',
          publicIp: '10.0.0.102',
          hostname: 'cdn-node-02',
          hostId: '2',
          agentId: 'AGT-002-CDN-2024',
          applicationType: 'CDN',
          region: '华北-北京',
          os: 'Windows',
          agentStatus: '未安装',
          nodeStatus: '在线',
          agentVersion: 'v2.0.8',
          lastHeartbeat: '2024-03-15 16:42:10',
          tags: [{ key: 'env', value: 'staging' }]
        },
        {
          id: 5,
          internalIp: '192.168.1.102',
          publicIp: '10.0.0.102',
          hostname: 'cdn-node-02',
          hostId: '2',
          agentId: 'AGT-002-CDN-2024',
          applicationType: 'CDN',
          region: '华北-北京',
          os: 'Windows',
          agentStatus: '未安装',
          nodeStatus: '在线',
          agentVersion: 'v2.0.8',
          lastHeartbeat: '2024-03-15 16:42:10',
          tags: [{ key: 'env', value: 'staging' }]
        },
        {
          id: 6,
          internalIp: '192.168.1.102',
          publicIp: '10.0.0.102',
          hostname: 'cdn-node-02',
          hostId: '2',
          agentId: 'AGT-002-CDN-2024',
          applicationType: 'CDN',
          region: '华北-北京',
          os: 'Windows',
          agentStatus: '未安装',
          nodeStatus: '在线',
          agentVersion: 'v2.0.8',
          lastHeartbeat: '2024-03-15 16:42:10',
          tags: [{ key: 'env', value: 'staging' }]
        }
      ]
    }
  }
  // return request.post('/api/v1/node/import', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data'
  //   }
  // })
}

// 下载Excel模板
export const downloadExcelTemplate = () => {
  return request.get('/api/v1/node/import/template', {
    responseType: 'blob'
  })
}
