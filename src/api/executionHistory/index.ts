import request from '@/axios'
// 执行历史记录列表
export const apiGetHistoryTaskList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/schedule/history/get/', params: data })
}

// 获取执行任务详情
export const apiGetExecTaskDetail = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/node/exec/detail/', params: data })
}
