import request from '@/axios'
// 应用列表
export const apiGetApplicationList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/application/', params: data })
}
