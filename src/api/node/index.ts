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
export const apiGetNodeTags = () => {
  return request.get({ url: '/api/v1/node/nodeTags/' })
}

// 获取任务列表
export const getExecTaskList = (): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/node/exec/' })
}

// 更新任务显示状态（关闭）
export const apiUpdateExecTask = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/node/exec/updateTask/', data })
}
