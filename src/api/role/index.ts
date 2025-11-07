import request from '@/axios'
// 获取角色列表（分页 + 模糊查询）
export const apiGetRoleList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/iam/roles', params: data })
}

// 创建角色
export const apiCreateRole = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/roles', data })
}

// 更新角色
export const apiEditRole = (data): Promise<IPaginationResponse> => {
  return request.put({ url: '/api/v1/iam/roles', data })
}

// 删除角色（支持批量删除）
export const apiDeleteRole = (data): Promise<IPaginationResponse> => {
  return request.delete({
    url: '/api/v1/iam/roles',
    data
  })
}
