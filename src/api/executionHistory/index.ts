import request from '@/axios'
// 执行历史记录列表
export const apiGetHistoryTaskList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/schedule/history/get/', params: data })
}

// 获取执行任务详情
export const apiGetHistoryTaskDetail = (data) => {
  const { id, pageType } = data
  let url = `/api/v1/schedule/history/get/?id=${id}`
  if (pageType) {
    url += `&pageType=${pageType}`
  }
  return request.get({ url })
}
