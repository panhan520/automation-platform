import request from '@/axios'
// 获取执行模板
export const apiGetTemplatesList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/exec/templates/get/', params: data })
}

// 新增/编辑执行模板
export const apiCreateTemplates = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/exec/templates/post/', data })
}

// 获取所有模板类型
export const apiGetTemplatesType = (): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/exec/templates/types/' })
}

// 删除执行模板
export const apiDeleteTemplate = (id): Promise<IPaginationResponse> => {
  return request.delete({ url: `/api/v1/exec/templates/delete/?id=${id}` })
}
