import request from '@/axios'
// 获取权限组列表
export const apiGetPermissionList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/iam/permission_groups', params: data })
}

// 新建权限组
export const apiCreatePermission = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/permission_group', data })
}

// 编辑权限组
export const apiEditPermission = (data): Promise<IPaginationResponse> => {
  return request.put({ url: `/api/v1/iam/permission_group/${data.id}`, data })
}

// 绑定权限组
export const apiBindPermission = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/permission_group/bind', data })
}
// 删除权限组
export const apiDeletePermission = (data): Promise<IPaginationResponse> => {
  return request.delete({
    url: `/api/v1/iam/permission_group/${data.id}`
  })
}
