import request from '@/axios'
// 应用列表
export const apiGetApplicationList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/application/', params: data })
}

// 人员列表
export const apiGetPersonList = (): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/account/user/' })
}

// 创建/更新应用
export const apiCreateApplication = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/application/', data })
}

// 创建/更新应用
export const apiDeleteApplication = (data): Promise<IPaginationResponse> => {
  return request.delete({ url: '/api/v1/application/', data })
}
