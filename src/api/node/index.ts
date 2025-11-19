import request from '@/axios/index'

// 获取节点列表
export const apiGetNodeList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/node/get/', params: data })
}

// 节点统计
export const apiGetNodeStatistics = () => {
  return request.get({ url: '/api/v1/node/statistics/' })
}

// 创建/更新应用
export const apiCreateNode = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/node/post/', data })
}

// 下载Excel模板
export const apiGetNodeDownload = () => {
  return request.get({
    url: '/api/v1/node/download/',
    responseType: 'blob'
  })
}

// 通过Excel导入节点数据
export const apiNodeImport = (formData: FormData) => {
  return request.post({
    url: '/api/v1/node/import/',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 单节点SSH连通性探测
export const apiNodeSingleProbe = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/node/singleProbe/', data })
}

// 批量节点SSH连通性探测
export const apiNodeBatchProbe = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/node/batchProbe/', data })
}

// 节点标签列表
export const apiGetNodeTags = (): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/node/nodeTags/' })
}

// 批量操作 Agent
export const batchOperateAgent = (data: { operation: string; nodeIds: number[] }) => {
  return request.post('/api/v1/node/batch-operate', data)
}

// 单个操作 Agent
export const operateAgent = (data: { operation: string; nodeId: number }) => {
  return request.post('/api/v1/node/operate', data)
}

// 获取任务列表
export const getTaskList = (): Promise<IPaginationResponse> => {
  console.log('获取执行任务列表接口')
  return {
    data: {
      list: [
        {
          id: 1,
          type: 'install',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 2,
          type: 'upgrade',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 3,
          type: 'online',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 4,
          type: 'offline',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 5,
          type: 'restart',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 6,
          type: 'reinstall',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 7,
          type: 'uninstall',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 8,
          type: 'offline',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        },
        {
          id: 9,
          type: 'restart',
          successCount: 1,
          progressCount: 1,
          failedCount: 1,
          time: '12:12:12'
        }
      ]
    }
  }
  // return request.get({ url: '/api/v1/node/get/', params: data })
}

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
  console.log('获取执行任务详情接口', taskId)
  return {
    data: {
      details: [
        {
          id: 1,
          hostId: '3',
          internalIp: '1.1.1.111',
          publicIp: '1.1.1.111',
          applicationType: '云拨测',
          status: 'success'
        },
        {
          id: 2,
          hostId: '6',
          internalIp: '1.1.1.222',
          publicIp: '1.1.1.122',
          applicationType: 'CDN',
          status: 'failed'
        },
        {
          id: 3,
          hostId: '9',
          internalIp: '1.1.1.222',
          publicIp: '1.1.1.122',
          applicationType: 'CDN',
          status: 'pending'
        },
        {
          id: 4,
          hostId: '10',
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
