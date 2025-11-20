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
export const apiNodeImport = (formData: FormData): Promise<IPaginationResponse> => {
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

// 获取任务列表
export const getExecTaskList = (): Promise<IPaginationResponse> => {
  console.log('获取执行任务列表接口')
  // return {
  //   data: {
  //     list: [
  //       {
  //         id: 1,
  //         taskName: '连通测试',
  //         type: 'connectTest',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 2,
  //         taskName: '连通测试',
  //         type: 'upgrade',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 3,
  //         taskName: '连通测试',
  //         type: 'online',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 4,
  //         taskName: '连通测试',
  //         type: 'offline',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 5,
  //         taskName: '连通测试',
  //         type: 'restart',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 6,
  //         taskName: '连通测试',
  //         type: 'reinstall',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 7,
  //         taskName: '连通测试',
  //         type: 'uninstall',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 8,
  //         taskName: '连通测试',
  //         type: 'offline',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       },
  //       {
  //         id: 9,
  //         taskName: '连通测试',
  //         type: 'restart',
  //         successCount: 1,
  //         progressCount: 1,
  //         failedCount: 1,
  //         time: '12:12:12'
  //       }
  //     ],
  //     isPending: true
  //   }
  // }
  return request.get({ url: '/api/v1/node/exec/' })
}

// 获取最近24小时内的作业记录(获取任务详情)
export const getExecTaskDetail = (id: string) => {
  console.log('获取执行任务详情接口', id)
  // return {
  //   data: {
  //     list: [
  //       {
  //         id: 1,
  //         hostId: '3',
  //         internalIp: '1.1.1.111',
  //         publicIp: '1.1.1.111',
  //         applicationType: '云拨测',
  //         status: 'success'
  //       },
  //       {
  //         id: 2,
  //         hostId: '6',
  //         internalIp: '1.1.1.222',
  //         publicIp: '1.1.1.122',
  //         applicationType: 'CDN',
  //         status: 'failed'
  //       },
  //       {
  //         id: 3,
  //         hostId: '9',
  //         internalIp: '1.1.1.222',
  //         publicIp: '1.1.1.122',
  //         applicationType: 'CDN',
  //         status: 'pending'
  //       },
  //       {
  //         id: 4,
  //         hostId: '10',
  //         internalIp: '1.1.1.222',
  //         publicIp: '1.1.1.122',
  //         applicationType: 'CDN',
  //         status: 'failed'
  //       }
  //     ],
  //     isPending: true
  //   }
  // }
  return request.get({ url: `/api/v1/node/exec/${id}/` })
}

// 更新任务显示状态
export const apiUpdateExecTask = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/node/exec/update_task/', data })
}
