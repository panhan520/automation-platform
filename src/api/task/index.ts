import request from '@/axios'
// 任务列表
export const apiGetTaskList = (data): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/schedule/', params: data })
}

// 新增或编辑任务
export const apiCreateTask = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/schedule/post/', data })
}

// 获取任务类型列表
export const apiGetTaskType = (): Promise<IPaginationResponse> => {
  return request.get({ url: '/api/v1/schedule/taskType/' })
}

// 删除任务
export const apiDeleteTask = (id): Promise<IPaginationResponse> => {
  return request.delete({ url: `/api/v1/schedule/${id}/` })
}

// 执行任务
export const apiExecTask = (data): Promise<IPaginationResponse> => {
  return request.post({ url: '/api/v1/schedule/history/exec/', data })
}
