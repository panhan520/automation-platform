import request from '@/axios'
// 获取用户组列表（分页 + 条件查询）
export const apiGetGroupsList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/iam/groups', params: data })
}
