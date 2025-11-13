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
  return request.get('/api/v1/node/tasks', { params })
}

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
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
  return request.get(`/api/v1/node/tasks/${taskId}`)
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
      count: 10
    }
  }
  return request.post('/api/v1/node/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载Excel模板
export const downloadExcelTemplate = () => {
  return request.get('/api/v1/node/import/template', {
    responseType: 'blob'
  })
}
