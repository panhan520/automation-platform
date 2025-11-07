import request from '@/axios'
// 用户列表
export const apiGetusersList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/iam/users', params: data })
}
// 生成 RAM 账户（新建用户）
export const apiCreateUser = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/user/generate', data })
}
// 编辑单个用户账号信息
export const apiEditUser = (data): Promise<IPaginationResponse> => {
  return request.patch({ url: '/api/v1/iam/account/editor', data })
}
// 分配角色，添加至组
export const apiOperateUser = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/user/private/editor', data })
}
// 邀请用户
export const apiInviteUser = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/user/invite', data })
}
// 用户操作（启用、禁用、删除、激活）
export const apiActiveUser = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/user/active', data })
}
// 租户主账号重置用户密码 - 云平台
export const apiResetPwdUser = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/iam/pwd/reset', data })
}
