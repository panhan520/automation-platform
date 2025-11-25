import request from '@/axios'

// 创建执行任务
export const apiCreateExecDo = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/exec/do/post/', data })
}
